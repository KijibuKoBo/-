/* =========================================================
   イワオトキノコ ― 訪問カウント と ランキング（共通）
   data/config.json の apiUrl が空のときは、何もしません。
   ========================================================= */
(function () {
  "use strict";

  var cfg = null;
  var ready = fetch("data/config.json", { cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (c) { cfg = c || {}; return cfg; })
    .catch(function () { cfg = {}; return cfg; });

  function url() { return (cfg && cfg.apiUrl) ? String(cfg.apiUrl) : ""; }
  function enabled() { return ready.then(function () { return !!url(); }); }

  /* --- 訪問を1つ数える（画像リクエストなので CORS の心配がない） --- */
  function hit(page) {
    return ready.then(function () {
      if (!url()) return;
      var isNew = "0";
      try {
        if (!localStorage.getItem("kinoko_seen")) {
          localStorage.setItem("kinoko_seen", "1");
          isNew = "1";
        }
      } catch (e) {}
      var src = url() + "?action=hit&p=" + encodeURIComponent(page) +
                "&n=" + isNew + "&t=" + Date.now();
      try { new Image().src = src; } catch (e) {}
    });
  }

  /* --- 上位5件を取る --- */
  function top(game) {
    return ready.then(function () {
      if (!url()) return null;
      return fetch(url() + "?action=ranking&g=" + encodeURIComponent(game) + "&t=" + Date.now())
        .then(function (r) { return r.json(); })
        .then(function (d) { return (d && d.ok) ? d.top : null; })
        .catch(function () { return null; });
    });
  }

  /* --- 名前とスコアを登録する --- */
  function submit(game, name, score) {
    return ready.then(function () {
      if (!url()) return null;
      return fetch(url(), {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },  // 事前確認(preflight)を避ける
        body: JSON.stringify({ action: "score", game: game, name: name, score: score })
      })
        .then(function (r) { return r.json(); })
        .catch(function () { return null; });
    });
  }

  /* --- 管理用 --- */
  function stats(key) {
    return ready.then(function () {
      if (!url()) return null;
      return fetch(url() + "?action=stats&key=" + encodeURIComponent(key) + "&t=" + Date.now())
        .then(function (r) { return r.json(); })
        .catch(function () { return null; });
    });
  }
  function remove(key, game, name, score) {
    return ready.then(function () {
      if (!url()) return null;
      return fetch(url(), {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "delete", key: key, game: game, name: name, score: score })
      })
        .then(function (r) { return r.json(); })
        .catch(function () { return null; });
    });
  }


  /* ---------------- ランキングの表示（共通UI） ---------------- */

  function esc(el, text) { el.textContent = String(text == null ? "" : text); return el; }

  function renderTop(ul, list, me) {
    ul.innerHTML = "";
    if (!list || !list.length) {
      var li = document.createElement("li");
      li.className = "rk__empty";
      li.textContent = "まだ誰も登録していません。いちばんのりになろう！";
      ul.appendChild(li);
      return;
    }
    list.forEach(function (r, i) {
      var li = document.createElement("li");
      li.className = "rk__row" + (me && r.name === me.name && r.score === me.score ? " is-me" : "");
      var no = document.createElement("span"); no.className = "rk__no"; no.textContent = (i + 1);
      var nm = document.createElement("span"); nm.className = "rk__name";
      nm.setAttribute("data-notr", "");         // 人の名前は翻訳しない
      esc(nm, r.name);                          // 名前は文字として入れる（HTMLにはしない）
      var sc = document.createElement("span"); sc.className = "rk__score"; sc.textContent = r.score;
      li.appendChild(no); li.appendChild(nm); li.appendChild(sc);
      ul.appendChild(li);
    });
  }

  /* 5位に入れるか？（5件未満なら誰でも入れる） */
  function qualifies(list, score) {
    if (!score || score <= 0) return false;
    if (!list || list.length < 5) return true;
    return score > list[4].score;
  }

  /*  els = { sec, list, form, name, msg }（それぞれ CSS セレクタ）
   *  ページを開いたときに show()、ゲームが終わったら offer(score) を呼ぶ。 */
  function board(game, els) {
    var q = function (k) { return document.querySelector(els[k]); };
    var sec = q("sec"), list = q("list"), form = q("form"),
        name = q("name"), msg = q("msg");
    var cache = null, sent = false;

    function show() {
      return enabled().then(function (on) {
        if (!on || !sec) return null;
        sec.hidden = false;
        return top(game).then(function (t) {
          cache = t || [];
          renderTop(list, cache);
          return cache;
        });
      });
    }

    function offer(score) {
      return enabled().then(function (on) {
        if (!on || !form) return;
        return top(game).then(function (t) {
          cache = t || [];
          renderTop(list, cache);
          sec.hidden = false;
          if (sent || !qualifies(cache, score)) { form.hidden = true; return; }
          form.hidden = false;
          if (msg) msg.textContent = "ベスト5に入りました！ 名前を残せます。";
          try { name.value = localStorage.getItem("kinoko_player") || ""; } catch (e) {}
          form.onsubmit = function (ev) {
            ev.preventDefault();
            if (sent) return;
            var n = (name.value || "").trim();
            try { localStorage.setItem("kinoko_player", n); } catch (e) {}
            if (msg) msg.textContent = "登録しています…";
            form.querySelector("button").disabled = true;
            submit(game, n, score).then(function (d) {
              form.querySelector("button").disabled = false;
              if (!d || !d.ok) { if (msg) msg.textContent = "うまく登録できませんでした。また試してね。"; return; }
              sent = true;
              cache = d.top || [];
              renderTop(list, cache, { name: (n || "ななし").slice(0, 12), score: score });
              form.hidden = true;
              if (msg) msg.textContent = d.rank ? (d.rank + "位に登録しました！") : "登録しました！";
            });
          };
        });
      });
    }

    function reset() { sent = false; if (form) form.hidden = true; if (msg) msg.textContent = ""; }

    return { show: show, offer: offer, reset: reset };
  }

  window.Kinoko = {
    ready: ready,
    enabled: enabled,
    hit: hit, top: top, submit: submit, stats: stats, remove: remove,
    board: board, renderTop: renderTop
  };

  /* 自動で1回数える（ページ名はファイル名から） */
  var page = (location.pathname.split("/").pop() || "index.html").replace(/\.html?$/, "") || "index";
  if (page !== "admin") hit(page);
})();
