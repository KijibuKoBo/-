/* =========================================================
   スマホの「長押しメニュー」「文字の選択」「勝手なジェスチャー」を止める。

   ゲームのページに <script src="notouch.js"></script> を1行入れるだけ。
   遊ぶところ（canvas と data-nt-area を付けた要素）だけタッチの
   既定動作を止める。ふつうのボタンには付けない —— touchend を止めると
   click が出なくなり、ボタンが反応しなくなるため。
   ========================================================= */
(function () {
  "use strict";

  var CSS = [
    /* 文字を選べないようにする（ゲーム中に選択が始まると操作が途切れる） */
    "body.nt, body.nt * {",
    "  -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none;",
    "  -webkit-touch-callout: none;",            /* iOS の長押しメニュー */
    "  -webkit-tap-highlight-color: transparent;",
    "}",
    /* 入力欄だけは、文字を選べないと困るので元に戻す */
    "body.nt input, body.nt textarea, body.nt [contenteditable] {",
    "  -webkit-user-select: text; user-select: text;",
    "}",
    /* ページ全体：ダブルタップの拡大と、押してから反応するまでの間を消す */
    "body.nt { touch-action: manipulation; }",
    /* 遊ぶところ：ブラウザのジェスチャーを完全に止める */
    "body.nt canvas, body.nt [data-nt-area] {",
    "  touch-action: none; outline: none; -webkit-user-drag: none;",
    "}"
  ].join("\n");

  function addCss() {
    if (document.getElementById("nt-css")) return;
    var st = document.createElement("style");
    st.id = "nt-css";
    st.textContent = CSS;
    (document.head || document.documentElement).appendChild(st);
  }

  var stop = function (e) { e.preventDefault(); };

  /* 遊ぶところだけ、タッチの既定動作を止める */
  function guard(el) {
    if (!el || el.__nt) return;
    el.__nt = true;
    ["touchstart", "touchmove", "touchend"].forEach(function (ev) {
      el.addEventListener(ev, stop, { passive: false });
    });
  }
  function scan() {
    var list = document.querySelectorAll("canvas, [data-nt-area]");
    for (var i = 0; i < list.length; i++) guard(list[i]);
  }

  function boot() {
    if (document.body) document.body.classList.add("nt");
    addCss();
    /* 長押しメニュー・選択・ドラッグを止める。click には影響しない */
    ["contextmenu", "selectstart", "dragstart"].forEach(function (ev) {
      document.addEventListener(ev, stop, false);
    });
    scan();
    /* あとから足された canvas にも効くように */
    if (window.MutationObserver) {
      new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
    }
    window.addEventListener("load", scan);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
