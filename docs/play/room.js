// Cat Clubhouse, design round 2: the living clubhouse room.
// The cats walk, groom, nap, stretch and do tricks on their own, and now and then two of them pair up: a nose boop, a wash,
// a chase, a pounce, a stare, or a scuffle inside a cartoon fight cloud. The rules, the numbers and the fight cloud follow
// the operator's lpingcat room (lpingcat src/characters/legacy/cat-life.js and scuffle.ts): a state and an `until` time per cat,
// walk frames keyed to distance so feet never skate, transforms for everything else, one clock with a capped step,
// and nothing running while the room is hidden. A tap greets a cat, a held finger picks it up.
(() => {
  const h = (tag, cls, html) => { const el = document.createElement(tag); if (cls) el.className = cls; if (html != null) el.innerHTML = html; return el; };
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), ease = (rate, dt) => 1 - Math.exp(-rate * dt);
  const smooth = u => { const v = clamp(u); return v * v * (3 - 2 * v); }, backOut = u => { const v = clamp(u) - 1; return 1 + v * v * (2.6 * v + 1.6); };
  const rad = d => d * Math.PI / 180;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- The scuffle, after lpingcat's scuffle.ts. Lengths are art units: 100 is the cloud box's width, (0,0) the floor under its middle. ----
  const SCUFFLE_TIME = 4.2, LUNGE = 0.2, POOF = SCUFFLE_TIME - 0.42, RX = 43, RY = 33, CY = -RY, BOIL = [0, 2, 1, 3, 0, 1, 2, 3, 1, 0, 3, 2];
  const held = (t, fps) => Math.floor(t * fps) / fps, jitter = n => { const v = Math.sin(n * 12.9898) * 43758.5453; return (v - Math.floor(v)) * 2 - 1; };
  function scuffleMove(t) {
    if (t < LUNGE) { const u = t / LUNGE; return { pounce: u >= 0.4, veiled: false, pull: smooth((u - 0.3) / 0.7), hop: Math.sin(clamp((u - 0.3) / 0.7) * Math.PI) * 12, rear: 0, squash: u < 0.4 ? 0.9 : 1.04 }; }
    if (t < POOF) return { veiled: true, pull: 1, hop: 0, rear: 0, squash: 1 };
    const u = clamp((t - POOF) / (SCUFFLE_TIME - POOF));
    return { pounce: u < 0.55, veiled: false, pull: 1 - backOut(u / 0.8), hop: Math.sin(clamp(u / 0.8) * Math.PI) * 10, rear: Math.sin(u * 24) * 8 * (1 - u), squash: 1 };
  }
  const FILES = { "cloud-0": [96, 76], "cloud-1": [96, 76], "cloud-2": [96, 76], "cloud-3": [96, 76], collar: [40, 22], "puff-a": [18, 15], "puff-b": [14, 12], star: [12, 12], spark: [10, 10], ticks: [16, 12], vein: [11, 11] };
  const edge = (deg, reach = 1.1) => ({ x: Math.cos(rad(deg)) * RX * reach, y: CY + Math.sin(rad(deg)) * RY * reach });
  const outward = (deg, at, last, id) => { const { x, y } = edge(deg, 1.2); return { id, at, last, x, y, rot: Math.atan2(x, CY - y) * 180 / Math.PI, mirror: 1, wag: 12 }; };
  const POPS = [
    outward(-140, 0.3, 0.42, "paw0"), { id: "head1", at: 0.55, last: 0.72, x: 16, y: -43, rot: 13, mirror: -1, wag: 6, cuff: 0 },
    outward(-35, 1.1, 0.4, "paw1"), { id: "head0", at: 1.38, last: 0.82, x: -16, y: -44, rot: -13, mirror: 1, wag: 6, cuff: 1 },
    { id: "front1", at: 1.74, last: 0.42, x: 15, y: -36, rot: 12, mirror: 1, wag: 12, cuff: 0 }, outward(150, 2.1, 0.4, "paw0"),
    { id: "head1", at: 2.3, last: 0.78, x: 15, y: -44, rot: 16, mirror: -1, wag: 6, cuff: 2 }, { id: "head0", at: 2.46, last: 0.62, x: -17, y: -43, rot: -16, mirror: 1, wag: 6, cuff: 1 },
    outward(35, 3.1, 0.38, "paw1"), { id: "front0", at: 3.14, last: 0.4, x: -13, y: -34, rot: -14, mirror: 1, wag: 12, cuff: 1 },
  ];
  // In drawing order: side paws behind the cloud, heads and raised paws in front of it with a collar of cloud bumps where they are cut off.
  const PARTS = ["rise0:puff-a", "rise1:puff-b", "rise2:puff-b", "paw0:paw:0", "paw1:paw:1", "cloud0:cloud-0", "cloud1:cloud-1", "cloud2:cloud-2", "cloud3:cloud-3", "head0:head:0", "head1:head:1", "front0:paw:0", "front1:paw:1", "cuff0:collar", "cuff1:collar", "cuff2:collar", "kick0:puff-b", "kick1:puff-b", "star0:star", "star1:star", "star2:star", "spark0:spark", "spark1:spark", "ticks0:ticks", "ticks1:ticks", "vein0:vein", "vein1:vein"].map(s => { const [id, file, slot] = s.split(":"); return { id, file, slot: slot == null ? null : +slot }; });
  const HIDDEN = { x: 0, y: 0, rot: 0, sx: 1, sy: 1, opacity: 0 };
  function scuffleBall(t) {
    const m = held(t, 24), on = smooth(m / LUNGE) * (1 - smooth((m - POOF) / 0.25)), hop = Math.abs(Math.sin(m * 5.2)), n = Math.floor(t * 12);
    return { x: (Math.sin(m * 2.6) * 8 + jitter(n) * 1.2) * on, y: -hop * 4.5 * on, rot: (Math.sin(m * 3.7) * 6 + jitter(n + 7) * 1.6) * on, sx: 1 + (0.05 - hop * 0.1) * on, sy: 1 - (0.05 - hop * 0.1) * on, opacity: 1 - smooth((t - POOF) / (SCUFFLE_TIME - POOF - 0.05)) };
  }
  function scuffleFrame(t) {
    const f = {}, m = held(t, 24), going = t >= POOF, width = 46, scale = width / 50;
    const grow = t < 0.08 ? 0 : backOut((t - 0.08) / 0.14) * (1 + clamp((t - POOF) / 0.42) * 0.2), shown = BOIL[Math.floor(t * 9) % BOIL.length];
    for (let i = 0; i < 4; i++) f[`cloud${i}`] = { x: 0, y: CY, rot: 0, sx: grow, sy: grow, opacity: t >= 0.08 && i === shown ? 1 : 0 };
    for (const p of PARTS) if (p.slot != null || p.id.startsWith("cuff") || p.id.startsWith("vein")) f[p.id] = HIDDEN;
    for (const pop of POPS) {
      const u = (t - pop.at) / pop.last; if (u <= 0 || u >= 1 || going) continue;
      const head = pop.id.startsWith("head"), paw = !head, inFront = pop.cuff !== undefined;
      const age = m - pop.at, snap = backOut(u / 0.16) * (1 - smooth((u - 0.84) / 0.16)), turn = pop.rot + Math.sin(age * 22) * pop.wag;
      const tipX = Math.sin(rad(pop.rot)), tipY = -Math.cos(rad(pop.rot)), jab = paw ? Math.max(0, Math.sin(age * 17)) * 4 : 0, slide = jab - (1 - snap) * (inFront ? 6 : 18);
      const grown = inFront ? 0.6 + 0.4 * clamp(snap) : 1, there = clamp(u * 40) * clamp((1 - u) * 40) * (inFront && snap < 0.2 ? 0 : 1);
      f[pop.id] = { x: pop.x + tipX * slide, y: pop.y + tipY * slide, rot: turn, sx: scale * pop.mirror * grown, sy: scale * grown, opacity: there };
      if (inFront) { const wide = head ? scale * 1.02 : scale * 0.62, drop = (head ? 17 : 12) * scale; f[`cuff${pop.cuff}`] = { x: pop.x - tipX * drop, y: pop.y - tipY * drop + Math.sin(m * 9) * 0.6, rot: pop.rot * 0.35, sx: wide * grown, sy: wide * grown, opacity: there }; }
      if (head && u > 0.1 && u < 0.9) { const beat = 1 + Math.sin(m * 15) * 0.16; f[pop.id === "head0" ? "vein0" : "vein1"] = { x: pop.x + pop.mirror * -13 * scale, y: pop.y - 16 * scale, rot: Math.sin(m * 13) * 10, sx: scale * beat, sy: scale * beat, opacity: 1 }; }
    }
    [0, 1].forEach(i => { const clock = (t - 0.25) / 0.46 + i * 0.5, beat = Math.floor(clock), u = clock - beat, spot = edge(-170 + jitter(beat * 3 + i) * 80 + (i ? 150 : 0), 1.2); f[`ticks${i}`] = t > 0.25 && !going && u < 0.34 ? { x: spot.x, y: spot.y, rot: Math.atan2(spot.x, CY - spot.y) * 180 / Math.PI, sx: 0.95, sy: 0.95, opacity: 1 } : HIDDEN; });
    const puff = (id, period, offset, from, to, size, spin) => {
      if (going) { const u = clamp((t - POOF) / 0.36), angle = rad(offset * 360 - 90), reach = 44 + 20 * backOut(u); f[id] = u < 1 ? { x: Math.cos(angle) * reach, y: CY + Math.sin(angle) * reach * 0.8, rot: u * spin, sx: size * (1 - u * 0.8), sy: size * (1 - u * 0.8), opacity: 1 } : HIDDEN; return; }
      const clock = (m - LUNGE) / period + offset, u = clock - Math.floor(clock), left = jitter(Math.floor(clock)) < 0 ? -1 : 1, shrink = size * Math.sin(Math.min(1, u * 1.15) * Math.PI / 2 + Math.PI / 2 * clamp(u * 1.15 - 0.25));
      f[id] = m > LUNGE ? { x: from[0] * left + (to[0] - from[0]) * left * u, y: from[1] + (to[1] - from[1]) * u, rot: u * spin * left, sx: Math.max(0.01, shrink), sy: Math.max(0.01, shrink), opacity: 1 } : HIDDEN;
    };
    puff("rise0", 0.95, 0, [24, -58], [40, -82], 0.86, 40); puff("rise1", 1.1, 0.34, [-22, -58], [-36, -80], 0.9, -50); puff("rise2", 0.8, 0.68, [8, -64], [14, -84], 0.8, 70);
    puff("kick0", 0.62, 0, [40, -3], [54, -7], 0.86, 80); puff("kick1", 0.74, 0.5, [38, -2], [52, -6], 0.78, -80);
    const fling = (id, period, offset, deg, reach, spin, size) => { const clock = (m - LUNGE) / period - offset, u = clock - Math.floor(clock), a = rad(deg + Math.floor(clock) * 47), travel = u ** 0.55 * reach, s = size * Math.min(1, u * 5) * (1 - u * 0.45); f[id] = m > LUNGE && t < POOF + 0.12 && clock >= 0 ? { x: Math.cos(a) * (RX * 1.02 + travel), y: CY + Math.sin(a) * (RY * 1.02 + travel * 0.85), rot: u * spin, sx: s, sy: s, opacity: Math.min(1, (1 - u) * 4) } : HIDDEN; };
    fling("star0", 0.9, 0, -150, 12, 200, 0.92); fling("star1", 1.05, 0.33, -35, 13, -190, 0.86); fling("star2", 1.2, 0.66, -95, 11, 220, 0.8);
    fling("spark0", 0.7, 0.2, -60, 10, 90, 0.86); fling("spark1", 0.8, 0.7, -125, 10, -90, 0.86);
    return f;
  }

  // ---- The room. Positions are in percent of the painted scene: x across, y down. ----
  const FLOOR = { left: 9, right: 91, top: 59, bottom: 87 }, TABLE = { x: 49.5, y: 64.5, rx: 23, ry: 6.5 };
  const HOME = { tofu: [24, 60, 21], plum: [74, 59.5, 18], jelly: [21, 74, 20], button: [76, 74.5, 20], ollie: [82, 34.5, 17], mint: [50, 46, 17], sumi: [84, 86.5, 21], mango: [37, 87, 15] };
  const PERCH = [{ x: 24, y: 60 }, { x: 74, y: 59.5 }, { x: 21, y: 74 }, { x: 76, y: 74.5 }, { x: 82, y: 34.5, high: true, foot: { x: 86, y: 62 } }, { x: 50, y: 46, high: true, foot: { x: 19, y: 66 } }, { x: 84, y: 86.5 }];
  const ROOM = ["stand", "walk1", "walk2", "sleep", "groom", "pounce"], FRONT = ["idle", "glad", "worried"];
  const LOOKS = { tofu: [-1, 1], mint: [-1, 1], mango: [-1, -1], jelly: [1, 1], ollie: [1, 1], button: [1, 1], sumi: [-1, -1], plum: [-1, 1] };   // [standing and walking, pouncing]
  const SPEED = { walk: 5.4, trot: 9.5, zoomies: 16, chase: 14, follow: 7, pair: 9, release: 6.6 };
  const hash = s => { let n = 7; for (const ch of s) n = (n * 31 + ch.charCodeAt(0)) >>> 0; return n; };
  const inTable = (x, y, pad = 0) => ((x - TABLE.x) / (TABLE.rx + pad)) ** 2 + ((y - TABLE.y) / (TABLE.ry + pad)) ** 2 < 1;

  class Room {
    constructor(el) {
      this.el = el; this.scene = h("div", "scene"); el.innerHTML = ""; el.appendChild(this.scene);
      this.time = 0; this.seed = (Date.now() ^ 0x5bd1e995) >>> 0; this.pairs = []; this.cats = []; this.running = false; this.last = 0;
      for (const [id, [x, y, w]] of Object.entries(HOME)) {
        const el = h("button", "rc"); el.dataset.cat = id; el.setAttribute("data-check-skip", ""); el.setAttribute("aria-label", tx(CAT[id].name));
        const body = h("span", "rc-body"), imgs = {};
        for (const p of [...FRONT.map(n => ["f-" + n, `img/cat-${id}-${n}.webp`]), ...ROOM.map(n => ["r-" + n, `img/room-${id}-${n}.webp`])]) { const i = new Image(); i.src = p[1]; i.alt = ""; i.draggable = false; i.hidden = p[0] !== "f-idle"; body.appendChild(i); imgs[p[0]] = i; }
        const emote = h("i", "rc-emote"); emote.hidden = true;
        el.append(body, emote); this.scene.appendChild(el);
        const n = hash(id), perch = PERCH.find(p => p.x === x && p.y === y) || null;
        const c = { id, el, body, imgs, emote, x, y, w, vx: 0, vy: 0, facing: n % 2 ? -1 : 1, state: "watch", until: 1.5 + n % 7, pose: "f-idle", distance: n % 42, jump: 0, tilt: 0, squash: 1, lift: perch && perch.high ? 0 : 0, perch, index: this.cats.length, turnLock: 0, target: null, route: null, pair: null, held: null, emoteUntil: 0, shown: {}, alpha: 1, nextPairAt: 4 + n % 9 };
        if (perch) perch.user = c;
        this.cats.push(c); this.bind(c);
      }
      // the fight cloud, built once and shown only during a scuffle
      this.cloud = h("div", "rc-cloud"); this.cloud.hidden = true; this.parts = {};
      for (const p of PARTS) { const i = new Image(); i.alt = ""; i.draggable = false; i.className = "rc-part" + (p.file === "paw" ? " is-paw" : p.file === "head" ? " is-head" : ""); if (FILES[p.file]) { i.src = `img/scuffle/${p.file}.webp`; i.style.width = FILES[p.file][0] + "%"; } this.cloud.appendChild(i); this.parts[p.id] = { el: i, part: p, shown: "" }; }
      this.scene.appendChild(this.cloud);
      this.name = h("button", "rc-name"); this.name.hidden = true; this.name.dataset.go = "cat"; this.scene.appendChild(this.name);
      this.draw();
      new IntersectionObserver(es => { this.visible = es[0].isIntersecting; this.check(); }).observe(el);
      document.addEventListener("visibilitychange", () => this.check());
      document.addEventListener("proto:go", () => setTimeout(() => this.check(), 0));
    }
    random() { this.seed = (1664525 * this.seed + 1013904223) >>> 0; return this.seed / 4294967296; }
    check() { const go = !reduce && this.visible && !document.hidden && this.el.offsetParent !== null; if (go && !this.running) { this.running = true; this.last = performance.now(); requestAnimationFrame(t => this.frame(t)); } else if (!go) this.running = false; }
    frame(now) { if (!this.running) return; const dt = clamp((now - this.last) / 1000, 0, 0.04); this.last = now; this.step(dt); this.draw(); requestAnimationFrame(t => this.frame(t)); }

    // ---- choosing what to do (lpingcat's shares: walk 52, groom 18, rest 14, stretch 6, a trick 10; then 3 in 10 look for a friend) ----
    set(c, state, seconds) { c.state = state; c.until = this.time + seconds; }
    say(c, text, seconds = 1.8) { c.emoteText = text; c.emoteUntil = this.time + seconds; }
    point() { for (let i = 0; i < 20; i++) { const p = { x: FLOOR.left + this.random() * (FLOOR.right - FLOOR.left), y: FLOOR.top + this.random() * (FLOOR.bottom - FLOOR.top) }; if (!inTable(p.x, p.y, 5)) return p; } return { x: 20, y: 82 }; }
    leavePerch(c) { if (!c.perch) return; const p = c.perch; p.user = null; c.perch = null; if (p.high) c.hop = { t: this.time, from: { x: c.x, y: c.y }, to: { ...p.foot }, dur: 0.8 }; }
    goTo(c, p) { c.target = p; c.route = inTable((c.x + p.x) / 2, (c.y + p.y) / 2, 4) || (Math.sign(c.x - TABLE.x) !== Math.sign(p.x - TABLE.x) && Math.abs(c.y - TABLE.y) < TABLE.ry + 6 && Math.abs(p.y - TABLE.y) < TABLE.ry + 6) ? [{ x: (c.x + p.x) / 2, y: TABLE.y + TABLE.ry + 7 }, p] : [p]; c.target = c.route[0]; c.routeStep = 0; }
    seekRest(c) {
      const free = PERCH.filter(p => !p.user).sort((a, b) => Math.hypot(a.x - c.x, a.y - c.y) - Math.hypot(b.x - c.x, b.y - c.y))[Math.floor(this.random() * 2)];
      if (!free) { this.set(c, "sleep", 9 + this.random() * 6); return; }
      free.user = c; c.perchGoal = free; this.goTo(c, free.high ? { ...free.foot } : { x: free.x, y: free.y }); this.set(c, "settling", 18);
    }
    choose(c) {
      if (c.pair || c.held || c.hop) return;
      if (c.perchGoal) { c.perchGoal.user = null; c.perchGoal = null; }   // it never got to its resting place: the place is free again
      if (c.state === "sleep") { this.set(c, "stretch", 1.7); return; }
      if (c.perch && this.random() < 0.45) { this.set(c, this.random() < 0.5 ? "watch" : "groom", 3 + this.random() * 3); return; }
      this.leavePerch(c);
      const r = this.random();
      if (r < 0.52) { this.set(c, "walk", 5 + this.random() * 4); this.goTo(c, this.point()); }
      else if (r < 0.7) this.set(c, "groom", 3.2 + this.random() * 2);
      else if (r < 0.84) { this.seekRest(c); return; }
      else if (r < 0.9) this.set(c, "stretch", 2);
      else { const kind = ["trot", "zoomies", "jump", "spin", "roll"][Math.floor(this.random() * 5)]; this.set(c, kind, kind === "zoomies" ? 5 : 3); c.soloStart = this.time; c.loop = [this.point(), this.point(), this.point()]; c.loopStep = 0; if (kind === "trot" || kind === "zoomies") { c.route = [c.loop[0]]; c.target = c.loop[0]; if (kind === "zoomies") window.Sound && Sound.cue("whoosh"); } }
      if (this.time >= c.nextPairAt && this.random() < 0.5) {
        const peer = this.cats.filter(p => p !== c && !p.pair && !p.held && !p.hop && !p.perch && !["sleep", "settling"].includes(p.state)).sort((a, b) => Math.hypot(a.x - c.x, a.y - c.y) - Math.hypot(b.x - c.x, b.y - c.y))[0];
        if (peer) this.startPair(c, peer, ["boop", "groom", "chase", "pounce", "follow", "stalk", "brawl", "stare"][Math.floor(this.random() * 8)]);
        c.nextPairAt = this.time + 6 + this.random() * 8;
      }
    }
    startPair(a, b, kind) {
      if (a.pair || b.pair || this.pairs.length >= 2) return;
      if (kind === "brawl" && this.pairs.some(p => p.kind === "brawl")) kind = "pounce";
      this.leavePerch(a); this.leavePerch(b);
      const ax = a.perch && a.perch.high ? a.perch.foot.x : a.x, ay = a.perch && a.perch.high ? a.perch.foot.y : a.y;
      let mx = clamp(ax * 0.7 + b.x * 0.3, FLOOR.left + 14, FLOOR.right - 14), my = clamp(ay * 0.7 + b.y * 0.3, FLOOR.top + 2, FLOOR.bottom - 1); const gap = 15, near = () => this.pairs.some(p => Math.hypot(p.mx - mx, (p.my - my) * 1.6) < 26);
      for (let i = 0; i < 16 && (inTable(mx - gap / 2, my, 9) || inTable(mx + gap / 2, my, 9) || inTable(mx, my, 9) || my < TABLE.y || near()); i++) { const p = this.point(); mx = clamp(p.x, FLOOR.left + 14, FLOOR.right - 14); my = p.y; }
      const pair = { a, b, kind, phase: "approach", start: this.time, t: this.time, mx, my, gap, side: a.x <= b.x ? -1 : 1, step: 0, trace: [] };
      a.pair = b.pair = pair; this.pairs.push(pair); a.state = b.state = "approach"; a.until = b.until = Infinity;
    }
    endPair(p) { for (const c of [p.a, p.b]) { if (c.pair === p) c.pair = null; this.set(c, "watch", 1.5 + this.random() * 2); c.target = null; c.route = null; c.jump = 0; c.tilt = 0; c.veiled = false; } this.pairs = this.pairs.filter(x => x !== p); if (p.kind === "brawl") this.cloud.hidden = true; }
    pairStep(p) {
      const { a, b } = p, elapsed = this.time - p.t, left = { x: p.mx + p.side * p.gap / 2, y: p.my }, right = { x: p.mx - p.side * p.gap / 2, y: p.my + 0.5 };
      if (p.phase === "approach") {
        if (a.target !== left && Math.hypot(a.x - left.x, a.y - left.y) > 1.3) { a.route = null; a.target = left; } if (Math.hypot(b.x - right.x, b.y - right.y) > 1.3) { b.route = null; b.target = right; }
        p.left = left; p.right = right; a.top = b.top = SPEED.pair;
        const arrived = Math.hypot(a.x - left.x, a.y - left.y) < 1.4 && Math.hypot(b.x - right.x, b.y - right.y) < 1.4;
        if (arrived) { p.phase = ["chase", "follow"].includes(p.kind) ? "chase" : "together"; p.t = this.time; a.state = b.state = p.kind; a.target = b.target = null; this.onPair(p); }
        else if (this.time - p.start > 12) this.endPair(p);
      } else if (p.phase === "chase") {
        p.loop = p.loop || [{ x: FLOOR.right - 6, y: FLOOR.top + 2 }, { x: FLOOR.right - 8, y: FLOOR.bottom - 1 }, { x: FLOOR.left + 8, y: FLOOR.bottom - 1 }, { x: FLOOR.left + 6, y: FLOOR.top + 2 }];
        a.target = p.loop[p.step % 4]; a.route = null; a.top = p.kind === "follow" ? SPEED.follow : SPEED.chase; b.top = a.top * 1.05;
        if (Math.hypot(a.x - a.target.x, a.y - a.target.y) < 4) p.step++;
        if (!p.trace.length || this.time - p.trace[p.trace.length - 1].time >= 0.1) { p.trace.push({ x: a.x, y: a.y, time: this.time }); if (p.trace.length > 20) p.trace.shift(); }
        b.target = p.trace.find(v => this.time - v.time < 1.1) || { x: a.x, y: a.y }; b.route = null;
        if (p.kind === "chase" && elapsed > 4 && !p.swapped) { p.swapped = true; [p.a, p.b] = [p.b, p.a]; p.trace = []; }
        if (elapsed > 8) { p.phase = "release"; p.t = this.time; this.say(a, "♪"); this.say(b, "♪"); }
      } else if (p.phase === "together") {
        a.facing = -p.side; b.facing = p.side; a.target = b.target = null;
        if (p.kind === "boop") { a.tilt = -p.side * Math.sin(Math.min(elapsed / 1.4, 1) * Math.PI) * 5; b.tilt = -a.tilt; }
        if (p.kind === "pounce" || p.kind === "stalk") { const u = clamp((elapsed - 0.55) / 0.8), v = clamp((elapsed - 0.85) / 0.65); a.jump = Math.sin(u * Math.PI) * 7; b.jump = Math.sin(v * Math.PI) * 3.6; a.squash = elapsed < 0.55 ? (p.kind === "stalk" ? 0.8 : 1 - Math.sin(elapsed / 0.55 * Math.PI) * 0.1) : 1; a.leap = u > 0 && u < 1; }
        if (p.kind === "stare") { a.tilt = Math.sin(elapsed * 2) * 4; b.tilt = -a.tilt; this.say(a, "?", 0.2); this.say(b, "?", 0.2); }
        if (p.kind === "brawl") this.scuffle(p, elapsed);
        if (elapsed > 0.5 && elapsed < 2.6 && !["brawl", "stare"].includes(p.kind)) { this.say(a, p.kind === "pounce" || p.kind === "stalk" ? "!" : "♡", 0.2); this.say(b, "♡", 0.2); }
        if (elapsed > (p.kind === "groom" ? 4.5 : p.kind === "brawl" ? SCUFFLE_TIME : 3)) { p.phase = "release"; p.t = this.time; a.veiled = b.veiled = false; a.leap = false; if (p.kind === "brawl") { this.cloud.hidden = true; this.say(a, "!", 0.9); this.say(b, "♪", 1.2); } }
      } else if (p.phase === "release") {
        const away = c => ({ x: clamp(c.x + (c === a ? p.side : -p.side) * 13, FLOOR.left, FLOOR.right), y: clamp(c.y + (c === a ? -3 : 3), FLOOR.top, FLOOR.bottom) });
        p.exitA = p.exitA || away(a); p.exitB = p.exitB || away(b); a.target = p.exitA; b.target = p.exitB; a.route = b.route = null; a.top = b.top = SPEED.release;
        if (elapsed > 2.2) this.endPair(p);
      }
    }
    onPair(p) {
      if (!window.Sound) return;
      if (p.kind === "brawl") { Sound.cat(p.a.id, "squeak"); setTimeout(() => Sound.cat(p.b.id, "squeak"), 260); }
      else if (p.kind === "boop" || p.kind === "groom") Sound.cue("heart");
      else if (p.kind === "pounce" || p.kind === "stalk") setTimeout(() => Sound.cue("pop"), 600);
      else if (p.kind === "chase") Sound.cue("whoosh");
    }
    // Scufflers lunge together, vanish into the cloud, and tumble back out to the spots they came from.
    scuffle(p, t) {
      p.spots = p.spots || new Map([[p.a, p.a.x], [p.b, p.b.x]]);
      const move = scuffleMove(t);
      for (const c of [p.a, p.b]) { const spot = p.spots.get(c); c.x = spot + (p.mx - spot) * move.pull * 0.72; c.jump = move.hop * 0.16; c.veiled = move.veiled; c.tilt = move.rear; c.squash = move.squash; c.leap = !!move.pounce; }
      const beat = Math.floor(t / 0.34); if (move.veiled && beat !== p.beat) { p.beat = beat; window.Sound && Sound.cue("thump", { rate: 0.8 + this.random() * 0.6 }); }
      if (this.cloud.hidden) { this.cloud.hidden = false; this.cloud.dataset.a = p.a.id; this.cloud.dataset.b = p.b.id; for (const k in this.parts) { const { el, part } = this.parts[k]; if (part.file === "paw") el.src = `img/paw-${part.slot ? p.b.id : p.a.id}.webp`; if (part.file === "head") el.src = `img/head-${part.slot ? p.b.id : p.a.id}.webp`; } }
      const ball = scuffleBall(t), frame = scuffleFrame(t), unit = (p.a.w + p.b.w) / 2 * 0.66 / 46;   // one art unit, in percent of the scene's width
      this.cloud.style.left = p.mx + "%"; this.cloud.style.top = p.my + "%"; this.cloud.style.width = unit * 100 + "%"; this.cloud.style.zIndex = Math.round(p.my * 10) + 3;
      this.cloud.style.transform = `translate(-50%, -100%) translate(${ball.x}%, ${ball.y}%) rotate(${ball.rot}deg) scale(${ball.sx}, ${ball.sy})`; this.cloud.style.opacity = ball.opacity;
      for (const k in this.parts) { const part = this.parts[k], f = frame[k] || HIDDEN, s = f.opacity <= 0 ? "0" : `${f.x.toFixed(1)}|${f.y.toFixed(1)}|${f.rot.toFixed(1)}|${f.sx.toFixed(2)}|${f.sy.toFixed(2)}|${f.opacity.toFixed(2)}`; if (s === part.shown) continue; part.shown = s; part.el.style.opacity = f.opacity; if (f.opacity > 0) { part.el.style.left = 50 + f.x + "%"; part.el.style.top = 100 + f.y + "%"; part.el.style.transform = `translate(-50%, -50%) rotate(${f.rot + (part.part.file === "paw" ? 180 : 0)}deg) scale(${f.sx}, ${f.sy})`; } }
    }

    // ---- one step of the clock ----
    steer(c, top, dt) {
      const t = c.target; c.moving = false;
      if (!t) { c.vx *= Math.exp(-dt * 8); c.vy *= Math.exp(-dt * 8); return; }
      const dx = t.x - c.x, dy = (t.y - c.y) * 1.6, d = Math.hypot(dx, dy);
      if (d < 0.6) { if (c.route && c.routeStep < c.route.length - 1) c.target = c.route[++c.routeStep]; else if (!c.pair) c.target = null; return; }
      const speed = Math.min(top, d * 4 + 1.5), ax = ease(4.5, dt);
      c.vx += (dx / d * speed - c.vx) * ax; c.vy += (dy / d * speed / 1.6 - c.vy) * ax;
      c.x = clamp(c.x + c.vx * dt, FLOOR.left - 2, FLOOR.right + 2); c.y = clamp(c.y + c.vy * dt, FLOOR.top - 1, FLOOR.bottom + 1);
      if (inTable(c.x, c.y, 2)) { const ex = (c.x - TABLE.x) / (TABLE.rx + 2), ey = (c.y - TABLE.y) / (TABLE.ry + 2), n = Math.hypot(ex, ey) || 1; c.x = TABLE.x + ex / n * (TABLE.rx + 2); c.y = TABLE.y + (ey >= -0.2 ? Math.abs(ey) : ey) / n * (TABLE.ry + 2); c.x += (c.x < TABLE.x ? -1 : 1) * 6 * dt; }
      const moved = Math.hypot(c.vx, c.vy * 1.6) * dt; c.distance += moved; c.moving = moved > 0.004;
      if (Math.abs(c.vx) > 0.8 && this.time > c.turnLock) { const f = c.vx > 0 ? 1 : -1; if (f !== c.facing) { c.facing = f; c.turnLock = this.time + 0.35; } }
    }
    step(dt) {
      this.time += dt;
      for (const c of this.cats) { c.jump = 0; c.tilt = 0; c.squash = 1; c.top = SPEED.walk; c.leap = false; if (this.time >= c.until) this.choose(c); }
      for (const p of [...this.pairs]) this.pairStep(p);
      for (const c of this.cats) {
        if (this.stepHeld(c, dt)) continue;
        if (c.hop) { const u = clamp((this.time - c.hop.t) / c.hop.dur), s = smooth(u); c.x = c.hop.from.x + (c.hop.to.x - c.hop.from.x) * s; c.y = c.hop.from.y + (c.hop.to.y - c.hop.from.y) * s; c.jump = Math.sin(u * Math.PI) * 6; c.leap = true; if (u >= 1) { const then = c.hop.then; c.hop = null; then && then(); } continue; }
        if (c.pair && c.pair.kind === "brawl" && c.pair.phase === "together") { c.pose = c.leap ? "r-pounce" : "r-stand"; continue; }
        if (c.state === "trot" || c.state === "zoomies") { c.top = SPEED[c.state]; if (!c.target) { c.loopStep++; c.target = c.loop[c.loopStep % 3]; c.route = [c.target]; } }
        this.steer(c, c.top, dt);
        if (c.state === "settling" && !c.target && c.perchGoal) {   // arrived under its resting place: hop up, or lie down
          const g = c.perchGoal; c.perchGoal = null;
          const land = () => { c.perch = g; c.x = g.x; c.y = g.y; this.set(c, this.random() < 0.6 ? "sleep" : "watch", 8 + this.random() * 7); };
          if (g.high) c.hop = { t: this.time, from: { x: c.x, y: c.y }, to: { x: g.x, y: g.y }, dur: 0.65, then: land }; else land();
        }
        const solo = this.time - (c.soloStart || this.time);
        c.pose = c.moving ? ["r-walk1", "r-stand", "r-walk2", "r-stand"][Math.floor(c.distance / 1.5) % 4] : c.state === "sleep" ? "r-sleep" : c.state === "groom" ? "r-groom" : c.state === "watch" || c.state === "greet" ? (c.state === "greet" ? "f-glad" : "f-idle") : "r-stand";
        if (c.state === "groom" && c.pair && c.pair.phase === "together") c.pose = (Math.floor((this.time - c.pair.t) / 1.5) % 2 === (c === c.pair.a ? 0 : 1)) ? "r-groom" : "r-stand";
        if (c.pair && c.pair.phase === "together" && c.leap) c.pose = "r-pounce";
        if (c.state === "jump") { c.jump = Math.max(0, Math.sin(solo / 1.3 * Math.PI * 2)) * 6; c.pose = c.jump > 1 ? "r-pounce" : "r-stand"; }
        if (c.state === "spin") { c.facing = Math.floor(solo / 0.6) % 2 ? 1 : -1; c.pose = solo % 0.6 < 0.25 ? "r-walk1" : "r-stand"; c.jump = Math.max(0, Math.sin(solo / 0.6 * Math.PI * 2)) * 1.6; }
        if (c.state === "roll") { c.pose = "r-sleep"; c.tilt = Math.sin(solo * 4.2) * 18; }
        if (c.state === "stretch") c.squash = 1 - 0.1 * Math.sin(clamp((c.until - this.time) / 1.7) * Math.PI);
        if (c.state === "groom" && !c.moving) c.tilt = Math.max(0, Math.sin(this.time * 4.5)) * 2.5;
        c.bob = c.moving ? Math.sin(c.distance / 2 * Math.PI) * 0.35 : Math.sin(this.time * 1.8 + c.index) * 0.14;
        if (c.state === "sleep" && this.time > c.emoteUntil) this.say(c, "z", 1.4);
      }
    }

    // ---- touch: a tap greets, a held finger picks the cat up ----
    bind(c) {
      const el = c.el; let press = null;
      const pt = e => { const r = this.scene.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * 100, y: (e.clientY - r.top) / r.height * 100 }; };
      el.addEventListener("pointerdown", e => { press = { x: e.clientX, y: e.clientY, at: performance.now(), id: e.pointerId }; clearTimeout(c.holdT); c.holdT = setTimeout(() => { if (press && !reduce) { this.lift(c, pt(e)); try { el.setPointerCapture(press.id); } catch (err) { /* gone */ } } }, 220); });
      el.addEventListener("pointermove", e => { if (!press) return; if (c.held) { const q = pt(e); c.held.aim = { x: clamp(q.x, 4, 96), y: clamp(q.y, 30, FLOOR.bottom - 4) }; } else if (Math.hypot(e.clientX - press.x, e.clientY - press.y) > 10) { clearTimeout(c.holdT); press = null; } });
      const up = e => { clearTimeout(c.holdT); if (c.held && c.held.phase === "carry") this.drop(c); else if (press && e.type === "pointerup") this.greet(c); press = null; };
      el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up);
      el.addEventListener("touchmove", e => { if (c.held) e.preventDefault(); }, { passive: false });
      el.addEventListener("click", e => { e.preventDefault(); });
    }
    greet(c) {
      this.say(c, "♡", 2); window.Sound && (Sound.cat(c.id), Sound.cue("heart"));
      this.name.hidden = false; this.name.dataset.cat = c.id; this.name.textContent = tx(CAT[c.id].name) + " ›"; this.named = c; clearTimeout(this.nameT); this.nameT = setTimeout(() => { this.name.hidden = true; this.named = null; }, 2800);
      if (c.pair || c.held || c.hop || c.state === "sleep") return;
      c.target = null; c.route = null; this.set(c, "greet", 2.2);
    }
    lift(c, point) {
      if (c.pair) this.endPair(c.pair);
      if (c.perch) { c.perch.user = null; c.perch = null; } if (c.perchGoal) { c.perchGoal.user = null; c.perchGoal = null; }
      c.hop = null; c.target = null; c.route = null; c.vx = c.vy = 0; c.state = "held"; c.until = Infinity; c.held = { phase: "carry", aim: point, swing: 0, px: c.x }; this.say(c, "!", 0.7); window.Sound && Sound.cat(c.id, "squeak");
    }
    drop(c) {
      let x = clamp(c.x, FLOOR.left, FLOOR.right), y = clamp(c.held.aim.y + 4, FLOOR.top, FLOOR.bottom); if (inTable(x, y, 4)) y = TABLE.y + TABLE.ry + 6;
      c.held = { phase: "fall", t: this.time, from: { x: c.x, y: c.y, lift: c.heldLift || 0 }, to: { x, y }, dur: clamp(Math.sqrt(Math.abs(y - c.y + (c.heldLift || 0)) / 60), 0.12, 0.5) };
    }
    stepHeld(c, dt) {
      const hd = c.held; if (!hd) return false;
      if (hd.phase === "carry") { const k = ease(24, dt), nx = c.x + (hd.aim.x - c.x) * k; hd.swing += (clamp((nx - c.x) / Math.max(dt, 0.001) * -0.5, -24, 24) - hd.swing) * ease(9, dt); c.x = nx; c.y += (hd.aim.y + 9 - c.y) * k; c.heldLift = 5; c.jump = 5; c.tilt = hd.swing; c.pose = "f-worried"; c.squash = 1; return true; }
      if (hd.phase === "fall") { const u = clamp((this.time - hd.t) / hd.dur); c.x = hd.from.x + (hd.to.x - hd.from.x) * u; c.y = hd.from.y + (hd.to.y - hd.from.y) * u * u; c.jump = 5 * (1 - u * u); c.pose = "f-worried"; if (u >= 1) { c.held = { phase: "land", t: this.time }; c.heldLift = 0; window.Sound && Sound.cue("land"); } return true; }
      const u = clamp((this.time - hd.t) / 0.26); c.squash = 1 - Math.sin(u * Math.PI) * 0.16; c.pose = u < 0.5 ? "r-pounce" : "r-stand"; if (u >= 1) { c.held = null; this.set(c, "watch", 1.2 + this.random() * 1.6); } return true;
    }

    // ---- writing to the page, only what changed ----
    draw() {
      for (const c of this.cats) {
        const depth = clamp((c.y - 34) / (FLOOR.bottom - 34)), k = 0.86 + depth * 0.2, front = c.pose[0] === "f";
        const s = { left: c.x.toFixed(2) + "%", top: c.y.toFixed(2) + "%", width: (c.w * k).toFixed(2) + "%", zIndex: String(Math.round(c.y * 10) + (c.held ? 2000 : 0)), opacity: c.veiled ? "0" : "1" };
        for (const key in s) if (c.shown[key] !== s[key]) { c.shown[key] = s[key]; c.el.style[key] = s[key]; }
        const t = `translateY(${(-(c.jump || 0) * 4 + (c.bob || 0) * 4).toFixed(1)}%) rotate(${(c.tilt || 0).toFixed(1)}deg) scale(${((front ? 1 : c.facing * LOOKS[c.id][c.pose === "r-pounce" ? 1 : 0]) * (2 - (c.squash || 1))).toFixed(3)}, ${(c.squash || 1).toFixed(3)})`;
        if (c.shown.t !== t) { c.shown.t = t; c.body.style.transform = t; }
        if (c.shown.pose !== c.pose) { if (c.imgs[c.shown.pose]) c.imgs[c.shown.pose].hidden = true; c.imgs[c.pose].hidden = false; c.shown.pose = c.pose; }
        const em = this.time < c.emoteUntil ? c.emoteText : ""; if (c.shown.em !== em) { c.shown.em = em; c.emote.hidden = !em; c.emote.textContent = em; c.emote.dataset.kind = em; }
      }
      if (this.named) { const c = this.named; this.name.style.left = clamp(c.x, 14, 86) + "%"; this.name.style.top = (c.y - c.w * 0.74) + "%"; this.name.style.zIndex = 4000; }
    }
  }
  window.Room = Room;
})();
