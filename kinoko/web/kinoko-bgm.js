/* =========================================================
   イワオトキノコ ― ゲーム音楽（音源ファイルなし・波形から合成）
   使い方:  BGM.attach("mori", "#bgmBtn")
   音は必ず「人が押したとき」から鳴りはじめます（スマホの決まりごと）。
   ========================================================= */
(function () {
  "use strict";

  var SONGS = {"mori":{"bpm":96,"beats":24,"parts":[["pad",[[0,3.0,50,0.9],[0,3.0,57,0.7],[3,3.0,57,0.9],[3,3.0,52,0.7],[6,3.0,59,0.9],[6,3.0,54,0.7],[9,3.0,55,0.9],[9,3.0,50,0.7],[12,3.0,50,0.9],[12,3.0,57,0.7],[15,3.0,59,0.9],[15,3.0,54,0.7],[18,3.0,55,0.9],[18,3.0,50,0.7],[21,3.0,57,0.9],[21,3.0,52,0.7]]],["bass",[[0,1.1,38,1.0],[3,1.1,45,1.0],[6,1.1,47,1.0],[9,1.1,43,1.0],[12,1.1,38,1.0],[15,1.1,47,1.0],[18,1.1,43,1.0],[21,1.1,45,1.0]]],["pluck",[[1,0.8,57,0.9],[1,0.8,66,0.7],[2,0.8,57,0.9],[2,0.8,66,0.7],[4,0.8,52,0.9],[4,0.8,61,0.7],[5,0.8,52,0.9],[5,0.8,61,0.7],[7,0.8,54,0.9],[7,0.8,62,0.7],[8,0.8,54,0.9],[8,0.8,62,0.7],[10,0.8,50,0.9],[10,0.8,59,0.7],[11,0.8,50,0.9],[11,0.8,59,0.7],[13,0.8,57,0.9],[13,0.8,66,0.7],[14,0.8,57,0.9],[14,0.8,66,0.7],[16,0.8,54,0.9],[16,0.8,62,0.7],[17,0.8,54,0.9],[17,0.8,62,0.7],[19,0.8,50,0.9],[19,0.8,59,0.7],[20,0.8,50,0.9],[20,0.8,59,0.7],[22,0.8,52,0.9],[22,0.8,61,0.7],[23,0.8,52,0.9],[23,0.8,61,0.7]]],["box",[[0,1,69,1.0],[1,1,71,1.0],[2,1,74,1.0],[3,1.5,71,1.0],[4.5,0.5,69,1.0],[5,1,66,1.0],[6,1,64,1.0],[7,1,66,1.0],[8,1,69,1.0],[9,3,66,1.0],[12,1,74,1.0],[13,1,71,1.0],[14,1,69,1.0],[15,1,66,1.0],[16,1,69,1.0],[17,1,71,1.0],[18,1,69,1.0],[19,1,67,1.0],[20,1,64,1.0],[21,3,62,1.0]]]]},"ponpon":{"bpm":116,"beats":32,"parts":[["pad",[[0,4.0,55,0.8],[4,4.0,52,0.8],[8,4.0,60,0.8],[12,4.0,62,0.8],[16,4.0,55,0.8],[20,4.0,52,0.8],[24,4.0,60,0.8],[28,4.0,62,0.8]]],["bass",[[0,1.4,43,1.0],[2,1.4,43,1.0],[3,0.7,50,0.7],[4,1.4,40,1.0],[6,1.4,40,1.0],[7,0.7,47,0.7],[8,1.4,48,1.0],[10,1.4,48,1.0],[11,0.7,55,0.7],[12,1.4,50,1.0],[14,1.4,50,1.0],[15,0.7,57,0.7],[16,1.4,43,1.0],[18,1.4,43,1.0],[19,0.7,50,0.7],[20,1.4,40,1.0],[22,1.4,40,1.0],[23,0.7,47,0.7],[24,1.4,48,1.0],[26,1.4,48,1.0],[27,0.7,55,0.7],[28,1.4,50,1.0],[30,1.4,50,1.0],[31,0.7,57,0.7]]],["pluck",[[1,0.6,55,0.8],[1,0.6,62,0.6],[3,0.6,55,0.8],[3,0.6,62,0.6],[5,0.6,52,0.8],[5,0.6,59,0.6],[7,0.6,52,0.8],[7,0.6,59,0.6],[9,0.6,60,0.8],[9,0.6,67,0.6],[11,0.6,60,0.8],[11,0.6,67,0.6],[13,0.6,62,0.8],[13,0.6,69,0.6],[15,0.6,62,0.8],[15,0.6,69,0.6],[17,0.6,55,0.8],[17,0.6,62,0.6],[19,0.6,55,0.8],[19,0.6,62,0.6],[21,0.6,52,0.8],[21,0.6,59,0.6],[23,0.6,52,0.8],[23,0.6,59,0.6],[25,0.6,60,0.8],[25,0.6,67,0.6],[27,0.6,60,0.8],[27,0.6,67,0.6],[29,0.6,62,0.8],[29,0.6,69,0.6],[31,0.6,62,0.8],[31,0.6,69,0.6]]],["shk",[[0.5,0.18,null,1.0],[0.75,0.14,null,0.6],[1.5,0.18,null,1.0],[1.75,0.14,null,0.6],[2.5,0.18,null,1.0],[2.75,0.14,null,0.6],[3.5,0.18,null,1.0],[3.75,0.14,null,0.6],[4.5,0.18,null,1.0],[4.75,0.14,null,0.6],[5.5,0.18,null,1.0],[5.75,0.14,null,0.6],[6.5,0.18,null,1.0],[6.75,0.14,null,0.6],[7.5,0.18,null,1.0],[7.75,0.14,null,0.6],[8.5,0.18,null,1.0],[8.75,0.14,null,0.6],[9.5,0.18,null,1.0],[9.75,0.14,null,0.6],[10.5,0.18,null,1.0],[10.75,0.14,null,0.6],[11.5,0.18,null,1.0],[11.75,0.14,null,0.6],[12.5,0.18,null,1.0],[12.75,0.14,null,0.6],[13.5,0.18,null,1.0],[13.75,0.14,null,0.6],[14.5,0.18,null,1.0],[14.75,0.14,null,0.6],[15.5,0.18,null,1.0],[15.75,0.14,null,0.6],[16.5,0.18,null,1.0],[16.75,0.14,null,0.6],[17.5,0.18,null,1.0],[17.75,0.14,null,0.6],[18.5,0.18,null,1.0],[18.75,0.14,null,0.6],[19.5,0.18,null,1.0],[19.75,0.14,null,0.6],[20.5,0.18,null,1.0],[20.75,0.14,null,0.6],[21.5,0.18,null,1.0],[21.75,0.14,null,0.6],[22.5,0.18,null,1.0],[22.75,0.14,null,0.6],[23.5,0.18,null,1.0],[23.75,0.14,null,0.6],[24.5,0.18,null,1.0],[24.75,0.14,null,0.6],[25.5,0.18,null,1.0],[25.75,0.14,null,0.6],[26.5,0.18,null,1.0],[26.75,0.14,null,0.6],[27.5,0.18,null,1.0],[27.75,0.14,null,0.6],[28.5,0.18,null,1.0],[28.75,0.14,null,0.6],[29.5,0.18,null,1.0],[29.75,0.14,null,0.6],[30.5,0.18,null,1.0],[30.75,0.14,null,0.6],[31.5,0.18,null,1.0],[31.75,0.14,null,0.6]]],["box",[[0,0.5,67,1.0],[0.5,0.5,71,1.0],[1,0.5,74,1.0],[1.5,0.5,71,1.0],[2,1,69,1.0],[3,1,67,1.0],[4,0.5,64,1.0],[4.5,0.5,67,1.0],[5,0.5,71,1.0],[5.5,0.5,67,1.0],[6,2,69,1.0],[8,0.5,74,1.0],[8.5,0.5,76,1.0],[9,0.5,74,1.0],[9.5,0.5,71,1.0],[10,1,67,1.0],[11,1,69,1.0],[12,0.5,71,1.0],[12.5,0.5,69,1.0],[13,0.5,67,1.0],[13.5,0.5,64,1.0],[14,2,62,1.0],[16,0.5,67,1.0],[16.5,0.5,71,1.0],[17,0.5,74,1.0],[17.5,0.5,79,1.0],[18,1,76,1.0],[19,1,74,1.0],[20,0.5,71,1.0],[20.5,0.5,74,1.0],[21,0.5,71,1.0],[21.5,0.5,69,1.0],[22,2,67,1.0],[24,0.5,64,1.0],[24.5,0.5,67,1.0],[25,0.5,69,1.0],[25.5,0.5,71,1.0],[26,1,74,1.0],[27,1,71,1.0],[28,1,69,1.0],[29,1,67,1.0],[30,2,67,1.0]]]]}};

  var ac = null, master = null, verb = null, timer = null;
  var cur = null, nextBeat = 0, startAt = 0, playing = false;
  var KEY = "kinoko_bgm";
  var on = false;
  try { on = localStorage.getItem(KEY) === "1"; } catch (e) {}

  function hz(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  function build() {
    if (ac) return;
    ac = new (window.AudioContext || window.webkitAudioContext)();
    master = ac.createGain();
    master.gain.value = 0.0;
    master.connect(ac.destination);

    // かんたんな残響（短い減衰ノイズをたたみこむ）
    verb = ac.createConvolver();
    var n = Math.floor(ac.sampleRate * 1.1), buf = ac.createBuffer(2, n, ac.sampleRate);
    for (var c = 0; c < 2; c++) {
      var d = buf.getChannelData(c);
      for (var i = 0; i < n; i++) {
        var t = i / ac.sampleRate;
        d[i] = (Math.random() * 2 - 1) * Math.exp(-4.2 * t) * (t < 0.012 ? 0 : 1);
      }
    }
    verb.buffer = buf;
    var wet = ac.createGain(); wet.gain.value = 0.22;
    verb.connect(wet); wet.connect(master);
  }

  function out(gain, sendVerb) {
    gain.connect(master);
    if (sendVerb !== false) gain.connect(verb);
  }

  /* ---------- 音色 ---------- */

  function box(f, t0, dur, vel) {          // オルゴール
    var parts = [[1, 1, 2.6], [2, .34, 4.2], [3, .16, 6], [4.17, .07, 9], [6.1, .04, 12]];
    for (var i = 0; i < parts.length; i++) {
      var o = ac.createOscillator(), g = ac.createGain();
      o.type = "sine"; o.frequency.value = f * parts[i][0];
      var a = 0.45 * vel * parts[i][1];
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, a), t0 + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + Math.min(3.2, 1 / parts[i][2] * 3));
      o.connect(g); out(g);
      o.start(t0); o.stop(t0 + Math.min(3.4, 1 / parts[i][2] * 3.2));
    }
  }

  function bass(f, t0, dur, vel) {
    var o = ac.createOscillator(), o2 = ac.createOscillator(), g = ac.createGain();
    o.type = "sine"; o.frequency.value = f;
    o2.type = "sine"; o2.frequency.value = f * 2;
    var g2 = ac.createGain(); g2.gain.value = 0.3; o2.connect(g2); g2.connect(g);
    o.connect(g);
    var a = 0.30 * vel;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(a, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + Math.max(0.35, dur * 1.3));
    out(g, false);
    o.start(t0); o2.start(t0);
    o.stop(t0 + dur * 1.4 + 0.2); o2.stop(t0 + dur * 1.4 + 0.2);
  }

  function pluck(f, t0, dur, vel) {
    var o = ac.createOscillator(), g = ac.createGain();
    o.type = "triangle"; o.frequency.value = f;
    var a = 0.18 * vel;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(a, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + Math.max(0.3, dur));
    o.connect(g); out(g);
    o.start(t0); o.stop(t0 + Math.max(0.35, dur) + 0.05);
  }

  function pad(f, t0, dur, vel) {
    var lp = ac.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = 900; lp.Q.value = 0.6;
    var g = ac.createGain();
    var a = 0.075 * vel;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(a, t0 + 0.35);
    g.gain.setValueAtTime(a, t0 + Math.max(0.5, dur - 0.5));
    g.gain.linearRampToValueAtTime(0.0001, t0 + dur + 0.25);
    lp.connect(g); out(g);
    [-6, 0, 7].forEach(function (cents) {
      var o = ac.createOscillator();
      o.type = "triangle";
      o.frequency.value = f * Math.pow(2, cents / 1200);
      o.connect(lp); o.start(t0); o.stop(t0 + dur + 0.3);
    });
  }

  function shk(f, t0, dur, vel) {        // シャカシャカ
    var n = Math.floor(ac.sampleRate * Math.max(0.05, dur));
    var b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-42 * i / ac.sampleRate);
    var s = ac.createBufferSource(); s.buffer = b;
    var hp = ac.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 3500;
    var g = ac.createGain(); g.gain.value = 0.05 * vel;
    s.connect(hp); hp.connect(g); out(g, false);
    s.start(t0);
  }

  var INSTR = { box: box, bass: bass, pluck: pluck, pad: pad, shk: shk };

  /* ---------- 進行 ---------- */

  function schedule() {
    if (!playing || !cur) return;
    var song = SONGS[cur], spb = 60 / song.bpm;
    var horizon = ac.currentTime + 0.6;
    while (startAt + nextBeat * spb < horizon) {
      var loop = Math.floor(nextBeat / song.beats);
      var b = nextBeat - loop * song.beats;
      for (var p = 0; p < song.parts.length; p++) {
        var inst = song.parts[p][0], notes = song.parts[p][1], fn = INSTR[inst];
        for (var i = 0; i < notes.length; i++) {
          var nb = notes[i];
          if (Math.abs(nb[0] - b) > 1e-6) continue;
          var t0 = startAt + nextBeat * spb;
          fn(nb[2] == null ? 0 : hz(nb[2]), t0, nb[1] * spb, nb[3]);
        }
      }
      nextBeat += 0.25;                    // 16分きざみで見ていく
    }
  }

  function play(name) {
    build();
    if (ac.state === "suspended") ac.resume();
    cur = name in SONGS ? name : Object.keys(SONGS)[0];
    nextBeat = 0;
    startAt = ac.currentTime + 0.15;
    playing = true;
    master.gain.cancelScheduledValues(ac.currentTime);
    master.gain.setValueAtTime(0.0001, ac.currentTime);
    master.gain.linearRampToValueAtTime(0.5, ac.currentTime + 1.2);
    if (timer) clearInterval(timer);
    timer = setInterval(schedule, 120);
    schedule();
  }

  function stop() {
    playing = false;
    if (timer) { clearInterval(timer); timer = null; }
    if (master) {
      master.gain.cancelScheduledValues(ac.currentTime);
      master.gain.setValueAtTime(master.gain.value, ac.currentTime);
      master.gain.linearRampToValueAtTime(0.0001, ac.currentTime + 0.5);
    }
  }

  /* ---------- ボタンをつなぐ ---------- */
  function attach(name, sel) {
    var btn = document.querySelector(sel);
    if (!btn) return;
    function label() { btn.textContent = on ? "🎵 音楽 ON" : "🎵 音楽 OFF"; }
    label();
    btn.addEventListener("click", function () {
      on = !on;
      try { localStorage.setItem(KEY, on ? "1" : "0"); } catch (e) {}
      label();
      if (on) play(name); else stop();
    });
    // 前回 ON だった人は、最初にどこかを触った時点で鳴らす
    if (on) {
      var once = function () {
        document.removeEventListener("pointerdown", once);
        document.removeEventListener("keydown", once);
        if (on) play(name);
      };
      document.addEventListener("pointerdown", once);
      document.addEventListener("keydown", once);
    }
    document.addEventListener("visibilitychange", function () {
      if (!ac) return;
      if (document.hidden) ac.suspend(); else if (on && playing) ac.resume();
    });
  }

  window.BGM = { attach: attach, play: play, stop: stop,
                 isOn: function () { return on; }, songs: Object.keys(SONGS) };
})();
