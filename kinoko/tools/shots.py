#!/usr/bin/env python3
"""管理ページの画面写真を撮る（説明書づくり用）。
   使いかた:  python3 tools/shots.py <出力フォルダ> [URLの先頭]
   ※ あらかじめ web/ を簡易サーバーで配信しておくこと。"""
import sys, os
from playwright.sync_api import sync_playwright

OUT  = sys.argv[1] if len(sys.argv) > 1 else "/tmp/shots"
BASE = sys.argv[2] if len(sys.argv) > 2 else "http://localhost:8899"
EXE  = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"
os.makedirs(OUT, exist_ok=True)

# 📊 と 📬 は Google スプレッドシートにつながっていないと中身が出ないので、
# 説明書の図には「見本のデータ」を流し込む（本物の数字ではありません）。
STUB = """
window.Kinoko = {
  enabled: async () => true,
  stats: async () => ({ ok:true, total: 1842, people: 613,
    days: [["09-10",22],["09-11",31],["09-12",18],["09-13",44],["09-14",26],
           ["09-15",35],["09-16",51],["09-17",29],["09-18",38],["09-19",47]]
          .map(([d,n]) => ({ d: "2026-" + d, n })),
    pages: [{p:"/",n:640},{p:"/zukan.html",n:392},{p:"/nikki.html",n:210},
            {p:"/game.html",n:188},{p:"/goods.html",n:96}] }),
  top: async (g) => (g === "match"
    ? [{name:"みほん１",score:8200},{name:"みほん２",score:6400},{name:"みほん３",score:5100}]
    : [{name:"みほん４",score:3300},{name:"みほん５",score:2900}]),
  posts: async () => ([
    { id:"p1", name:"みほん さん", state:"承認まち", date:"2026-09-20",
      place:"長岡市の雑木林", text:"倒れたブナに10本ほど重なって生えていました。傘は10cmくらいです。",
      photo:"data/photos/rec-003-1.jpg", comments:[] },
    { id:"p2", name:"みほん さん", state:"公開", date:"2026-09-18",
      place:"悠久山公園", text:"これは食べられますか？",
      photo:"data/photos/rec-047-1.jpg",
      comments:[{name:"石原巖",text:"ナメコによく似ていますが、写真だけでは断定できません。",admin:true}] },
  ]),
  moderate: async () => ({ ok:false }), remove: async () => ({ ok:false }),
  addComment: async () => ({ ok:false }), fetchMeta: async () => ({ ok:false }),
  board: () => null, hit: () => {},
};
"""

def shot(pg, name, sel, maxh=560):
    """要素を撮る。長すぎるときは上から maxh ぶんだけ切り取る。"""
    path = os.path.join(OUT, name + ".png")
    pg.locator(sel).first.scroll_into_view_if_needed()
    pg.evaluate("()=>window.scrollBy(0,-24)")
    pg.wait_for_timeout(300)
    box = pg.locator(sel).first.bounding_box()
    h = min(box["height"], maxh)
    pg.screenshot(path=path, clip={"x": box["x"], "y": box["y"], "width": box["width"], "height": h})
    print("  ", name, f'{int(box["width"])}x{int(h)}')

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=EXE)
    ctx = b.new_context(viewport={"width": 880, "height": 900}, device_scale_factor=2)
    pg = ctx.new_page()
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))

    pg.goto(BASE + "/admin.html"); pg.wait_for_timeout(1800)
    shot(pg, "01-login", ".lock__card", 900)

    pg.fill("#pinInput", "100"); pg.click("#pinBtn"); pg.wait_for_timeout(1200)
    pg.evaluate(STUB)                      # 見本データに差し替える
    shot(pg, "02-top", "header.topbar", 200)
    shot(pg, "03-tabs", ".adm-tabs", 200)

    pg.click("#gearBtn"); pg.wait_for_timeout(600)
    shot(pg, "04-settings", "#settingsPanel", 620)
    pg.click("#gearBtn"); pg.wait_for_timeout(300)

    # ここから先は、画面上に貼りついているバーが図に写り込まないよう隠す
    pg.add_style_tag(content=".topbar{ display:none !important; }")
    pg.wait_for_timeout(200)

    # 🍄 キノコ
    pg.click('.adm-tab[data-tab="records"]'); pg.wait_for_timeout(700)
    shot(pg, "05-rec-select", '[data-panel="records"] .adm-editbar', 200)
    shot(pg, "06-rec-form",   '[data-panel="records"] .adm-grid', 480)
    shot(pg, "07-rec-photos", '[data-panel="records"] .adm-photos', 320)
    shot(pg, "08-rec-buttons",'[data-panel="records"] .adm-actions--main', 160)

    # 📝 コラム
    pg.click('.adm-tab[data-tab="columns"]'); pg.wait_for_timeout(700)
    shot(pg, "09-column", '[data-panel="columns"]', 560)

    # 📔 日誌
    pg.click('.adm-tab[data-tab="diary"]'); pg.wait_for_timeout(700)
    shot(pg, "10-diary", '[data-panel="diary"]', 520)

    # 📊 みんなの記録（見本データ）
    pg.click('.adm-tab[data-tab="visits"]'); pg.wait_for_timeout(1600)
    shot(pg, "11-visits", ".adm-stats", 260)
    shot(pg, "11b-bars", "#visDays", 420)
    shot(pg, "11c-rank", "#rankAdmin", 420)

    # 📬 投稿（見本データ）
    pg.click('.adm-tab[data-tab="posts"]'); pg.wait_for_timeout(1600)
    shot(pg, "12-posts", "#pstList", 520)

    print("  pageerror:", errs)
    b.close()
print("できました →", OUT)
