// Teeter Table: take turns piling things on a little side table. Whoever's drop knocks something off loses. Turn game.
// Physics by matter-js (MIT, vendor/) in this mock; the build would use SpriteKit's physics.
// The cat plans its drop by trying places in a copy of the table. Tell: ears forward when it thinks you have no steady spot left.
(() => {
  const h = (tag, cls, html) => { const el = document.createElement(tag); if (cls) el.className = cls; if (html != null) el.innerHTML = html; return el; };
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const randn = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  // w and h are fractions of the view's width. shape: rect, round (corner radius as a share of h), ball (ten sides, so it settles), cup (trapezoid, narrow foot).
  const KINDS = {
    book: { w: 0.30, h: 0.097, shape: "rect", r: 0.12, density: 0.004, friction: 0.5, name: L("book", "책이") },
    cushion: { w: 0.28, h: 0.144, shape: "round", r: 0.4, density: 0.0016, friction: 0.95, name: L("cushion", "방석이") },
    box: { w: 0.18, h: 0.175, shape: "rect", r: 0.05, density: 0.0012, friction: 0.7, name: L("box", "상자가") },
    yarn: { w: 0.18, h: 0.18, shape: "ball", density: 0.0016, friction: 0.9, name: L("ball of yarn", "털실이") },
    cup: { w: 0.2, h: 0.148, shape: "cup", density: 0.003, friction: 0.6, name: L("teacup", "찻잔이") },
    fish: { w: 0.26, h: 0.138, shape: "round", r: 0.45, density: 0.0012, friction: 0.8, name: L("fish toy", "생선 인형이") },
    tin: { w: 0.27, h: 0.099, shape: "rect", r: 0.3, density: 0.004, friction: 0.45, name: L("tin of sardines", "정어리 통조림이") },
    carton: { w: 0.14, h: 0.196, shape: "rect", r: 0.06, density: 0.003, friction: 0.6, name: L("milk carton", "우유팩이") },
  };
  function L(en, ko) { return { en, ko }; }
  const IMG = {};
  for (const k of [...Object.keys(KINDS), "table"]) { const i = new Image(); i.src = k === "table" ? "img/teeter-table.webp" : `img/piece-${k}.webp`; IMG[k] = i; }

  GAME_IMPL.teeter = (M, table, controls) => {
    const { Engine, Bodies, Body, Composite } = Matter;
    const [nerve, smarts, focus] = M.cat.traits;
    const view = h("div", "tt"); table.appendChild(view);
    const canvas = h("canvas", "tt-canvas"); view.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    const over = h("div", "tt-over"); view.appendChild(over);
    const next = h("div", "tt-next", `<span class="t-caption t-strong">${T("Next", "다음")}</span><img alt="">`); view.appendChild(next);
    let W = 0, Ht = 0, U = 1, topY = 0, left = 0, right = 0, camY = 0;
    let engine = null, pieces = [], hover = null, queue = [], phase = "wait", mine = false, settleT = 0, fallen = null, fallAt = 0, dropper = 0, dropAt = 0;
    let undo = [], stopClock = null, shiftPx = 0, band = null, sockOn = false, raf = 0, alive = true, last = 0, simT = 0, acc = 0, snap = null, snapT = 0;
    const STEP = 1000 / 60;
    const placed = { 1: 0, 2: 0 };

    function size() {
      const r = view.getBoundingClientRect(); W = r.width; Ht = r.height; U = W;
      const dpr = Math.min(2, devicePixelRatio || 1); canvas.width = W * dpr; canvas.height = Ht * dpr; canvas.style.width = W + "px"; canvas.style.height = Ht + "px"; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      topY = Ht * 0.74; left = W * 0.15; right = W * 0.85;
    }
    // ---- bodies ----
    function make(kind, x, y, angle = 0) {
      const k = KINDS[kind], w = k.w * U, hh = k.h * U, opt = { friction: k.friction, frictionStatic: 1, restitution: 0, density: k.density, frictionAir: 0.02 };
      let b;
      if (k.shape === "ball") b = Bodies.polygon(0, 0, 8, w / 2, opt);
      else if (k.shape === "cup") b = Bodies.fromVertices(0, 0, [[{ x: -w / 2, y: -hh / 2 }, { x: w / 2, y: -hh / 2 }, { x: w * 0.35, y: hh / 2 }, { x: -w * 0.35, y: hh / 2 }]], opt);
      else b = Bodies.rectangle(0, 0, w, hh, { ...opt, chamfer: { radius: Math.min(w, hh) * (k.r || 0) } });
      // the picture is drawn on the box the shape came from: keep where its centre sits from the body's own centre
      const bb = b.bounds; b.plugin = { kind, w, h: hh, ox: (bb.min.x + bb.max.x) / 2 - b.position.x, oy: (bb.min.y + bb.max.y) / 2 - b.position.y };
      Body.setAngle(b, angle); Body.setPosition(b, { x, y });
      return b;
    }
    function world(list) {
      const e = Engine.create({ enableSleeping: false }); e.gravity.y = 1; e.positionIterations = 10; e.velocityIterations = 8;
      const top = Bodies.rectangle((left + right) / 2, topY + 12, right - left, 24, { isStatic: true, friction: 0.8, frictionStatic: 1 });
      Composite.add(e.world, top);
      for (const p of list) Composite.add(e.world, p);
      return e;
    }
    // A copy of the table for planning: the same pieces where they rest now.
    function copy() { return pieces.map(p => make(p.plugin.kind, p.position.x, p.position.y, p.angle)); }
    // the piece waits a little above the pile, so a drop is a short fall, not a long bounce
    const pileTop = () => pieces.reduce((m, p) => p.bounds.min.y < topY ? Math.min(m, p.bounds.min.y) : m, topY);
    const hoverY = () => Math.max(camY + 74, pileTop() - 120);
    // Try a drop in a copy. Returns how far the pile moved, whether anything fell, and how high the pile ends.
    function trial(kind, x, angle, steps = 200) {
      const list = copy(), e = world(list), start = list.map(b => ({ x: b.position.x, y: b.position.y }));
      const n = make(kind, x, hoverY(), angle); Composite.add(e.world, n);
      for (let i = 0; i < steps; i++) Engine.update(e, 1000 / 60);
      let moved = 0, fell = false, top = topY;
      list.forEach((b, i) => { moved += Math.hypot(b.position.x - start[i].x, b.position.y - start[i].y); });
      for (const b of [...list, n]) { if (b.bounds.min.y > topY + 6) fell = true; top = Math.min(top, b.bounds.min.y); }
      const still = n.speed + n.angularSpeed * 30, tilt = Math.abs(Math.sin(n.angle - angle));
      Engine.clear(e);
      return { fell, risk: (fell ? 1e5 : 0) + moved * 2 + still * 25 + tilt * 30, top };
    }
    function spots(kind, n) {
      const k = KINDS[kind], hw = k.w * U / 2, xs = [], angles = k.shape === "ball" ? [0] : nerve >= 4 ? [0, Math.PI / 2, Math.PI / 4] : [0, Math.PI / 2];
      for (let i = 0; i < n; i++) xs.push(left + hw * 0.2 + (right - left - hw * 0.4) * (n === 1 ? 0.5 : i / (n - 1)));
      const out = []; for (const x of xs) for (const a of angles) out.push({ x, a });
      return out;
    }
    // The cat's plan: daring cats like a high spot, careful ones keep the pile low. Focus decides how well it aims.
    function plan(kind, q, aimed = true) {
      const wobble = (q === "careless" ? 4 : 1) * (6 - focus), sd = aimed ? wobble * 1.1 : 0;
      const tries = spots(kind, 3 + smarts).map(s => ({ ...s, ...trial(kind, s.x, s.a) }));
      // a clever cat knows its own paw is not exact, so it keeps away from the edge by about that much
      // a piece hanging over the table's edge stays up now but tips later: careful cats avoid it, daring ones shrug
      const k = KINDS[kind], half = a => (Math.abs(Math.cos(a)) * k.w + Math.abs(Math.sin(a)) * k.h) * U / 2;
      for (const t of tries) t.score = t.risk + (nerve >= 4 ? -(topY - t.top) * 0.5 : nerve <= 2 ? (topY - t.top) * 0.4 : 0) + Math.random() * 6
        + Math.max(0, 2.5 * sd - Math.min(t.x - left, right - t.x)) * (smarts * 2)
        + Math.max(0, left - (t.x - half(t.a)), t.x + half(t.a) - right) * (6 - nerve) * 0.6;
      tries.sort((a, b) => a.score - b.score);
      const best = tries[0];
      return { x: best.x + randn() * sd, a: best.a + (aimed ? randn() * wobble * 0.015 : 0), risk: best.risk };
    }
    // Does a steady spot remain for this piece? Used for the cat's ears on your turn.
    function steady(kind) { return spots(kind, 5).map(s => trial(kind, s.x, s.a, 100)).some(t => t.risk < 40); }

    // ---- the loop ----
    function frame(t) {
      if (!alive) return;
      raf = requestAnimationFrame(frame);
      if (M.paused) { last = t; return; }
      const dt = Math.min(1000 / 30, t - (last || t)); last = t;
      // fixed steps, the same as the cat's trials use, so a drop lands the way the cat worked it out
      acc = engine ? acc + dt : 0; while (engine && acc >= STEP) { Engine.update(engine, STEP); simT += STEP; acc -= STEP; }
      t = simT;   // settling and falls are timed on the table's own clock, so a hidden tab cannot skip them
      // the view rises with the pile
      const want = Math.min(0, pileTop() - 200); camY += (want - camY) * 0.08;
      if (engine && phase !== "done") watch(t);
      paint();
    }
    // A fall at any moment counts against whoever dropped last, even if the turn has passed while it slid.
    function watch(t) {
      for (const p of pieces) if (!fallen && dropper && p.bounds.min.y > topY + 6) {
        fallen = p; fallAt = t; phase = "fell"; mine = M.myTurn = false; buttons(false); stopTurnClock(); clearPrank(); hover = null;
        window.Sound && Sound.cue("fall"); M.status(T("Something went over the edge!", "탁자 밖으로 떨어졌어요!"), 3000);
      }
      if (fallen) { if (t - fallAt > 1100) { phase = "done"; lose(); } return; }
      if (phase !== "falling") return;
      // the pile counts as still when nothing has moved more than a hair over the last 0.4 s (resting pieces jitter a little)
      if (!snap || t - snapT >= 400) {
        const now = pieces.map(p => [p.position.x, p.position.y, p.angle]);
        const still = snap && snap.length === now.length && t - dropAt > 600 && now.every((q, i) => Math.hypot(q[0] - snap[i][0], q[1] - snap[i][1]) < 0.8 && Math.abs(q[2] - snap[i][2]) < 0.012);
        snap = now; snapT = t;
        if (!still && t - dropAt < 6000) return;
      } else return;
      { phase = "wait"; snap = null; placed[dropper]++; M.score(placed[1], placed[2]); window.Sound && Sound.cue("land"); dropper === 1 ? M.after(250, catTurn) : M.after(250, myTurn); }
    }
    function paint() {
      ctx.clearRect(0, 0, W, Ht);
      ctx.save(); ctx.translate(0, -camY);
      const tw = (right - left) / 0.96, th = tw * (IMG.table.naturalHeight / IMG.table.naturalWidth || 0.9);
      if (IMG.table.complete) ctx.drawImage(IMG.table, (left + right) / 2 - tw / 2, topY - th * 0.07, tw, th);
      for (const p of pieces) drawPiece(p.plugin, p.position.x, p.position.y, p.angle, 1);
      if (hover && phase === "aim") {
        const x = hover.x, land = x + (mine ? shiftPx : 0);
        ctx.save(); ctx.setLineDash([3, 6]); ctx.strokeStyle = shiftPx && mine ? "rgba(168,82,122,.7)" : "rgba(71,60,58,.28)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(land, hoverY() + 30); ctx.lineTo(land, topY); ctx.stroke(); ctx.restore();
        const k = KINDS[hover.kind]; drawPiece({ kind: hover.kind, w: k.w * U, h: k.h * U, ox: 0, oy: 0 }, x, hoverY(), hover.a, mine ? 1 : 0.95);
      }
      ctx.restore();
      if (band) { over.querySelector(".tt-paw") && Object.assign(over.querySelector(".tt-paw").style, { left: band[0] + "px", width: band[1] - band[0] + "px" }); }
      if (sockOn && hover) { const s = over.querySelector(".tt-sock"); if (s) { s.style.left = hover.x + "px"; s.style.top = hoverY() - camY + "px"; } }
      const arrow = over.querySelector(".tt-shift"); if (arrow && hover) { arrow.style.left = hover.x + "px"; arrow.style.top = hoverY() - camY - 56 + "px"; }
    }
    function drawPiece(pl, x, y, a, alpha) {
      const img = IMG[pl.kind]; if (!img.complete) return;
      ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.rotate(a); ctx.drawImage(img, pl.ox - pl.w / 2, pl.oy - pl.h / 2, pl.w, pl.h); ctx.restore();
    }

    // ---- turns ----
    function deal() {
      while (queue.length < 2) { const ks = Object.keys(KINDS).filter(k => k !== queue[queue.length - 1]); queue.push(pick(ks)); }
      const k = queue.shift(); next.querySelector("img").src = `img/piece-${queue[0]}.webp`; return k;
    }
    // A clock for every turn of yours, as in Box Fort. When it runs out your piece is dropped where it is: passing would let
    // you wait out a shaky pile, so time is never an escape here. Pause holds it.
    let clock = null;
    function startClock(sec, drum = false) {
      stopTurnClock();
      const el = h("div", `m-clock bx-clock ${drum ? "is-drum" : ""}`, `<i></i><b>${sec}</b>`); el.style.setProperty("--sec", sec + "s"); el.setAttribute("aria-label", T(`${sec} seconds`, `${sec}초`)); controls.appendChild(el);
      let secs = sec;   // not "left": that name is the table's edge in this game
      const tick = () => {
        secs--; el.querySelector("b").textContent = Math.max(0, secs);
        if (drum) { window.Sound && Sound.cue("drum"); M.el.table.classList.toggle("is-drummed", secs <= 4); }
        else if (secs <= 5) { el.classList.add("is-low"); window.Sound && Sound.cue("tick"); }
        if (secs <= 0) timeUp(); else clock.t = M.after(1000, tick);
      };
      clock = { el, t: M.after(1000, tick) };
    }
    function stopTurnClock() { if (clock) { M.cancel(clock.t); clock.el.remove(); clock = null; } M.el.table.classList.remove("is-drummed"); }
    function timeUp() {
      stopTurnClock(); if (!mine || phase !== "aim" || !hover || M.over) return;
      if (band && hover.x > band[0] && hover.x < band[1]) hover.x = hover.x - band[0] < band[1] - hover.x ? band[0] - 1 : band[1] + 1;   // never into her paw
      M.status(T("Time's up. Your piece drops where it is.", "시간이 다 됐어요. 물건이 지금 자리에 놓여요."), 2200);
      const off = shiftPx; mine = M.myTurn = false; buttons(false); clearPrank(); drop(1, off);
    }
    function myTurn() {
      mine = M.myTurn = true; hover = { kind: deal(), x: (left + right) / 2, a: 0 }; phase = "aim";
      M.feel(steady(hover.kind) ? (placed[2] > placed[1] ? 0.1 : 0) : 0.8);
      buttons(true);
      M.playerTurn(id => { startClock(20); if (id) prank(id); else if (!M.winding) M.status(T("Drag to move, twist with two fingers to tilt, then Drop.", "끌어서 옮기고, 두 손가락으로 비틀어 기울인 다음 놓아요.")); }, { canPrank: pieces.length >= 1 });
    }
    function drop(who, off = 0) {
      if (phase !== "aim" || !hover) return;
      const x = hover.x + off;
      const b = make(hover.kind, x, hoverY(), hover.a); pieces.push(b); Composite.add(engine.world, b);
      hover = null; phase = "falling"; dropper = who; dropAt = simT; snap = null; fallen = null;
      window.Sound && Sound.cue("whoosh");
    }
    function myDrop() {
      if (!mine || phase !== "aim" || M.winding || M.over || M.paused) return;
      if (sockOn) { M.status(T("Tap the sock away first.", "먼저 양말을 눌러서 치우세요."), 1400); return; }
      if (band && hover.x > band[0] && hover.x < band[1]) { M.status(T(`${M.name()}'s paw is there this turn.`, `이번 차례엔 ${M.name()}의 앞발이 거기 있어요.`), 1600); return; }
      const off = shiftPx; mine = M.myTurn = false; buttons(false); stopTurnClock(); clearPrank(); drop(1, off);
    }
    function turn() { if (!mine || phase !== "aim" || !hover) return; hover.a += Math.PI / 12; window.Sound && Sound.cue("tap"); }   // 15 degrees a tap
    function catTurn() {
      hover = { kind: deal(), x: (left + right) / 2, a: 0 }; phase = "aim";
      M.catThink(q => {
        if (!hover || M.over || phase !== "aim") return;
        const p = plan(hover.kind, q);
        M.feel(p.risk > 200 ? -0.8 : 0.2);
        const x0 = hover.x, a0 = hover.a, steps = reduce ? 1 : 14; let i = 0;
        const slide = () => { i++; hover.x = x0 + (p.x - x0) * (i / steps); hover.a = a0 + (p.a - a0) * (i / steps); if (i < steps) M.after(40, slide); else { if (!hover) return; M.reach({ left: table.getBoundingClientRect().left + hover.x - 20, top: table.getBoundingClientRect().top + hoverY() - camY - 20, width: 40, height: 40 }, 420); M.after(260, () => drop(2)); } };
        slide();
      });
    }
    function lose() {
      clearPrank(); buttons(false); mine = M.myTurn = false;
      const what = tx(KINDS[fallen.plugin.kind].name), you = dropper === 1, kept = pieces.filter(p => p.bounds.min.y < topY).length;
      M.end(you ? "cat" : "you", [you ? T(`After your drop the ${what} went off the table.`, `내가 놓은 뒤 ${what} 탁자 밖으로 떨어졌어요.`) : T(`After ${M.name()}'s drop the ${what} went off the table.`, `${M.name()}가 놓은 뒤 ${what} 탁자 밖으로 떨어졌어요.`), T(`Pieces still on the table: ${kept}.`, `탁자에 남은 물건: ${kept}개.`)],
        { score: T(`Pieces placed: you ${placed[1]}, ${M.name()} ${placed[2]}`, `쌓은 물건: 나 ${placed[1]}개, ${M.name()} ${placed[2]}개`) });
    }

    // ---- touch: drag anywhere on the table to move your piece ----
    // One finger moves the piece. Two fingers twist it, by exactly the angle the fingers turn.
    const touches = new Map(); let twistAt = null;
    const angleOf = () => { const [a, b] = [...touches.values()]; return Math.atan2(b.y - a.y, b.x - a.x); };
    const move = e => {
      if (!touches.has(e.pointerId)) return;
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (!mine || !hover || phase !== "aim") return;
      if (touches.size >= 2) { const a = angleOf(); if (twistAt != null) { let d = a - twistAt; if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; hover.a += d; } twistAt = a; return; }
      const r = view.getBoundingClientRect(), hw = KINDS[hover.kind].w * U / 2; hover.x = Math.max(hw * 0.5, Math.min(W - hw * 0.5, e.clientX - r.left));
    };
    view.addEventListener("pointerdown", e => { if (e.target.closest(".tt-sock, .tt-actions")) return; touches.set(e.pointerId, { x: e.clientX, y: e.clientY }); twistAt = touches.size >= 2 ? angleOf() : null; if (touches.size === 1) move(e); });
    view.addEventListener("pointermove", move);
    const up = e => { touches.delete(e.pointerId); twistAt = touches.size >= 2 ? angleOf() : null; };
    addEventListener("pointerup", up); addEventListener("pointercancel", up);
    const actions = h("div", "tt-actions"); view.appendChild(actions);
    function buttons(on) {
      actions.innerHTML = "";
      if (!on) return;
      const t = h("button", "button is-quiet tt-btn", T("Turn", "돌리기")); t.addEventListener("click", turn);
      const d = h("button", "button tt-btn", T("Drop", "놓기")); d.addEventListener("click", myDrop);
      actions.append(t, d);
    }

    // ---- The eight pranks, as they land in this game. Each lasts for this turn of yours. ----
    function prank(id) {
      if (!hover || phase !== "aim") return;
      if (id === "loaf") { const lo = h("img", "tt-loaf"); lo.src = "img/cat-tofu-prank-cut.webp"; lo.alt = ""; lo.classList.toggle("is-right", Math.random() < 0.5); over.appendChild(lo); M.el.face.classList.add("is-away"); undo.push(() => { lo.remove(); M.el.face.classList.remove("is-away"); }); }
      if (id === "gift") { sockOn = true; const s = h("img", "tt-sock"); s.src = "img/prop-sock.webp"; s.alt = T("Sock", "양말"); s.addEventListener("pointerdown", e => { e.stopPropagation(); sockOn = false; s.remove(); window.Sound && Sound.cue("tap"); M.status(T("Flicked away.", "톡, 치웠어요."), 1200); }); over.appendChild(s); undo.push(() => { sockOn = false; s.remove(); }); }
      if (id === "pounce") { shiftPx = (Math.random() < 0.5 ? 1 : -1) * W * 0.06; const a = h("b", "tt-shift", shiftPx > 0 ? "→" : "←"); over.appendChild(a); undo.push(() => { shiftPx = 0; a.remove(); }); }
      if (id === "knead") { canvas.classList.add("is-wobble"); undo.push(() => canvas.classList.remove("is-wobble")); }
      if (id === "stare") { next.classList.add("is-hidden"); undo.push(() => next.classList.remove("is-hidden")); }
      if (id === "taptap") startClock(10, true);   // her drumming cuts your clock to 10 seconds; nothing else
      if (id === "lights") { M.lights(false); undo.push(() => M.lights(true)); }
      if (id === "pawdown") {   // a band over the pile you cannot drop into. Never over the steadiest spot for your piece.
        const tries = spots(hover.kind, 5).map(s => ({ ...s, ...trial(hover.kind, s.x, s.a, 100) })).sort((a, b) => a.risk - b.risk);
        const keep = tries[0].x, w = W * 0.2, ok = [left, (left + right) / 2 - w / 2, right - w].filter(a => keep < a || keep > a + w);
        if (ok.length) { const a = pick(ok); band = [a, a + w]; const p = h("i", "tt-paw", `<img src="img/paw-${M.cat.id}.webp" alt="">`); p.style.left = a + "px"; p.style.width = w + "px"; over.appendChild(p); undo.push(() => { band = null; p.remove(); }); }
      }
    }
    function clearPrank() { if (stopClock) { stopClock(); stopClock = null; } for (const f of undo) f(); undo = []; M.prankDone && M.prankDone(); }

    // The empty table and the first pieces show as soon as the match opens, before the cat has sat down.
    while (queue.length < 2) { const ks = Object.keys(KINDS).filter(k => k !== queue[queue.length - 1]); queue.push(pick(ks)); }
    next.querySelector("img").src = `img/piece-${queue[1]}.webp`;
    requestAnimationFrame(() => { if (!alive) return; size(); raf = requestAnimationFrame(frame); });
    IMG.table.decode && IMG.table.decode().then(() => alive && paint()).catch(() => {});

    return {
      begin() {
        size(); engine = world(pieces);
        M.score(0, 0); M.status(T("Whoever knocks something off loses.", "탁자 밖으로 떨어뜨리면 져요.")); myTurn();
      },
      destroy() { alive = false; cancelAnimationFrame(raf); if (stopClock) stopClock(); stopTurnClock(); removeEventListener("pointerup", up); removeEventListener("pointercancel", up); },
      state() { return { mine, phase, pieces: pieces.map(p => [p.plugin.kind, Math.round(p.position.x), Math.round(p.position.y), +p.angle.toFixed(2)]), hover: hover && { ...hover }, placed: { ...placed }, topY, left, right, W, camY }; },
      aim(x, a = 0) { if (hover && mine) { hover.x = x; hover.a = a; } },
      drop: myDrop, turn,
      plan: (kind, aimed = false) => plan(kind || (hover && hover.kind), "normal", aimed),
      trial: (kind, x, a, steps) => trial(kind, x, a, steps),
      prank: id => prank(id),   // for checking a prank by hand in the mock
    };
  };
})();
