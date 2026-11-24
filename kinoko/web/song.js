/* テーマソングの視聴欄（data/song.json の src が空なら出さない） */
(function () {
  "use strict";
  var $ = function (s) { return document.getElementById(s); };
  var sec = $("song"); if (!sec) return;
  var au = $("songAudio"), btn = $("songPlay");
  function fmt(t) { t = Math.max(0, t | 0); return (t / 60 | 0) + ":" + String(t % 60).padStart(2, "0"); }

  fetch("data/song.json?t=" + Date.now(), { cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (s) {
      if (!s || !s.src) return;
      $("songTitle").textContent = s.title || "テーマソング";
      $("songCredit").textContent = s.credit || "";
      if (s.cover) { $("songCover").src = s.cover; $("songCover").alt = s.title || ""; }
      else $("songCover").hidden = true;
      if (s.lyrics) { $("songLyrics").textContent = s.lyrics; $("songLyrBtn").hidden = false; }
      au.src = s.src;
      sec.hidden = false;
    }).catch(function () {});

  btn.addEventListener("click", function () {
    if (au.paused) { au.play().catch(function () {}); } else { au.pause(); }
  });
  au.addEventListener("play",  function () { btn.textContent = "❚❚"; btn.setAttribute("aria-label", "一時停止"); });
  au.addEventListener("pause", function () { btn.textContent = "▶";  btn.setAttribute("aria-label", "再生"); });
  au.addEventListener("ended", function () { au.currentTime = 0; });
  au.addEventListener("timeupdate", function () {
    var d = au.duration || 0;
    $("songFill").style.width = d ? (au.currentTime / d * 100) + "%" : "0";
    $("songTime").textContent = fmt(au.currentTime) + (d ? " / " + fmt(d) : "");
  });
  $("songBar").addEventListener("click", function (e) {
    if (!au.duration) return;
    var r = this.getBoundingClientRect();
    au.currentTime = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * au.duration;
  });
  $("songLyrBtn").addEventListener("click", function () {
    var l = $("songLyrics"); l.hidden = !l.hidden;
    this.textContent = l.hidden ? "歌詞を見る" : "歌詞をとじる";
  });
})();
