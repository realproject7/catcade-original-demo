// Cat Clubhouse, design round 1: the frame every match shares.
// The cat sits across the table. Its pose tells the truth, it has one prank you can stop with a boop on the nose,
// and one weak spot you can trigger. Each game plugs into this frame (see g-*.js).
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const h = (tag, cls, html) => { const el = document.createElement(tag); if (cls) el.className = cls; if (html != null) el.innerHTML = html; return el; };
  const POSES = ["idle", "glad", "worried", "think", "win", "lose", "windup", "prank", "slip", "booped", "miffed", "smug"];
  const rand = (a, b) => a + Math.random() * (b - a);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const times = n => (LANG === "ko" ? `${n}번` : n === 1 ? "once" : n === 2 ? "twice" : `${n} times`);
  window.GAME_IMPL = window.GAME_IMPL || {};
  let M = null;

  function start({ game, cat }) {
    stop();
    const root = $('[data-screen="match"]'), c = CAT[cat], g = GAME[game];
    const el = {
      root, title: $("[data-m-title]", root), face: $("[data-m-face]", root), say: $("[data-m-say]", root), boop: $("[data-m-boop]", root),
      paws: $("[data-m-paws]", root), cs: $("[data-m-cs]", root), ys: $("[data-m-ys]", root), cname: $("[data-m-cname]", root),
      table: $("[data-m-table]", root), status: $("[data-m-status]", root), controls: $("[data-m-controls]", root), extra: $("[data-m-extra]", root),
      result: $("[data-m-result]", root), band: $("[data-m-band]", root), dark: $("[data-m-dark]", root), lamp: $("[data-m-lamp]", root), ball: $("[data-m-ball]", root),
    };
    M = {
      cat: c, game: g, el, alive: true, paused: false, clock: 0, queue: [],
      pranksLeft: c.pranks, turn: 0, sincePrank: 9, pranked: 0, booped: 0, slips: 0,
      slipOn: false, mood: "idle", moodAt: -9999, holdUntil: 0, statusHold: 0, used: {}, winding: false, lightsOff: false, turnAt: 0,
    };
    el.title.textContent = tx(g.name); el.cname.textContent = tx(c.name);
    el.table.innerHTML = ""; el.controls.innerHTML = ""; el.extra.innerHTML = ""; el.result.hidden = true; el.say.hidden = true; el.boop.hidden = true;
    el.dark.hidden = true; el.lamp.hidden = true; el.ball.hidden = c.id !== "mango"; el.ball.classList.remove("is-rolling"); el.face.classList.remove("is-away");
    el.root.style.setProperty("--cat-tint", c.tint); el.root.style.setProperty("--cat-edge", c.edge);
    el.root.dataset.cat = c.id; el.root.dataset.game = g.id; el.root.classList.remove("is-paused");
    // One image per pose, loaded once and switched with `hidden`, so a pose change never waits on the network.
    el.face.querySelectorAll("img").forEach(i => i.remove());
    M.imgs = {};
    for (const p of POSES) { const i = new Image(); i.src = `img/cat-${c.id}-${p}.webp`; i.alt = ""; i.hidden = p !== "idle"; i.draggable = false; el.face.prepend(i); M.imgs[p] = i; }
    Object.assign(M, api);
    // The match keeps its own clock, so that Pause really holds everything: the cat's thinking, a wind-up, a prank, a turn clock.
    const m = M;
    m.ticker = setInterval(() => {
      if (!m.alive || m.paused) return;
      m.clock += 50;
      const due = m.queue.filter(e => !e.dead && e.at <= m.clock); m.queue = m.queue.filter(e => !e.dead && e.at > m.clock);
      for (const e of due) if (m.alive) e.fn();
    }, 50);
    M.score(0, 0); M.paws(); M.status("");
    M.impl = GAME_IMPL[game](M, el.table, el.controls);
    // Round 4: the prank is announced on the table itself, so it never looks like the game went wrong.
    el.banner = h("div", "m-prank"); el.banner.hidden = true; el.table.appendChild(el.banner);
    el.banner.addEventListener("click", () => { if (M && M.el.banner.classList.contains("is-small")) M.bannerOpen(2600); });
    M.say("hi", 2200); el.band.classList.remove("is-in"); void el.band.offsetWidth; el.band.classList.add("is-in"); setTimeout(() => window.Sound && Sound.cat(c.id), 350);
    M.after(reduce ? 200 : 1500, () => { bindSlips(); M.impl.begin(); });
    window.M = M;
    return M;
  }
  function stop() {
    if (!M) return;
    M.alive = false; clearInterval(M.ticker); M.queue = [];
    try { M.impl && M.impl.destroy && M.impl.destroy(); } catch (e) { /* the game was half built */ }
    for (const off of M.offs || []) off();
    M = null;
  }
  function pause(on) { if (!M) return; M.paused = on; M.el.root.classList.toggle("is-paused", on); }

  const api = {
    now() { return this.clock; },
    after(ms, fn) { const e = { at: this.clock + ms, fn, dead: false }; this.queue.push(e); return e; },
    cancel(e) { if (e) e.dead = true; },
    // A line under the table. A prank or a weak moment holds its line for a while so that a game event does not wipe it.
    status(text, hold = 0) { if (!hold && this.clock < this.statusHold) return; this.statusHold = hold ? this.clock + hold : 0; this.el.status.textContent = text; this.statusText = text; },
    score(you, cat) { this.you = you; this.them = cat; this.el.ys.textContent = you; this.el.cs.textContent = cat; },
    paws() { this.el.paws.innerHTML = ""; for (let i = 0; i < this.cat.pranks; i++) this.el.paws.appendChild(h("i", i < this.pranksLeft ? "" : "is-used")); this.el.paws.setAttribute("aria-label", T(`${this.pranksLeft} pranks left`, `남은 장난 ${this.pranksLeft}번`)); },
    show(name) { for (const p in this.imgs) this.imgs[p].hidden = p !== name; this.el.face.dataset.pose = name; },
    // A pose held for a while; the mood pose (ears) comes back after it.
    pose(name, ms = 1400) { this.holdUntil = this.clock + ms; this.show(name); this.after(ms + 50, () => { if (this.clock >= this.holdUntil && !this.over) this.show(this.restPose()); }); },
    restPose() { return this.slipOn ? "slip" : this.mood; },
    // How the cat feels about its position, from -1 to 1. Ears forward when it likes it, flat when it does not. It never lies.
    // In a game played at the same time the mood holds for a few seconds, so the ears do not flicker.
    feel(v) {
      const mood = v > 0.3 ? "glad" : v < -0.3 ? "worried" : "idle";
      if (mood === this.mood) return;
      if (this.rt && this.clock - this.moodAt < 3000) return;
      this.mood = mood; this.moodAt = this.clock;
      if (this.clock >= this.holdUntil) this.show(this.restPose());
    },
    say(key, ms = 1800) {
      const text = this.cat.says[key] ? tx(this.cat.says[key]) : key;
      this.el.say.textContent = text; this.el.say.hidden = false; this.cancel(this.sayT);
      this.sayT = this.after(ms, () => { this.el.say.hidden = true; });
    },
    name() { return tx(this.cat.name); },
    // The cat thinks, then moves. Daring cats move at once, careful ones take their time.
    catThink(fn) {
      const n = this.cat.traits[0], wait = reduce ? 250 : 500 + (5 - n) * 330 + rand(0, 300);
      if (!this.slipOn) this.pose("think", wait);
      this.status(T(`${this.name()} is thinking.`, `${this.name()} 생각 중.`));
      this.after(wait, () => fn(this.quality()));
    },
    // How the cat plays its next move: careless while its weak moment lasts, as usual otherwise.
    // In a turn game the weak moment is used up by one move. In a game played at the same time it lasts a few seconds.
    quality() {
      if (!this.slipOn) return "normal";
      if (!this.rt) { this.slips++; this.endSlip(); this.say("slip", 1500); }
      return "careless";
    },
    endSlip() { if (!this.slipOn) return; this.slipOn = false; this.el.extra.innerHTML = ""; if (this.statusText === this.slipLine) { this.statusHold = 0; this.status(""); } if (!this.over && this.clock >= this.holdUntil) this.show(this.restPose()); },
    learn(what) { window.APP && APP.learn(this.cat.id, what); },
    // Called by a turn game when the player's turn starts. cb(prankId or null) runs once the cat has made up its mind.
    playerTurn(cb, { canPrank = true, lead = 0 } = {}) {
      this.turn++; this.sincePrank++; this.turnAt = this.clock;
      const due = this.pranksLeft > 0 && canPrank && this.turn >= 2 && this.sincePrank >= 3 && lead < 0.5;
      const want = due && (Math.random() < 0.45 || (this.pranked + this.booped === 0 && this.turn >= 3));
      if (!want) { this.status(T("Your turn.", "내 차례.")); cb(null); return; }
      this.windup(cb);
    },
    // The wind-up: the cat shows what is coming. Boop its nose and the prank is off.
    windup(cb) {
      const m = this, c = m.cat; m.winding = true; m.sincePrank = 0; m.pranksLeft--; m.paws();
      m.pose("windup", 2600); m.learn("tell");
      m.banner("coming", reduce ? 1600 : 2400);
      m.status(tx(c.prank.tell) + " " + T("Boop the nose to stop it.", "코를 톡 치면 멈춰요."), 2400);
      m.el.boop.hidden = false; window.Sound && Sound.cue("windup"); window.Sound && Sound.cat(c.id);
      const done = booped => {
        if (!m.winding) return; m.winding = false; m.el.boop.hidden = true; m.cancel(t);
        if (booped) { m.booped++; window.Sound && Sound.cue("boop"); window.Sound && Sound.cat(c.id, "squeak"); m.pose("booped", 1000); m.say("booped", 1300); m.banner("booped"); m.status(T("Booped. The prank is off.", "톡! 장난을 막았어요."), 1600); m.after(900, () => { m.pose("miffed", 1200); cb(null); }); }
        else { m.pranked++; window.Sound && Sound.cue("prank"); m.pose("prank", 1500); m.say("prank", 1500); m.learn("prank"); m.banner("landed"); m.statusHold = 0; m.status(""); /* the banner on the table says what it does */ m.after(700, () => { cb(c.prank.id); m.after(900, () => m.pose("smug", 1400)); }); }
      };
      m.boopNow = () => done(true);
      const t = m.after(reduce ? 1600 : 2400, () => done(false));
    },
    // The prank banner: "coming" during the wind-up (with the time left to boop), "booped", then "landed" with what it does
    // in this game. After a moment it folds into a small tag on the table until the prank ends (prankDone). Tap the tag to read it again.
    banner(kind, ms = 0) {
      const m = this, c = m.cat, b = m.el.banner, name = m.name(), pn = tx(c.prank.name);
      m.cancel(m.bannerT); b.hidden = false; b.className = `m-prank is-${kind}`; b.style.setProperty("--ms", ms + "ms");
      const what = window.APP ? APP.prankIn(m.game, c) : tx(c.prank.what), span = m.rt ? T("For a few seconds", "몇 초 동안") : T("This turn only", "이번 차례만");
      if (kind === "coming") b.innerHTML = `<img src="img/cat-${c.id}-windup.webp" alt=""><span class="grow"><b class="t-headline">${T(`${name} is up to something!`, `${name}가 장난을 치려고 해요!`)}</b><span class="t-subhead">${T("Boop the nose to stop it.", "코를 톡 치면 막을 수 있어요.")}</span></span><i class="m-prank-bar"></i>`;
      if (kind === "booped") { b.innerHTML = `<img src="img/cat-${c.id}-booped.webp" alt=""><span class="grow"><b class="t-headline">${T("Booped!", "톡!")}</b><span class="t-subhead">${T(`No ${pn} this time.`, `${pn} 장난을 막았어요.`)}</span></span>`; m.bannerT = m.after(1500, () => { b.hidden = true; }); }
      if (kind === "landed") { b.innerHTML = `<img src="img/cat-${c.id}-prank.webp" alt=""><span class="grow"><b class="t-headline">${T(`${name}'s prank: ${pn}`, `${name}의 장난: ${pn}`)}</b><span class="t-subhead">${what}</span><span class="t-footnote t-strong m-prank-span">${span}</span></span>`; m.bannerT = m.after(3000, () => m.bannerSmall()); if (m.rt) m.after(6500, () => m.prankDone()); }
    },
    bannerSmall() { const b = this.el.banner; if (b.hidden || !b.classList.contains("is-landed")) return; b.classList.add("is-small"); b.setAttribute("aria-label", tx(this.cat.prank.name)); },
    bannerOpen(ms) { const b = this.el.banner; b.classList.remove("is-small"); this.cancel(this.bannerT); this.bannerT = this.after(ms, () => this.bannerSmall()); },
    prankDone() { const b = this.el.banner; if (b && b.classList.contains("is-landed")) { this.cancel(this.bannerT); b.hidden = true; } },
    // A game played at the same time asks now and then. The frame keeps the count and the spacing.
    rtPrank(elapsed, cb, { lead = 0 } = {}) {
      if (this.winding || this.pranksLeft <= 0 || lead > 0.5) return;
      if (elapsed - (this.lastPrankAt ?? -6) < 20 || elapsed < 8) return;
      if (Math.random() < 0.3 || (this.pranked + this.booped === 0 && elapsed > 12)) { this.lastPrankAt = elapsed; this.windup(cb); }
    },
    // Sumi's prank: dark, except a circle of light round the finger. Tapping the lamp switches it back on, and the moth comes.
    lights(on, moth = true) {
      const was = this.lightsOff; if (was !== !on) window.Sound && Sound.cue(on ? "lamp" : "lights"); this.lightsOff = !on; this.el.dark.hidden = on; this.el.lamp.hidden = on;
      if (on && was && moth && !this.over) this.slipCue("moth", 6000);
    },
    // A weak moment the player can see: the bird at the window, the sunbeam, the moth, a doze. The cat plays carelessly while it lasts.
    slipCue(kind, ms) {
      const m = this; if (m.slipOn || m.over) return;
      if (m.rt) { ms = 3600; m.slips++; m.say("slip", 1500); }
      m.slipOn = true; window.Sound && Sound.cue("slip"); if (kind === "pet") window.Sound && Sound.cat(m.cat.id, "purr"); m.el.extra.innerHTML = `<i class="cue is-${kind}"></i>`; m.show("slip");
      m.slipLine = tx(m.cat.slip.tell) + " " + T(`${m.name()} is not paying attention.`, `${m.name()}가 딴 데 정신이 팔렸어요.`);
      m.status(m.slipLine, 2600); m.learn("slip");
      m.cancel(m.slipT); m.slipT = m.after(ms, () => m.endSlip());
    },
    goodMove() { if (this.cat.id === "plum" && Math.random() < 0.5) this.slipCue("groom", 9000); },
    // The cat's own paw reaches onto the table to make its move: from the top edge to the thing it touches, and back.
    reach(target, ms = 520) {
      if (reduce || !target) return;
      const t = this.el.table.getBoundingClientRect(), r = target.getBoundingClientRect ? target.getBoundingClientRect() : target;
      const x = r.left + r.width / 2 - t.left, y = r.top + r.height / 2 - t.top, cap = Math.max(150, t.height * 0.36);
      // the arm starts above the table's edge, a little toward the cat, and leans to the thing it touches
      const x0 = x + (t.width / 2 - x) * 0.35, dist = Math.hypot(x - x0, y), len = Math.min(dist + 18, cap), turn = -Math.atan2(x - x0, y) * 180 / Math.PI, far = dist + 18 > cap;
      const paw = h("i", "m-reach"); paw.style.borderImageSource = `url(img/paw-${this.cat.id}.webp)`; paw.style.left = x0 + "px"; paw.style.height = len + "px"; this.el.table.appendChild(paw);
      const at = s => `translateX(-50%) rotate(${turn}deg) translateY(${s})`;
      paw.animate([{ transform: at("-100%") }, { transform: at("0%"), offset: 0.38 }, { transform: at("-6px"), offset: 0.5 }, { transform: at("0%"), offset: 0.62 }, { transform: at("-100%") }], { duration: ms, easing: "ease-in-out" }).onfinish = () => paw.remove();
      // a far thing is touched by a flick: a small ring where it lands
      if (far) { const ring = h("i", "m-flick"); ring.style.left = x + "px"; ring.style.top = y + "px"; this.el.table.appendChild(ring); setTimeout(() => ring.remove(), ms + 200); ring.style.animationDelay = ms * 0.38 + "ms"; }
    },
    // A turn clock for Button's prank. It hurries you and never plays for you: when it runs out she only drums louder.
    turnClock(sec) {
      const m = this, el = h("div", "m-clock", `<i></i><b>${sec}</b>`); el.style.setProperty("--sec", sec + "s"); m.el.controls.appendChild(el);
      let left = sec, t = null, dead = false;
      const tick = () => { if (dead) return; left--; window.Sound && Sound.cue(left <= 0 ? "drum" : "tick"); el.querySelector("b").textContent = Math.max(0, left); if (left <= 0) { m.el.table.classList.add("is-drummed"); m.say(T("Too slow!", "너무 느려!"), 1500); m.status(T("Time is up. Nothing is lost, but she drums until you play.", "시간 끝. 잃는 건 없지만, 둘 때까지 계속 두드려요."), 2600); } else t = m.after(1000, tick); };
      t = m.after(1000, tick);
      return () => { dead = true; m.cancel(t); el.remove(); m.el.table.classList.remove("is-drummed"); };
    },
    end(winner, lines = [], opts = {}) {
      const m = this, c = m.cat, r = m.el.result; if (m.over) return; m.over = true;
      window.Sound && Sound.cue(winner === "you" ? "win" : winner === "cat" ? "lose" : "pair"); setTimeout(() => window.Sound && Sound.cat(c.id, winner === "you" ? "low" : "meow"), 500); m.show(winner === "cat" ? "win" : winner === "you" ? "lose" : "idle"); m.el.boop.hidden = true; m.winding = false; m.lights(true, false); m.slipOn = false; m.el.extra.innerHTML = ""; m.el.table.classList.remove("is-drummed");
      const title = winner === "you" ? T("You win!", "이겼어요!") : winner === "cat" ? T(`${m.name()} wins`, `${m.name()} 승리`) : T("A tie", "무승부");
      const pn = tx(c.prank.name);
      const stat = m.pranked + m.booped === 0 ? T(`No ${pn} this time.`, `이번엔 ${pn}${(pn.charCodeAt(pn.length - 1) - 0xAC00) % 28 ? "이" : "가"} 없었어요.`)
        : (m.pranked ? T(`${pn} landed ${times(m.pranked)}.`, `${pn}에 ${times(m.pranked)} 당했어요.`) : "") + (m.pranked && m.booped ? " " : "") + (m.booped ? T(`You stopped it ${times(m.booped)}.`, `${times(m.booped)} 코를 쳐서 막았어요.`) : "");
      const weak = m.slips ? T(`You caught ${m.name()} off guard ${times(m.slips)}.`, `${m.name()}의 빈틈을 ${times(m.slips)} 잡았어요.`) : (window.S && S.learned[c.id] && S.learned[c.id].slip ? T(`Weak spot: ${tx(c.slip.name)}. Not used this time.`, `약점: ${tx(c.slip.name)}. 이번엔 못 썼어요.`) : T(`${m.name()}'s weak spot is still a secret.`, `${m.name()}의 약점은 아직 몰라요.`));
      $("[data-r-img]", r).src = `img/cat-${c.id}-${winner === "cat" ? "win" : winner === "you" ? "lose" : "idle"}.webp`;
      $("[data-r-title]", r).textContent = title; r.dataset.mood = winner;
      $("[data-r-say]", r).textContent = "“" + tx(c.says[winner === "cat" ? "win" : "lose"]) + "”";
      $("[data-r-score]", r).textContent = opts.score || T(`You ${m.you} · ${m.name()} ${m.them}`, `나 ${m.you} · ${m.name()} ${m.them}`);
      m.prankDone();
      $("[data-r-lines]", r).innerHTML = [...lines, stat, weak].map(l => `<li class="t-subhead prose">${l}</li>`).join("");
      const stamp = $("[data-r-stamp]", r); stamp.hidden = winner !== "you";
      if (winner === "you") { const first = window.APP && APP.win(c.id, m.game.id); $("[data-r-stamp-text]", r).textContent = first ? T(`New stamp: ${m.name()} at ${tx(m.game.name)}.`, `새 도장: ${tx(m.game.name)}에서 ${m.name()}를 이겼어요.`) : T(`You already hold this stamp.`, `이미 받은 도장이에요.`); }
      else window.APP && APP.played(c.id, m.game.id);
      setTimeout(() => { if (m.alive) { r.hidden = false; if (winner === "you") setTimeout(() => window.Sound && Sound.cue("stamp"), 350); } }, reduce ? 100 : 900);
    },
  };

  // Each cat's weak spot has its own trigger. Some come by themselves, some the player causes.
  function bindSlips() {
    const m = M, id = m.cat.id, el = m.el; m.offs = [];
    const on = (node, type, fn, opt) => { node.addEventListener(type, fn, opt); m.offs.push(() => node.removeEventListener(type, fn, opt)); };
    const free = () => !m.winding && !m.slipOn && !m.over && !m.paused;
    on(el.face, "click", () => { if (m.winding && m.boopNow) m.boopNow(); });
    on(el.lamp, "click", () => { m.lights(true); });
    const follow = e => { if (m.rt && m.game.id === "climb") return; el.dark.style.setProperty("--lx", e.clientX + "px"); el.dark.style.setProperty("--ly", e.clientY - el.root.getBoundingClientRect().top + "px"); };
    on(el.root, "pointermove", follow); on(el.root, "pointerdown", follow);
    const loop = (ms, fn) => { const tick = () => m.after(ms(), () => { if (!m.over) { fn(); tick(); } }); tick(); };
    if (id === "mint") loop(() => rand(11000, 19000), () => { if (free()) m.slipCue("bird", 6500); });
    if (id === "button") loop(() => rand(12000, 20000), () => { if (free()) m.slipCue("sun", 6500); });
    // Tofu: in a turn game he dozes when you take your time. In a game played at the same time he nods off by himself now and then.
    if (id === "tofu" && m.rt) loop(() => rand(13000, 19000), () => { if (free()) m.slipCue("doze", 3600); });
    if (id === "tofu" && !m.rt) loop(() => 1000, () => { if (m.myTurn && free() && m.clock - m.turnAt > 8000) m.slipCue("doze", 60000); });
    if (id === "mango") on(el.ball, "click", () => { if (m.used.ball || !free()) return; m.used.ball = true; el.ball.classList.add("is-rolling"); m.slipCue("ball", 9000); });
    if (id === "jelly") {   // one stroke across her, once a match
      let sx = null;
      on(el.face, "pointerdown", e => { sx = e.clientX; });
      on(el.face, "pointermove", e => { if (sx != null && Math.abs(e.clientX - sx) > 28 && !m.used.pet && free()) { m.used.pet = true; m.slipCue("pet", 9000); } });
      for (const type of ["pointerup", "pointercancel"]) on(window, type, () => { sx = null; });
    }
    if (id === "ollie") {   // hold a finger in front of his face for a moment: his eyes follow it. Twice a match.
      let t = 0;
      const clear = () => { clearTimeout(t); t = 0; };
      on(el.face, "pointerdown", () => { clear(); if ((m.used.finger || 0) >= 2 || !free()) return; t = setTimeout(() => { if (free()) { m.used.finger = (m.used.finger || 0) + 1; m.slipCue("finger", 9000); } }, 650); });
      for (const type of ["pointerup", "pointercancel", "pointerleave"]) on(el.face, type, clear);
    }
  }

  window.Match = { start, stop, pause, get current() { return M; } };
})();
