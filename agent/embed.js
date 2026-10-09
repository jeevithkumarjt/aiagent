/**
 * Sensiple AI Agent â€” floating chat widget for sensiple.com.
 *
 * Drop-in snippet for any site (WordPress in this case):
 *
 *     <script src="https://www.sensiple.com/agent/embed.js" defer></script>
 *
 * Everything this script draws lives inside a shadow root, so the host theme cannot restyle it and
 * our rules cannot leak onto the host page â€” a WordPress theme with aggressive `button { ... }`
 * selectors is the normal reason embed widgets rot.
 *
 * The chat itself is the Next app loaded in an iframe pointing at /agent/embed. That is what keeps
 * the credentials and the session storage in our origin instead of handing them to whatever page
 * loaded us, and it is why this file has no React and no bundle: it is a launcher, a frame and a
 * close button.
 *
 * The style block below mirrors the tokens in frontend/app/globals.css. It has to: the app's
 * stylesheet only exists inside the iframe. If the design changes, change both.
 */
(function () {
  "use strict";

  /* The snippet may be included twice (a theme, a page builder, and a hand-edited footer all do
   * this). Load once; a second include just re-runs this guard. */
  if (window.__sensipleAgentWidget) return;

  var TAG = "sensiple-agent";

  /** Base URL of the agent app, e.g. https://www.sensiple.com/agent */
  function resolveBase() {
    var tag = document.currentScript;

    /* `data-base` lets the snippet be served from somewhere other than the app (a CDN, or a copy
     * pasted into a page) without guessing. */
    var explicit = tag && tag.getAttribute("data-base");
    if (explicit) return explicit.replace(/\/+$/, "");

    var url = tag && tag.src;

    /* `currentScript` is only set while a classic script executes. `defer`/`async` both keep it,
     * but a script injected after load does not â€” fall back to the last /embed.js we can find. */
    if (!url) {
      var all = document.getElementsByTagName("script");
      for (var i = all.length - 1; i >= 0; i--) {
        if (all[i].src && /\/embed\.js(?:[?#]|$)/.test(all[i].src)) {
          url = all[i].src;
          break;
        }
      }
    }

    if (!url) {
      console.warn(
        "[sensiple-agent] could not work out where embed.js was loaded from; " +
          "add data-base=\"https://www.sensiple.com/agent\" to the script tag."
      );
      return null;
    }

    return url.split("#")[0].split("?")[0].replace(/\/embed\.js$/, "");
  }

  var base = resolveBase();
  if (!base) return;

  /* ------------------------------------------------------------------ *
   * Style. Numbers are copied from globals.css, not re-derived.
   * ------------------------------------------------------------------ */
  var CSS = [
    /* The first thing Tailwind's preflight does for the app, and the first thing that does NOT
     * happen here: element selectors from the host document never cross a shadow boundary, so
     * without this reset every box below is content-box. That made the panel 402x602 instead of
     * the 400x600 the in-app panel renders as, and would have pushed the bottom edge 2px past
     * calc(100vh - 40px) on a short screen. */
    "*, *::before, *::after { box-sizing: border-box; }",

    ":host {",
    "  position: fixed;",
    "  inset: 0;",
    "  z-index: 2147483000;",
    /* The host spans the viewport so its fixed children resolve against a viewport-sized box.
     * A zero-size host would make `right: 20px` mean "20px left of x=0" and fling the panel
     * off the left edge of the screen. */
    "  pointer-events: none;",
    "  color-scheme: dark;",
    "  font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Roboto,",
    "    'Helvetica Neue', Arial, sans-serif;",
    "  -webkit-font-smoothing: antialiased;",
    "  -moz-osx-font-smoothing: grayscale;",
    "  text-rendering: optimizeLegibility;",
    "}",

    ".dock-chat {",
    "  position: fixed;",
    "  right: 20px;",
    "  bottom: 20px;",
    "  pointer-events: auto;",
    "}",
    /* `hidden` alone would rely on the UA sheet's [hidden] rule surviving this stylesheet's own
     * declarations for .dock-chat; say it outright rather than depend on which rule wins. */
    ".dock-chat[hidden] { display: none; }",

    ".launcher {",
    "  position: relative;",
    "  display: grid;",
    "  place-items: center;",
    "  width: 60px;",
    "  height: 60px;",
    "  padding: 0;",
    "  border: 1px solid rgba(255, 255, 255, 0.16);",
    "  border-radius: 999px;",
    "  background: rgba(12, 17, 32, 0.92);",
    "  -webkit-backdrop-filter: saturate(150%) blur(18px);",
    "  backdrop-filter: saturate(150%) blur(18px);",
    "  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.55);",
    "  color: #eef1f8;",
    "  cursor: pointer;",
    "  animation: launcher-drift 7s ease-in-out infinite;",
    "  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;",
    "}",

    "@keyframes launcher-drift {",
    "  0%, 100% { transform: translateY(0); }",
    "  50% { transform: translateY(-7px); }",
    "}",

    ".launcher__glow {",
    "  position: absolute;",
    "  inset: -6px;",
    "  border-radius: 999px;",
    "  background: radial-gradient(circle, rgba(110, 231, 211, 0.22), transparent 68%);",
    "  animation: launcher-pulse 3.6s ease-in-out infinite;",
    "  pointer-events: none;",
    "}",

    "@keyframes launcher-pulse {",
    "  0%, 100% { opacity: 0.45; transform: scale(0.94); }",
    "  50% { opacity: 1; transform: scale(1.06); }",
    "}",

    ".launcher__disc {",
    "  display: grid;",
    "  place-items: center;",
    "  width: 38px;",
    "  height: 38px;",
    "  border-radius: 999px;",
    "  background: rgba(255, 255, 255, 0.06);",
    "  transition: background 0.18s ease;",
    "}",

    "@media (hover: hover) {",
    "  .launcher:hover {",
    "    animation: none;",
    "    transform: translateY(-2px);",
    "    border-color: rgba(110, 231, 211, 0.4);",
    "    box-shadow: 0 18px 48px rgba(0, 0, 0, 0.6);",
    "  }",
    "  .launcher:hover .launcher__disc { background: rgba(110, 231, 211, 0.14); }",
    "}",
    "@media (pointer: coarse) { .launcher { animation: none; } }",

    ".launcher:focus-visible { outline: 2px solid #6ee7d3; outline-offset: 3px; }",

    ".panel {",
    "  position: fixed;",
    "  right: 20px;",
    "  bottom: 20px;",
    "  width: min(400px, calc(100vw - 40px));",
    "  height: min(600px, calc(100vh - 40px));",
    "  display: flex;",
    "  flex-direction: column;",
    "  overflow: hidden;",
    "  border: 1px solid rgba(255, 255, 255, 0.16);",
    "  border-radius: 20px;",
    "  background: #05070f;",
    "  box-shadow: 0 28px 80px rgba(0, 0, 0, 0.62);",
    "  animation: panel-in 0.26s cubic-bezier(0.22, 1, 0.36, 1) both;",
    "  pointer-events: auto;",
    "}",
    /* Not removable: closing sets `hidden` rather than taking the panel out of the tree, so the
     * iframe keeps its document and the next open is instant instead of a full reload of the
     * Next app. `hidden` alone would lose to `.panel { display: flex }` above — an author
     * declaration always beats the UA's [hidden] rule — so it has to be stated here. */
    ".panel[hidden] { display: none; }",

    "@keyframes panel-in {",
    "  from { opacity: 0; transform: translateY(14px) scale(0.97); }",
    "  to { opacity: 1; transform: none; }",
    "}",

    ".panel__close {",
    "  position: absolute;",
    "  top: 9px;",
    "  right: 9px;",
    "  z-index: 3;",
    "  display: grid;",
    "  place-items: center;",
    "  width: 26px;",
    "  height: 26px;",
    "  padding: 0;",
    "  border: 0;",
    "  border-radius: 999px;",
    "  background: rgba(255, 255, 255, 0.06);",
    /* globals.css asks for var(--ink-dim), which is never defined there, so in the real app this
     * resolves to the inherited body colour. This is that colour, not the name. */
    "  color: #eef1f8;",
    "  cursor: pointer;",
    "  transition: background 0.15s ease, color 0.15s ease;",
    "}",
    ".panel__close:hover { background: rgba(255, 255, 255, 0.14); }",
    ".panel__close:focus-visible { outline: 2px solid #6ee7d3; outline-offset: 2px; }",

    /* The frame paints our own background so a slow load shows the app's dark surface rather than
     * a white rectangle flashing inside a dark panel. */
    ".frame { flex: 1 1 auto; width: 100%; border: 0; background: #05070f; }",

    "@media (max-width: 640px) {",
    "  .dock-chat { right: 10px; bottom: 10px; }",
    "  .panel {",
    "    right: 10px;",
    "    bottom: 10px;",
    "    width: calc(100vw - 20px);",
    "    height: min(72vh, calc(100vh - 20px));",
    "  }",
    "}",
  ].join("\n");

  var CHAT_ICON =
    '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M20 11.5a7.5 7.5 0 0 1-10.9 6.7L4 20l1.8-4.9A7.5 7.5 0 1 1 20 11.5Z"/>' +
    '<path d="M9 10.5h6M9 13.5h4"/></svg>';

  var CLOSE_ICON =
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M6 6l12 12M18 6L6 18"/></svg>';

  /* ------------------------------------------------------------------ *
   * DOM
   * ------------------------------------------------------------------ */
  var host = document.createElement("div");
  host.setAttribute("data-" + TAG, "");
  var shadow = host.attachShadow({ mode: "open" });

  var style = document.createElement("style");
  style.textContent = CSS;
  shadow.appendChild(style);

  var dock = document.createElement("div");
  dock.className = "dock-chat";

  var launcher = document.createElement("button");
  launcher.type = "button";
  launcher.className = "launcher";
  launcher.setAttribute("aria-label", "Chat with the Sensiple assistant");
  launcher.setAttribute("title", "Chat with Sensiple");
  launcher.innerHTML =
    '<span class="launcher__glow" aria-hidden="true"></span><span class="launcher__disc">' + CHAT_ICON + "</span>";

  var panel = null;
  var frame = null;
  var closeBtn = null;
  var open = false;

  dock.appendChild(launcher);
  shadow.appendChild(dock);

  /* Inserting into documentElement rather than body: this runs from a deferred script, but a page
   * builder may inject it later, and <html> is always there. */
  (document.body || document.documentElement).appendChild(host);

  /**
   * Build the panel on first open, not on load. A marketing page should not pull down the whole
   * Next bundle for a button most visitors never press â€” and the first click is the only moment the
   * cost is visible, when a short wait reads as "it is loading" rather than "it is broken".
   */
  function ensurePanel() {
    if (panel) return;

    panel = document.createElement("div");
    panel.className = "panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Chat with the Sensiple assistant");

    closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "panel__close";
    closeBtn.title = "Close chat";
    closeBtn.setAttribute("aria-label", "Close chat");
    closeBtn.innerHTML = CLOSE_ICON;
    closeBtn.addEventListener("click", function () {
      close();
    });

    frame = document.createElement("iframe");
    frame.className = "frame";
    frame.title = "Sensiple assistant";
    frame.src = base + "/embed";

    panel.appendChild(closeBtn);
    panel.appendChild(frame);
    shadow.appendChild(panel);
  }

  function setOpen(next) {
    if (open === next) return;
    open = next;

    if (open) {
      ensurePanel();
      /* Match ChatLauncher: the launcher is hidden while the panel is up, so it can never be
       * clicked through or left stranded behind the panel. */
      panel.hidden = false;
      dock.hidden = true;
      closeBtn.focus();
      window.addEventListener("keydown", onKey, true);
      document.addEventListener("pointerdown", onDown, true);
      window.addEventListener("message", onMessage);
    } else {
      /* Hidden, not removed — see the note on .panel[hidden]. */
      panel.hidden = true;
      dock.hidden = false;
      window.removeEventListener("keydown", onKey, true);
      document.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("message", onMessage);
      launcher.focus();
    }
  }

  function close() {
    setOpen(false);
  }

  function onKey(e) {
    if (e.key === "Escape") close();
  }

  /**
   * Dismiss on a click outside the panel.
   *
   * `event.target` is useless here: with an open shadow root the browser retargets it to the host
   * element, so every click on anything in this widget looks like a click on the host, and the
   * host covers the whole viewport. `composedPath()` is the only view that still lists the real
   * nodes.
   */
  function onDown(e) {
    var path = e.composedPath ? e.composedPath() : [];
    if (path.indexOf(panel) !== -1 || path.indexOf(dock) !== -1) return;
    close();
  }

  /**
   * Escape pressed while focus is inside the iframe never reaches us â€” keyboard events do not
   * cross a frame boundary. The embed page listens and posts back; without this, a keyboard user
   * has to tab all the way out of the chat before they can dismiss it.
   */
  function onMessage(e) {
    if (e.origin !== new URL(base, location.href).origin) return;
    if (e.data && e.data.type === TAG + ":escape") close();
  }

  launcher.addEventListener("click", function () {
    setOpen(true);
  });

  window.__sensipleAgentWidget = {
    base: base,
    open: function () {
      setOpen(true);
    },
    close: close,
    /* Nothing can reload the host page without re-running this script, so this only exists for
     * pages that swap document contents without a navigation (a builder, a SPA shell). */
    destroy: function () {
      setOpen(false);
      if (host.parentNode) host.parentNode.removeChild(host);
      delete window.__sensipleAgentWidget;
    },
  };
})();
