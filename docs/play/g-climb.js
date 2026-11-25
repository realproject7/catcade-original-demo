// Cushion Climb: you and the cat climb the same cat tower at the same time. First to the roof wins.
// Both bounce on their own. You steer your ball with a drag; the cat steers itself.
// Landing on the other one's head gives you a spring and knocks them down a little. It works both ways.
// The cushion pictures are the operator's own, from his Cat Tower prototype (lpingcat playtime-cat-tower).
// Tell: ears forward when the cat is ahead, flat when it is behind.
(() => {
  const h = (tag, cls, html) => { const el = document.createElement(tag); if (cls) el.className = cls; if (html != null) el.innerHTML = html; return el; };
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x)), rand = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.floor(Math.random() * a.length)];
  const W = 300, ROOF = 8000, G = 1500, JUMP = 640, PW = 70, SECONDS = 150, X0 = 46, X1 = 254;
  const BEDS = [["cafe", 221], ["cloud", 282], ["moon", 252], ["sakura", 161], ["sunroom", 252]];

  GAME_IMPL.climb = (M, table, controls) => {
    const [nerve, smarts, focus] = M.cat.traits;
    M.rt = true;
    const cv = h("canvas", "cl-canvas"); table.appendChild(cv);
    const bar = h("div", "cl-bar", `<i class="is-cat"></i><i class="is-you"></i>`); table.appendChild(bar);
    const pin = h("div", "cl-pin", `<img src="img/cat-${M.cat.id}-small.webp" alt=""><b class="t-footnote t-num"></b>`); pin.hidden = true; table.appendChild(pin);
    const clockEl = h("div", "m-time t-num"); controls.appendChild(clockEl);
    const img = src => { const i = new Image(); i.src = src; return i; };
    const beds = BEDS.map(([n, top]) => ({ im: img(`img/tower-${n}-bed.webp`), top })), ball = img("img/prop-ball.webp"), catIm = img(`img/cat-${M.cat.id}-small.webp`), loafIm = img("img/cat-tofu-prank-cut.webp"), pawIm = img(`img/paw-${M.cat.id}.webp`), sockIm = img("img/prop-sock.webp");
    // The tower: one cushion every 80 to 108 units, each within reach of the one below, none cut off by the side of the screen.
    const cushions = []; let x = 150;
    for (let y = 0; y < ROOF; y += rand(80, 108)) { cushions.push({ x, y, bed: cushions.length % beds.length, held: 0, soft: false, phase: rand(0, 6) }); let nx = x + pick([-1, 1]) * rand(40, 118); if (nx < X0 || nx > X1) nx = x + (x - nx); x = clamp(nx, X0, X1); }
    const mk = x0 => ({ x: x0, y: 0, vy: JUMP, last: cushions[0], freeze: 0, tx: x0, wait: 0, bop: 0, squash: 0 });
    const you = mk(130), cat = mk(170);
    let raf = 0, lastT = 0, elapsed = 0, done = false, lastSec = -1, k = 1, vw = 300, vh = 500, cam = 0, target = 130, steering = false;
    let fx = { loaf: 0, fog: 0, sway: 0, fast: 0, dark: 0 };

    function size() { const r = table.getBoundingClientRect(); if (!r.width) return; const d = Math.min(3, devicePixelRatio || 1); vw = r.width; vh = r.height; cv.width = Math.round(vw * d); cv.height = Math.round(vh * d); k = vw / W; }
    const cx = c => clamp(c.x + (fx.sway > 0 ? Math.sin(elapsed * 3 + c.phase) * 20 : 0), X0 - 8, X1 + 8);
    function physics(p, dt, mine) {
      if (p.freeze > 0) { p.freeze -= dt; return; }
      const py = p.y; p.vy -= G * dt; p.y += p.vy * dt; p.bop -= dt; p.squash = Math.max(0, p.squash - dt * 4);
      if (p.vy < 0) for (const c of cushions) {
        if (c.held > 0 && mine) continue;
        if (py >= c.y && p.y <= c.y && Math.abs(p.x - cx(c)) < PW / 2 + 6) {
          p.y = c.y; p.vy = JUMP * (c.soft && mine ? 0.72 : 1); if (c.soft && mine) c.soft = false; p.last = c; p.squash = 1; if (mine) window.Sound && Sound.cue("land");
          if (!mine) landCat(c);
          break;
        }
      }
      if (p.y < p.last.y - 250) { p.x = p.last.x; p.y = p.last.y; p.vy = JUMP; p.freeze = 0.7; if (mine) window.Sound && Sound.cue("fall"); if (!mine) landCat(p.last); else M.status(T("A fall. Back to your last cushion.", "떨어졌어요. 마지막 방석으로 돌아가요.")); }
    }
    // The cat picks its next cushion when it lands. A daring cat takes the highest one in reach. A clever one does too, when it is close by.
    // A careful one takes the nearest, and a dreamy one sometimes bounces where it is to line up. After a miss it plays safe.
    function landCat(c) {
      const q = M.quality();
      cat.fails = c === cat.prev ? (cat.fails || 0) + 1 : 0; cat.prev = c;
      const reach = cushions.filter(o => o.y > c.y + 20 && o.y <= c.y + 128 && Math.abs(cx(o) - cx(c)) <= 150).sort((a, b) => a.y - b.y);
      const near = reach.filter(o => Math.abs(cx(o) - cx(c)) <= 80);
      let t = !reach.length ? cushions.find(o => o.y > c.y) || c : nerve >= 4 ? reach[reach.length - 1] : smarts >= 4 && near.length ? near[near.length - 1] : nerve <= 2 ? reach[0] : pick(reach);
      if (q === "normal" && !cat.fails && Math.random() < Math.max(0, (4 - nerve) * 0.1 - (focus - 3) * 0.06)) t = c;
      if (cat.fails && reach.length) t = reach[0];
      if (q === "careless") t = c;   // its weak moment: it bounces where it is and looks the other way
      const err = cat.fails ? 6 : (6 - focus) * 9 + (nerve >= 4 ? 8 : 0);
      cat.tx = clamp(cx(t) + rand(-err, err), 12, W - 12); cat.wait = 0.03 + (5 - focus) * 0.045;
      // A daring cat near you goes for your head instead.
      if (nerve >= 4 && q !== "careless" && you.y > cat.y - 40 && you.y < cat.y + 110 && Math.random() < 0.3) cat.tx = you.x;
    }
    function steer(p, to, speed, dt) { p.x = clamp(p.x + clamp(to - p.x, -speed * dt, speed * dt), 12, W - 12); }
    function heads(a, b, aMine) {   // a lands on b's head
      if (a.bop > 0 || a.vy >= 0 || a.freeze > 0 || b.freeze > 0) return;
      const dy = a.y - (b.y + 34);
      if (dy > -4 && dy < 14 && Math.abs(a.x - b.x) < 26) { a.vy = JUMP * 1.22; window.Sound && Sound.cue(aMine ? "spring" : "bop"); b.vy = Math.min(b.vy, -300); a.bop = b.bop = 1; a.squash = 1; M.status(aMine ? T(`Boing! You bounced off ${M.name()}'s head.`, `뿅! ${M.name()}의 머리를 밟고 뛰었어요.`) : T(`${M.name()} bounced off your head.`, `${M.name()}가 내 머리를 밟고 뛰었어요.`)); if (!aMine) M.goodMove(); }
    }
    function finish(winner, line) { if (done) return; done = true; cancelAnimationFrame(raf); M.myTurn = false; const pct = p => Math.round(clamp(p.last.y / ROOF, 0, 1) * 100) + "%"; M.score(winner === "you" && you.y >= ROOF - 4 ? "100%" : pct(you), winner === "cat" && cat.y >= ROOF - 4 ? "100%" : pct(cat)); M.end(winner, [line]); }

    function frame(now) {
      if (done || !M.alive) return;
      raf = requestAnimationFrame(frame);
      if (M.paused) { lastT = now; return; }
      let dt = Math.min(0.033, (now - lastT) / 1000 || 0); lastT = now; elapsed += dt; if (fx.fast > 0) dt *= 1.3;
      for (const key of ["loaf", "fog", "sway", "fast", "dark"]) if (fx[key] > 0) { fx[key] -= dt; if (fx[key] <= 0) { if (key === "dark") M.lights(true); if (key === "loaf") M.el.face.classList.remove("is-away"); } }
      for (const c of cushions) if (c.held > 0) c.held -= dt;
      steer(you, target, 400, dt); physics(you, dt, true);
      if (cat.wait > 0) cat.wait -= dt; else steer(cat, cat.tx, 250 + smarts * 34, dt);
      physics(cat, dt, false);
      heads(you, cat, true); heads(cat, you, false);
      if (you.y >= ROOF - 4 || cat.y >= ROOF - 4) return finish(you.y >= cat.y ? "you" : "cat", you.y >= cat.y ? T("You reached the roof first.", "내가 먼저 지붕에 올랐어요.") : T(`${M.name()} reached the roof first.`, `${M.name()}가 먼저 지붕에 올랐어요.`));
      if (elapsed >= SECONDS) return finish(you.y > cat.y ? "you" : "cat", T("Time. The higher climber wins.", "시간 끝. 더 높이 오른 쪽이 이겨요."));
      cam += (Math.max(0, you.y - vh / k * 0.42) - cam) * Math.min(1, dt * 6);
      draw();
      const sec = Math.floor(elapsed);
      if (sec !== lastSec) {
        lastSec = sec; const left = Math.max(0, SECONDS - sec); clockEl.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
        M.feel((cat.y - you.y) / 260); M.score(Math.round(you.last.y / ROOF * 100) + "%", Math.round(cat.last.y / ROOF * 100) + "%");
        M.rtPrank(elapsed, id => id && prank(id), { lead: (cat.y - you.y) / 700 });
      }
    }
    function draw() {
      const c = cv.getContext("2d"), d = cv.width / vw; c.setTransform(d, 0, 0, d, 0, 0); c.clearRect(0, 0, vw, vh);
      const sy = y => vh - (y - cam) * k - 46 * k, sx = x => x * k;
      // The tower: a sisal scratching post up the middle, with every cushion on an arm from it.
      const pw = 20 * k, px = vw / 2 - pw / 2;
      c.fillStyle = "#ecd9b6"; c.fillRect(px, 0, pw, vh); c.strokeStyle = "#d6bd90"; c.lineWidth = 1;
      const off = (cam * k) % 9; for (let y = -12 + off; y < vh + 12; y += 9) { c.beginPath(); c.moveTo(px, y); c.lineTo(px + pw, y + 5); c.stroke(); }
      c.strokeStyle = "#cfb58a"; c.beginPath(); c.moveTo(px, 0); c.lineTo(px, vh); c.moveTo(px + pw, 0); c.lineTo(px + pw, vh); c.stroke();
      // the roof
      const ry = sy(ROOF); if (ry > -80) { c.fillStyle = "#fff7ee"; c.fillRect(0, ry + 14 * k, vw, 12 * k); c.fillStyle = "#f4b9cb"; c.beginPath(); c.moveTo(-10, ry + 16 * k); c.lineTo(vw / 2, ry - 44 * k); c.lineTo(vw + 10, ry + 16 * k); c.closePath(); c.fill(); }
      for (const cu of cushions) {
        const y = sy(cu.y); if (y < -80 || y > vh + 80) continue;
        if (fx.fog > 0 && cu.y > you.y + 150) continue;   // Stare: you cannot see far ahead
        const b = beds[cu.bed], w = PW * 1.12 * k, hh = w * (461 - b.top) / 448, X = sx(cx(cu));
        c.strokeStyle = "#d6bd90"; c.lineWidth = 5 * k; c.lineCap = "round"; c.beginPath(); c.moveTo(vw / 2, y + hh * 0.5); c.lineTo(X, y + hh * 0.42); c.stroke();
        c.globalAlpha = cu.held > 0 ? 0.35 : 1; if (b.im.complete && b.im.naturalWidth) c.drawImage(b.im, 32, b.top, 448, 461 - b.top, X - w / 2, y - hh * 0.36, w, hh); c.globalAlpha = 1;
        if (cu.soft && sockIm.complete) c.drawImage(sockIm, X - 12 * k, y - hh * 0.36 - 14 * k, 24 * k, 24 * k);
        if (cu.held > 0 && pawIm.complete) c.drawImage(pawIm, X - 16 * k, y - hh * 0.36 - 44 * k, 32 * k, 52 * k);
      }
      const who = (p, im, w, hgt) => { const sq = 1 - p.squash * 0.16; if (im.complete && im.naturalWidth) c.drawImage(im, sx(p.x) - w * k / 2, sy(p.y) - hgt * k * sq, w * k, hgt * k * sq); };
      who(cat, catIm, 46 * catIm.naturalWidth / Math.max(1, catIm.naturalHeight), 46); who(you, ball, 30, 30);
      if (fx.loaf > 0 && loafIm.complete) { const Y = sy(you.y + 210); c.drawImage(loafIm, vw * 0.06, Y, vw * 0.88, vw * 0.88 * loafIm.naturalHeight / loafIm.naturalWidth); }
      if (fx.dark > 0) { const r = cv.getBoundingClientRect(); M.el.dark.style.setProperty("--lx", r.left + sx(you.x) + "px"); M.el.dark.style.setProperty("--ly", r.top - M.el.root.getBoundingClientRect().top + sy(you.y) - 12 + "px"); }
      // the race bar and the pin that shows where the cat is when it is off screen
      bar.children[0].style.bottom = clamp(cat.y / ROOF, 0, 1) * 100 + "%"; bar.children[1].style.bottom = clamp(you.y / ROOF, 0, 1) * 100 + "%";
      const cyS = sy(cat.y), away = cyS < 0 || cyS > vh; pin.hidden = !away || fx.fog > 0;
      if (away) { pin.classList.toggle("is-below", cyS > vh); pin.style.left = clamp(sx(cat.x), 36, vw - 36) + "px"; const n = Math.round(Math.abs(cat.y - you.y) / 94); pin.lastChild.textContent = (cat.y > you.y ? "+" : "−") + n; }
    }

    // ---- The eight pranks, as they land in this game. Each lasts a few seconds. ----
    function prank(id) {
      const ahead = cushions.filter(c => c.y > you.y + 30 && c.y < you.y + 330);
      if (id === "loaf") { fx.loaf = 5; M.el.face.classList.add("is-away"); }
      if (id === "gift" && ahead.length) pick(ahead).soft = true;
      if (id === "pounce") { const d = you.x > W / 2 ? -1 : 1; target = clamp(you.x + d * 90, 12, W - 12); you.x = clamp(you.x + d * 56, 12, W - 12); }
      if (id === "knead") fx.sway = 6;
      if (id === "stare") fx.fog = 7;
      if (id === "taptap") fx.fast = 5;
      if (id === "lights") { M.lights(false); fx.dark = 5; }
      if (id === "pawdown" && ahead.length) ahead.sort((a, b) => a.y - b.y)[Math.min(1, ahead.length - 1)].held = 5;
    }

    const toX = e => { const r = cv.getBoundingClientRect(); return clamp((e.clientX - r.left) / r.width * W, 12, W - 12); };
    const onDown = e => { steering = true; target = toX(e); }, onMove = e => { if (steering) target = toX(e); }, onUp = () => { steering = false; };
    table.addEventListener("pointerdown", onDown); table.addEventListener("pointermove", onMove); addEventListener("pointerup", onUp); addEventListener("pointercancel", onUp);
    const onResize = () => size(); addEventListener("resize", onResize);
    requestAnimationFrame(() => { size(); draw(); });   // the tower is drawn before the cat has finished saying hello

    return {
      begin() { size(); landCat(cushions[0]); M.myTurn = true; M.turnAt = M.now(); M.status(T("Drag left and right to steer. First to the roof wins.", "좌우로 끌어서 조종하세요. 먼저 지붕에 오르면 이겨요.")); lastT = performance.now(); raf = requestAnimationFrame(frame); },
      destroy() { done = true; cancelAnimationFrame(raf); table.removeEventListener("pointerdown", onDown); table.removeEventListener("pointermove", onMove); removeEventListener("pointerup", onUp); removeEventListener("pointercancel", onUp); removeEventListener("resize", onResize); },
      state() { const above = cushions.filter(c => c.y > you.last.y + 20 && c.y <= you.last.y + 128).sort((a, b) => a.y - b.y)[0]; return { you: Math.round(you.y), cat: Math.round(cat.y), next: above ? cx(above) / W : you.x / W }; },
    };
  };
})();
