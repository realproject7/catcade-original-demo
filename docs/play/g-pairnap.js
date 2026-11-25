// Pair Nap: memory pairs against a cat. Turn game. The photos are the eight club members.
// Tell: the cat's ears go forward when it knows where a pair is, and perk up when you flip a photo whose twin it has seen.
(() => {
  const h = (tag, cls, html) => { const el = document.createElement(tag); if (cls) el.className = cls; if (html != null) el.innerHTML = html; return el; };
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  GAME_IMPL.pairnap = (M, table) => {
    const [nerve, smarts, focus] = M.cat.traits;
    // How many flips back the cat remembers, and how often it uses what it remembers. Even the best cat forgets.
    const span = [0, 5, 5, 8, 11, 15][smarts], use = [0, 0.6, 0.7, 0.8, 0.88, 0.93][focus];
    const board = h("div", "pn"); table.appendChild(board);
    const faces = shuffle(CATS.flatMap(c => [c.id, c.id]));
    const cards = faces.map((face, i) => {
      const el = h("button", "pn-card", `<span class="back"></span><span class="front" style="--tint:${CAT[face].tint}"><img src="img/cat-${face}-small.webp" alt=""></span>`);
      el.setAttribute("aria-label", T("Photo card", "사진 카드")); board.appendChild(el);
      return { face, slot: i, el, up: false, found: false, seen: -99 };
    });
    let you = 0, them = 0, flips = 0, picks = [], busy = true, mine = false, undo = [], held = null, sock = null, stopClock = null, hinted = false, pounce = false, stare = false;
    const place = () => { for (const c of cards) { c.el.style.setProperty("--col", c.slot % 4); c.el.style.setProperty("--row", Math.floor(c.slot / 4)); } };
    place();
    const down = () => cards.filter(c => !c.up && !c.found);
    const knows = c => flips - c.seen <= span;
    const twin = c => cards.find(o => o !== c && o.face === c.face);
    const knownPair = () => { for (const c of down()) { const t = twin(c); if (!t.up && knows(c) && knows(t)) return [c, t]; } return null; };
    const show = (c, up) => { c.up = up; c.el.classList.toggle("is-up", up); c.el.classList.remove("is-peeked"); if (up) c.seen = ++flips; window.Sound && Sound.cue(up ? "flip" : "unflip"); };
    const mood = () => M.feel(knownPair() ? 0.7 : (them - you) / 3);
    const pairsLeft = () => cards.filter(c => !c.found).length / 2;

    function settle(a, b, who, next) {
      if (a.face === b.face) {
        window.Sound && Sound.cue("pair"); for (const c of [a, b]) { c.found = true; c.up = false; c.el.classList.add("is-found", who === "you" ? "is-mine" : "is-theirs"); }
        who === "you" ? you++ : them++; M.score(you, them);
        if (who === "cat") { M.pose("glad", 900); M.goodMove(); } else if (them < you) M.pose("worried", 900);
        if (!pairsLeft()) { finish(); return; }
        M.after(500, () => next(true));
      } else M.after(1000, () => { show(a, false); show(b, false); next(false); });
    }
    function finish() {
      clearPrank(); mine = M.myTurn = false;
      M.end(you > them ? "you" : them > you ? "cat" : "tie", [T(`Pairs: you ${you}, ${M.name()} ${them}.`, `짝: 나 ${you}, ${M.name()} ${them}.`)]);
    }

    // ---- The player's turn ----
    function myTurn() {
      mine = M.myTurn = true; busy = true; picks = []; mood();
      M.playerTurn(id => { busy = false; if (id) prank(id); else if (!M.winding) M.status(T("Your turn. Flip two photos.", "내 차례. 사진 두 장을 뒤집으세요.")); }, { canPrank: pairsLeft() > 2, lead: (them - you) / 8 });
    }
    function tap(c) {
      if (!mine || busy || c.up || c.found || M.over || M.paused) return;
      if (sock && sock.card === c) { flick(); return; }
      if (held === c) { M.status(T(`${M.name()}'s paw is on that one this turn.`, `이번 차례엔 ${M.name()}의 앞발이 올라가 있어요.`)); return; }
      if (pounce) {   // Mango lands on the photo you reach for, and the one next to it flips
        pounce = false; board.classList.remove("is-pounce");
        const near = down().filter(o => o !== c && o !== held && Math.abs(o.slot % 4 - c.slot % 4) + Math.abs(Math.floor(o.slot / 4) - Math.floor(c.slot / 4)) === 1);
        if (near.length) { c = pick(near); M.status(T("Pounce: he landed on yours. The photo next to it flipped.", "덮치기: 내가 고른 사진을 덮쳤어요. 옆 사진이 뒤집혔어요."), 2200); }
      }
      show(c, true); picks.push(c);
      const t = twin(c);
      if (picks.length === 1 && !t.up && !t.found && knows(t) && t.seen > 0) { M.pose("glad", 1300); if (!hinted) { hinted = true; M.status(T(`Ears up: ${M.name()} has seen this one's twin.`, `귀가 쫑긋: ${M.name()}는 이 사진의 짝을 본 적 있어요.`), 2200); } }
      if (picks.length === 1 && stare) M.after(700, () => { if (picks.length === 1 && picks[0] === c && c.up) { c.el.classList.remove("is-up"); c.el.classList.add("is-peeked"); } });   // Ollie's stare: your first photo hides again
      if (picks.length < 2) return;
      busy = true; if (stopClock) { stopClock(); stopClock = null; }
      const [a, b] = picks; a.el.classList.remove("is-peeked"); a.el.classList.add("is-up");
      settle(a, b, "you", again => { if (again) { picks = []; busy = false; mood(); M.turnAt = M.now(); M.status(T("A pair. Go again.", "짝이에요. 한 번 더.")); } else endMine(); });
    }
    function endMine() { mine = M.myTurn = false; clearPrank(); catTurn(); }
    board.addEventListener("click", e => { const el = e.target.closest(".pn-card"); if (el) tap(cards.find(c => c.el === el)); });

    // ---- The cat's turn ----
    function catTurn() {
      mood();
      M.catThink(q => {
        const pool = down(); if (pool.length < 2) return;
        let a, b;
        const kp = q !== "careless" && knownPair();
        if (kp && Math.random() < use) [a, b] = kp;
        else { const fresh = pool.filter(c => !knows(c)); a = q === "careless" ? pick(pool) : pick(fresh.length ? fresh : pool); }
        M.reach(a.el); M.after(190, () => show(a, true));
        M.after(650, () => {
          if (!b) {
            const t = twin(a), rest = down();
            if (q !== "careless" && !t.up && knows(t) && t.seen > 0 && t.seen !== a.seen && Math.random() < use) b = t;
            else {
              const known = rest.filter(c => knows(c) && c.face !== a.face), fresh = rest.filter(c => !knows(c));
              b = q !== "careless" && nerve <= 2 && known.length && Math.random() < 0.6 ? pick(known) : pick(fresh.length ? fresh : rest);   // a careful cat often shows you nothing new
            }
          }
          M.reach(b.el); M.after(190, () => { show(b, true); settle(a, b, "cat", again => { if (again) catTurn(); else myTurn(); }); });
        });
      });
    }

    // ---- The eight pranks, as they land in this game. Each lasts for this turn of yours. ----
    function prank(id) {
      const pool = down();
      if (id === "loaf") {   // Tofu lies over six photos. You can still flip them: a flipped photo shows on top of him.
        const col = pick([0, 1]), row = pick([0, 1, 2]);
        const lo = h("img", "pn-loaf"); lo.src = "img/cat-tofu-prank-cut.webp"; lo.alt = ""; lo.style.setProperty("--col", col); lo.style.setProperty("--row", row); board.appendChild(lo);
        M.el.face.classList.add("is-away"); undo.push(() => { lo.remove(); M.el.face.classList.remove("is-away"); });
      }
      if (id === "gift") { const c = pick(pool); sock = { card: c, el: h("i", "pn-sock") }; c.el.appendChild(sock.el); undo.push(() => { sock && sock.el.remove(); sock = null; }); }
      if (id === "pounce") { pounce = true; board.classList.add("is-pounce"); undo.push(() => { pounce = false; board.classList.remove("is-pounce"); }); }
      if (id === "knead") {   // two photos next to each other change places, slowly, so a careful eye can follow
        const pairs = []; for (const c of pool) for (const o of pool) if ((o.slot === c.slot + 1 && c.slot % 4 !== 3) || o.slot === c.slot + 4) pairs.push([c, o]);
        if (pairs.length) { const [c, o] = pick(pairs); window.Sound && Sound.cue("swap"); c.el.classList.add("is-moving"); o.el.classList.add("is-moving"); [c.slot, o.slot] = [o.slot, c.slot]; place(); busy = true; M.after(1500, () => { c.el.classList.remove("is-moving"); o.el.classList.remove("is-moving"); busy = false; }); }
      }
      if (id === "stare") { stare = true; board.classList.add("is-stared"); undo.push(() => { stare = false; board.classList.remove("is-stared"); }); }
      if (id === "taptap") stopClock = M.turnClock(6);
      if (id === "lights") { M.lights(false); undo.push(() => M.lights(true)); }
      if (id === "pawdown") { held = pick(pool); held.el.classList.add("is-held"); const p = h("img", "pn-paw"); p.src = `img/paw-${M.cat.id}.webp`; p.alt = ""; held.el.appendChild(p); const c = held; undo.push(() => { p.remove(); c.el.classList.remove("is-held"); held = null; }); }
    }
    function flick() { sock.el.classList.add("is-flicked"); const s = sock; sock = null; M.after(350, () => s.el.remove()); M.status(T("Flicked away.", "톡, 치웠어요."), 1200); }
    function clearPrank() { if (stopClock) { stopClock(); stopClock = null; } for (const f of undo) f(); undo = []; M.prankDone && M.prankDone(); }

    return {
      begin() { M.status(T("Find more pairs than the cat.", "고양이보다 짝을 더 많이 찾으세요.")); myTurn(); },
      destroy() { if (stopClock) stopClock(); },
      state() { return { mine, busy, picks: picks.length, you, them, held: !!held, sock: !!sock, cards: cards.map(c => (c.found ? "F" : c.up ? "U" : "d")).join("") }; },
    };
  };
})();
