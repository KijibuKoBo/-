/* テーマソングのページ（song.html）。data/song.json の曲を並べる */
(function () {
  "use strict";
  var $ = function (s) { return document.getElementById(s); };
  var sec = $("song"); if (!sec) return;
  var au = $("songAudio"), btn = $("songPlay");
  var cfg = null, tracks = [], cur = 0;
  function fmt(t) { t = Math.max(0, t | 0); return (t / 60 | 0) + ":" + String(t % 60).padStart(2, "0"); }

  fetch("data/song.json?t=" + Date.now(), { cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (s) {
      if (!s) { showEmpty(); return; }
      cfg = s;
      if (s.heading && $("songHead")) $("songHead").textContent = s.heading;
      if (s.background && $("songBg")) $("songBg").style.backgroundImage = 'url("' + s.background + '")';
      tracks = (s.tracks || (s.src ? [{ title: s.title, src: s.src, lyrics: s.lyrics }] : []))
                 .filter(function (t) { return t && t.src; });
      if (!tracks.length) { showEmpty(); return; }
      if (s.cover) { $("songCover").src = s.cover; $("songCover").alt = s.heading || s.title || ""; }
      else $("songCover").hidden = true;
      var ol = $("songList");
      tracks.forEach(function (t, i) {
        var li = document.createElement("li");
        var b = document.createElement("button");
        b.type = "button";
        var n = document.createElement("span"); n.className = "song__no"; n.textContent = trackNo(i);
        var nm = document.createElement("span"); nm.className = "song__nm"; nm.textContent = t.title || "";
        b.appendChild(n); b.appendChild(nm);
        b.addEventListener("click", function () { pick(i, true); });
        li.appendChild(b); ol.appendChild(li);
      });
      ol.hidden = tracks.length < 2;
      pick(0, false);
      sec.hidden = false;
    }).catch(showEmpty);

  function trackNo(i) { return "track" + String(i + 1).padStart(2, "0"); }

  function showEmpty() { if ($("songEmpty")) $("songEmpty").hidden = false; }

  function pick(i, play) {
    cur = i;
    var t = tracks[i];
    $("songTitle").textContent = t.title || ((cfg && cfg.heading) || "テーマソング");
    $("songCredit").textContent = trackNo(i);
    au.src = t.src;
    $("songFill").style.width = "0"; $("songTime").textContent = "0:00";
    var l = $("songLyrics"), lb = $("songLyrBtn");
    l.textContent = t.lyrics || ""; l.hidden = true;
    lb.hidden = !t.lyrics; lb.textContent = "歌詞を見る";
    [].forEach.call($("songList").children, function (li, k) { li.classList.toggle("is-on", k === i); });
    if (play) au.play().catch(function () {});
  }

  btn.addEventListener("click", function () {
    if (au.paused) { au.play().catch(function () {}); } else { au.pause(); }
  });
  au.addEventListener("play",  function () { btn.textContent = "❚❚"; btn.setAttribute("aria-label", "一時停止"); });
  au.addEventListener("pause", function () { btn.textContent = "▶";  btn.setAttribute("aria-label", "再生"); });
  au.addEventListener("ended", function () {
    if (cur + 1 < tracks.length) pick(cur + 1, true);     // 次の曲へ
    else { pick(0, false); }
  });
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
