/* ============================================================
 * A1 THEME — Chế độ sáng/tối dùng chung cho index.html và toàn
 * bộ mockup trong ban-thiet-ke/. plain JS, không module, không framework.
 *
 * Cách hoạt động:
 *  1. Inject <style> bảng màu CSS variables (--a1-<token>) cho light (:root)
 *     và dark (html.dark). tailwind.config trong từng HTML tham chiếu
 *     "rgb(var(--a1-<token>) / <alpha-value>)" nên mọi utility token
 *     (bg-surface, text-primary, ring-primary/20 ...) tự đổi màu.
 *  2. Lưu lựa chọn trong localStorage("a1-theme-mode" = "light"|"dark");
 *     chưa lưu thì theo prefers-color-scheme và nghe hệ thống đổi.
 *  3. Đồng bộ html.dark, color-scheme, meta theme-color.
 *  4. Nút toggling: bind #btn-theme-toggle (hoặc [data-a1-theme-toggle]);
 *     trang không có nút (mockup) được tự chèn nút nổi.
 * window.__a1Theme = { get, set, toggle }
 * ============================================================ */
(function () {
  "use strict";

  var STORAGE_KEY = "a1-theme-mode";

  /* ——— Light: giữ nguyên 100% màu hiện hành của app ——— */
  var LIGHT = {
    "background": "248 249 255",
    "on-background": "11 28 48",
    "surface": "248 249 255",
    "surface-dim": "203 219 245",
    "surface-bright": "248 249 255",
    "surface-container-lowest": "255 255 255",
    "surface-container-low": "239 244 255",
    "surface-container": "229 238 255",
    "surface-container-high": "220 233 255",
    "surface-container-highest": "211 228 254",
    "surface-variant": "211 228 254",
    "surface-tint": "0 83 219",
    "on-surface": "11 28 48",
    "on-surface-variant": "67 70 85",
    "inverse-surface": "33 49 69",
    "inverse-on-surface": "234 241 255",
    "outline": "115 118 134",
    "outline-variant": "195 198 215",
    "primary": "0 74 198",
    "on-primary": "255 255 255",
    "primary-container": "37 99 235",
    "on-primary-container": "238 239 255",
    "primary-fixed": "219 225 255",
    "primary-fixed-dim": "180 197 255",
    "on-primary-fixed": "0 23 75",
    "on-primary-fixed-variant": "0 62 168",
    "secondary": "0 108 73",
    "on-secondary": "255 255 255",
    "secondary-container": "108 248 187",
    "on-secondary-container": "0 113 77",
    "secondary-fixed": "111 251 190",
    "secondary-fixed-dim": "78 222 163",
    "on-secondary-fixed": "0 33 19",
    "on-secondary-fixed-variant": "0 82 54",
    "tertiary": "173 0 51",
    "on-tertiary": "255 255 255",
    "tertiary-container": "210 35 72",
    "on-tertiary-container": "255 236 236",
    "tertiary-fixed": "255 218 219",
    "tertiary-fixed-dim": "255 178 183",
    "on-tertiary-fixed": "64 0 13",
    "on-tertiary-fixed-variant": "146 0 42",
    "error": "186 26 26",
    "on-error": "255 255 255",
    "error-container": "255 218 214",
    "on-error-container": "147 0 10",
    "inverse-primary": "180 197 255",
  };

  /* ——— Dark: bảng Material-3 navy-dark cùng họ màu ——— */
  var DARK = {
    "background": "13 20 32",
    "on-background": "221 228 240",
    "surface": "13 20 32",
    "surface-dim": "13 20 32",
    "surface-bright": "52 64 80",
    "surface-container-lowest": "8 15 26",
    "surface-container-low": "21 30 43",
    "surface-container": "25 35 50",
    "surface-container-high": "36 46 61",
    "surface-container-highest": "47 57 72",
    "surface-variant": "47 57 72",
    "surface-tint": "110 163 255",
    "on-surface": "221 228 240",
    "on-surface-variant": "192 197 209",
    "inverse-surface": "221 228 240",
    "inverse-on-surface": "28 38 52",
    "outline": "141 145 157",
    "outline-variant": "68 73 90",
    "primary": "159 192 255",
    "on-primary": "0 43 102",
    "primary-container": "0 62 168",
    "on-primary-container": "219 225 255",
    "primary-fixed": "219 225 255",
    "primary-fixed-dim": "159 192 255",
    "on-primary-fixed": "0 23 75",
    "on-primary-fixed-variant": "0 62 168",
    "secondary": "93 235 176",
    "on-secondary": "0 56 42",
    "secondary-container": "11 93 65",
    "on-secondary-container": "142 247 196",
    "secondary-fixed": "111 251 190",
    "secondary-fixed-dim": "78 222 163",
    "on-secondary-fixed": "0 33 19",
    "on-secondary-fixed-variant": "0 82 54",
    "tertiary": "255 178 184",
    "on-tertiary": "92 0 24",
    "tertiary-container": "138 15 47",
    "on-tertiary-container": "255 218 219",
    "tertiary-fixed": "255 218 219",
    "tertiary-fixed-dim": "255 178 183",
    "on-tertiary-fixed": "64 0 13",
    "on-tertiary-fixed-variant": "146 0 42",
    "error": "255 180 171",
    "on-error": "96 20 16",
    "error-container": "148 0 9",
    "on-error-container": "255 218 214",
    "inverse-primary": "0 62 168",
  };

  function varsBlock(tokens, selector, scheme) {
    var lines = [selector + "{color-scheme:" + scheme + ";"];
    Object.keys(tokens).forEach(function (k) {
      lines.push("--a1-" + k + ":" + tokens[k] + ";");
    });
    return lines.join("") + "}";
  }

  /* Override các lớp Tailwind palette thô (amber/emerald/...) + glass
   * chỉ trong dark; specificity 0-2-0 thắng class gốc mọi thứ tự. */
  var DARK_OVERRIDES = [
    "html.dark .glass-header{background:rgba(13,20,32,.88);border-bottom-color:rgba(148,163,184,.14)}",
    "html.dark .glass-nav{background:rgba(8,15,26,.92);border-top-color:rgba(148,163,184,.16)}",
    "html.dark .glass-floating{background:rgba(25,35,50,.95);border-color:rgba(148,163,184,.18);box-shadow:0 12px 36px rgba(0,0,0,.5)}",
    "html.dark .modal-scrim{background:rgba(3,7,13,.66)}",
    "html.dark .bg-white{background-color:rgb(var(--a1-surface-container))}",
    "html.dark .bg-amber-50{background-color:rgb(251 191 36 / .1)}",
    "html.dark .bg-amber-100{background-color:rgb(245 158 11 / .18)}",
    "html.dark .bg-amber-500\\/10{background-color:rgb(245 158 11 / .14)}",
    "html.dark .border-amber-200,html.dark .border-amber-300{border-color:rgb(245 158 11 / .35)}",
    "html.dark .text-amber-700{color:#fbbf24}",
    "html.dark .text-amber-800{color:#fcd34d}",
    "html.dark .text-amber-900{color:#fde68a}",
    "html.dark .bg-emerald-100{background-color:rgb(16 185 129 / .16)}",
    "html.dark .text-emerald-800{color:#6ee7b7}",
    "html.dark .bg-rose-100,html.dark .bg-red-100{background-color:rgb(244 63 94 / .16)}",
    "html.dark .text-rose-800,html.dark .text-red-800{color:#fca5a5}",
    "html.dark .bg-blue-100{background-color:rgb(59 130 246 / .18)}",
    "html.dark .text-blue-800{color:#93c5fd}",
    "html.dark .bg-slate-300{background-color:#334155}",
    "html.dark .text-slate-800{color:#cbd5e1}",
    "html.dark .border-slate-300,html.dark .border-gray-300{border-color:#4b5563}",
  ].join("");

  function injectStyles() {
    if (document.getElementById("a1-theme-palette")) return;
    var css =
      varsBlock(LIGHT, ":root", "light") +
      varsBlock(DARK, "html.dark", "dark") +
      DARK_OVERRIDES;
    var el = document.createElement("style");
    el.id = "a1-theme-palette";
    el.textContent = css;
    document.head.appendChild(el);
  }

  function readStored() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  function systemMode() {
    try {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    } catch (e) {
      return "light";
    }
  }

  function current() {
    var m = readStored();
    return m === "dark" || m === "light" ? m : systemMode();
  }

  function render(mode) {
    document.documentElement.classList.toggle("dark", mode === "dark");
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", mode === "dark" ? "#0d1420" : "#004ac6");
    document.querySelectorAll("[data-a1-theme-toggle], #btn-theme-toggle").forEach(function (btn) {
      var icon = btn.querySelector(".material-symbols-outlined");
      if (icon) icon.textContent = mode === "dark" ? "light_mode" : "dark_mode";
      btn.setAttribute("aria-pressed", mode === "dark" ? "true" : "false");
    });
  }

  function setTheme(mode) {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch (e) {}
    render(mode);
  }

  function toggle() {
    setTheme(current() === "dark" ? "light" : "dark");
  }

  window.__a1Theme = { get: current, set: setTheme, toggle: toggle };

  /* ——— Khởi động: chạy ngay khi <script> được đọc (đặt trong <head>) ——— */
  injectStyles();
  render(current());
  /* Nút #btn-theme-toggle nằm trong <body> → render() lúc ở head chưa thấy,
   * cần đồng bộ lại icon sau khi DOM có thật. */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      render(current());
    });
  }

  try {
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", function () {
        var m = readStored();
        if (m !== "dark" && m !== "light") render(systemMode());
      });
  } catch (e) {}

  document.addEventListener("click", function (e) {
    var btn = e.target && e.target.closest
      ? e.target.closest("[data-a1-theme-toggle], #btn-theme-toggle")
      : null;
    if (btn) toggle();
  });

  /* Mockup không có nút trên header → chèn một nút nổi góc phải, trên nav. */
  document.addEventListener("DOMContentLoaded", function () {
    if (document.getElementById("btn-theme-toggle")) return;
    if (!document.querySelector(".material-symbols-outlined") &&
        !document.querySelector('link[href*="Material+Symbols"]')) return;
    var btn = document.createElement("button");
    btn.id = "btn-theme-toggle";
    btn.type = "button";
    btn.title = "Chuyển chế độ sáng/tối";
    btn.setAttribute("aria-label", "Chuyển chế độ sáng/tối");
    btn.className =
      "fixed right-4 z-50 w-11 h-11 rounded-full glass-floating flex items-center justify-center text-primary active:scale-95 transition-transform";
    btn.style.bottom = "calc(env(safe-area-inset-bottom, 0px) + 5.25rem)";
    btn.innerHTML =
      '<span class="material-symbols-outlined text-[22px]">' +
      (current() === "dark" ? "light_mode" : "dark_mode") +
      "</span>";
    document.body.appendChild(btn);
  });
})();
