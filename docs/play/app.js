// Cat Clubhouse, design round 1: screens, sample records and navigation for the click-through mock.
// English is the base language. ?lang=ko shows the Korean strings kept beside each English one.
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const h = (tag, cls, html) => { const el = document.createElement(tag); if (cls) el.className = cls; if (html != null) el.innerHTML = html; return el; };
  const L = (en, ko) => ({ en, ko });
  document.documentElement.lang = LANG;
  if (LANG === "ko") {
    for (const el of $$("[data-ko]")) el.innerHTML = el.dataset.ko;
    for (const el of $$("[data-ko-note]")) el.dataset.note = el.dataset.koNote;
  }
  const icon = (id, cls = "") => `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true"><use href="#i-${id}"/></svg>`;

  // ---- The eight games of the first version and two new ones (round 3). `live` ones are playable in this mock. ----
  window.GAMES = [
    { id: "basket", free: true, live: true, two: true, name: L("Basket Duel", "바구니 대결"), mode: L("Same time", "동시에"), time: L("2 min", "2분"),
      one: L("Two baskets side by side, the same yarn. A chain in yours drops a tangle into the cat's.", "나란한 바구니 두 개에 똑같은 털실이 나와요. 내가 연쇄를 내면 고양이 바구니에 엉킨 실이 떨어져요."),
      how: [L("Drag over your basket and lift to drop.", "내 바구니 위에서 끌다가 손을 떼면 털실이 떨어져요."), L("Two of a kind merge into a bigger ball. Two merges in a row is a chain.", "같은 털실 두 개가 만나면 더 큰 털실로 합쳐져요. 연달아 두 번 합쳐지면 연쇄예요."), L("The yarn never stops. Go over the line and you lose. On time, the better score wins.", "털실은 계속 나와요. 선을 넘으면 져요. 시간이 다 되면 점수가 높은 쪽이 이겨요.")],
      tell: L("Ears forward: a chain is coming, and a tangle with it.", "귀가 쫑긋: 고양이가 곧 연쇄를 내요. 엉킨 실이 내 바구니로 와요.") },
    { id: "pairnap", free: true, live: true, two: true, name: L("Pair Nap", "짝꿍 낮잠"), mode: L("Take turns", "차례대로"), time: L("2 min", "2분"),
      one: L("Find more pairs of club photos than the cat.", "고양이보다 클럽하우스 사진의 짝을 더 많이 찾아요."),
      how: [L("Flip two photos. A pair is yours and you go again.", "사진 두 장을 뒤집어요. 짝이 맞으면 내 것이 되고 한 번 더 해요."), L("The cat remembers what it has seen. Some cats remember more.", "고양이도 본 사진을 기억해요. 기억력이 더 좋은 고양이도 있어요."), L("Most pairs wins.", "짝을 더 많이 찾은 쪽이 이겨요."), L("You have 20 seconds a turn. When time runs out, the photos are flipped for you.", "한 차례에 20초가 있어요. 시간이 다 되면 사진이 대신 뒤집혀요.")],
      tell: L("Ears up when you flip a photo: the cat has seen its twin.", "사진을 뒤집을 때 귀가 쫑긋: 고양이가 그 짝을 본 적 있어요.") },
    { id: "pawdrop", free: true, live: true, two: true, name: L("Paw Drop", "발도장 사목"), mode: L("Take turns", "차례대로"), time: L("2 min", "2분"),
      one: L("Drop tokens into the rack. Four in a row wins.", "줄을 골라 말을 떨어뜨려요. 4개를 한 줄로 이으면 이겨요."),
      how: [L("Tap a column. Your token falls to the lowest free spot.", "줄을 누르면 내 말이 그 줄 맨 아래 빈칸으로 떨어져요."), L("Four in a row wins: across, up or slanted.", "가로, 세로, 대각선 어느 쪽이든 4개를 한 줄로 이으면 이겨요."), L("Clever cats look further ahead.", "영리한 고양이는 더 멀리 내다봐요."), L("You have 20 seconds a turn. When time runs out, a token is dropped for you.", "한 차례에 20초가 있어요. 시간이 다 되면 말 하나가 대신 떨어져요.")],
      tell: L("Ears forward: the cat has a winning drop ready. Block it.", "귀가 쫑긋: 고양이가 이길 자리를 찾았어요. 막으세요!") },
    { id: "climb", free: false, live: true, two: false, name: L("Cushion Climb", "방석 타워"), mode: L("Same time", "동시에"), time: L("2 min", "2분"),
      one: L("You and the cat climb the same tower at the same time. First to the roof wins.", "나와 고양이가 같은 타워를 동시에 올라요. 먼저 지붕에 닿으면 이겨요."),
      how: [L("Your ball bounces by itself. Drag left and right to steer.", "내 공은 저절로 통통 튀어요. 좌우로 끌어서 방향을 잡아요."), L("Land on the cat's head for a spring. It can do the same to you.", "고양이 머리 위에 떨어지면 높이 튀어 올라요. 고양이도 내 머리를 밟을 수 있어요."), L("A fall takes you back to your last cushion.", "떨어지면 마지막 방석으로 돌아가요.")],
      tell: L("Ears forward: the cat is ahead of you.", "귀가 쫑긋: 고양이가 나보다 앞서 있어요.") },
    { id: "billiards", free: false, live: false, two: true, name: L("Catnip Billiards", "캣닢 당구"), mode: L("Take turns", "차례대로"), time: L("4 min", "4분"),
      one: L("A short rack of pool against a cat that lies on the table.", "당구대에 드러눕는 고양이와 치는 짧은 포켓볼 한 판."),
      how: [L("Hold to build power, let go to shoot.", "길게 눌러 힘을 모으고 떼면 쳐요."), L("Pot your four, then the black.", "내 공 4개를 다 넣고, 마지막에 검은 공을 넣어요."), L("Daring cats try bank shots. Careful cats play safe.", "대담한 고양이는 쿠션 샷도 노리고, 신중한 고양이는 안전하게 쳐요."), L("You have 30 seconds a shot. When time runs out, the turn passes to the cat.", "한 번 칠 때 30초가 있어요. 시간이 다 되면 고양이 차례로 넘어가요.")],
      tell: L("Ears forward: the cat has a clean pot lined up.", "귀가 쫑긋: 고양이가 확실히 넣을 공을 노리고 있어요.") },
    { id: "spades", free: false, live: false, two: false, name: L("Fireside Spades", "난롯가 스페이드"), mode: L("Four seats", "넷이서"), time: L("6 min", "6분"),
      one: L("You and a cat partner against two cats. Read your partner's ears.", "나와 파트너 고양이가 한 팀이 되어 고양이 둘과 겨뤄요. 파트너의 귀를 잘 보세요."),
      how: [L("You and your partner win by taking 7 of the 13 rounds first.", "나와 파트너가 합쳐서 13판 중 7판을 먼저 따면 이겨요."), L("Play the suit that was led if you can. Its highest card takes the round, and a ♠ beats every other suit.", "이번 판에 처음 나온 무늬가 있으면 꼭 그 무늬를 내요. 그 무늬에서 가장 높은 카드가 판을 따고, ♠는 다른 무늬를 모두 이겨요."), L("Your partner's ears show how strong its hand is.", "파트너의 귀를 보면 손패가 얼마나 좋은지 알 수 있어요."), L("Your partner never pranks you. The other two do.", "파트너는 나한테 장난을 안 쳐요. 상대 둘은 장난을 쳐요."), L("You have 20 seconds a card. When time runs out, your lowest card is played.", "카드 한 장 낼 때 20초가 있어요. 시간이 다 되면 가장 낮은 카드가 대신 나가요.")],
      tell: L("Partner's ears up: it is strong in the suit that was led.", "파트너 귀가 쫑긋: 이번 판에 처음 나온 무늬에 강해요.") },
    { id: "flip", free: false, live: false, two: true, name: L("Tuxedo Flip", "턱시도 뒤집기"), mode: L("Take turns", "차례대로"), time: L("3 min", "3분"),
      one: L("Trap the cat's discs between yours and they flip to your colour.", "고양이 말을 내 말 두 개 사이에 가두면 내 색으로 뒤집혀요."),
      how: [L("Place a disc so it traps a line of the cat's.", "고양이 말이 한 줄로 내 말 사이에 끼도록 놓아요."), L("The corners can never be flipped back.", "모서리에 놓은 말은 다시 뒤집히지 않아요."), L("Most discs at the end wins.", "끝났을 때 말이 더 많은 쪽이 이겨요."), L("You have 20 seconds a turn. When time runs out, a disc is placed for you.", "한 차례에 20초가 있어요. 시간이 다 되면 말 하나가 대신 놓여요.")],
      tell: L("Ears forward: the cat has a corner coming.", "귀가 쫑긋: 고양이가 모서리를 노리고 있어요.") },
    { id: "hockey", free: false, live: false, two: true, name: L("Paw Hockey", "앞발 하키"), mode: L("Same time", "동시에"), time: L("2 min", "2분"),
      one: L("Your mallet against the cat's paw. First to five.", "내 채와 고양이 앞발의 대결. 먼저 5점을 내면 이겨요."),
      how: [L("Drag your mallet to hit the puck.", "채를 끌어서 퍽을 쳐요."), L("The puck bounces off the walls.", "퍽은 벽에 튕겨요."), L("Quick cats rush forward and leave the goal open.", "발 빠른 고양이는 앞으로 달려 나오느라 골문을 비워요.")],
      tell: L("A wiggle: a hard shot is coming.", "엉덩이 씰룩: 센 슛이 와요.") },
    // Round 3: two new games, both played in turns.
    { id: "boxes", free: false, live: true, two: true, isNew: true, name: L("Box Fort", "상자 땅따먹기"), mode: L("Take turns", "차례대로"), time: L("3 min", "3분"),
      one: L("Take turns joining pegs with yarn. Close a square and the box in it is yours.", "번갈아 털실로 말뚝 두 개를 이어요. 네 변을 다 막으면 그 칸의 상자는 내 거예요."),
      how: [L("Tap between two pegs to stretch a line of yarn.", "말뚝 두 개 사이를 누르면 털실이 이어져요."), L("Draw the fourth side of a square to win its box, then go again.", "네 번째 변을 이으면 그 칸의 상자를 차지하고 한 번 더 해요."), L("A third side hands the box to the cat. Most boxes wins.", "세 번째 변을 이으면 그 상자를 고양이에게 주게 돼요. 상자가 더 많은 쪽이 이겨요."), L("You have 20 seconds a turn. When time runs out, a random line is drawn for you.", "한 차례에 20초가 있어요. 시간이 다 되면 아무 줄이나 대신 이어져요."), L("Clever cats count the safe lines. Some even hand you two boxes to keep control.", "영리한 고양이는 안전한 줄이 몇 개 남았는지 헤아려요. 흐름을 잡으려고 일부러 상자 두 개를 넘겨주기도 해요.")],
      tell: L("Ears flat: there is a box you can close. Ears forward: every line left hands the cat a box.", "귀가 납작: 지금 닫을 수 있는 상자가 있어요. 귀가 쫑긋: 어디를 이어도 고양이에게 상자를 줘요.") },
    { id: "teeter", free: false, live: true, two: true, isNew: true, name: L("Teeter Table", "아슬아슬 탁자"), mode: L("Take turns", "차례대로"), time: L("2 min", "2분"),
      one: L("Take turns piling things on a little table. Knock something off and you lose.", "작은 탁자 위에 번갈아 물건을 쌓아요. 뭐든 탁자 밖으로 떨어뜨리면 져요."),
      how: [L("Drag to move your piece. Twist with two fingers, or tap Turn, to tilt it.", "끌어서 물건을 옮기고, 두 손가락으로 비틀거나 돌리기를 눌러 기울여요."), L("Drop it where it looks steady. You have 20 seconds; when time runs out, your piece drops where it is.", "안전해 보이는 자리에 놓아요. 한 차례에 20초가 있고, 시간이 다 되면 물건이 지금 자리에 그대로 놓여요."), L("If anything goes off the table after your drop, you lose.", "내가 놓은 뒤 탁자 밖으로 뭐라도 떨어지면 내가 져요."), L("Daring cats pile high. Careful cats keep the pile low.", "대담한 고양이는 높이 쌓고, 신중한 고양이는 낮게 쌓아요.")],
      tell: L("Ears forward: the cat thinks no steady spot is left for you.", "귀가 쫑긋: 고양이가 보기엔 이제 안전한 자리가 없어요.") },
  ];
  window.GAME = Object.fromEntries(GAMES.map(g => [g.id, g]));
  // What each cat's prank does in the four playable games. In the other four the general line from cats.js is shown.
  const PRANK_IN = {
    pairnap: { loaf: L("Tofu lies over six photos. You can still flip them.", "두부가 사진 여섯 장 위에 누워요. 그래도 뒤집을 수는 있어요."), gift: L("A sock lands on one photo. Tap it away.", "사진 한 장 위에 양말이 떨어져요. 눌러서 치우세요."), pounce: L("He lands on the photo you reach for, and the one next to it flips.", "내가 누르려는 사진에 뛰어들어요. 그 옆 사진이 대신 뒤집혀요."), knead: L("Two photos next to each other slowly change places.", "붙어 있는 사진 두 장이 천천히 자리를 바꿔요."), stare: L("Your first photo hides again while you pick the second.", "두 번째 사진을 고를 때 첫 번째 사진이 다시 덮여요."), taptap: L("Her drumming cuts your clock to 10 seconds this turn.", "탁탁 두드려서 이번 차례 시간이 10초로 줄어요."), lights: L("Dark, except a circle round your finger.", "내 손가락 주변만 빼고 어두워져요."), pawdown: L("Her paw rests on one photo. Not that one this turn.", "사진 한 장에 앞발을 올려요. 이번 차례엔 그 사진을 못 뒤집어요.") },
    pawdrop: { loaf: L("Tofu lies over a corner of the rack and hides it.", "두부가 판 한쪽 구석에 누워서 가려요."), gift: L("A leaf lands on one column. Tap it away.", "줄 하나에 나뭇잎이 떨어져요. 눌러서 치우세요."), pounce: L("Your token lands one column over. The arrow shows which way.", "내 말이 한 줄 옆으로 떨어져요. 화살표가 방향을 알려줘요."), knead: L("Two columns next to each other slowly change places.", "붙어 있는 두 줄이 천천히 자리를 바꿔요."), stare: L("All tokens look the same for one turn.", "한 차례 동안 말이 전부 똑같아 보여요."), taptap: L("Her drumming cuts your clock to 10 seconds this turn.", "탁탁 두드려서 이번 차례 시간이 10초로 줄어요."), lights: L("Dark, except a circle round your finger.", "내 손가락 주변만 빼고 어두워져요."), pawdown: L("Her paw closes one column for a turn. Never the one you need.", "한 차례 동안 한 줄을 앞발로 막아요. 꼭 필요한 줄은 안 막아요.") },
    basket: { loaf: L("Tofu lies across your basket. Your aim line is hidden for 6 seconds.", "두부가 내 바구니 위에 누워요. 6초 동안 조준선이 안 보여요."), gift: L("A sock drops into your basket. It is gone in a few seconds.", "내 바구니에 양말이 떨어져요. 몇 초 뒤에 사라져요."), pounce: L("Your next yarn gets knocked to one side.", "다음 털실이 옆으로 툭 밀려나요."), knead: L("Your basket tilts for 6 seconds.", "6초 동안 내 바구니가 기울어요."), stare: L("You cannot see which yarn is next for 8 seconds.", "8초 동안 다음 털실이 뭔지 안 보여요."), taptap: L("Her drumming shakes your aim for 6 seconds.", "탁탁 두드려서 6초 동안 조준이 흔들려요."), lights: L("Dark for 5 seconds, except a circle round your finger.", "5초 동안 내 손가락 주변만 빼고 어두워져요."), pawdown: L("Her paw covers a third of your basket for 5 seconds.", "5초 동안 앞발이 내 바구니의 3분의 1을 막아요.") },
    climb: { loaf: L("Tofu lies across the cushions above you for 5 seconds.", "두부가 5초 동안 내 위쪽 방석들에 누워서 가려요."), gift: L("A sock lands on a cushion ahead. It bounces you less, once.", "앞쪽 방석에 양말이 떨어져요. 그 방석에서는 한 번 낮게 튀어요."), pounce: L("He knocks you sideways.", "내 공을 옆으로 툭 쳐요."), knead: L("The cushions sway for 6 seconds.", "6초 동안 방석들이 좌우로 흔들려요."), stare: L("You cannot see far ahead for 7 seconds.", "7초 동안 멀리 있는 방석이 안 보여요."), taptap: L("Everything runs faster for 5 seconds.", "5초 동안 모든 게 빨라져요."), lights: L("Dark for 5 seconds, except a circle round your ball.", "5초 동안 내 공 주변만 빼고 어두워져요."), pawdown: L("Her paw holds one cushion ahead. You fall through it.", "앞쪽 방석 하나를 앞발로 붙잡아요. 거기 닿으면 그냥 통과해서 떨어져요.") },
    boxes: { loaf: L("Tofu lies over a corner of the board. You can still draw under him.", "두부가 판 한쪽 구석에 누워서 가려요. 그 밑에도 줄은 이을 수 있어요."), gift: L("A sock lands on one gap. Tap it away.", "빈자리 하나에 양말이 떨어져요. 눌러서 치우세요."), pounce: L("Your line lands one gap over. The arrow shows which way. Never where it gives away more boxes.", "내 줄이 옆자리로 한 칸 밀려나요. 화살표가 방향을 알려줘요. 상자를 더 내주는 자리로는 안 밀려요."), knead: L("The board sways slowly for your turn.", "내 차례 동안 판이 천천히 흔들려요."), stare: L("The three newest lines vanish for your turn. Tap one and it shows again.", "내 차례 동안 가장 최근에 이은 줄 세 개가 안 보여요. 누르면 다시 보여요."), taptap: L("Her drumming cuts your clock to 10 seconds this turn.", "탁탁 두드려서 이번 차례 시간이 10초로 줄어요."), lights: L("Dark, except a circle round your finger.", "내 손가락 주변만 빼고 어두워져요."), pawdown: L("Her paw holds one gap for a turn. Never one that closes a box.", "한 차례 동안 빈자리 하나를 앞발로 막아요. 상자를 닫는 자리는 안 막아요.") },
    teeter: { loaf: L("Tofu lies along one side and hides part of the pile.", "두부가 한쪽에 누워서 쌓인 물건 일부를 가려요."), gift: L("A sock lands on your piece. Tap it away before you drop.", "내 물건 위에 양말이 떨어져요. 놓기 전에 눌러서 치우세요."), pounce: L("Your piece gets batted a little to one side as it drops. The line shows where it will land.", "놓을 때 내 물건이 옆으로 살짝 밀려요. 점선이 떨어질 자리를 알려줘요."), knead: L("The view rocks gently for your turn. The table itself stays still.", "내 차례 동안 화면이 살살 흔들려요. 탁자는 가만히 있어요."), stare: L("You cannot see which piece comes next.", "다음에 올 물건이 안 보여요."), taptap: L("Her drumming cuts your clock to 10 seconds this turn.", "탁탁 두드려서 이번 차례 시간이 10초로 줄어요."), lights: L("Dark, except a circle round your finger.", "내 손가락 주변만 빼고 어두워져요."), pawdown: L("Her paw covers part of the table this turn. Never the steadiest spot.", "이번 차례엔 앞발로 한쪽을 덮어요. 가장 안전한 자리는 안 덮어요.") },
  };
  const prankIn = (g, c) => tx((PRANK_IN[g.id] || {})[c.prank.id] || c.prank.what);

  // ---- Sample state: a player about two weeks in, still on the free club ----
  const S = window.S = {
    plus: false, game: "pairnap", cat: "tofu", view: null,
    rec: { tofu: { pairnap: [3, 1], basket: [2, 1], pawdrop: [1, 0] }, mint: { pairnap: [1, 2], basket: [1, 1] }, mango: { pawdrop: [2, 3], basket: [0, 2] } },
    learned: { tofu: { tell: true, prank: true, slip: true }, mint: { tell: true, prank: true, slip: true }, mango: { tell: true, prank: true } },
  };
  const rec = (c, g) => (S.rec[c] && S.rec[c][g]) || [0, 0];
  const wins = c => Object.values(S.rec[c] || {}).reduce((n, r) => n + r[0], 0);
  const games = c => Object.values(S.rec[c] || {}).reduce((n, r) => n + r[0] + r[1], 0);
  const stamps = c => Object.values(S.rec[c] || {}).filter(r => r[0] > 0).length;
  const allStamps = () => CATS.reduce((n, c) => n + stamps(c.id), 0);
  const catOpen = c => S.plus || c.free, gameOpen = g => S.plus || g.free;
  window.APP = {
    prankIn: (g, c) => prankIn(g, c),
    learn(c, what) { (S.learned[c] = S.learned[c] || {})[what] = true; },
    win(c, g) { const r = ((S.rec[c] = S.rec[c] || {})[g] = rec(c, g).slice()); const first = r[0] === 0; r[0]++; return first; },
    played(c, g) { const r = ((S.rec[c] = S.rec[c] || {})[g] = rec(c, g).slice()); r[1]++; },
  };

  // ---- Pieces ----
  const catImg = (id, pose = "idle", cls = "") => `<img class="${cls}" src="img/cat-${id}-${pose}.webp" alt="" draggable="false">`;
  const traitBars = c => `<div class="traits">${TRAITS.map((t, i) => `<div class="trait"><span class="t-footnote t-strong">${tx(t.name)}</span><span class="pips" aria-label="${c.traits[i]} / 5">${[1, 2, 3, 4, 5].map(n => `<i class="${n <= c.traits[i] ? "is-on" : ""}"></i>`).join("")}</span><span class="t-footnote t-secondary">${tx(c.traits[i] >= 4 ? t.high : c.traits[i] <= 2 ? t.low : t.mid)}</span></div>`).join("")}</div>`;
  const lockChip = () => `<span class="chip is-butter is-lock">${icon("lock")}<span>${T("Locked", "잠김")}</span></span>`;

  // The clubhouse room: the painted scene with the cats sitting in it.
  const SPOTS = { tofu: [24, 60, 21], plum: [74, 59.5, 18], jelly: [21, 74, 20], button: [76, 74.5, 20], ollie: [82, 34.5, 17], mint: [50, 46, 17], sumi: [84, 86.5, 21], mango: [37, 87, 15] };
  function room(el) {
    el.innerHTML = `<div class="scene">${Object.entries(SPOTS).sort((a, b) => a[1][1] - b[1][1]).map(([id, [x, y, w]]) => `<button class="sit" data-check-skip data-cat="${id}" data-go="cat" style="left:${x}%;top:${y}%;width:${w}%" aria-label="${tx(CAT[id].name)}">${catImg(id, id === "tofu" || id === "sumi" ? "idle" : id === "mango" ? "glad" : "idle")}</button>`).join("")}</div>`;
  }
  function tabs() {
    for (const nav of $$("[data-tabs]")) nav.innerHTML = [["club", T("Club", "클럽"), "club"], ["cats", T("Cats", "고양이"), "cats"], ["me", T("Stamps", "도장첩"), "me"]].map(([id, label, ic]) => `<button class="tab ${nav.dataset.tabs === id ? "is-current" : ""}" data-go="${id}">${icon(ic)}<span>${label}</span></button>`).join("");
  }

  // ---- Screens ----
  function renderMeet() {
    $("[data-starters]").innerHTML = CATS.filter(c => c.free).map(c => `<button class="starter" data-cat="${c.id}" data-game="pairnap" data-go="lesson" style="--tint:${c.tint};--edge:${c.edge}">${catImg(c.id, "glad", "art-96")}<span class="grow stack-1"><b class="t-title-2">${tx(c.name)}</b><span class="t-subhead prose t-secondary">${tx(c.about)}</span><span class="t-footnote prose t-strong">${tx(c.prank.name)} · ${tx(c.style)}</span></span>${icon("next", "go")}</button>`).join("");
  }
  function renderClub() {
    const c = CAT.mango, g = GAME.pawdrop, r = rec(c.id, g.id);
    $("[data-invite]").innerHTML = `${catImg(c.id, "miffed", "art-88")}<span class="grow stack-1"><span class="label">${T("Waiting at the table", "판 앞에서 기다리는 중")}</span><b class="t-headline">${T(`${tx(c.name)} wants a rematch`, `${tx(c.name)}가 한 판 더 하재요`)}</b><span class="t-subhead prose t-secondary">${tx(g.name)} · ${T(`you ${r[0]} : ${r[1]}`, `나 ${r[0]} : ${r[1]}`)}</span></span>${icon("next", "go")}`;
    $("[data-invite]").dataset.cat = c.id; $("[data-invite]").dataset.game = g.id;
    $("[data-invite]").style.setProperty("--tint", c.tint); $("[data-invite]").style.setProperty("--edge", c.edge);
    $("[data-games]").innerHTML = GAMES.map(g => `<button class="game-tile ${gameOpen(g) ? "" : "is-locked"}" data-game="${g.id}" data-go="game"><span class="pic"><img src="img/game-${g.id}.webp" alt=""></span><b class="t-headline">${tx(g.name)}</b><span class="t-footnote t-secondary">${tx(g.mode)} · ${tx(g.time)}</span>${gameOpen(g) ? "" : `<i class="lock">${icon("lock")}</i>`}${g.isNew ? `<span class="chip is-pink new-chip">${T("New", "새 게임")}</span>` : ""}</button>`).join("");
    $("[data-mock-plus]").textContent = S.plus ? T("Mock: go back to the free club", "시안: 무료 상태로 돌아가기") : T("Mock: open every cat and game", "시안: 고양이와 게임 전부 열기");
  }
  function renderGame(root, forceLocked) {
    const g = GAME[S.game], locked = forceLocked || !gameOpen(g);
    let c = CAT[S.cat]; if (!locked && !catOpen(c)) c = CAT.tofu;
    $("[data-g-name]", root).textContent = tx(g.name);
    $("[data-game-body]", root).innerHTML = `
      <div class="game-hero"><img src="img/game-${g.id}.webp" alt=""></div>
      <div class="stack"><p class="t-body prose">${tx(g.one)}</p><div class="chips"><span class="chip">${tx(g.mode)}</span><span class="chip">${tx(g.time)}</span>${g.two ? `<span class="chip">${T("Two people too", "둘이서도 가능")}</span>` : ""}${g.live ? "" : `<span class="chip is-sky">${T("Design only in this mock", "이 시안에서는 설계만")}</span>`}</div></div>
      ${locked ? `<div class="card is-butter"><div class="card-row">${icon("lock", "big")}<div class="grow stack-1"><h2 class="t-headline prose">${T("Opens with the whole clubhouse", "클럽하우스 전체를 열면 할 수 있어요")}</h2><p class="t-subhead prose">${T("One payment opens every game and every cat.", "한 번 결제하면 게임과 고양이가 전부 열려요.")}</p></div></div></div>` : `
      <div class="stack"><div class="head"><h2 class="t-title-2 grow">${T("Pick a cat", "고양이 고르기")}</h2></div>
        <div class="pick-row" role="radiogroup">${CATS.map(k => `<button class="pick ${k.id === c.id ? "is-on" : ""} ${catOpen(k) ? "" : "is-locked"}" role="radio" aria-checked="${k.id === c.id}" data-pick="${k.id}" style="--tint:${k.tint};--edge:${k.edge}">${catImg(k.id, "idle")}<b class="t-footnote t-strong">${tx(k.name)}</b><span class="t-footnote t-secondary t-num">${catOpen(k) ? `${rec(k.id, g.id)[0]} : ${rec(k.id, g.id)[1]}` : icon("lock")}</span></button>`).join("")}</div>
        <div class="card is-cat" style="--tint:${c.tint};--edge:${c.edge}"><div class="card-row">${catImg(c.id, "windup", "art-88")}<div class="grow stack-1"><h3 class="t-headline">${tx(c.name)}: ${tx(c.prank.name)}</h3><p class="t-subhead prose">${prankIn(g, c)}</p><p class="t-footnote prose t-secondary">${tx(c.style)}</p></div></div></div>
      </div>`}
      <div class="card"><h2 class="t-headline">${T("How to play", "하는 법")}</h2><ol class="steps">${g.how.map((s, i) => `<li><span class="n">${i + 1}</span><p class="t-subhead prose">${tx(s)}</p></li>`).join("")}</ol><p class="ear-line t-subhead prose"><img src="img/cat-${c.id}-glad.webp" alt=""><span>${tx(g.tell)}</span></p></div>`;
    $("[data-game-dock]", root).innerHTML = locked
      ? `<button class="button is-butter" data-go="plus">${T("Open the whole clubhouse", "클럽하우스 전체 열기")}</button>${g.live ? "" : `<button class="button is-plain" data-go="m-${g.id}">${T("See the design", "설계 화면 보기")}</button>`}`
      : `<button class="button" data-go="intro">${T(`Play ${tx(c.name)}`, `${tx(c.name)}와 두기`)}</button>`;
    if (!locked) S.cat = c.id;
  }
  function notes(c, g) {
    const k = S.learned[c.id] || {};
    return `
      <div class="card"><div class="card-row"><img class="art-72s" src="img/cat-${c.id}-windup.webp" alt=""><div class="grow stack-1"><span class="label">${T("Prank", "장난")} · ${T(`${c.pranks} a game`, `한 판에 ${c.pranks}번`)}</span><h3 class="t-headline">${tx(c.prank.name)}</h3><p class="t-subhead prose">${g ? prankIn(g, c) : tx(c.prank.what)}</p><p class="t-footnote prose t-secondary">${k.tell ? T("You see it coming: ", "이렇게 티가 나요: ") + tx(c.prank.tell) : T("Watch what it does just before.", "장난 직전에 뭘 하는지 지켜보세요.")}</p></div></div></div>
      <div class="card ${k.slip ? "" : "is-unknown"}"><div class="card-row">${k.slip ? `<img class="art-72s" src="img/cat-${c.id}-slip.webp" alt="">` : `<span class="unknown">?</span>`}<div class="grow stack-1"><span class="label">${T("Weak spot", "약점")}</span>${k.slip ? `<h3 class="t-headline">${tx(c.slip.name)}</h3><p class="t-subhead prose">${tx(c.slip.what)}</p>` : `<h3 class="t-headline">${T("Not found yet", "아직 못 찾았어요")}</h3><p class="t-subhead prose t-secondary">${T("Hint: ", "힌트: ")}${tx(c.slip.hint)}</p>`}</div></div></div>`;
  }
  function renderIntro() {
    const c = CAT[S.cat], g = GAME[S.game], r = rec(c.id, g.id);
    $("[data-i-game]").textContent = tx(g.name);
    $("[data-intro-body]").innerHTML = `
      <div class="cat-hero" style="--tint:${c.tint};--edge:${c.edge}">${catImg(c.id, "glad")}<p class="quote t-headline">${tx(c.says.hi)}</p></div>
      <div class="stack"><div class="head"><h1 class="t-title-1 grow">${tx(c.name)}</h1><span class="t-subhead t-secondary t-num">${r[0] + r[1] ? T(`You ${r[0]} : ${r[1]}`, `나 ${r[0]} : ${r[1]}`) : T("First game", "첫 대결")}</span></div><p class="t-body prose t-secondary">${tx(c.style)}</p></div>
      ${traitBars(c)}${notes(c, g)}`;
  }
  function renderCats() {
    $("[data-roster]").innerHTML = CATS.map(c => `<button class="cat-card ${catOpen(c) ? "" : "is-locked"}" data-cat="${c.id}" data-go="cat" style="--tint:${c.tint};--edge:${c.edge}"><span class="pic">${catImg(c.id, "idle")}</span><b class="t-headline">${tx(c.name)}</b><span class="t-footnote t-secondary">${tx(c.prank.name)}</span>${catOpen(c) ? `<span class="t-footnote t-strong t-num stampline">${icon("star")}${stamps(c.id)} / ${GAMES.length}</span>` : `<span class="t-footnote t-strong stampline">${icon("lock")}${T("Locked", "잠김")}</span>`}</button>`).join("");
  }
  function renderCat(root, mode) {
    const c = CAT[S.cat], locked = mode === "locked" || (mode !== "open" && !catOpen(c)), w = wins(c.id), n = games(c.id);
    $("[data-cat-body]", root).innerHTML = `
      <div class="cat-hero" style="--tint:${c.tint};--edge:${c.edge}">${catImg(c.id, locked ? "think" : "idle")}</div>
      <div class="stack"><div class="head"><h1 class="t-title-1 grow">${tx(c.name)}</h1>${locked ? lockChip() : `<span class="t-subhead t-secondary t-num">${n ? T(`${n} games, ${w} wins`, `${n}판 ${w}승`) : T("Not played yet", "아직 안 붙어 봤어요")}</span>`}</div><p class="t-body prose">${tx(c.about)}</p><p class="t-subhead prose t-secondary">${tx(c.style)}</p></div>
      ${traitBars(c)}
      ${locked ? `<div class="card"><div class="card-row"><img class="art-72s" src="img/cat-${c.id}-windup.webp" alt=""><div class="grow stack-1"><span class="label">${T("Prank", "장난")}</span><h3 class="t-headline">${tx(c.prank.name)}</h3><p class="t-subhead prose">${tx(c.prank.what)}</p></div></div></div>` : notes(c, null)}
      ${locked ? "" : `<div class="stack"><div class="head"><h2 class="t-title-2 grow">${T("Stamps", "도장")}</h2><span class="t-footnote t-secondary t-num">${stamps(c.id)} / ${GAMES.length}</span></div><div class="stamp-row">${GAMES.map(g => `<span class="stamp ${rec(c.id, g.id)[0] ? "is-got" : ""}"><img src="img/game-${g.id}.webp" alt=""><i>${icon("paw")}</i><b class="t-caption">${tx(g.name)}</b></span>`).join("")}</div></div>
      <div class="card ${w >= 5 ? "is-butter" : ""}"><div class="card-row"><img class="art-72s ${w >= 5 ? "" : "is-dim"}" src="img/keep-${c.id}.webp" alt=""><div class="grow stack-1"><span class="label">${T("Keepsake", "기념품")}</span><h3 class="t-headline">${tx(c.keepsake)}</h3><p class="t-subhead prose t-secondary">${w >= 5 ? T("Yours. It is on your shelf.", "받았어요. 선반에 있어요.") : T(`${w} of 5 wins.`, `5승 중 ${w}승.`)}</p></div></div></div>`}`;
    $("[data-cat-dock]", root).innerHTML = locked ? `<button class="button is-butter" data-go="plus">${T("Open the whole clubhouse", "클럽하우스 전체 열기")}</button>` : `<button class="button" data-go="game" data-keep-cat>${T(`Play ${tx(c.name)}`, `${tx(c.name)}와 두기`)}</button>`;
  }
  function renderMe(fresh) {
    const keep = S.rec; if (fresh) S.rec = {};
    const root = $(fresh ? '[data-screen="me-new"]' : '[data-screen="me"]');
    $("[data-stamps]", root).innerHTML = `<div class="head"><h2 class="t-headline grow">${T(`${allStamps()} of ${CATS.length * GAMES.length} stamps`, `도장 ${CATS.length * GAMES.length}개 중 ${allStamps()}개`)}</h2></div><div class="grid64" style="grid-template-columns:32px repeat(${GAMES.length}, 1fr)"><span></span>${GAMES.map(g => `<img class="gh" src="img/game-${g.id}.webp" alt="${tx(g.name)}">`).join("")}${CATS.map(c => `<img class="ch" src="img/cat-${c.id}-small.webp" alt="${tx(c.name)}">${GAMES.map(g => `<i class="cell ${rec(c.id, g.id)[0] ? "is-got" : ""} ${catOpen(c) && gameOpen(g) ? "" : "is-shut"}">${rec(c.id, g.id)[0] ? icon("paw") : ""}</i>`).join("")}`).join("")}</div><p class="legend t-footnote t-secondary"><span><i class="cell is-got">${icon("paw")}</i>${T("won", "이김")}</span><span><i class="cell"></i>${T("not won yet", "아직 못 이김")}</span>${S.plus ? "" : `<span><i class="cell is-shut"></i>${T("opens with the whole club", "전체를 열면 가능")}</span>`}</p>${S.plus ? "" : `<p class="t-footnote prose t-secondary">${T("Nine stamps can be won in the free club.", "무료 클럽에서는 도장 아홉 개를 받을 수 있어요.")}</p>`}`;
    const got = CATS.filter(c => wins(c.id) >= 5).length;
    $("[data-keep-count]", root).textContent = `${got} / 8`;
    $("[data-shelf]", root).innerHTML = CATS.map(c => `<span class="keep ${wins(c.id) >= 5 ? "is-got" : ""}"><img src="img/keep-${c.id}.webp" alt=""><b class="t-caption t-num">${wins(c.id) >= 5 ? tx(c.name) : `${Math.min(wins(c.id), 5)} / 5`}</b></span>`).join("");
    for (const el of $$("[data-plus-state]")) el.textContent = S.plus ? T("Open", "열림") : T("$4.99", "₩7,700");
    if (fresh) S.rec = keep;
  }
  function renderTwo() {
    $("[data-two-games]").innerHTML = GAMES.filter(g => g.two).map((g, i) => `<button class="chip" aria-pressed="${i === 0}" data-two-game>${tx(g.name)}</button>`).join("");
    $("[data-two-cats]").innerHTML = CATS.map((k, i) => `<button class="pick ${i === (S.plus ? 5 : 1) ? "is-on" : ""} ${catOpen(k) ? "" : "is-locked"}" data-two-cat style="--tint:${k.tint};--edge:${k.edge}">${catImg(k.id, "idle")}<b class="t-footnote t-strong">${tx(k.name)}</b><span class="t-footnote t-secondary">${catOpen(k) ? tx(k.prank.name) : icon("lock")}</span></button>`).join("");
  }
  function renderLineups() {
    for (const el of $$("[data-lineup]")) el.innerHTML = CATS.filter(c => el.dataset.lineup === "all" || !c.free).map((c, i) => `<img src="img/cat-${c.id}-${el.dataset.lineup === "all" ? "win" : "idle"}.webp" alt="" style="--i:${i}">`).join("");
    for (const el of $$("[data-price]")) el.textContent = LANG === "ko" ? "₩7,700" : "$4.99";
  }
  function resultSample(el, kind) {
    const win = kind === "win", c = win ? CAT.tofu : CAT.mango, g = win ? GAME.pairnap : GAME.pawdrop, name = tx(c.name);
    el.innerHTML = `<img class="r-cat" src="img/cat-${c.id}-${win ? "lose" : "win"}.webp" alt=""><h2 class="t-title-1">${win ? T("You win!", "이겼어요!") : T(`${name} wins`, `${name} 승리`)}</h2><p class="t-headline r-score t-num">${win ? T(`You 5 · ${name} 3`, `나 5 · ${name} 3`) : T(`You 3 · ${name} 4`, `나 3 · ${name} 4`)}</p><p class="t-body prose r-say">“${tx(c.says[win ? "lose" : "win"])}”</p>
      ${win ? `<div class="chip is-butter r-stamp">${icon("star")}<span>${T(`New stamp: ${name} at ${tx(g.name)}.`, `새 도장: ${tx(g.name)}에서 ${name}를 이겼어요.`)}</span></div>` : ""}
      <ul class="r-lines"><li class="t-subhead prose">${win ? T(`Pairs: you 5, ${name} 3.`, `짝: 나 5, ${name} 3.`) : T("Four in a row.", "네 개가 한 줄.")}</li><li class="t-subhead prose">${T(`${tx(c.prank.name)}: ${win ? 1 : 2} landed, ${win ? 0 : 1} booped.`, `${tx(c.prank.name)}: ${win ? 1 : 2}번 당함, ${win ? 0 : 1}번 막음.`)}</li><li class="t-subhead prose">${win ? T(`You caught ${name} off guard 2 times.`, `${name}의 빈틈을 2번 잡았어요.`) : T(`Weak spot: ${tx(c.slip.name)}. Not used this time.`, `약점: ${tx(c.slip.name)}. 이번엔 못 썼어요.`)}</li></ul>
      <div class="stack"><button class="button" data-cat="${c.id}" data-game="${g.id}" data-go="match">${T("Rematch", "한 판 더")}</button><button class="button is-quiet" data-game="${g.id}" data-go="game">${T("Another cat", "다른 고양이")}</button><button class="button is-plain" data-go="club">${T("Back to the club", "클럽하우스로")}</button></div>`;
  }
  function renderFlip() {
    const rows = ["......", ".wbb..", ".wwbb.", ".bwwb.", "..bw..", "......"];
    $("[data-flip]").innerHTML = rows.join("").split("").map(ch => `<i class="fl-cell">${ch === "." ? "" : `<b class="fl-disc ${ch === "w" ? "is-white" : "is-black"}"></b>`}</i>`).join("");
  }

  // ---- Navigation ----
  const PLAY = { "play-pairnap": ["pairnap", "tofu"], "play-basket": ["basket", "mango"], "play-climb": ["climb", "mint"], "play-pawdrop": ["pawdrop", "plum"], "play-boxes": ["boxes", "ollie"], "play-teeter": ["teeter", "button"] };
  window.PROTO_RESOLVE = id => {
    if (id === "game") return gameOpen(GAME[S.game]) ? "game" : "game-locked";
    if (id === "cat") return catOpen(CAT[S.cat]) ? "cat" : "cat-locked";
    if (id === "intro" || id === "match") { const g = GAME[S.game], c = CAT[S.cat]; if (!gameOpen(g) || !catOpen(c)) return "plus"; if (!g.live) return "m-" + g.id; }
    return id;
  };
  document.addEventListener("click", e => {
    const set = e.target.closest("[data-cat], [data-game]");
    if (set && !e.target.closest("[data-keep-cat]")) { if (set.dataset.cat) S.cat = set.dataset.cat; if (set.dataset.game) S.game = set.dataset.game; }
    const p = e.target.closest("[data-pick]");
    if (p) { const k = CAT[p.dataset.pick]; if (!catOpen(k)) { S.cat = k.id; PROTO.go("cat"); } else { S.cat = k.id; renderGame($('[data-screen="game"]')); } }
    const tg = e.target.closest("[data-two-game]"); if (tg) for (const b of $$("[data-two-game]")) b.setAttribute("aria-pressed", b === tg);
    const tc = e.target.closest("[data-two-cat]"); if (tc && !tc.classList.contains("is-locked")) for (const b of $$("[data-two-cat]")) b.classList.toggle("is-on", b === tc);
    const sw = e.target.closest(".switch"); if (sw) sw.setAttribute("aria-checked", sw.getAttribute("aria-checked") !== "true");
    const d = e.target.closest("[data-do]");
    if (d) {
      if (d.dataset.do === "plus-toggle") { S.plus = !S.plus; renderClub(); }
      if (d.dataset.do === "plus-on") S.plus = true;
      if (d.dataset.do === "rematch") Match.start({ game: S.game, cat: S.cat });
    }
  }, true);
  document.addEventListener("proto:go", e => {
    const { from, to, jump } = e.detail;
    if (PLAY[to]) { [S.game, S.cat] = PLAY[to]; S.forced = true; setTimeout(() => PROTO.go("match", true, true), 0); return; }
    if (from === "match" && to !== "match" && to !== "pause") Match.stop();
    if (to === "pause" && Match.current) { Match.pause(true); $("[data-pause-img]").src = `img/cat-${Match.current.cat.id}-think.webp`; }
    if (to === "match") {
      const m = Match.current;
      if (m && from === "pause" && !m.over) Match.pause(false);
      else { if (jump && !S.forced && !from) { S.game = "pairnap"; S.cat = "tofu"; } S.forced = false; Match.start({ game: GAME[S.game].live ? S.game : "pairnap", cat: S.cat }); }
    }
    if (jump) {   // a jump from the Screens panel opens each preset in its own state
      if (to === "cat") S.cat = "tofu"; if (to === "cat-new") S.cat = "jelly"; if (to === "cat-locked") S.cat = "plum";
      if (to === "game") { if (!gameOpen(GAME[S.game])) S.game = "basket"; } if (to === "game-locked") S.game = "billiards";
    }
    if (to === "lesson") { const first = from === "meet"; $("[data-lesson-first]").hidden = !first; $("[data-lesson-back]").hidden = first; }
    if (to === "meet") renderMeet();
    if (to === "club" || to === "welcome") { renderClub(); }
    if (to === "game") renderGame($('[data-screen="game"]'));
    if (to === "game-locked") renderGame($('[data-screen="game-locked"]'), true);
    if (to === "intro") renderIntro();
    if (to === "cats") renderCats();
    if (to === "cat") renderCat($('[data-screen="cat"]'));
    if (to === "cat-new") renderCat($('[data-screen="cat-new"]'), "open");
    if (to === "cat-locked") renderCat($('[data-screen="cat-locked"]'), "locked");
    if (to === "me") renderMe();
    if (to === "me-new") renderMe(true);
    if (to === "two") renderTwo();
    if (to === "plus-open") { S.plus = true; window.Sound && Sound.cue("open"); }
  });

  window.ROOMS = $$("[data-room]").map(el => new Room(el));
  tabs(); renderLineups(); renderFlip(); renderMeet();
  for (const el of $$("[data-result-sample]")) { resultSample(el, el.dataset.resultSample); el.parentElement.dataset.mood = el.dataset.resultSample === "win" ? "you" : "cat"; }
  // A cat on its own page or on the intro answers a tap: a happy face and its voice.
  document.addEventListener("click", e => {
    const hero = e.target.closest(".cat-hero"); if (!hero) return;
    const img = $("img", hero), m = /cat-(\w+)-(\w+)\.webp/.exec(img.getAttribute("src")); if (!m || hero.dataset.busy) return;
    hero.dataset.busy = "1"; const was = img.getAttribute("src"); img.src = `img/cat-${m[1]}-${m[2] === "glad" ? "win" : "glad"}.webp`; hero.classList.add("is-tapped"); window.Sound && Sound.cat(m[1]);
    setTimeout(() => { img.src = was; hero.classList.remove("is-tapped"); delete hero.dataset.busy; }, 1100);
  });
  const sw = $("[data-sound-switch]"); if (sw) { sw.setAttribute("aria-checked", String(Sound.on)); sw.addEventListener("click", () => setTimeout(() => Sound.set(sw.getAttribute("aria-checked") === "true"), 0)); }

  // The language button in the Screens panel.
  addEventListener("load", () => {
    const panel = $("[data-review]"); if (!panel) return;
    const b = h("button", "toggle", LANG === "ko" ? "English" : "한국어"); b.style.marginBottom = "8px";
    b.addEventListener("click", () => { const p = new URLSearchParams(location.search); LANG === "ko" ? p.delete("lang") : p.set("lang", "ko"); location.search = p.toString(); });
    panel.insertBefore(b, panel.lastElementChild);
  });
})();
