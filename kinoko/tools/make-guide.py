#!/usr/bin/env python3
"""管理ページの使い方ガイド（PDF）を作る。
   使いかた:
     cd kinoko/web && python3 -m http.server 8899 &
     python3 tools/shots.py /tmp/shots
     python3 tools/make-guide.py /tmp/shots kinoko/web/guide.pdf
"""
import sys, os, base64, datetime
from playwright.sync_api import sync_playwright

SHOTS = sys.argv[1] if len(sys.argv) > 1 else "/tmp/shots"
OUTPDF = sys.argv[2] if len(sys.argv) > 2 else "kinoko/web/guide.pdf"
EXE = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"
TODAY = datetime.date.today().strftime("%Y年%-m月%-d日")

def img(name):
    p = os.path.join(SHOTS, name + ".png")
    if not os.path.exists(p):
        return ""
    return "data:image/png;base64," + base64.b64encode(open(p, "rb").read()).decode()

def fig(name, cap="", cls=""):
    src = img(name)
    if not src:
        return ""
    c = f'<figcaption>{cap}</figcaption>' if cap else ""
    k = f' class="{cls}"' if cls else ""
    return f'<figure{k}><img src="{src}" alt="">{c}</figure>'

LOGO = img("../logo")  # 使わない

CSS = """
@page { size: A4; margin: 16mm 15mm 18mm; }
* { box-sizing: border-box; }
body { margin:0; font-family:"Noto Sans JP","Hiragino Sans","Yu Gothic",sans-serif;
       color:#22201c; font-size:12pt; line-height:1.78; }
h1,h2,h3 { font-family:"Shippori Mincho","Yu Mincho",serif; }
.cover { height:247mm; display:flex; flex-direction:column; align-items:center;
         justify-content:center; text-align:center; page-break-after:always; }
.cover .mark { font-size:40pt; }
.cover h1 { font-size:26pt; margin:14px 0 6px; letter-spacing:.06em; }
.cover .sub { font-size:14pt; color:#5d5849; margin:0 0 26px; }
.cover .pw { border:2px solid #2f5d3a; border-radius:14px; padding:14px 26px; font-size:13pt; }
.cover .pw b { font-size:20pt; color:#2f5d3a; }
.cover .date { margin-top:30px; font-size:10.5pt; color:#7a7565; }
section { page-break-before:always; }
section:first-of-type { page-break-before:auto; }
h2 { font-size:17pt; margin:0 0 4px; padding:0 0 8px; border-bottom:3px solid #2f5d3a; }
h2 .no { display:inline-block; background:#2f5d3a; color:#fff; border-radius:8px;
         padding:1px 12px; margin-right:10px; font-size:14pt; }
h3 { font-size:13.5pt; margin:20px 0 6px; color:#2f5d3a; }
p { margin:8px 0; }
ol.steps { margin:10px 0; padding-left:0; list-style:none; counter-reset:st; }
ol.steps > li { counter-increment:st; position:relative; padding:4px 0 4px 40px; margin:0; }
ol.steps > li::before { content:counter(st); position:absolute; left:0; top:6px;
    width:26px; height:26px; border-radius:50%; background:#2f5d3a; color:#fff;
    font-size:11pt; display:flex; align-items:center; justify-content:center; }
ul.plain { margin:8px 0; padding-left:1.3em; }
ul.plain li { margin:5px 0; }
figure { margin:12px 0 6px; page-break-inside:avoid; text-align:center; }
/* 縦長の図が1ページを占領しないよう、高さにも上限をつける */
figure img { display:block; margin:0 auto; max-width:100%; max-height:88mm;
             width:auto; height:auto; border:1px solid #d8d2c2; border-radius:8px; }
figcaption { font-size:9.5pt; color:#6f6a5c; margin-top:5px; text-align:left; }
figure.sm img { max-height:62mm; }
figure.xs img { max-height:56mm; }
.box { border-radius:10px; padding:10px 15px; margin:12px 0; font-size:11pt; page-break-inside:avoid; }
.warn { background:#fdeeea; border-left:6px solid #c0442c; }
.tip  { background:#eef4ea; border-left:6px solid #2f5d3a; }
.note { background:#f6f2e6; border-left:6px solid #a8854a; }
.box b { color:#22201c; }
table { width:100%; border-collapse:collapse; margin:12px 0; font-size:11pt; }
th,td { border:1px solid #d8d2c2; padding:7px 10px; text-align:left; vertical-align:top; }
th { background:#efeadd; white-space:nowrap; }
.kbd { background:#efeadd; border:1px solid #cfc7b4; border-radius:5px; padding:1px 7px;
       font-size:10.5pt; white-space:nowrap; }
.big { font-size:13pt; font-weight:700; }
.foot { position:fixed; bottom:-12mm; left:0; right:0; text-align:center;
        font-size:9pt; color:#8a8474; }
"""

