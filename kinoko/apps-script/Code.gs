/*  イワオトキノコ ― 訪問カウント と ゲームのランキング
 *  ------------------------------------------------------------------
 *  Google スプレッドシートに紐づけて「ウェブアプリ」として公開します。
 *  手順は kinoko/docs/ranking-setup.md を見てください。
 *
 *  データはすべて、あなた自身の Google ドライブの中にしか残りません。
 *  名前とスコア以外は保存しません（IPアドレスなどは記録しません）。
 */

var SHEET_VISIT = '訪問';
var SHEET_RANK  = 'ランキング';
var TOP_N = 5;     // 表示する順位の数
var KEEP  = 30;    // 1ゲームあたり保存しておく件数
var NAME_MAX = 12;

/* 管理画面（admin.html）から集計を見るときの合言葉。変えても構いません。 */
var ADMIN_KEY = '100';

var GAMES = {
  match: { name: 'きのこマッチパズル', max: 200000 },
  tsumu: { name: 'きのこつみ',         max: 200000 }
};

/* ============================ 入口 ============================ */

function doGet(e) {
  var p = (e && e.parameter) || {};
  try {
    switch (p.action) {
      case 'hit':     return json_(hit_(p.p, p.n === '1'));
      case 'ranking': return json_({ ok: true, top: ranking_(p.g) });
      case 'stats':   return json_(stats_(p.key));
      case 'ping':    return json_({ ok: true, version: 1 });
      default:        return json_({ ok: false, error: 'unknown action' });
    }
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  var body = {};
  try { body = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (err) {}
  try {
    switch (body.action) {
      case 'score':  return json_(submit_(body.game, body.name, body.score));
      case 'delete': return json_(remove_(body.key, body.game, body.name, body.score));
      default:       return json_({ ok: false, error: 'unknown action' });
    }
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

/* ============================ 訪問 ============================ */

function hit_(page, isNew) {
  page = String(page || 'index').slice(0, 40).replace(/[^a-zA-Z0-9._-]/g, '');
  var lock = LockService.getScriptLock();
  try { lock.waitLock(8000); } catch (err) { return { ok: true }; }
  try {
    var sh = sheet_(SHEET_VISIT, ['日付', 'ページ', '表示回数', 'はじめての人']);
    var today = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');
    var last = sh.getLastRow();
    var rows = last > 1 ? sh.getRange(2, 1, last - 1, 2).getValues() : [];
    for (var i = rows.length - 1; i >= 0; i--) {
      var d = rows[i][0];
      if (d instanceof Date) d = Utilities.formatDate(d, 'Asia/Tokyo', 'yyyy-MM-dd');
      if (String(d) === today && String(rows[i][1]) === page) {
        var r = i + 2;
        sh.getRange(r, 3).setValue(Number(sh.getRange(r, 3).getValue() || 0) + 1);
        if (isNew) sh.getRange(r, 4).setValue(Number(sh.getRange(r, 4).getValue() || 0) + 1);
        return { ok: true };
      }
    }
    sh.appendRow([today, page, 1, isNew ? 1 : 0]);
    return { ok: true };
  } finally {
    try { lock.releaseLock(); } catch (err) {}
  }
}

function stats_(key) {
  if (String(key || '') !== ADMIN_KEY) return { ok: false, error: 'key' };
  var sh = sheet_(SHEET_VISIT, ['日付', 'ページ', '表示回数', 'はじめての人']);
  var last = sh.getLastRow();
  if (last < 2) return { ok: true, total: 0, people: 0, days: [], pages: [] };

  var vals = sh.getRange(2, 1, last - 1, 4).getValues();
  var total = 0, people = 0, byDay = {}, byPage = {};
  vals.forEach(function (v) {
    var d = v[0];
    if (d instanceof Date) d = Utilities.formatDate(d, 'Asia/Tokyo', 'yyyy-MM-dd');
    d = String(d);
    var n = Number(v[2] || 0), np = Number(v[3] || 0);
    total += n; people += np;
    byDay[d] = (byDay[d] || 0) + n;
    byPage[v[1]] = (byPage[v[1]] || 0) + n;
  });
  var days = Object.keys(byDay).sort().slice(-30).map(function (d) { return { d: d, n: byDay[d] }; });
  var pages = Object.keys(byPage).map(function (p) { return { p: p, n: byPage[p] }; })
                    .sort(function (a, b) { return b.n - a.n; });
  return { ok: true, total: total, people: people, days: days, pages: pages };
}

/* ============================ ランキング ============================ */

function rankSheet_() {
  return sheet_(SHEET_RANK, ['ゲーム', '名前', 'スコア', '登録日時']);
}

function ranking_(game) {
  if (!GAMES[game]) return [];
  var sh = rankSheet_();
  var last = sh.getLastRow();
  if (last < 2) return [];
  var vals = sh.getRange(2, 1, last - 1, 4).getValues();
  return vals
    .filter(function (v) { return String(v[0]) === game; })
    .map(function (v) {
      var t = v[3];
      if (t instanceof Date) t = Utilities.formatDate(t, 'Asia/Tokyo', 'yyyy-MM-dd');
      return { name: String(v[1]), score: Number(v[2] || 0), date: String(t || '') };
    })
    .sort(function (a, b) { return b.score - a.score; })
    .slice(0, TOP_N);
}

function cleanName_(s) {
  s = String(s == null ? '' : s)
        .replace(/[\r\n\t]/g, ' ')
        .replace(/[\u0000-\u001f\u007f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
  if (!s) s = 'ななし';
  return s.slice(0, NAME_MAX);
}

function submit_(game, name, score) {
  var g = GAMES[game];
  if (!g) return { ok: false, error: 'game' };
  score = Math.floor(Number(score));
  if (!isFinite(score) || score < 0 || score > g.max) return { ok: false, error: 'score' };
  name = cleanName_(name);

  var lock = LockService.getScriptLock();
  try { lock.waitLock(10000); } catch (err) { return { ok: false, error: 'busy' }; }
  try {
    var sh = rankSheet_();
    var last = sh.getLastRow();
    var vals = last > 1 ? sh.getRange(2, 1, last - 1, 4).getValues() : [];

    // 同じ名前・同じ点の二重登録は無視する
    var dup = vals.some(function (v) {
      return String(v[0]) === game && String(v[1]) === name && Number(v[2]) === score;
    });
    if (!dup) {
      sh.appendRow([game, name, score, new Date()]);
      vals.push([game, name, score, new Date()]);
    }

    // ゲームごとに上位 KEEP 件だけ残して、あとは消す
    var mine = [];
    vals.forEach(function (v, i) {
      if (String(v[0]) === game) mine.push({ row: i + 2, score: Number(v[2] || 0) });
    });
    if (mine.length > KEEP) {
      mine.sort(function (a, b) { return b.score - a.score; });
      mine.slice(KEEP).map(function (m) { return m.row; })
          .sort(function (a, b) { return b - a; })
          .forEach(function (r) { sh.deleteRow(r); });
    }

    var top = ranking_(game);
    var rank = 0;
    for (var i = 0; i < top.length; i++) {
      if (top[i].name === name && top[i].score === score) { rank = i + 1; break; }
    }
    return { ok: true, rank: rank, top: top };
  } finally {
    try { lock.releaseLock(); } catch (err) {}
  }
}

/* 管理画面から、ふさわしくない名前を消すため */
function remove_(key, game, name, score) {
  if (String(key || '') !== ADMIN_KEY) return { ok: false, error: 'key' };
  var sh = rankSheet_();
  var last = sh.getLastRow();
  if (last < 2) return { ok: true, top: [] };
  var vals = sh.getRange(2, 1, last - 1, 4).getValues();
  for (var i = vals.length - 1; i >= 0; i--) {
    if (String(vals[i][0]) === String(game) &&
        String(vals[i][1]) === String(name) &&
        Number(vals[i][2]) === Math.floor(Number(score))) {
      sh.deleteRow(i + 2);
      break;
    }
  }
  return { ok: true, top: ranking_(game) };
}

/* ============================ 共通 ============================ */

function sheet_(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) sh.appendRow(headers);
  return sh;
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o))
                       .setMimeType(ContentService.MimeType.JSON);
}
