// Click-through shell for a mock. One HTML file holds every screen as
// <section class="screen" data-screen="id" data-title="Name">. Any element with
// data-go="id" opens that screen. The review panel lists every screen.
// ?screen=id opens one screen directly. ?review=0 hides the review panel (the checker uses this).
(() => {
  const screens = [...document.querySelectorAll("[data-screen]")];
  const ids = screens.map(s => s.dataset.screen);
  const params = new URLSearchParams(location.search);

  // A mock may resolve a target by its own state: window.PROTO_RESOLVE(id) returns the screen to open.
  // data-go="back" returns to the screen before this one (data-fallback names one when there is none).
  // data-note="text" shows a note from the mock itself, for a tap that leaves the app.
  const trail = [];
  let current = null;
  function go(id, push = true, jump = false, back = false) {
    if (window.PROTO_RESOLVE && !jump) id = window.PROTO_RESOLVE(id);   // a jump opens exactly the screen named
    if (!ids.includes(id)) id = ids[0];
    const from = current;
    if (from && from !== id && !back) trail.push(from);
    current = id;
    document.dispatchEvent(new CustomEvent("proto:go", { detail: { from, to: id, jump } }));
    for (const s of screens) s.classList.toggle("is-current", s.dataset.screen === id);
    for (const b of document.querySelectorAll("[data-jump]")) b.setAttribute("aria-current", b.dataset.jump === id ? "true" : "false");
    window.scrollTo(0, 0);
    if (push) {
      const next = new URLSearchParams(location.search);
      next.set("screen", id);
      history.pushState({ id }, "", `?${next}`);
    }
  }
  let noteTimer = 0;
  function note(text) {
    let el = document.querySelector("[data-proto-note]");
    if (!el) {
      el = document.createElement("div"); el.setAttribute("data-proto-note", "");
      el.style.cssText = "position:fixed;left:50%;top:calc(12px + env(safe-area-inset-top,0px));transform:translateX(-50%);z-index:98;width:max-content;max-width:calc(100% - 32px);padding:12px 16px;border-radius:16px;background:#4c3b3e;color:#fff;font:600 13px/18px -apple-system,system-ui,sans-serif;text-align:center;";
      document.body.appendChild(el);
    }
    el.textContent = text; el.hidden = false;
    clearTimeout(noteTimer); noteTimer = setTimeout(() => { el.hidden = true; }, 2600);
  }

  document.addEventListener("click", event => {
    const noted = event.target.closest("[data-note]");
    if (noted) note(noted.dataset.note);
    const target = event.target.closest("[data-go]");
    if (!target) return;
    event.preventDefault();
    if (target.dataset.go === "back") go(trail.pop() || target.dataset.fallback || ids[0], true, false, true);
    else go(target.dataset.go);
  });
  addEventListener("popstate", () => go(new URLSearchParams(location.search).get("screen"), false, true));

  if (params.get("review") !== "0") {
    const panel = document.createElement("div");
    panel.setAttribute("data-review", "");
    panel.innerHTML = `
      <style>
        [data-review] { position: fixed; right: 12px; bottom: calc(72px + env(safe-area-inset-bottom, 0px)); z-index: 99; font: 600 13px/18px -apple-system, system-ui, sans-serif; }
        [data-review] button { font: inherit; }
        [data-review] .toggle { display: block; margin-left: auto; min-width: 44px; height: 44px; padding: 0 12px; border-radius: 22px; border: 0; background: #4c3b3e; color: #fff; }
        [data-review] .jump { display: none; margin-bottom: 8px; padding: 8px; max-height: 60vh; overflow: auto; border-radius: 16px; background: #4c3b3e; }
        [data-review].is-open .jump { display: grid; gap: 4px; }
        [data-review] .jump button { min-height: 44px; padding: 0 12px; border: 0; border-radius: 10px; background: transparent; color: #fff; text-align: left; }
        [data-review] .jump button[aria-current="true"] { background: #f6bcd3; color: #4c3b3e; }
      </style>
      <div class="jump">${screens.map(s => `<button data-jump="${s.dataset.screen}">${s.dataset.title || s.dataset.screen}</button>`).join("")}</div>
      <button class="toggle" aria-label="Screens">Screens</button>`;
    document.body.appendChild(panel);
    panel.querySelector(".toggle").addEventListener("click", () => panel.classList.toggle("is-open"));
    panel.querySelector(".jump").addEventListener("click", event => {
      const b = event.target.closest("[data-jump]");
      if (b) { go(b.dataset.jump, true, true); panel.classList.remove("is-open"); }
    });
  }

  window.PROTO = { screens: ids, go };
  go(params.get("screen") || ids[0], false, true);
})();