BODY = f"""
<div class="cover">
  <div class="mark">🍄</div>
  <h1>イワオトキノコ<br>管理ページの つかいかた</h1>
  <p class="sub">写真と記録を、じぶんでホームページに出すための本</p>
  <div class="pw">
    この本は <b>パスワード 100</b> でできることの説明です
  </div>
  <p class="date">{TODAY} 版</p>
</div>

<section>
  <h2><span class="no">1</span>ひらく／ログインする</h2>

  <h3>ページをひらく</h3>
  <p>スマホでもパソコンでも、同じ住所（URL）で開けます。
     一度ひらいたら <b>ブックマーク（お気に入り）に入れておく</b> と、次からすぐ開けます。</p>

  <div class="box warn">
    ⚠ <b>この住所とパスワードは、人に教えないでください。</b><br>
    ここを知られると、だれでもホームページを書きかえられてしまいます。
    人に見せるのは <b>トップページだけ</b> にしてください。
  </div>

  <h3>ログインする</h3>
  <ol class="steps">
    <li>まん中の四角に <span class="kbd">100</span> と入れる</li>
    <li><b>ログイン</b> を押す</li>
  </ol>
  {fig("01-login", "図1　ログインの画面", "sm")}

  <div class="box tip">
    💡 パスワードをまちがえると「パスワードが違います」と赤く出ます。
    数字は <b>半角</b>（ふつうの数字）で入れてください。
  </div>

  <p>ログインすると、右上に <b>「グッズ以外を編集できます」</b> と出ます。
     これが、いま 100 で入っているしるしです。</p>
  {fig("02-top", "図2　ログインしたあとの右上")}

</section>

<section>
  <h2><span class="no">2</span>画面の見かた</h2>

  <p>上にならんでいる <b>タブ</b> で、編集するものを切りかえます。押すと下の中身が変わります。</p>
  {fig("03-tabs", "図3　タブ（100 でログインしたとき）")}

  <table>
    <tr><th>🍄 キノコ</th><td>採ったキノコの記録を、追加・修正・削除する（いちばんよく使います）</td></tr>
    <tr><th>📝 コラム</th><td>読みもの（文章）を追加・修正・削除する</td></tr>
    <tr><th>📔 日誌</th><td>その日の短い記録を足す</td></tr>
    <tr><th>📊 みんなの記録</th><td>ホームページが何回見られたかを見る（見るだけ）</td></tr>
    <tr><th>📬 投稿</th><td>知らない人から届いた写真に、公開の許可と返事をする</td></tr>
  </table>

  <div class="box note">
    🛍 <b>グッズ</b> のページだけは、このパスワードでは編集できません（タブも出てきません）。
    グッズを直すときは、もう一方のパスワードで入り直してください。
    となりの <b>🔒 ログアウト</b> を押すと、入力の画面にもどれます。
  </div>

  <h3>さいしょに一度だけ：⚙ 設定</h3>
  <p>右上の <b>⚙ 設定</b> には、ホームページに書きこむための「鍵」が入っています。
     <b>すでに入っていれば、さわる必要はありません。</b></p>
  {fig("04-settings", "図4　⚙ 設定の画面", "xs")}

  <div class="box note">
    📱 <b>ちがう機械（スマホ・パソコン）で使うときは、そこでもう一度この鍵を入れます。</b><br>
    鍵はその機械のブラウザの中だけに保存され、どこにも送られません。
    鍵が入っていないと「公開」を押したときに
    「先に ⚙設定 で GitHub トークンを登録してください」と出ます。
  </div>
</section>

<section>
  <h2><span class="no">3</span>キノコを ついかする</h2>

  <ol class="steps">
    <li>タブの <b>🍄 キノコ</b> を押す</li>
    <li>「編集する記録」が <b>＋ 新しいキノコを追加</b> になっているか見る</li>
  </ol>
  {fig("05-rec-select", "図5　ここが「＋ 新しいキノコを追加」なら、新しく足せます")}

  <ol class="steps" style="counter-reset:st 2">
    <li>下の欄に分かることを入れる。<b>赤い ＊ が付いた 3つ（和名・食毒・採集日）は必ず</b>。
        ほかは空でもかまいません</li>
  </ol>
  {fig("06-rec-form", "図6　入力する欄（この下にもまだ続きます）")}

  <div class="box tip">
    💡 <b>うすい字</b>は「こう書くといいですよ」という見本です。じゃまにはなりません。
    そのまま上から書けば消えます。
  </div>
</section>

<section>
  <h2><span class="no">3</span>キノコを ついかする（つづき）</h2>

  <h3>写真をつける</h3>
  <ol class="steps">
    <li><b>📷 写真を追加</b> を押す</li>
    <li>スマホなら、その場でカメラで撮ってもかまいません</li>
    <li>何枚でも足せます。写真は自動で軽くなるので、大きさは気にしなくて大丈夫です</li>
  </ol>
  {fig("07-rec-photos", "図7　写真の欄")}

  <ul class="plain">
    <li><b>◀ ▶</b> … 写真の並び順を入れかえる</li>
    <li><b>主</b> … その写真を「いちばん見せたい1枚」にする（一覧に出る写真）</li>
    <li><b>🗑</b> … その写真を外す</li>
  </ul>

  <h3>公開する</h3>
  <ol class="steps">
    <li><b>👁 プレビュー</b> で、どう見えるか確かめる（まだ公開されません）</li>
    <li><b>🍄 公開する</b> を押す</li>
    <li>「✅ 公開しました」と出たら成功。<b>1〜2分</b>でホームページに出ます</li>
  </ol>
  {fig("08-rec-buttons", "図8　いちばん下のボタン")}

  <div class="box warn">
    ⚠ <b>公開を押したあと、すぐ画面を閉じないでください。</b>
    「✅ 公開しました」が出るまで待ってください。
  </div>
  <div class="box tip">
    💡 ホームページをすぐ見ても変わっていないときは、
    <b>1〜2分おいて、ページを読み込み直す</b>と出てきます。
  </div>
</section>

<section>
  <h2><span class="no">4</span>キノコを なおす・けす</h2>

  <h3>なおす</h3>
  <ol class="steps">
    <li>「編集する記録」から、直したいキノコを えらぶ</li>
    <li>中身がそのまま欄に入るので、直したいところだけ書きかえる</li>
    <li><b>🍄 公開する</b> を押す</li>
  </ol>
  <p>写真をえらび直さなければ、写真は元のままです。</p>

  <h3>けす</h3>
  <ol class="steps">
    <li>「編集する記録」から、消したいキノコを えらぶ</li>
    <li>下に出てくる <b>🗑 この記録を消す</b> を押す</li>
    <li>たしかめの画面で <b>OK</b> を押す</li>
  </ol>

  <div class="box warn">
    ⚠ <b>消すと、元にはもどせません。</b> 名前をよく見てから押してください。
  </div>
  <div class="box tip">
    💡 新しく足すときは、必ず「編集する記録」を <b>＋ 新しいキノコを追加</b> にしてから
    入力してください。ほかのキノコを えらんだまま公開すると、
    <b>そのキノコが書きかわって</b> しまいます。
  </div>
</section>

<section>
  <h2><span class="no">5</span>コラム（読みもの）</h2>

  <p>写真1枚と文章で、読みものを足せます。やり方はキノコとほとんど同じです。</p>
  <ol class="steps">
    <li>タブの <b>📝 コラム</b> を押す</li>
    <li>「直すコラム」が <b>＋ 新しいコラムを書く</b> になっているか見る</li>
    <li><b>題名</b> と <b>本文</b> を入れる（題名は必ず）</li>
    <li>写真を1枚えらぶ（なくてもかまいません）</li>
    <li><b>📝 公開する</b> を押す</li>
  </ol>
  {fig("09-column", "図9　コラムの画面")}

  <div class="box tip">
    💡 本文は、<b>一行あけると段落が分かれます</b>。読みやすくなります。
  </div>
  <div class="box note">
    直すときも消すときも、キノコと同じです。
    「直すコラム」からえらぶと、下に <b>🗑 このコラムを消す</b> が出ます。
  </div>
</section>

<section>
  <h2><span class="no">6</span>日誌</h2>

  <p>その日の短い記録を、一行ずつ足していけます。</p>
  <ol class="steps">
    <li>タブの <b>📔 日誌</b> を押す</li>
    <li><b>日づけ</b> をえらぶ（きょうの日づけが最初から入っています）</li>
    <li>その日のことを書く</li>
    <li><b>📔 公開する</b> を押す</li>
  </ol>
  {fig("10-diary", "図10　日誌の画面")}

  <p>下に、いままでの日誌がならびます。消したいものは、その行の <b>消す</b> を押します。</p>
</section>

<section>
  <h2><span class="no">7</span>みんなの記録（見るだけ）</h2>

  <p>ホームページが何回見られたかが分かります。<b>この画面でしか見られません。</b>
     ホームページには出していないので、見に来た人には分かりません。</p>
  <div class="box note">
    この節の図に出ている数字は <b>見本</b> です。実際にはあなたのホームページの数字が出ます。
  </div>
  {fig("11-visits", "図11　だいたいの人数と回数〈見本〉")}
  {fig("11b-bars", "図12　日ごとの回数〈見本〉")}

  <p>下のほうには、ゲームのランキングも出ます。
     ふさわしくない名前が登録されていたら、<b>消す</b> で取りのぞけます。</p>
  {fig("11c-rank", "図13　ゲームのランキング〈見本〉", "sm")}

</section>

<section>
  <h2><span class="no">8</span>投稿（「このキノコ なに？」）</h2>

  <p>知らない人が送ってきた写真が、ここに届きます。</p>

  <div class="box warn">
    ⚠ <b>送られてきた写真は、ここで「✓ 公開する」を押すまでホームページには出ません。</b>
    あわてなくて大丈夫です。
  </div>

  {fig("12-posts", "図14　投稿の画面〈見本〉")}

  <table>
    <tr><th>✓ 公開する</th><td>その写真をホームページに出す</td></tr>
    <tr><th>↩ 下げる</th><td>いちど出したものを、また見えなくする</td></tr>
    <tr><th>🗑 消す</th><td>投稿そのものを消す（写真も消えます・もどせません）</td></tr>
    <tr><th>答える</th><td>下の欄に書いて押すと、<b>「採集者」の印つき</b>で答えが載ります</td></tr>
  </table>

  <div class="box tip">
    💡 答えるときは、<b>「食べてよい」と言いきらない</b>ようにしてください。
    「〜に見えますが、写真だけでは分かりません」のように書くと安心です。
  </div>
</section>

<section>
  <h2><span class="no">9</span>こまったとき</h2>

  <table>
    <tr><th>おきたこと</th><th>どうするか</th></tr>
    <tr><td>「パスワードが違います」と出る</td>
        <td>数字が <b>半角</b> か確かめる。かな入力になっていないか見る</td></tr>
    <tr><td>「先に ⚙設定 で GitHub トークンを登録してください」</td>
        <td>右上の <b>⚙ 設定</b> をひらいて、鍵を入れる。
            ちがう機械で初めて使うときは、毎回これが必要です</td></tr>
    <tr><td>「✗ 公開に失敗」と出る</td>
        <td>電波のよいところで、もう一度 <b>公開する</b> を押す。
            それでも出るときは、鍵の期限が切れているかもしれません</td></tr>
    <tr><td>公開したのにホームページが変わらない</td>
        <td><b>1〜2分</b>待ってから、ページを読み込み直す</td></tr>
    <tr><td>📊 や 📬 に「まだ準備ができていません」と出る</td>
        <td>Google のスプレッドシートにつながっていません。
            息子に連絡してください</td></tr>
    <tr><td>まちがえて消してしまった</td>
        <td>もう一度入力し直してください。
            どうしても戻したいときは息子に連絡を（記録は残っています）</td></tr>
  </table>

  <h3>おぼえておくこと</h3>
  <ul class="plain">
    <li class="big">管理ページの住所とパスワードは、人に教えない</li>
    <li class="big">公開を押したら「✅」が出るまで待つ</li>
    <li class="big">新しく足すときは「＋ 新しい…」を えらんでから</li>
    <li class="big">消す前に、名前をよく見る</li>
  </ul>

  <div class="box tip">
    こまったら、この本のページ番号を言って息子に聞いてください。
  </div>
</section>
"""

