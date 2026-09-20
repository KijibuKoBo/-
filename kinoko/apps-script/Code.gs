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
var SHEET_POST  = '投稿';
var SHEET_CMT   = 'コメント';
var DRIVE_FOLDER = 'イワオトキノコ 投稿写真';   // 写真の保存先（自動で作られます）
var POST_MAX = 400;      // 本文の字数
var CMT_MAX  = 400;
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
      case 'posts':   return json_({ ok: true, posts: posts_(p.key) });
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
      case 'post':    return json_(addPost_(body));
      case 'comment': return json_(addComment_(body));
      case 'moderate':return json_(moderate_(body));
      case 'fetchmeta':return json_(fetchMeta_(body));
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


/* ============================ 写真の投稿 ============================
 *  だれでも送れますが、載るのは管理画面で「公開」を押したものだけです。
 *  写真は、あなたの Google ドライブのフォルダに入ります。
 */

function postSheet_() {
  return sheet_(SHEET_POST, ['ID', '状態', '日時', 'なまえ', '本文', '場所', '写真URL', 'ファイルID']);
}
function cmtSheet_() {
  return sheet_(SHEET_CMT, ['投稿ID', '日時', 'なまえ', '本文', '管理者']);
}
function folder_() {
  var it = DriveApp.getFoldersByName(DRIVE_FOLDER);
  return it.hasNext() ? it.next() : DriveApp.createFolder(DRIVE_FOLDER);
}

