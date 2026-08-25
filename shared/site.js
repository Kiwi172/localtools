/* localtools — telemetry strip, footer, and network watchdog.
 *
 * Loaded first, before any tool code, so the network patches are in place
 * before anything could possibly make a request.
 *
 * EDIT THIS ONE LINE to change the donation address everywhere:
 */
var MONERO_ADDRESS = "YOUR_MONERO_SUBADDRESS_HERE";
var SOURCE_URL     = "https://github.com/YOUR_USERNAME/localtools";

(function () {
  "use strict";

  /* ---- watchdog ------------------------------------------------------- */
  /* Counts anything that tries to leave the machine. The strip reports the
     real number; it is not a decorative badge. */

  var outbound = 0;
  var log = [];
  var listeners = [];

  function record(kind, url) {
    outbound++;
    log.push(kind + " " + url);
    paint();
    listeners.forEach(function (fn) { fn(outbound); });
  }

  var origin = location.origin;
  function isLocal(url) {
    try {
      var u = new URL(url, location.href);
      return u.origin === origin || u.protocol === "blob:" ||
             u.protocol === "data:" || u.protocol === "file:";
    } catch (e) { return false; }
  }

  var nativeFetch = window.fetch;
  if (nativeFetch) {
    window.fetch = function (input) {
      var url = (input && input.url) || String(input);
      if (!isLocal(url)) record("fetch", url);
      return nativeFetch.apply(this, arguments);
    };
  }

  var xhrOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url) {
    if (!isLocal(url)) record("xhr", url);
    return xhrOpen.apply(this, arguments);
  };

  if (navigator.sendBeacon) {
    var beacon = navigator.sendBeacon.bind(navigator);
    navigator.sendBeacon = function (url) {
      if (!isLocal(url)) record("beacon", url);
      return beacon.apply(null, arguments);
    };
  }

  var NativeWS = window.WebSocket;
  if (NativeWS) {
    window.WebSocket = function (url) {
      record("websocket", url);
      return new NativeWS(url, arguments[1]);
    };
    window.WebSocket.prototype = NativeWS.prototype;
  }

  /* Catches subresources too: a stray font, image, or script from a CDN. */
  if (window.PerformanceObserver) {
    try {
      new PerformanceObserver(function (list) {
        list.getEntries().forEach(function (e) {
          if (!isLocal(e.name)) record("resource", e.name);
        });
      }).observe({ type: "resource", buffered: true });
    } catch (e) { /* older browser: the API patches above still hold */ }
  }

  /* ---- tools ---------------------------------------------------------- */

  var TOOLS = [
    { id: "scrub", name: "Scrub",  job: "Strip metadata and burn out regions of an image" },
    { id: "qr",    name: "QR",     job: "Build QR codes for links, WiFi, contacts, payments" },
    { id: "regex", name: "Regex",  job: "Test a pattern and read it back in English" },
    { id: "cron",  name: "Cron",   job: "Read a cron line and see when it actually fires" },
    { id: "gpx",   name: "GPX",    job: "Inspect a GPS track and trim its endpoints" }
  ];

  /* ---- strip ---------------------------------------------------------- */

  var strip, counter;

  function paint() {
    if (!counter) return;
    counter.innerHTML = "Net <b>" + outbound + "</b>";
    if (outbound > 0) {
      strip.classList.add("breach");
      counter.title = log.join("\n");
    }
  }

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function build() {
    var here = document.body.getAttribute("data-tool") || "";
    var depth = here ? "../" : "";

    strip = el("div"); strip.id = "telemetry";

    var home = el("a", "home", "localtools");
    home.href = depth || "./";
    strip.appendChild(home);

    if (here) {
      var t = TOOLS.filter(function (x) { return x.id === here; })[0];
      strip.appendChild(el("span", null, "/ <b>" + (t ? t.name.toLowerCase() : here) + "</b>"));
    }

    counter = el("span", null, "");
    strip.appendChild(counter);
    strip.appendChild(el("span", null, "Runs <b>offline</b>"));

    var sp = el("span", "spacer");
    strip.appendChild(sp);

    var status = el("span", "status", "");
    status.id = "tool-status";
    strip.appendChild(status);

    document.body.insertBefore(strip, document.body.firstChild);
    paint();
  }

  /* ---- footer --------------------------------------------------------- */

  function buildFooter() {
    var f = el("div", "footer");
    var here = document.body.getAttribute("data-tool") || "";
    var depth = here ? "../" : "";

    f.appendChild(el("span", null,
      "Everything here runs in your browser. Nothing is uploaded."));

    var src = el("a", null, "Source");
    src.href = SOURCE_URL;
    src.rel = "noopener";
    f.appendChild(src);

    var sp = el("span", "spacer");
    f.appendChild(sp);

    if (MONERO_ADDRESS && MONERO_ADDRESS.indexOf("YOUR_MONERO") !== 0) {
      var give = el("span", null, "Optional: ");
      var a = el("a", null, "donate&nbsp;XMR");
      a.href = "monero:" + MONERO_ADDRESS + "?recipient_name=localtools";
      give.appendChild(a);
      f.appendChild(give);

      var addr = el("code", "xmr", MONERO_ADDRESS);
      addr.tabIndex = 0;
      addr.title = "Click to copy";
      addr.style.cursor = "pointer";
      function copy() {
        navigator.clipboard.writeText(MONERO_ADDRESS).then(function () {
          var old = addr.textContent;
          addr.textContent = "copied";
          setTimeout(function () { addr.textContent = old; }, 1200);
        });
      }
      addr.addEventListener("click", copy);
      addr.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); copy(); }
      });
      f.appendChild(addr);
    } else {
      f.appendChild(el("span", "warn",
        "Set MONERO_ADDRESS in shared/site.js to show a donation link."));
    }

    document.body.appendChild(f);
  }

  window.LT = {
    tools: TOOLS,
    net: function () { return outbound; },
    onNet: function (fn) { listeners.push(fn); fn(outbound); },
    status: function (text) {
      var s = document.getElementById("tool-status");
      if (s) s.innerHTML = text || "";
    },
    bytes: function (n) {
      if (n < 1024) return n + " B";
      if (n < 1048576) return (n / 1024).toFixed(1) + " KB";
      return (n / 1048576).toFixed(2) + " MB";
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { build(); buildFooter(); });
  } else { build(); buildFooter(); }
})();