HTML = f"<!DOCTYPE html><html lang='ja'><head><meta charset='utf-8'>" \
       f"<link href='https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@600;700&" \
       f"family=Noto+Sans+JP:wght@400;500;700&display=swap' rel='stylesheet'>" \
       f"<style>{CSS}</style></head><body>{BODY}</body></html>"

tmp = os.path.abspath("_guide_tmp.html")
open(tmp, "w", encoding="utf-8").write(HTML)

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=EXE)
    pg = b.new_page()
    pg.goto("file://" + tmp)
    try:
        pg.wait_for_function("() => document.fonts.status === 'loaded'", timeout=8000)
    except Exception:
        pass
    pg.wait_for_timeout(1200)
    pg.pdf(path=OUTPDF, format="A4", print_background=True,
           display_header_footer=True,
           header_template="<div></div>",
           footer_template="<div style='width:100%;font-size:8pt;color:#8a8474;"
                           "text-align:center;font-family:sans-serif'>"
                           "イワオトキノコ 管理ページの つかいかた　―　"
                           "<span class='pageNumber'></span> / <span class='totalPages'></span></div>",
           margin={"top": "16mm", "bottom": "18mm", "left": "15mm", "right": "15mm"})
    b.close()
os.remove(tmp)
print("できました →", OUTPDF, os.path.getsize(OUTPDF), "バイト")