function addPost_(b) {
  var name = cleanName_(b.name);
  var text = clean_(b.text, POST_MAX);
  var place = clean_(b.place, 60);
  if (!b.photo) return { ok: false, error: 'photo' };

  var lock = LockService.getScriptLock();
  try { lock.waitLock(20000); } catch (e) { return { ok: false, error: 'busy' }; }
  try {
    var sh = postSheet_();
    // 1日あたりの受け入れ上限（いたずら対策）
    var today = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');
    var last = sh.getLastRow(), n = 0;
    if (last > 1) {
      var ds = sh.getRange(2, 3, last - 1, 1).getValues();
      for (var i = 0; i < ds.length; i++) {
        var d = ds[i][0];
        if (d instanceof Date) d = Utilities.formatDate(d, 'Asia/Tokyo', 'yyyy-MM-dd');
        if (String(d).slice(0, 10) === today) n++;
      }
    }
    if (n >= 60) return { ok: false, error: 'limit' };

    var raw = String(b.photo).replace(/^data:image\/\w+;base64,/, '');
    var bytes = Utilities.base64Decode(raw);
    if (bytes.length > 3 * 1024 * 1024) return { ok: false, error: 'toobig' };
    var id = 'p' + Date.now() + Math.floor(Math.random() * 900 + 100);
    var blob = Utilities.newBlob(bytes, 'image/jpeg', id + '.jpg');
    var file = folder_().createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    var url = 'https://lh3.googleusercontent.com/d/' + file.getId();

    sh.appendRow([id, '承認待ち', new Date(), name, text, place, url, file.getId()]);
    return { ok: true, id: id };
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

function posts_(key) {
  var admin = String(key || '') === ADMIN_KEY;
  var sh = postSheet_(), last = sh.getLastRow();
  if (last < 2) return [];
  var vals = sh.getRange(2, 1, last - 1, 7).getValues();
  var cs = comments_();
  var out = [];
  for (var i = vals.length - 1; i >= 0; i--) {
    var v = vals[i], st = String(v[1]);
    if (!admin && st !== '公開') continue;
    if (st === '削除') continue;
    var t = v[2];
    if (t instanceof Date) t = Utilities.formatDate(t, 'Asia/Tokyo', 'yyyy-MM-dd');
    out.push({ id: String(v[0]), state: st, date: String(t), name: String(v[3]),
               text: String(v[4]), place: String(v[5]), photo: String(v[6]),
               comments: cs[String(v[0])] || [] });
    if (out.length >= 60) break;
  }
  return out;
}

function comments_() {
  var sh = cmtSheet_(), last = sh.getLastRow(), map = {};
  if (last < 2) return map;
  var vals = sh.getRange(2, 1, last - 1, 5).getValues();
  vals.forEach(function (v) {
    var t = v[1];
    if (t instanceof Date) t = Utilities.formatDate(t, 'Asia/Tokyo', 'yyyy-MM-dd');
    (map[String(v[0])] = map[String(v[0])] || []).push({
      date: String(t), name: String(v[2]), text: String(v[3]), admin: !!v[4]
    });
  });
  return map;
}

function addComment_(b) {
  var pid = String(b.id || '');
  if (!pid) return { ok: false, error: 'id' };
  var isAdmin = String(b.key || '') === ADMIN_KEY;
  var name = isAdmin ? '石原 巖' : cleanName_(b.name);
  var text = clean_(b.text, CMT_MAX);
  if (!text) return { ok: false, error: 'text' };
  cmtSheet_().appendRow([pid, new Date(), name, text, isAdmin ? 1 : '']);
  return { ok: true, comments: (comments_()[pid] || []) };
}

/* 管理画面から：公開する／下げる／消す、コメントを消す */
function moderate_(b) {
  if (String(b.key || '') !== ADMIN_KEY) return { ok: false, error: 'key' };
  var sh = postSheet_(), last = sh.getLastRow();
  if (last < 2) return { ok: true };
  var vals = sh.getRange(2, 1, last - 1, 8).getValues();
  for (var i = 0; i < vals.length; i++) {
    if (String(vals[i][0]) !== String(b.id)) continue;
    if (b.act === 'show')  sh.getRange(i + 2, 2).setValue('公開');
    if (b.act === 'hide')  sh.getRange(i + 2, 2).setValue('承認待ち');
    if (b.act === 'trash') {
      sh.getRange(i + 2, 2).setValue('削除');
      try { DriveApp.getFileById(String(vals[i][7])).setTrashed(true); } catch (e) {}
    }
    break;
  }
  if (b.act === 'delcmt') {
    var cs = cmtSheet_(), cl = cs.getLastRow();
    if (cl > 1) {
      var cv = cs.getRange(2, 1, cl - 1, 4).getValues();
      for (var j = cv.length - 1; j >= 0; j--) {
        if (String(cv[j][0]) === String(b.id) && String(cv[j][3]) === String(b.text)) {
          cs.deleteRow(j + 2); break;
        }
      }
    }
  }
  return { ok: true, posts: posts_(b.key) };
}

function clean_(s, max) {
  s = String(s == null ? '' : s)
        .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
        .replace(/\r\n?/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
  return s.slice(0, max);
}


/* ============================ 商品URLから中身を読む ============================
 *  スズリ・BASE・BOOTH など、たいていの商品ページには
 *  「OGP」という見出し・写真の情報が埋まっています。それを読みます。
 *  ブラウザからは他所のページを直接読めないので、ここが代わりに読みに行きます。
 */

function fetchMeta_(b) {
  if (String(b.key || '') !== ADMIN_KEY) return { ok: false, error: 'key' };
  var url = String(b.url || '').trim();
  if (!/^https?:\/\//i.test(url)) return { ok: false, error: 'url' };

  var html;
  try {
    var res = UrlFetchApp.fetch(url, {
      muteHttpExceptions: true, followRedirects: true,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; IwaotoKinoko/1.0)' }
    });
    if (res.getResponseCode() >= 400) return { ok: false, error: 'http' + res.getResponseCode() };
    html = res.getContentText();
  } catch (e) {
    return { ok: false, error: 'fetch' };
  }

  var out = {
    ok: true,
    title: meta_(html, 'og:title') || tag_(html, 'title') || '',
    desc:  meta_(html, 'og:description') || meta_(html, 'description') || '',
    image: meta_(html, 'og:image') || meta_(html, 'twitter:image') || '',
    price: price_(html)
  };
  out.title = decode_(out.title).slice(0, 60);
  out.desc  = decode_(out.desc).replace(/\s+/g, ' ').slice(0, 120);

  // 写真も持ってくる（サイトに取り込むため）
  if (out.image && b.withImage) {
    try {
      var im = UrlFetchApp.fetch(out.image, { muteHttpExceptions: true, followRedirects: true });
      if (im.getResponseCode() < 400) {
        var blob = im.getBlob();
        if (blob.getBytes().length <= 4 * 1024 * 1024) {
          out.imageB64 = Utilities.base64Encode(blob.getBytes());
          out.imageType = blob.getContentType();
        }
      }
    } catch (e) {}
  }
  return out;
}

function meta_(html, prop) {
  var pats = [
    new RegExp('<meta[^>]+(?:property|name)\\s*=\\s*["\']' + prop + '["\'][^>]*content\\s*=\\s*["\']([^"\']*)["\']', 'i'),
    new RegExp('<meta[^>]+content\\s*=\\s*["\']([^"\']*)["\'][^>]*(?:property|name)\\s*=\\s*["\']' + prop + '["\']', 'i')
  ];
  for (var i = 0; i < pats.length; i++) {
    var m = html.match(pats[i]);
    if (m) return m[1];
  }
  return '';
}

function tag_(html, name) {
  var m = html.match(new RegExp('<' + name + '[^>]*>([\\s\\S]*?)</' + name + '>', 'i'));
  return m ? m[1].trim() : '';
}

function price_(html) {
  var m = meta_(html, 'product:price:amount');
  if (m) return '¥' + Number(m).toLocaleString();
  m = html.match(/[¥￥]\s?([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{3,6})/);
  if (m) return '¥' + m[1];
  m = html.match(/([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{3,6})\s?円/);
  if (m) return '¥' + m[1];
  return '';
}

function decode_(s) {
  return String(s)
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, function (_, n) { return String.fromCharCode(Number(n)); })
    .trim();
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
