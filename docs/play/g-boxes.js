// Box Fort: take turns joining pegs with yarn; close a square and the box is yours. Turn game, 5 by 5 squares (no draw is possible).
// The public rules of the pen-and-paper game, on our own peg board. Tell: ears flat when you have a box to close,
// ears forward when every line left hands the cat a box.
(() => {
  const h = (tag, cls, html) => { const el = document.createElement(tag); if (cls) el.className = cls; if (html != null) el.innerHTML = html; return el; };
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const N = 5, NH = (N + 1) * N, NL = NH + N * (N + 1);   // 30 across, 30 down, 60 lines
  const P = i => 8 + i * (84 / N);                       // peg position in % of the board
  // Lines: across H(r, c) = r*N + c joins pegs (r, c) and (r, c+1); down V(r, c) = NH + r*(N+1) + c joins (r, c) and (r+1, c).
  const H = (r, c) => r * N + c, V = (r, c) => NH + r * (N + 1) + c;
  const SIDES = [];   // the four lines of each square
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) SIDES.push([H(r, c), H(r + 1, c), V(r, c), V(r, c + 1)]);
  const SQUARES_OF = Array.from({ length: NL }, () => []);
  SIDES.forEach((s, b) => s.forEach(l => SQUARES_OF[l].push(b)));
  const ends = l => l < NH ? [[Math.floor(l / N), l % N], [Math.floor(l / N), l % N + 1]] : [[Math.floor((l - NH) / (N + 1)), (l - NH) % (N + 1)], [Math.floor((l - NH) / (N + 1)) + 1, (l - NH) % (N + 1)]];

  GAME_IMPL.boxes = (M, table, controls) => {
    const TURN = 20;   // seconds a turn (round 4, the operator: "각 턴마다 시간제한이 있어야 할것 같아")
    const [nerve, smarts, focus] = M.cat.traits;
    const line = new Array(NL).fill(0);    // 0 free, 1 you, 2 cat
    const owner = new Array(N * N).fill(0);
    const order = [];                      // lines in the order they were drawn
    let mine = false, busy = true, undo = [], stopClock = null, held = -1, sock = -1, shift = 0, hidden = new Set();

    // ---- the board ----
    const board = h("div", "bx"); table.appendChild(board);
    const svg = `<svg class="bx-svg" viewBox="0 0 100 100" aria-hidden="true"><g class="bx-guides">${[...Array(NL).keys()].map(l => { const [[r1, c1], [r2, c2]] = ends(l); return `<line x1="${P(c1)}" y1="${P(r1)}" x2="${P(c2)}" y2="${P(r2)}"/>`; }).join("")}</g><g class="bx-lines"></g><g class="bx-pegs">${[...Array((N + 1) ** 2).keys()].map(i => `<circle cx="${P(i % (N + 1))}" cy="${P(Math.floor(i / (N + 1)))}" r="2.3"/>`).join("")}</g></svg>`;
    board.innerHTML = svg;
    const lineLayer = board.querySelector(".bx-lines");
    const boxLayer = h("div", "bx-boxes"); board.appendChild(boxLayer);
    const hitLayer = h("div", "bx-hits"); board.appendChild(hitLayer);
    const hint = h("div", "bx-hint"); board.appendChild(hint);
    const gap = 84 / N;
    // One button per gap for VoiceOver and keys, centred on the gap. A finger is read by the board itself: the nearest gap wins,
    // so every gap is a large target even though the gaps sit close together.
    const hits = [...Array(NL).keys()].map(l => {
      const [[r1, c1], [r2, c2]] = ends(l), across = l < NH, b = h("button", `bx-hit ${across ? "is-across" : "is-down"}`);
      b.style.left = (P(c1) + P(c2)) / 2 + "%"; b.style.top = (P(r1) + P(r2)) / 2 + "%";
      b.setAttribute("aria-label", across ? T(`Across, row ${r1 + 1}, gap ${c1 + 1}`, `가로 ${r1 + 1}번 줄, ${c1 + 1}번 자리`) : T(`Down, column ${c1 + 1}, gap ${r1 + 1}`, `세로 ${c1 + 1}번 줄, ${r1 + 1}번 자리`));
      b.addEventListener("click", e => { if (e.detail === 0) { e.stopPropagation(); tap(l); } }); hitLayer.appendChild(b); return b;
    });
    board.addEventListener("click", e => {
      const r = board.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * 100, y = (e.clientY - r.top) / r.height * 100;
      let best = -1, bd = gap * 0.5;
      for (let l = 0; l < NL; l++) {
        const [[r1, c1], [r2, c2]] = ends(l), mx = (P(c1) + P(c2)) / 2, my = (P(r1) + P(r2)) / 2;
        const d = l < NH ? Math.hypot(Math.max(0, Math.abs(x - mx) - gap * 0.3), y - my) : Math.hypot(x - mx, Math.max(0, Math.abs(y - my) - gap * 0.3));
        const open = !line[l] || hidden.has(l);
        if (open && d < bd) { bd = d; best = l; }
      }
      if (best >= 0) tap(best);
    });

    // ---- rules ----
    const sides = b => SIDES[b].reduce((n, l) => n + (line[l] ? 1 : 0), 0);
    const free = () => [...Array(NL).keys()].filter(l => !line[l]);
    const closes = l => SQUARES_OF[l].some(b => sides(b) === 3);
    const closing = () => free().filter(closes);
    const safe = () => free().filter(l => SQUARES_OF[l].every(b => sides(b) < 2));
    const count = who => owner.filter(o => o === who).length;
    // How many squares the other side gets after this line, if it takes everything it can.
    function handout(l) {
      const was = line.slice(); line[l] = 3; let n = 0, more = true;
      while (more) { more = false; for (const x of free()) if (closes(x)) { n += SQUARES_OF[x].filter(b => sides(b) === 3).length; line[x] = 3; more = true; } }
      for (let i = 0; i < NL; i++) line[i] = was[i];
      return n;
    }
    // A clever cat counts the safe lines: whoever draws the last one makes the other open a row of boxes.
    function lastSafe() {
      const memo = new Map();
      const win = () => {
        const key = line.map(v => (v ? 1 : 0)).join(""); if (memo.has(key)) return memo.get(key);
        let w = false; for (const l of safe()) { line[l] = 3; const lose = win(); line[l] = 0; if (!lose) { w = true; break; } }
        memo.set(key, w); return w;
      };
      return safe().filter(l => { line[l] = 3; const ok = !win(); line[l] = 0; return ok; });
    }
    // Near the end a careful clever cat reads the board exactly, so it may hand you two boxes to keep control.
    function exact() {
      const rem = free(), k = rem.length, full = (1 << k) - 1, memo = new Map();
      const on = (l, m) => line[l] !== 0 || (rem.indexOf(l) >= 0 && (m >> rem.indexOf(l)) & 1);
      const got = (i, m) => SQUARES_OF[rem[i]].filter(b => SIDES[b].every(x => on(x, m))).length;
      const best = m => {
        if (m === full) return 0; if (memo.has(m)) return memo.get(m);
        let v = -99; for (let i = 0; i < k; i++) if (!((m >> i) & 1)) { const n = m | (1 << i), g = got(i, n), s = g ? g + best(n) : -best(n); if (s > v) v = s; }
        memo.set(m, v); return v;
      };
      let top = -99, moves = [];
      for (let i = 0; i < k; i++) { const n = 1 << i, g = got(i, n), s = g ? g + best(n) : -best(n); if (s > top) { top = s; moves = [rem[i]]; } else if (s === top) moves.push(rem[i]); }
      return pick(moves);
    }
    function choose(q) {
      const all = free();
      if (q === "careless") return pick(all);
      const dreamy = Math.random() < (5 - focus) * 0.07;
      if (smarts >= 4 && nerve <= 3 && all.length <= 12) return exact();
      const take = closing();
      if (take.length && !(dreamy && Math.random() < 0.5)) return pick(take);
      const s = safe();
      if (s.length) {
        if (dreamy) return pick(all);
        if (smarts >= 5 && s.length <= 9) { const w = lastSafe(); if (w.length) return pick(w); }
        return pick(s);
      }
      if (smarts <= 1 || dreamy) return pick(all);
      const cost = all.map(l => [handout(l), Math.random(), l]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
      return cost[0][2];
    }

    // ---- drawing ----
    function paintLine(l, who, fresh) {
      const [[r1, c1], [r2, c2]] = ends(l);
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute("class", `bx-yarn ${who === 1 ? "is-you" : "is-cat"} ${fresh ? "is-fresh" : ""}`); g.dataset.l = l;
      g.innerHTML = `<line pathLength="1" x1="${P(c1)}" y1="${P(r1)}" x2="${P(c2)}" y2="${P(r2)}"/><line class="twist" x1="${P(c1)}" y1="${P(r1)}" x2="${P(c2)}" y2="${P(r2)}"/>`;
      for (const old of lineLayer.querySelectorAll(".is-last")) old.classList.remove("is-last");
      g.classList.add("is-last"); lineLayer.appendChild(g);
      hits[l].disabled = true;
    }
    function claim(b, who) {
      owner[b] = who; const r = Math.floor(b / N), c = b % N;
      const el = h("div", `bx-box ${who === 1 ? "is-you" : "is-cat"}`, `<img src="img/claim-box.webp" alt=""><i>${who === 2 ? `<img src="img/cat-${M.cat.id}-small.webp" alt="">` : ""}</i>`);
      el.style.left = P(c) + "%"; el.style.top = P(r) + "%"; el.style.width = el.style.height = gap + "%"; boxLayer.appendChild(el);
      window.Sound && Sound.cue("pair");
    }
    // Draw a line. Returns how many squares it closed.
    function draw(l, who) {
      line[l] = who; order.push(l); paintLine(l, who, true); window.Sound && Sound.cue("flip");
      let n = 0; for (const b of SQUARES_OF[l]) if (!owner[b] && sides(b) === 4) { claim(b, who); n++; }
      M.score(count(1), count(2));
      return n;
    }
    function over() { return owner.every(o => o); }
    function finish() {
      stopTurnClock(); clearPrank(); mine = M.myTurn = false;
      const you = count(1), cat = count(2);
      M.end(you > cat ? "you" : "cat", [T(`Boxes: you ${you}, ${M.name()} ${cat}.`, `상자: 나 ${you}, ${M.name()} ${cat}.`)]);
    }
    function mood() {
      if (mine) M.feel(closing().length ? -0.8 : !safe().length ? 0.8 : Math.max(-0.6, Math.min(0.6, (count(2) - count(1)) / 6)));
      else M.feel(closing().length ? 0.8 : !safe().length ? -0.6 : Math.max(-0.6, Math.min(0.6, (count(2) - count(1)) / 6)));
    }

    // ---- your turn ----
    // A clock for every turn of yours. It starts once the cat has made up its mind about a prank, and Pause holds it.
    // When it runs out a random line is drawn for you (the operator, 2026-11-24, after playing on Reddit: "제한시간이 다되면
    // 스킵하면 안되고 아무거나 선을 긋게 해야할듯. 안그러면 이걸 악용해서 플레이를 하게 되더라"). A pass let a player dodge every
    // hand-out by waiting. The line is never one that closes a box while another is free, so waiting never wins a box.
    let clock = null;
    function startClock(sec, drum = false) {
      stopTurnClock();
      const el = h("div", `m-clock bx-clock ${drum ? "is-drum" : ""}`, `<i></i><b>${sec}</b>`); el.style.setProperty("--sec", sec + "s"); el.setAttribute("aria-label", T(`${sec} seconds`, `${sec}초`)); controls.appendChild(el);
      let left = sec;
      const tick = () => {
        left--; el.querySelector("b").textContent = Math.max(0, left);
        if (drum) { window.Sound && Sound.cue("drum"); M.el.table.classList.toggle("is-drummed", left <= 4); }
        else if (left <= 5) { el.classList.add("is-low"); window.Sound && Sound.cue("tick"); }
        if (left <= 0) timeUp(); else clock.t = M.after(1000, tick);
      };
      clock = { el, t: M.after(1000, tick) };
    }
    function stopTurnClock() { if (clock) { M.cancel(clock.t); clock.el.remove(); clock = null; } M.el.table.classList.remove("is-drummed"); }
    function timeUp() {
      stopTurnClock(); if (!mine || busy || M.over) return;
      const open = free().filter(x => x !== held && x !== sock), any = open.length ? open : free();
      const plain = any.filter(x => !closes(x)), from = plain.length ? plain : any;
      const l = from[Math.floor(Math.random() * from.length)];
      window.Sound && Sound.cue("whoosh");
      M.status(T("Time's up. A line was drawn for you.", "시간이 다 됐어요. 아무 줄이나 대신 이어졌어요."), 2200);
      play(l);
    }
    function myTurn(again = false) {
      mine = M.myTurn = true; busy = true; mood();
      if (again) { busy = false; M.turnAt = M.now(); M.status(T("A box! Go again.", "상자를 닫았어요! 한 번 더 해요."), 1400); startClock(TURN); return; }
      M.playerTurn(id => { busy = false; startClock(TURN); if (id) prank(id); else if (!M.winding) M.status(T("Your turn. Tap between two pegs.", "내 차례. 말뚝 두 개 사이를 누르세요.")); },
        { canPrank: free().length > 6, lead: count(2) - count(1) >= 5 ? 0.6 : 0 });
    }
    function tap(l) {
      if (!mine || busy || M.over || M.paused) return;
      if (hidden.has(l)) { hidden.delete(l); const g = lineLayer.querySelector(`[data-l="${l}"]`); g && g.classList.remove("is-ghost"); M.status(T("That one was already there.", "거긴 이미 이어져 있었어요."), 1400); return; }
      if (line[l]) return;
      if (sock === l) { sock = -1; hint.innerHTML = ""; window.Sound && Sound.cue("tap"); M.status(T("Flicked away.", "톡, 치웠어요."), 1200); return; }
      if (l === held) { M.status(T(`${M.name()}'s paw is on that gap this turn.`, `이번 차례엔 ${M.name()}의 앞발이 그 자리에 있어요.`)); return; }
      let to = l;
      // Pounce moves your line one gap over, never to a place that gives either side more than yours would have
      if (shift && !closes(l)) { const t = slide(l, shift); if (t >= 0 && !line[t] && !closes(t) && handout(t) === handout(l)) to = t; else M.status(T("Pounce: he jumped and missed.", "덮치기: 뛰었는데 빗나갔어요."), 1600); }
      play(to);
    }
    function play(to) {
      busy = true; stopTurnClock(); clearPrank();
      const n = draw(to, 1);
      M.after(320, () => { if (over()) finish(); else if (n) myTurn(true); else { mine = M.myTurn = false; catTurn(); } });
    }
    const slide = (l, s) => { if (l < NH) { const r = Math.floor(l / N), c = l % N + s; return c >= 0 && c < N ? H(r, c) : -1; } const r = Math.floor((l - NH) / (N + 1)), c = (l - NH) % (N + 1) + s; return c >= 0 && c <= N ? V(r, c) : -1; };

    // ---- the cat's turn ----
    function catTurn(again = false) {
      mood();
      const move = q => {
        const l = choose(q), wasSafe = safe().includes(l) || closes(l);
        M.reach(hits[l], 440);
        M.after(200, () => {
          const n = draw(l, 2);
          if (n && smarts >= 4 && !wasSafe) M.goodMove();
          M.after(380, () => { if (over()) finish(); else if (n) catTurn(true); else myTurn(); });
        });
      };
      if (again) { M.status(T(`${M.name()} goes again.`, `${M.name()}가 한 번 더 해요.`)); M.after(520, () => move("normal")); }
      else M.catThink(move);
    }

    // ---- The eight pranks, as they land in this game. Each lasts for this turn of yours. ----
    function prank(id) {
      const open = free(), keep = new Set(closing());
      if (safe().length === 1) keep.add(safe()[0]);
      if (id === "loaf") { const lo = h("img", "bx-loaf"); lo.src = "img/cat-tofu-prank-cut.webp"; lo.alt = ""; lo.classList.toggle("is-right", Math.random() < 0.5); board.appendChild(lo); M.el.face.classList.add("is-away"); undo.push(() => { lo.remove(); M.el.face.classList.remove("is-away"); }); }
      if (id === "gift") { sock = pick(open.filter(l => !keep.has(l)).length ? open.filter(l => !keep.has(l)) : open); const s = h("img", "bx-sock"); s.src = "img/prop-sock.webp"; s.alt = ""; place(s, sock); hint.appendChild(s); undo.push(() => { sock = -1; hint.innerHTML = ""; }); }
      if (id === "pounce") { shift = Math.random() < 0.5 ? 1 : -1; const a = h("b", "bx-shift", shift > 0 ? "→" : "←"); hint.appendChild(a); undo.push(() => { shift = 0; hint.innerHTML = ""; }); }
      if (id === "knead") { board.classList.add("is-wobble"); undo.push(() => board.classList.remove("is-wobble")); }
      if (id === "stare") { for (const l of order.slice(-3)) { hidden.add(l); const g = lineLayer.querySelector(`[data-l="${l}"]`); g && g.classList.add("is-ghost"); hits[l].disabled = false; } undo.push(() => { for (const l of hidden) { const g = lineLayer.querySelector(`[data-l="${l}"]`); g && g.classList.remove("is-ghost"); hits[l].disabled = true; } hidden.clear(); }); }
      if (id === "taptap") startClock(10, true);   // her drumming cuts your clock to 10 seconds; nothing else
      if (id === "lights") { M.lights(false); undo.push(() => M.lights(true)); }
      if (id === "pawdown") {
        const can = open.filter(l => !keep.has(l));
        if (can.length > 1) { held = pick(can); const p = h("img", "bx-paw"); p.src = `img/paw-${M.cat.id}.webp`; p.alt = ""; place(p, held); hint.appendChild(p); undo.push(() => { held = -1; hint.innerHTML = ""; }); }
      }
    }
    function place(el, l) { const [[r1, c1], [r2, c2]] = ends(l); el.style.left = (P(c1) + P(c2)) / 2 + "%"; el.style.top = (P(r1) + P(r2)) / 2 + "%"; }
    function clearPrank() { if (stopClock) { stopClock(); stopClock = null; } for (const f of undo) f(); undo = []; M.prankDone && M.prankDone(); }

    return {
      begin() { M.score(0, 0); M.status(T("Close a square to win a box.", "네 변을 다 이으면 그 칸이 내 상자가 돼요.")); myTurn(); },
      destroy() { if (stopClock) stopClock(); stopTurnClock(); },
      state() { return { mine, busy, line: line.slice(), owner: owner.slice(), safe: safe(), closing: closing(), held, sock, shift }; },
      tap,
      prank: id => prank(id),   // for checking a prank by hand in the mock
    };
  };
})();
