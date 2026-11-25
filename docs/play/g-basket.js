// Basket Duel: two baskets side by side, played at the same time. Same yarn queue for both, and no end to the yarn.
// A chain of two or more merges drops a tangle into the other basket; a merge next to a tangle clears it.
// A basket that goes over the line loses. If the clock runs out first, the better score wins.
// The fixed-step physics follow the operator's Yarn Basket prototype (lpingcat playtime-yarn-basket/engine.js), resized for two baskets.
// Tell: ears forward means the cat's next drop makes a chain (a tangle is coming), ears flat means its basket is nearly full.
(() => {
  const h = (tag, cls, html) => { const el = document.createElement(tag); if (cls) el.className = cls; if (html != null) el.innerHTML = html; return el; };
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x)), rand = (a, b) => a + Math.random() * (b - a);
  const R = [10, 13, 17, 22, 28], TANGLE = -1, SOCK = -2, TR = 15;
  const B = { w: 176, h: 340, left: 6, right: 170, bottom: 332, line: 86, release: 46 };
  const SECONDS = 120;
  const rOf = b => (b.tier < 0 ? TR : R[b.tier]);

  function makeSide() { return { n: 0, balls: [{ tier: 1, x: 40, y: B.bottom - R[1], vx: 0, vy: 0, spin: 0, depth: 0 }, { tier: 0, x: 92, y: B.bottom - R[0], vx: 0, vy: 0, spin: 0, depth: 0 }, { tier: 2, x: 140, y: B.bottom - R[2], vx: 0, vy: 0, spin: 0, depth: 0 }], falling: false, ticks: 0, score: 0, chain: 0, tilt: 0, over: false, pendingTangles: 0, events: [] }; }
  const copy = s => ({ ...s, balls: s.balls.map(b => ({ ...b })), events: [] });
  function bounds(b) {
    const r = rOf(b);
    if (b.x < B.left + r) { b.x = B.left + r; b.vx = Math.abs(b.vx) * 0.24; }
    if (b.x > B.right - r) { b.x = B.right - r; b.vx = -Math.abs(b.vx) * 0.24; }
    if (b.y > B.bottom - r) { b.y = B.bottom - r; b.vy = b.vy > 0.68 ? -b.vy * 0.14 : 0; b.vx *= 0.9; }
  }
  function add(s, tier, x) { const r = tier < 0 ? TR : R[tier]; for (const b of s.balls) b.depth = 0; s.balls.push({ tier, x: clamp(x, B.left + r, B.right - r), y: B.release, vx: 0, vy: 0, spin: 0, depth: 0, ttl: tier === SOCK ? 7 : 0 }); s.falling = true; s.ticks = 0; s.chain = 0; }
  function step(s) {
    if (!s.falling) return;
    s.ticks++;
    for (const b of s.balls) { b.vy += 0.19; b.vx += s.tilt; b.vx *= 0.994; b.x += b.vx; b.y += b.vy; b.spin += b.vx * 0.03; bounds(b); }
    for (let pass = 0; pass < 4; pass++) {
      let merged = false;
      pairs: for (let i = 0; i < s.balls.length; i++) for (let j = i + 1; j < s.balls.length; j++) {
        const a = s.balls[i], b = s.balls[j], dx = b.x - a.x, dy = b.y - a.y, dist = Math.hypot(dx, dy), sum = rOf(a) + rOf(b);
        if (dist >= sum) continue;
        if (a.tier === b.tier && a.tier >= 0) {
          const level = a.tier + 1, depth = 1 + Math.max(a.depth, b.depth), x = (a.x + b.x) / 2, y = (a.y + b.y) / 2;
          s.score += 5 * 2 ** a.tier * depth + (level >= R.length ? 60 : 0); s.chain = Math.max(s.chain, depth);
          s.balls.splice(j, 1); s.balls.splice(i, 1);
          if (level < R.length) { const n = { tier: level, x, y: Math.min(y, B.bottom - R[level]), vx: (a.vx + b.vx) * 0.3, vy: -1.25, spin: 0, depth }; bounds(n); s.balls.push(n); }
          // A merge next to a tangle or a sock clears it.
          s.balls = s.balls.filter(t => t.tier >= 0 || Math.hypot(t.x - x, t.y - y) > TR + R[Math.min(level, R.length - 1)] + 5);
          s.events.push({ x, y, level, depth }); merged = true; break pairs;
        }
        const nx = dist ? dx / dist : 1, ny = dist ? dy / dist : 0, ra = rOf(a) ** 2, rb = rOf(b) ** 2, wa = rb / (ra + rb), wb = 1 - wa, sep = sum - dist;
        a.x -= nx * sep * wa; a.y -= ny * sep * wa; b.x += nx * sep * wb; b.y += ny * sep * wb;
        const speed = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
        if (speed < 0) { a.vx += nx * speed * wa * 1.12; a.vy += ny * speed * wa * 1.12; b.vx -= nx * speed * wb * 1.12; b.vy -= ny * speed * wb * 1.12; }
        bounds(a); bounds(b);
      }
      if (!merged) break;
    }
    const quiet = s.ticks > 65 && s.balls.every(b => Math.abs(b.vx) < 0.16 && Math.abs(b.vy) < 0.32);
    if (quiet || s.ticks >= 175) { for (const b of s.balls) { b.vx = 0; b.vy = 0; } s.falling = false; if (s.balls.some(b => b.y - rOf(b) < B.line)) s.over = true; }
  }
  const top = s => Math.min(B.bottom, ...s.balls.map(b => b.y - rOf(b)));

  GAME_IMPL.basket = (M, table, controls) => {
    const [nerve, smarts] = M.cat.traits;
    M.rt = true;
    const queue = [0, 0], q = i => { while (queue.length <= i) queue.push(Math.floor(Math.random() * 3)); return queue[i]; };
    const cat = makeSide(), you = makeSide();
    const wrap = h("div", "bd"); table.appendChild(wrap);
    const mk = (cls, label) => { const el = h("div", `bd-side ${cls}`, `<div class="bd-next"><span class="t-footnote t-strong">${label}</span><i></i></div><div class="bd-basket"><canvas></canvas><div class="bd-line"></div><div class="bd-fx"></div></div>`); wrap.appendChild(el); return { el, cv: el.querySelector("canvas"), next: el.querySelector(".bd-next i"), basket: el.querySelector(".bd-basket"), fx: el.querySelector(".bd-fx") }; };
    const cu = mk("is-cat", tx(M.cat.name)), yu = mk("is-you", T("You", "나"));
    const clockEl = h("div", "m-time t-num"); controls.appendChild(clockEl);
    const yarn = [0, 1, 2, 3, 4].map(i => { const im = new Image(); im.src = `img/yarn-${i}.webp`; return im; });
    const sockIm = new Image(); sockIm.src = "img/prop-sock.webp";
    let raf = 0, lastT = 0, acc = 0, elapsed = 0, aim = 88, aiming = false, catAt = 2.2, catPlan = null, done = false, lastSec = -1;
    let fx = { hideAim: 0, mystery: 0, nudge: 0, tilt: 0, tilt_t: 0, drum: 0, hold: null, holdT: 0, dark: 0 };

    function size() {
      const r = table.getBoundingClientRect(); if (!r.width) return;
      const wEach = Math.min((r.width - 36) / 2, (r.height - 64) * B.w / B.h);
      wrap.style.setProperty("--bw", wEach + "px"); wrap.style.setProperty("--bh", wEach * B.h / B.w + "px");
      for (const s of [cu, yu]) { const d = Math.min(3, devicePixelRatio || 1); s.cv.width = Math.round(wEach * d); s.cv.height = Math.round(wEach * B.h / B.w * d); }
    }
    function tangle(c, r) {   // a knot of grey yarn, drawn so it cannot be taken for a ball you can merge
      c.fillStyle = "#b9aea6"; c.beginPath(); c.arc(0, 0, r, 0, 7); c.fill();
      c.strokeStyle = "#7d736d"; c.lineWidth = 1.4; c.lineCap = "round";
      for (let i = 0; i < 5; i++) { c.beginPath(); c.ellipse(0, 0, r * 0.82, r * (0.25 + i * 0.12), i * 1.1, 0, 7); c.stroke(); }
      c.strokeStyle = "#fff"; c.lineWidth = 1; c.beginPath(); c.arc(0, 0, r - 0.5, 0, 7); c.stroke();
    }
    function draw(side, ui, ghost) {
      const c = ui.cv.getContext("2d"), k = ui.cv.width / B.w; c.setTransform(k, 0, 0, k, 0, 0); c.clearRect(0, 0, B.w, B.h);
      for (const b of side.balls) {
        const r = rOf(b); c.save(); c.translate(b.x, b.y); c.rotate(b.spin);
        if (b.tier === TANGLE) tangle(c, r);
        else { const im = b.tier === SOCK ? sockIm : yarn[b.tier]; if (im.complete && im.naturalWidth) c.drawImage(im, -r * 1.08, -r * 1.08, r * 2.16, r * 2.16); else { c.fillStyle = "#e9a9b9"; c.beginPath(); c.arc(0, 0, r, 0, 7); c.fill(); } }
        c.restore();
      }
      if (ghost != null) { const t = q(side.n), r = R[t]; c.globalAlpha = 0.9; if (ui === yu && fx.mystery > 0) { c.fillStyle = "#fff7e6"; c.strokeStyle = "#8a7a70"; c.setLineDash([3, 3]); c.lineWidth = 1; c.beginPath(); c.arc(ghost, B.release, 15, 0, 7); c.fill(); c.stroke(); c.setLineDash([]); } else if (yarn[t].complete) c.drawImage(yarn[t], ghost - r * 1.08, B.release - r * 1.08, r * 2.16, r * 2.16); c.globalAlpha = 0.5; c.strokeStyle = "#8a7a70"; c.setLineDash([3, 5]); c.lineWidth = 1; c.beginPath(); c.moveTo(ghost, B.release + 16); c.lineTo(ghost, B.bottom); c.stroke(); c.setLineDash([]); c.globalAlpha = 1; }
    }
    function nextUI() { for (const [side, ui, mine] of [[cat, cu, false], [you, yu, true]]) { const hide = mine && fx.mystery > 0; ui.next.style.backgroundImage = hide ? "none" : `url(img/yarn-${q(side.n)}.webp)`; ui.next.classList.toggle("is-mystery", hide); } }
    function pop(ui, e) { const p = h("i", "bd-pop" + (e.depth > 1 ? " is-chain" : "")); p.style.left = e.x / B.w * 100 + "%"; p.style.top = e.y / B.h * 100 + "%"; ui.fx.appendChild(p); setTimeout(() => p.remove(), 600); }
    function settle(side, other, ui, mine) {   // one drop came to rest
      for (const e of side.events) { pop(ui, e); window.Sound && Sound.cue(e.depth > 1 ? "chain" : "merge", { rate: 0.8 + e.level * 0.12, gain: mine ? 1 : 0.5 }); } side.events = [];
      if (side.chain >= 2) { other.pendingTangles += Math.min(2, side.chain - 1); M.status(mine ? T(`Chain! A tangle drops into ${M.name()}'s basket.`, `연쇄! ${M.name()}의 바구니에 엉킨 실이 떨어져요.`) : T(`${M.name()} made a chain. A tangle drops into your basket.`, `${M.name()}가 연쇄를 냈어요. 내 바구니에 엉킨 실이 떨어져요.`)); if (!mine) M.goodMove(); }
      M.score(you.score, cat.score);
    }
    const aimNow = () => aim + (fx.drum > 0 ? Math.sin(elapsed * 9) * 16 : 0);   // Button's drumming makes your aim shake
    function dropMine(x) {
      if (you.falling || done || M.paused) return;
      if (fx.hold) x = fx.hold === "l" ? Math.max(x, B.w * 0.36 + 10) : Math.min(x, B.w * 0.64 - 10);
      x += fx.nudge; if (fx.nudge) { fx.nudge = 0; yu.basket.classList.remove("is-nudge-l", "is-nudge-r"); }
      add(you, q(you.n), x); window.Sound && Sound.cue("yarn"); you.n++; nextUI();
    }
    // The cat tries a few spots, lets each one come to rest in a copy of its basket, and keeps the one it likes.
    function plan(quality) {
      const t = q(cat.n);
      if (quality === "careless") return { x: rand(20, 156), chain: 0 };
      const n = [0, 4, 6, 9, 12, 16][smarts], xs = Array.from({ length: n }, (_, i) => 16 + (144 * (i + 0.5)) / n);
      for (const b of cat.balls) if (b.tier === t) xs.push(b.x);
      let best = null;
      for (const x of xs) {
        const s = copy(cat); add(s, t, x); let guard = 0; while (s.falling && guard++ < 200) step(s);
        const height = clamp((B.bottom - top(s)) / (B.bottom - B.line), 0, 1.4);
        let near = 0; for (let i = 0; i < s.balls.length; i++) for (let j = i + 1; j < s.balls.length; j++) { const a = s.balls[i], b = s.balls[j]; if (a.tier === b.tier && a.tier >= 0 && Math.hypot(a.x - b.x, a.y - b.y) < rOf(a) * 2 + 12) near++; }
        // A daring cat stacks high for chains. A careful one keeps its basket low.
        const v = (s.score - cat.score) + near * smarts * 1.5 + (s.chain >= 2 ? 14 * nerve : 0) - height * height * (150 - nerve * 22) - (s.over ? 5000 : 0) + rand(0, 6 - smarts);
        if (!best || v > best.v) best = { x, v, chain: s.chain };
      }
      return best;
    }
    function tick() {
      for (const [side, other, ui, mine] of [[cat, you, cu, false], [you, cat, yu, true]]) {
        const was = side.falling; side.tilt = mine ? fx.tilt : 0; step(side);
        if (was && !side.falling) settle(side, other, ui, mine);
        if (!side.falling && side.pendingTangles > 0 && !side.over) { side.pendingTangles--; if (mine) window.Sound && Sound.cue("tangle"); add(side, TANGLE, rand(30, 146)); }
      }
      if (cat.over || you.over) return finish(cat.over && !you.over ? "you" : you.over && !cat.over ? "cat" : "tie", cat.over ? T(`${M.name()}'s basket went over the line.`, `${M.name()}의 바구니가 선을 넘었어요.`) : T("Your basket went over the line.", "내 바구니가 선을 넘었어요."));
      if (elapsed >= SECONDS) finish(you.score > cat.score ? "you" : cat.score > you.score ? "cat" : "tie", T(`Time. Yarn points: you ${you.score}, ${M.name()} ${cat.score}.`, `시간 끝. 실 점수: 나 ${you.score}, ${M.name()} ${cat.score}.`));
    }
    function finish(winner, line) { if (done) return; done = true; cancelAnimationFrame(raf); M.myTurn = false; M.score(you.score, cat.score); M.end(winner, [line]); }
    function frame(now) {
      if (done || !M.alive) return;
      raf = requestAnimationFrame(frame);
      if (M.paused) { lastT = now; return; }
      const dt = Math.min(0.05, (now - lastT) / 1000 || 0); lastT = now; acc += dt; elapsed += dt;
      while (acc >= 1 / 60) { acc -= 1 / 60; tick(); if (done) return; }
      // a sock from Mint goes away by itself after a few seconds
      for (const side of [you]) for (const b of side.balls) if (b.tier === SOCK && (b.ttl -= dt) <= 0 && !side.falling) { side.balls = side.balls.filter(o => o !== b); break; }
      // the cat
      if (!cat.falling && elapsed >= catAt) {
        if (!catPlan) { catPlan = plan(M.quality()); if (catPlan.chain >= 2) M.pose("glad", 1100); catAt = elapsed + (catPlan.chain >= 2 ? 0.9 : 0.25); }
        else { add(cat, q(cat.n), catPlan.x); window.Sound && Sound.cue("yarn", { rate: 0.8, gain: 0.45 }); cu.basket.classList.remove("is-dropping"); void cu.basket.offsetWidth; cu.basket.classList.add("is-dropping"); cat.n++; catPlan = null; catAt = elapsed + 2.3 - nerve * 0.3 + rand(0, 0.4) + (M.slipOn ? 1.4 : 0); nextUI(); }
      }
      // pranks that run on a timer
      for (const key of ["hideAim", "mystery", "tilt_t", "drum", "holdT", "dark"]) if (fx[key] > 0) { fx[key] -= dt; if (fx[key] <= 0) endFx(key); }
      const sec = Math.floor(elapsed);
      if (sec !== lastSec) {
        lastSec = sec; const left = Math.max(0, SECONDS - sec); clockEl.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
        M.feel(top(cat) < B.line + 60 ? -0.8 : (cat.score - you.score) / 120);
        M.rtPrank(elapsed, id => id && prank(id), { lead: (cat.score - you.score) / 300 });
      }
      draw(cat, cu, catPlan ? catPlan.x : null); draw(you, yu, !you.falling && fx.hideAim <= 0 ? aimNow() : null);
    }

    // ---- The eight pranks, as they land in this game. Each lasts a few seconds. ----
    function prank(id) {
      if (id === "loaf") { fx.hideAim = 6; const lo = h("img", "bd-loaf"); lo.src = "img/cat-tofu-prank-cut.webp"; lo.alt = ""; yu.basket.appendChild(lo); M.el.face.classList.add("is-away"); fx.loaf = lo; }
      if (id === "gift" && !you.falling) add(you, SOCK, rand(40, 136));
      if (id === "pounce") { const d = Math.random() < 0.5 ? -1 : 1; fx.nudge = d * 30; yu.basket.classList.add(d < 0 ? "is-nudge-l" : "is-nudge-r"); }
      if (id === "knead") { const d = Math.random() < 0.5 ? -1 : 1; fx.tilt = d * 0.035; fx.tilt_t = 6; yu.basket.classList.add(d < 0 ? "is-tilt-l" : "is-tilt-r"); }
      if (id === "stare") { fx.mystery = 8; nextUI(); }
      if (id === "taptap") { fx.drum = 6; yu.basket.classList.add("is-drum"); }
      if (id === "lights") { M.lights(false); fx.dark = 5; }
      if (id === "pawdown") { fx.hold = Math.random() < 0.5 ? "l" : "r"; fx.holdT = 5; const p = h("img", "bd-paw is-" + fx.hold); p.src = `img/paw-${M.cat.id}.webp`; p.alt = ""; yu.basket.appendChild(p); fx.paw = p; }
    }
    function endFx(key) {
      if (key === "hideAim" && fx.loaf) { fx.loaf.remove(); fx.loaf = null; M.el.face.classList.remove("is-away"); }
      if (key === "mystery") nextUI();
      if (key === "tilt_t") { fx.tilt = 0; yu.basket.classList.remove("is-tilt-l", "is-tilt-r"); }
      if (key === "drum") yu.basket.classList.remove("is-drum");
      if (key === "holdT") { fx.hold = null; fx.paw && fx.paw.remove(); }
      if (key === "dark") M.lights(true);
    }

    const toX = e => { const r = yu.cv.getBoundingClientRect(); return clamp((e.clientX - r.left) / r.width * B.w, 12, B.w - 12); };
    const onDown = e => { if (done) return; aiming = true; aim = toX(e); if (yu.basket.setPointerCapture && e.pointerId != null) { try { yu.basket.setPointerCapture(e.pointerId); } catch (err) { /* the pointer is already gone */ } } };
    const onMove = e => { if (aiming) aim = toX(e); };
    const onUp = e => { if (!aiming) return; aiming = false; aim = toX(e); dropMine(aimNow()); };
    yu.basket.addEventListener("pointerdown", onDown); yu.basket.addEventListener("pointermove", onMove); yu.basket.addEventListener("pointerup", onUp); yu.basket.addEventListener("pointercancel", () => { aiming = false; });
    const onResize = () => size(); addEventListener("resize", onResize);
    requestAnimationFrame(() => { size(); nextUI(); draw(cat, cu, null); draw(you, yu, aim); });   // the table is drawn before the cat has finished saying hello

    return {
      begin() { size(); nextUI(); M.myTurn = true; M.turnAt = M.now(); M.status(T("Drag over your basket, lift to drop. Match two of a kind.", "내 바구니 위에서 끌고, 손을 떼면 떨어져요. 같은 실 두 개를 붙이세요.")); lastT = performance.now(); raf = requestAnimationFrame(frame); },
      destroy() { done = true; cancelAnimationFrame(raf); removeEventListener("resize", onResize); },
      state() { const t = q(you.n); const same = you.balls.filter(b => b.tier === t).sort((a, b) => a.y - b.y)[0]; return { falling: you.falling, same: same ? same.x / B.w : null, top: top(you), topCat: top(cat), you: you.score, cat: cat.score, elapsed }; },
    };
  };
})();
