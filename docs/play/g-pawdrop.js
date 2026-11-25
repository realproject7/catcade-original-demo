// Paw Drop: four in a row against a cat. Turn game, 7 columns by 6 rows, on our own wooden rack.
// Tell: ears forward means the cat has a winning drop ready (block it), ears flat means it sees yours.
(() => {
  const h = (tag, cls, html) => { const el = document.createElement(tag); if (cls) el.className = cls; if (html != null) el.innerHTML = html; return el; };
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const W = 7, H = 6, WIN = 100000;

  GAME_IMPL.pawdrop = (M, table) => {
    const [nerve, smarts, focus] = M.cat.traits;
    const depth = [0, 1, 2, 4, 5, 7][smarts];
    const g = Array.from({ length: W }, () => []);   // g[col] = stack of 1 (you) or 2 (cat), bottom first
    const board = h("div", "pd"); table.appendChild(board);
    const hint = h("div", "pd-hint"); board.appendChild(hint);
    const cols = Array.from({ length: W }, (_, c) => { const el = h("button", "pd-col"); el.setAttribute("aria-label", T(`Column ${c + 1}`, `${c + 1}번 줄`)); for (let r = 0; r < H; r++) el.appendChild(h("i", "pd-cell")); board.appendChild(el); return el; });
    let mine = false, busy = true, undo = [], held = -1, shift = 0, stopClock = null, leaf = -1, lastAt = null;

    const at = (c, r) => (c < 0 || c >= W || r < 0 || r >= H ? 0 : g[c][r] || 0);
    const legal = () => [...Array(W).keys()].filter(c => g[c].length < H);
    function line(c, r, who) {   // the winning four through (c, r), or null
      for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
        const cells = [[c, r]];
        for (const s of [1, -1]) for (let k = 1; k < 4; k++) { const x = c + dx * k * s, y = r + dy * k * s; if (at(x, y) === who) cells.push([x, y]); else break; }
        if (cells.length >= 4) return cells;
      }
      return null;
    }
    const anyLine = () => { for (let c = 0; c < W; c++) for (let r = 0; r < g[c].length; r++) if (line(c, r, g[c][r])) return true; return false; };
    const wins = (c, who) => { g[c].push(who); const w = !!line(c, g[c].length - 1, who); g[c].pop(); return w; };
    const winning = who => legal().filter(c => wins(c, who));
    function longest(who) {
      let best = 0;
      for (let c = 0; c < W; c++) for (let r = 0; r < H; r++) if (at(c, r) === who) for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [1, -1]]) { let n = 1; while (at(c + dx * n, r + dy * n) === who) n++; best = Math.max(best, n); }
      return best;
    }
    // Position value for `who`: open twos and threes, the centre column. A daring cat counts its own lines more than yours.
    function value(who) {
      let v = 0; const mineW = 1 + (nerve - 3) * 0.12, yoursW = 1 - (nerve - 3) * 0.12;
      for (let c = 0; c < W; c++) for (let r = 0; r < H; r++) for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
        let a = 0, b = 0, ok = true;
        for (let k = 0; k < 4; k++) { const x = c + dx * k, y = r + dy * k; if (x < 0 || x >= W || y < 0 || y >= H) { ok = false; break; } const s = at(x, y); if (s === who) a++; else if (s) b++; }
        if (!ok) continue;
        if (a && !b) v += [0, 1, 6, 40, 0][a] * mineW; else if (b && !a) v -= [0, 1, 6, 40, 0][b] * yoursW;
      }
      for (let r = 0; r < g[3].length; r++) v += g[3][r] === who ? 3 : -3;
      return v;
    }
    function search(who, d, alpha, beta) {
      const moves = legal().sort((a, b) => Math.abs(a - 3) - Math.abs(b - 3));
      if (!moves.length) return [0, -1];
      let best = -Infinity, move = moves[0];
      for (const c of moves) {
        g[c].push(who);
        let s;
        if (line(c, g[c].length - 1, who)) s = WIN + d;
        else if (d <= 1) s = value(who);
        else s = -search(3 - who, d - 1, -beta, -alpha)[0];
        g[c].pop();
        if (s > best) { best = s; move = c; }
        alpha = Math.max(alpha, s); if (alpha >= beta) break;
      }
      return [best, move];
    }
    function token(who, fall) { const t = h("span", `pd-tok ${who === 1 ? "is-you" : "is-cat"}`, who === 2 ? `<img src="img/cat-${M.cat.id}-small.webp" alt="">` : ""); if (fall == null) t.classList.add("is-still"); else t.style.setProperty("--fall", fall); return t; }
    function paint(c) { [...cols[c].children].forEach((cell, r) => { cell.innerHTML = ""; if (g[c][r]) cell.appendChild(token(g[c][r])); }); }
    function markLast() { for (const el of board.querySelectorAll(".is-last")) el.classList.remove("is-last"); if (lastAt && cols[lastAt[0]].children[lastAt[1]].firstChild) cols[lastAt[0]].children[lastAt[1]].firstChild.classList.add("is-last"); }

    function drop(c, who, then) {
      const r = g[c].length; g[c].push(who); window.Sound && Sound.cue("token"); M.after(330, () => window.Sound && Sound.cue("land")); if (who === 2) M.reach(cols[c].children[H - 1], 460);
      cols[c].children[r].appendChild(token(who, H - r)); lastAt = [c, r]; markLast();
      M.score(longest(1), longest(2));
      M.after(380, () => {
        const w = line(c, r, who);
        if (w) { for (const [x, y] of w) cols[x].children[y].firstChild.classList.add("is-win"); finish(who === 1 ? "you" : "cat"); }
        else if (!legal().length) finish("tie");
        else then();
      });
    }
    function finish(winner) { clearPrank(); mine = M.myTurn = false; M.end(winner, [winner === "tie" ? T("The rack is full.", "판이 가득 찼어요.") : T("Four in a row.", "네 개가 한 줄.")]); }
    function mood() { M.feel(winning(2).length ? 0.8 : winning(1).length ? -0.8 : (value(2) > 30 ? 0.4 : value(2) < -30 ? -0.4 : 0)); }

    function myTurn() {
      mine = M.myTurn = true; busy = true; mood();
      M.playerTurn(id => { busy = false; if (id) prank(id); else if (!M.winding) M.status(T("Your turn. Tap a column.", "내 차례. 줄을 누르세요.")); }, { canPrank: legal().length > 2, lead: (value(2) > 60 ? 0.6 : 0) });
    }
    function tap(c) {
      if (!mine || busy || M.over || M.paused) return;
      if (leaf === c) { leaf = -1; hint.innerHTML = ""; M.status(T("Flicked away.", "톡, 치웠어요."), 1200); return; }
      if (c === held) { M.status(T(`${M.name()}'s paw is on that column this turn.`, `이번 차례엔 ${M.name()}의 앞발이 그 줄에 있어요.`)); return; }
      let to = c + shift; if (to < 0 || to >= W || g[to].length >= H) to = c;
      if (g[to].length >= H) return;
      busy = true; mine = M.myTurn = false; clearPrank();
      drop(to, 1, catTurn);
    }
    cols.forEach((el, c) => el.addEventListener("click", () => tap(c)));

    function catTurn() {
      mood();
      M.catThink(q => {
        // A dreamy cat sometimes plays without looking, so the easy cats can be beaten by a first-time player.
        let c = q === "careless" || Math.random() < (5 - focus) * 0.08 ? pick(legal()) : search(2, depth, -Infinity, Infinity)[1];
        if (c < 0) c = pick(legal());
        const good = wins(c, 2) || winning(1).includes(c);
        drop(c, 2, () => { if (good) M.goodMove(); myTurn(); });
      });
    }

    // ---- The eight pranks, as they land in this game. Each lasts for this turn of yours. ----
    function prank(id) {
      const open = legal(), need = new Set([...winning(1), ...winning(2)]);
      if (id === "loaf") { const lo = h("img", "pd-loaf"); lo.src = "img/cat-tofu-prank-cut.webp"; lo.alt = ""; lo.classList.toggle("is-right", Math.random() < 0.5); board.appendChild(lo); M.el.face.classList.add("is-away"); undo.push(() => { lo.remove(); M.el.face.classList.remove("is-away"); }); }
      if (id === "gift") { leaf = pick(open); hint.innerHTML = `<i class="pd-leaf" style="--col:${leaf}"></i>`; undo.push(() => { leaf = -1; hint.innerHTML = ""; }); }
      if (id === "pounce") {   // your token lands one column over. Never in a way that puts the column you need out of reach.
        const ways = [1, -1].filter(s => !need.has(s > 0 ? 0 : W - 1));
        if (ways.length) { shift = pick(ways); hint.innerHTML = `<b class="pd-shift">${shift > 0 ? "→" : "←"}</b>`; undo.push(() => { shift = 0; hint.innerHTML = ""; }); }
        else M.status(T("Pounce: he jumped and missed.", "덮치기: 뛰었는데 빗나갔어요."), 2200);
      }
      if (id === "knead") {   // two columns next to each other change places, slowly. Never into a line of four, never into a win for her.
        const before = winning(2).length, ok = [];
        for (let c = 0; c < W - 1; c++) { if (g[c].join() === g[c + 1].join()) continue; [g[c], g[c + 1]] = [g[c + 1], g[c]]; if (!anyLine() && winning(2).length <= before) ok.push(c); [g[c], g[c + 1]] = [g[c + 1], g[c]]; }
        if (ok.length) {
          const c = pick(ok); busy = true; window.Sound && Sound.cue("swap"); cols[c].classList.add("is-slide-r"); cols[c + 1].classList.add("is-slide-l");
          M.after(1100, () => { [g[c], g[c + 1]] = [g[c + 1], g[c]]; paint(c); paint(c + 1); cols[c].classList.remove("is-slide-r"); cols[c + 1].classList.remove("is-slide-l"); if (lastAt && (lastAt[0] === c || lastAt[0] === c + 1)) lastAt[0] = lastAt[0] === c ? c + 1 : c; markLast(); M.score(longest(1), longest(2)); mood(); busy = false; });
        } else M.status(T("Knead: she kneaded, and nothing moved.", "꾹꾹이: 눌렀는데 아무것도 안 움직였어요."), 2200);
      }
      if (id === "stare") { board.classList.add("is-plain"); undo.push(() => board.classList.remove("is-plain")); }
      if (id === "taptap") stopClock = M.turnClock(8);
      if (id === "lights") { M.lights(false); undo.push(() => M.lights(true)); }
      if (id === "pawdown") {   // never the column you need to win or to block
        const free = open.filter(c => !need.has(c));
        if (free.length > 1) { held = pick(free); const p = h("img", "pd-paw"); p.src = `img/paw-${M.cat.id}.webp`; p.alt = ""; p.style.setProperty("--col", held); board.appendChild(p); undo.push(() => { p.remove(); held = -1; }); }
      }
    }
    function clearPrank() { if (stopClock) { stopClock(); stopClock = null; } for (const f of undo) f(); undo = []; M.prankDone && M.prankDone(); }

    return {
      begin() { M.score(0, 0); M.status(T("Four in a row wins.", "네 개를 한 줄로 놓으면 이겨요.")); myTurn(); },
      destroy() { if (stopClock) stopClock(); },
      state() { return { mine, busy, cols: g.map(c => c.join("")), held, shift, win1: winning(1), win2: winning(2) }; },
    };
  };
})();
