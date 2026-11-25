// Cat Clubhouse, design round 1: the cast. English is the base language; Korean sits beside it.
// Traits are 1 to 5: nerve (how daring), smarts (how clever), focus (how steady), mischief (how naughty).
(() => {
  const params = new URLSearchParams(location.search);
  const LANG = params.get("lang") === "ko" ? "ko" : "en";
  window.LANG = LANG;
  window.T = (en, ko) => (LANG === "ko" ? ko : en);
  const L = (en, ko) => ({ en, ko });

  window.TRAITS = [
    { id: "nerve", name: L("Nerve", "배짱"), low: L("careful", "신중"), mid: L("even", "보통"), high: L("daring", "대담") },
    { id: "smarts", name: L("Smarts", "두뇌"), low: L("simple", "단순"), mid: L("sensible", "무난"), high: L("clever", "영리") },
    { id: "focus", name: L("Focus", "집중"), low: L("dreamy", "딴생각"), mid: L("calm", "차분"), high: L("steady", "끈기") },
    { id: "mischief", name: L("Mischief", "장난"), low: L("polite", "얌전"), mid: L("playful", "장난기"), high: L("naughty", "말썽") },
  ];

  window.CATS = [
    {
      id: "tofu", name: L("Tofu", "두부"), free: true, tint: "#f4efe6", edge: "#ddd2c2",
      about: L("A sleepy, kind cat who thinks every game is better lying down.", "어떤 게임이든 누워서 하면 더 좋다고 믿는, 졸리고 다정한 고양이."),
      style: L("Slow and safe. Easy to predict.", "느리고 안전하게. 수가 잘 읽혀요."),
      traits: [1, 2, 1, 1], pranks: 1,
      prank: { id: "loaf", name: L("Loaf", "식빵 굽기"), what: L("He flops onto part of your side and hides it.", "내 쪽에 털썩 드러누워서 일부를 가려요."), tell: L("His tail wraps round his paws and he yawns.", "꼬리로 발을 감싸고 하품해요.") },
      slip: { hint: L("He gets sleepy when nothing happens.", "아무 일도 없으면 졸려 해요."), name: L("Dozes off", "꾸벅꾸벅"), what: L("Take your time. He falls asleep and plays the first thing he sees.", "서두르지 마세요. 깜빡 잠들어서 처음 보이는 대로 해요."), tell: L("A slow blink.", "눈을 천천히 깜빡여요.") },
      says: {
        hi: L("Oh, hi... I saved you the warm spot.", "어, 왔어... 따뜻한 자리 맡아놨어."),
        win: L("I won? Mm. Wake me for the next one.", "내가 이겼어? 음... 다음 판 하면 깨워 줘."),
        lose: L("Good game. I'm going to lie down about it.", "좋은 게임이었어... 난 좀 누워야겠다."),
        prank: L("Just resting here...", "여기 좀 누울게..."), booped: L("Mm. Not the nose.", "음... 코는 안 돼..."), slip: L("Zzz...", "쿨쿨..."),
      },
      keepsake: L("Tofu's pillow", "두부의 베개"),
    },
    {
      id: "mint", name: L("Mint", "민트"), free: true, tint: "#dff2e4", edge: "#a9d6b5",
      about: L("A cheerful gift-giver who wants both of you to have fun.", "둘 다 즐거웠으면 하는, 선물 주기를 좋아하는 명랑한 고양이."),
      style: L("Steady and fair. Takes the easy move.", "꾸준하고 정직하게. 쉬운 수를 골라요."),
      traits: [3, 2, 3, 2], pranks: 2,
      prank: { id: "gift", name: L("Gift", "깜짝 선물"), what: L("She drops a little present on your side. Flick it away.", "내 쪽에 작은 선물을 두고 가요. 튕겨서 치우세요."), tell: L("She trots in with something in her mouth.", "뭔가를 입에 물고 종종걸음으로 와요.") },
      slip: { hint: L("Keep an eye on the window.", "창문 쪽을 지켜보세요."), name: L("The bird", "창가의 새"), what: L("When the bird lands at the window she stares at it and plays without looking.", "창가에 새가 앉으면 새만 쳐다보느라 보지도 않고 해요."), tell: L("Her head turns to the window.", "고개가 창문 쪽으로 돌아가요.") },
      says: {
        hi: L("I brought you something! It's a leaf.", "선물 가져왔어! 나뭇잎이야."),
        win: L("Yay! Here, you can have the leaf back.", "야호! 자, 나뭇잎은 돌려줄게."),
        lose: L("You're so good! You can keep the sock.", "너 진짜 잘한다! 양말은 너 가져."),
        prank: L("This is for you!", "이거 너 줄게!"), booped: L("Oh! I hadn't wrapped it yet.", "아, 아직 포장도 안 했는데!"), slip: L("Oh, a bird...", "어, 새다..."),
      },
      keepsake: L("Mint's flower", "민트의 꽃"),
    },
    {
      id: "mango", name: L("Mango", "망고"), free: true, tint: "#fde3cc", edge: "#f0b98d",
      about: L("A fearless kitten who wants to win fast and then win again.", "빨리 이기고 또 이기고 싶은, 겁 없는 아기 고양이."),
      style: L("Fast and wild. Big risks, big mistakes.", "빠르고 거칠게. 크게 걸고 크게 실수해요."),
      traits: [5, 2, 2, 2], pranks: 2,
      prank: { id: "pounce", name: L("Pounce", "덮치기"), what: L("He jumps on whatever you are moving.", "내가 움직이고 있는 걸 덮쳐요."), tell: L("He crouches and wiggles. His eyes show the target.", "몸을 낮추고 엉덩이를 씰룩여요. 눈길을 보면 어디로 뛸지 보여요.") },
      slip: { hint: L("He cannot leave a ball alone.", "공만 보면 못 참아요."), name: L("Anything that rolls", "굴러가는 것"), what: L("Something rolling near him pulls him away from the game.", "근처에서 뭔가 굴러가면 게임을 잊고 쫓아가요."), tell: L("His ears swing toward the sound.", "귀가 소리 나는 쪽으로 돌아가요.") },
      says: {
        hi: L("Hi hi hi! Let's go! Go go!", "안녕안녕안녕! 하자! 얼른얼른!"),
        win: L("I'M THE FASTEST. Again!", "내가 제일 빨라! 한 판 더!"),
        lose: L("Rematch. Rematch! RE-match!", "다시 해. 다시 해! 다~시 해!"),
        prank: L("GOT IT!", "잡았다!"), booped: L("Eep!", "으앗!"), slip: L("It's rolling!", "앗, 굴러간다!"),
      },
      keepsake: L("Mango's bouncy ball", "망고의 탱탱볼"),
    },
    {
      id: "jelly", name: L("Jelly", "젤리"), free: false, tint: "#fde0e8", edge: "#f0a9bf",
      about: L("A cuddly cat who would rather snuggle than win, but likes winning too.", "이기는 것보다 안겨 있는 게 좋지만, 이기는 것도 좋아하는 애교쟁이 고양이."),
      style: L("Soft and sensible. Never guesses.", "순하고 차분하게. 함부로 찍지 않아요."),
      traits: [2, 3, 3, 3], pranks: 2,
      prank: { id: "knead", name: L("Knead", "꾹꾹이"), what: L("She kneads the table and things shift a little.", "탁자를 꾹꾹 눌러서 위에 있는 게 조금씩 밀려요."), tell: L("Her front paws paddle in the air and she purrs.", "허공에 앞발로 꾹꾹이를 하며 골골대요.") },
      slip: { hint: L("She loves being stroked.", "쓰다듬어 주는 걸 좋아해요."), name: L("Melts when petted", "쓰다듬으면 사르르"), what: L("Stroke her once and she goes soft for a turn.", "한 번 쓰다듬으면 한 차례 동안 흐물흐물해져요."), tell: L("She rolls to show her belly.", "벌러덩 누워 배를 보여요.") },
      says: {
        hi: L("Prrr. Sit close, it's cozier.", "골골... 가까이 앉아. 그래야 더 포근해."),
        win: L("I win! Hug?", "내가 이겼어! 안아 줄래?"),
        lose: L("Prrr... worth it. You're warm.", "골골... 져도 좋아. 넌 따뜻하니까."),
        prank: L("Knead, knead...", "꾹꾹, 꾹꾹..."), booped: L("Mew.", "냥..."), slip: L("There... right there...", "거기... 바로 거기..."),
      },
      keepsake: L("Jelly's blanket", "젤리의 담요"),
    },
    {
      id: "ollie", name: L("Ollie", "올리"), free: false, tint: "#dcecf8", edge: "#a9cbe6",
      about: L("A polite, nosy little genius who notices everything.", "뭐든 다 알아채는, 예의 바르고 참견 많은 꼬마 천재."),
      style: L("Careful thinker. Blocks first.", "신중한 두뇌파. 막는 게 먼저예요."),
      traits: [2, 4, 4, 3], pranks: 2,
      prank: { id: "stare", name: L("Stare", "빤히 보기"), what: L("He stares, and one thing you could see goes away for a while.", "빤히 쳐다보면, 보이던 것 하나가 잠시 가려져요."), tell: L("His pupils grow huge.", "눈동자가 동그랗게 커져요.") },
      slip: { hint: L("He cannot look away from a finger held in front of him.", "눈앞에 손가락이 있으면 눈을 못 떼요."), name: L("Follows your finger", "손가락 따라가기"), what: L("Hold a finger in front of his face. He watches it and loses his place.", "얼굴 앞에 손가락을 잠깐 대고 있으면, 그걸 보느라 하던 생각을 잊어요."), tell: L("His head tilts.", "고개를 갸웃해요.") },
      says: {
        hi: L("Hello. I have already noticed four things about you.", "안녕하세요. 벌써 네 가지를 알아챘습니다."),
        win: L("As I predicted. Mostly.", "예상대로군요. 대체로는요."),
        lose: L("I did not see that. And I see everything.", "그건 못 봤습니다. 저는 다 보는데 말이죠."),
        prank: L("One moment. I am looking.", "잠시만요. 지금 보는 중입니다."), booped: L("Excuse me. That is my nose.", "실례합니다. 그건 제 코입니다."), slip: L("Where is it going...", "어디로 가는 걸까요..."),
      },
      keepsake: L("Ollie's notebook", "올리의 수첩"),
    },
    {
      id: "button", name: L("Button", "단추"), free: false, tint: "#fdf3d3", edge: "#e6d291",
      about: L("A speedy, impatient cat who thinks every turn takes too long.", "차례마다 너무 오래 걸린다고 생각하는, 날쌔고 성질 급한 고양이."),
      style: L("Plays at once. Strong start, sloppy end.", "망설임 없이 바로 해요. 시작은 세고 끝은 엉성해요."),
      traits: [4, 3, 2, 4], pranks: 3,
      prank: { id: "taptap", name: L("Tap-tap", "타닥타닥"), what: L("She drums the table to hurry you. She never plays for you.", "탁자를 두드리며 재촉해요. 내 차례를 대신 하지는 않아요."), tell: L("One slow tap, then her paw hovers.", "앞발로 천천히 한 번 탁 치고, 그대로 들고 있어요.") },
      slip: { hint: L("She likes a warm spot.", "따뜻한 자리를 좋아해요."), name: L("The sunbeam", "햇살"), what: L("When the sunbeam reaches her she sits in it and stops caring.", "햇살이 닿으면 그 자리에 앉아서 대충 해요."), tell: L("Her eyes half close.", "눈이 반쯤 감겨요.") },
      says: {
        hi: L("Ready? Ready. Go. Your turn. Go!", "준비됐어? 됐지. 시작. 네 차례. 어서!"),
        win: L("Done! Done! Faster next time!", "끝! 끝! 다음엔 더 빨리 해!"),
        lose: L("Okay okay okay. Again. Now?", "그래, 그래, 그래. 다시! 지금 해?"),
        prank: L("Tick tock. Hurry!", "째깍째깍. 빨리빨리!"), booped: L("Okay, okay!", "알았어, 알았어!"), slip: L("Warm...", "따뜻해..."),
      },
      keepsake: L("Button's bell", "단추의 방울"),
    },
    {
      id: "sumi", name: L("Sumi", "수미"), free: false, tint: "#e6e3ea", edge: "#b9b3c4",
      about: L("A cool night cat who likes it quiet and plays sharp.", "조용한 걸 좋아하고 날카롭게 게임하는, 쿨한 밤 고양이."),
      style: L("Bold and good. Sets traps.", "대담하고 노련해요. 함정을 파요."),
      traits: [4, 4, 3, 3], pranks: 2,
      prank: { id: "lights", name: L("Lights Out", "불 끄기"), what: L("She taps the lamp. The room goes dark except a circle round your finger.", "전등을 탁 꺼요. 내 손가락 주변만 빼고 깜깜해져요."), tell: L("Her eyes glow and her paw reaches for the lamp.", "눈이 반짝이고, 앞발을 전등 쪽으로 뻗어요.") },
      slip: { hint: L("Something comes to the lamp when it is lit.", "전등이 켜지면 뭔가 날아와요."), name: L("The moth", "나방"), what: L("When the lamp comes back on a moth comes too, and she hunts it.", "불이 다시 켜지면 나방도 날아와요. 그러면 나방 사냥에 정신이 팔려요."), tell: L("One ear turns to the lamp.", "한쪽 귀가 전등 쪽으로 돌아가요.") },
      says: {
        hi: L("Evening.", "왔네."),
        win: L("Nice and quiet. Just how I like it.", "조용해서 좋네. 딱 내 취향."),
        lose: L("Hm. You're good in the dark.", "흠. 어둠 속에서도 잘하네."),
        prank: L("Lights out.", "불 끈다."), booped: L("...Hmph.", "...흥."), slip: L("That moth.", "저 나방."),
      },
      keepsake: L("Sumi's night lamp", "수미의 수면등"),
    },
    {
      id: "plum", name: L("Plum", "자두"), free: false, tint: "#ebe3f3", edge: "#c3b0d8",
      about: L("A proper old champion who is strict but secretly delighted by a good opponent.", "엄격하지만 좋은 상대를 만나면 속으로 반가워하는, 점잖은 왕년의 챔피언."),
      style: L("The best in the club. Patient and exact.", "클럽 최고수. 참을성 있고 정확해요."),
      traits: [2, 5, 5, 2], pranks: 2,
      prank: { id: "pawdown", name: L("Paw Down", "앞발 꾹"), what: L("She puts her paw on one of your choices. It is held for a turn.", "내 선택지 하나에 앞발을 올려요. 한 차례 동안 못 써요."), tell: L("Her paw lifts and hovers over the spot.", "앞발을 들고 한 곳 위에서 멈칫해요.") },
      slip: { hint: L("She is proud of a good move.", "잘하고 나면 뿌듯해해요."), name: L("Grooms after a good move", "잘하면 세수"), what: L("After a good move she washes her face and plays the next one plainly.", "잘한 다음에는 세수하느라 그다음은 대충 해요."), tell: L("She licks her lips.", "입맛을 다셔요.") },
      says: {
        hi: L("Ah. A challenger. Do sit up straight.", "오, 도전자로구나. 허리 펴고 앉으렴."),
        win: L("Splendid. Do try again, dear.", "훌륭하구나. 또 도전하렴, 얘야."),
        lose: L("Well! I shall need to wash my face about this.", "이런! 세수라도 해야겠구나."),
        prank: L("Not that one, dear.", "그건 안 된단다, 얘야."), booped: L("I beg your pardon!", "어허, 버릇없이!"), slip: L("One moment. My whiskers.", "잠깐만. 수염이 흐트러졌구나."),
      },
      keepsake: L("Plum's rosette", "자두의 리본 훈장"),
    },
  ];
  window.CAT = Object.fromEntries(window.CATS.map(c => [c.id, c]));
  window.tx = v => (v && typeof v === "object" && "en" in v ? v[LANG] : v);
})();
