/* =========================================================
   イワオトキノコ ― 日本語 / English 切り替え
   すべてのページで <script src="i18n.js"> を1本読むだけで動きます。
   ・HTML には手を入れず、テキストノードを辞書で置き換えます
   ・JS が後から描画した要素も MutationObserver で追従します
   ・巖さんが管理画面から足した日本語は、訳が無ければそのまま残ります
   ========================================================= */
(function () {
  "use strict";

  var KEY = "kinokoLang";
  var lang = "ja";
  try {
    var q = new URLSearchParams(location.search).get("lang");
    lang = q === "en" || q === "ja" ? q : (localStorage.getItem(KEY) || "ja");
  } catch (e) { lang = "ja"; }

  /* ---------------- 辞書（固定文言） ---------------- */
  var DICT = {
    /* ブランド・ナビ */
    "イワオトキノコ": "IWAO to KINOKO",
    "ZUKAN ― 図鑑": "ZUKAN ― Field Guide",
    "BOOK ― 書籍プレビュー": "BOOK ― Book preview",
    "DIARY ― 採集日誌": "DIARY ― Foraging diary",
    "GAME ― きのこクイズ": "GAME ― Mushroom quiz",
    "HIKE ― きのこ山歩き": "HIKE ― Mountain walk",
    "8BIT ― キノコハンター IWAO": "8BIT ― Hunter IWAO",
    "← ホームへ": "← Home",
    "← もどる": "← Back",
    "← クイズへ": "← Quiz",
    "◀ イワオトキノコ": "◀ IWAO to KINOKO",
    "メインナビ": "Main navigation",
    "メニュー": "Menu",
    "ホーム": "Home",
    "図鑑": "Field guide",
    "書籍": "Book",

    /* ヒーロー */
    "長岡 ｜ 山のキノコ採集アーカイブ": "Nagaoka ｜ A mountain mushroom archive",
    "長岡の森が育む、": "Small lives,",
    "小さな命の記録。": "raised by the forests of Nagaoka.",
    "長岡の森が育む、小さな命の記録。": "Small lives, raised by the forests of Nagaoka.",
    "新潟県・長岡市の山を、十年以上。": "More than ten years in the mountains of Nagaoka, Niigata.",
    "石原巖が歩いて出会ったキノコたちの、": "Every mushroom Iwao Ishihara met on foot —",
    "採れた日・場所・環境・覚え書きを一枚ずつ。": "the date, the place, the habitat, the notes, one by one.",
    "雪国の森が育てた、小さな命の図鑑です。": "A field guide to the small lives of a snow-country forest.",
    "記録を見る": "See the records",
    "SCROLL": "SCROLL",

    /* ABOUT */
    "石原 巖 について": "About Iwao Ishihara",
    "新潟県西頸城郡名立町（現・上越市名立区）の生まれ。 雪深い越後の山と海に育ち、長岡市に移り住んでからは 周辺の山を十年以上歩き続けてきました。 春の雪解けから晩秋の初雪前まで、季節ごとに姿を変える森のキノコを訪ね、 採れた日と場所、天気、生えていた木、味や食べ方を一つひとつ書き留めています。":
      "Born in Nadachi, Niigata (now Nadachi, Joetsu City). Raised among the deep-snow mountains and the sea of Echigo, he moved to Nagaoka and has walked the surrounding mountains for more than ten years. From the spring thaw to the first snow of late autumn, he visits the forest mushrooms as they change with the season, writing down each catch — the date and the place, the weather, the tree it grew on, its taste and how to cook it.",
    "キノコは同じ木に毎年のように顔を出すもの。 足が覚えた「シロ」を巡り、似た毒キノコを見分けながら、 山の恵みと危うさの両方を記録してきました。 このサイトは、その十年以上の覚え書きをまとめたものです。":
      "Mushrooms come back to the same tree year after year. Walking the \"shiro\" — the spots his feet remember — and telling them apart from their poisonous look-alikes, he has recorded both the gifts and the dangers of the mountain. This site gathers more than ten years of those notes.",
    "出身": "Born",
    "新潟県西頸城郡名立町（現・上越市名立区）": "Nadachi, Niigata (now Nadachi, Joetsu City)",
    "採集地": "Location",
    "新潟県 長岡市 周辺の山": "The mountains around Nagaoka, Niigata",
    "記録期間": "Period",
    "十年以上（since 2013）": "Over ten years (since 2013)",
    "記録数": "Records",
    "森に分け入り、キノコを探す石原 巖": "Iwao Ishihara, deep in the woods, looking for mushrooms",

    /* GALLERY / COLUMN */
    "キノコの記録": "The mushroom records",
    "採集した日付や場所、生えていた環境とともに記録しています。": "Each mushroom is recorded with the date, the place and the habitat it grew in.",
    "気になるキノコをタップすると、詳しい記録をご覧いただけます。": "Tap any mushroom to open its full record.",
    "すべての記録を見る": "See every record",
    "コラム": "Column",
    "キノコ歩き十余年の覚え書き。採集のコツ、季節の楽しみ、毒キノコの見分け方など。":
      "Notes from over ten years of mushroom walking — tips for foraging, the pleasures of each season, how to tell the poisonous ones apart.",
    "今日の1問": "Today's question",
    "TODAY'S QUIZ": "TODAY'S QUIZ",
    "この写真は、何のキノコ？": "Which mushroom is this?",
    "答えを見る": "Show the answer",
    "クイズで遊ぶ": "Play the quiz",
    "ごあいさつ": "Foreword",
    "エッセイ": "Essay",
    "採集のコツ": "Foraging tips",
    "安全": "Safety",
    "食べ方": "Cooking",

    /* コラム本文（現在の5本） */
    "はじめに ― 父の記録を、ここに": "Foreword ― My father's records, gathered here",
    "このサイトをつくった理由。父が長岡の山で積み重ねてきた記録を、ここから。":
      "Why this site exists: my father's years of records from the mountains of Nagaoka, starting here.",
    "― 息子": "― His son",
    "このサイトは、父が長年長岡の地で営んできたキノコ狩りの記録です。":
      "This site is the record of the mushroom hunting my father has practised for many years here in Nagaoka.",
    "引退後、この地での採集の記録を皆さんに知ってもらいたいという思いで作りました。":
      "After his retirement, I built it because I wanted people to know what he had gathered in this place.",
    "現地で、自分の足で集めた情報の価値は、とても重要だと思います。":
      "Knowledge collected on the ground, on one's own feet, is worth a great deal.",
    "父の「好き」が、長岡の地、新潟、日本、そして世界へと広がれば面白いなと思っています。":
      "It would be a fine thing if what my father loves spread out from Nagaoka to Niigata, to Japan, and to the world.",
    "はじめてのキノコ採集": "Your first mushroom hunt",
    "山に入る前にそろえたい道具と、最初の一本を安全に持ち帰るための心得。":
      "What to bring before you enter the mountain, and how to bring your first mushroom home safely.",
    "雨上がりこそ、山へ": "Go up right after the rain",
    "キノコが一斉に顔を出すタイミングの読み方。気温と雨の関係。":
      "How to read the moment mushrooms all appear at once — temperature and rainfall.",
    "似たもの同士 ― 毒キノコの見分け方": "Look-alikes ― telling the poisonous ones apart",
    "新潟で中毒が多いツキヨタケ、クサウラベニタケ、ニガクリタケ。見分けの要点。":
      "Tsukiyotake, Kusaurabenitake and Nigakuritake cause most poisonings in Niigata. The key points.",
    "山の恵みを食卓へ": "From the mountain to the table",
    "ナメコおろし、コウタケ飯、マイタケの天ぷら。天然キノコの味わい方。":
      "Nameko with grated radish, koutake rice, maitake tempura — how to enjoy wild mushrooms.",

    /* フッター */
    "採集場所の一部は保全のため非公開としています。": "Some locations are withheld to protect the sites.",
    "食毒の最終判断はご自身の責任で。少しでも不安なキノコは食べないでください。":
      "Any final decision about edibility is your own responsibility. If you have the slightest doubt, do not eat it.",
    "採集場所の一部は保全のため表記をぼかしています。食毒の最終判断はご自身の責任で。":
      "Some locations are blurred to protect the sites. Any final decision about edibility is your own responsibility.",
    "石原 巖 ｜ 長岡キノコ採集記録": "Iwao Ishihara ｜ Nagaoka Mushroom Records",

    /* 図鑑 */
    "キノコの全記録": "The complete records",
    "長岡の山で出会ったキノコたち。検索や食毒で絞り込み、図鑑モードで一覧できます。":
      "Every mushroom met in the mountains of Nagaoka. Filter by search or edibility, or switch to grid mode.",
    "記録の概要": "Summary",
    "採集記録": "Records",
    "種類": "Species",
    "年にわたる記録": "Years covered",
    "採集エリア": "Areas",
    "並び順": "Sort",
    "採集日が新しい順": "Newest first",
    "採集日が古い順": "Oldest first",
    "和名（五十音）": "Japanese name (a–z)",
    "おすすめ度": "Rating",
    "図鑑モード": "Grid mode",
    "通常モード": "List mode",
    "すべて": "All",
    "食用": "Edible",
    "毒": "Poisonous",
    "食不適": "Not for eating",
    "不詳": "Unknown",
    "該当する記録がありません。": "No matching records.",
    "キノコ名・採集場所で検索…": "Search by mushroom or place…",
    "検索": "Search",
    "📖 書籍用に出力": "📖 Book layout",
    "⚠ 似た毒キノコに注意": "⚠ Has poisonous look-alikes",

    /* モーダルの見出し */
    "採集日": "Date",
    "科": "Family",
    "別名": "Other names",
    "標高": "Elevation",
    "発生環境": "Habitat",
    "共生・宿主": "Host",
    "季節": "Season",
    "天候": "Weather",
    "採集量": "Amount",
    "味・食べ方": "Taste & cooking",
    "覚え書き": "Notes",
    "注意・似たキノコ": "Caution & look-alikes",
    "判別に注意が必要です。": "Identify with care.",
    "春": "Spring", "夏": "Summer", "秋": "Autumn", "冬": "Winter",

    /* 日誌 */
    "採集日誌": "Foraging diary",
    "いつ・どこで・どのキノコに出会ったか。日々の採集の記録です。":
      "When, where and which mushroom — the day-to-day record of the walks.",
    "採集の記録": "Diary entries",
    "のべ種類": "Species mentioned",
    "採取のめやす（適期・場所）を見る": "Show the best-season guide (timing & places)",
    "採取時期": "Best season",
    "採取場所": "Place",
    "備考": "Notes",
    "日誌を読み込んでいます…": "Loading the diary…",
    "日誌を読み込めませんでした。": "The diary could not be loaded.",

    /* 書籍プレビュー */
    "書籍プレビュー": "Book preview",
    "長岡きのこ採集記 ｜ 書籍プレビュー（印刷・PDF出力）": "Nagaoka Mushroom Records ｜ Book preview (print / PDF)",
    "本のデータを読み込んでいます…": "Loading the book…",
    "🖨 印刷 / PDFで保存": "🖨 Print / Save as PDF",
    "印刷 / PDFで保存": "Print / Save as PDF",
    "用紙：A4": "Paper: A4",
    "余白：標準": "Margins: normal",
    "背景のグラフィック：オン": "Background graphics: on",
    "（写真の色を濃く出したい場合は": "(to print the photos richly, turn on",
    "はじめに": "Foreword",
    "目次": "Contents",
    "索引": "Index",
    "索引（和名・学名）": "Index (Japanese & scientific names)",
    "和名（五十音順）": "Japanese names (kana order)",
    "学名（アルファベット順）": "Scientific names (A–Z)",
    "奥付": "Colophon",
    "書名": "Title",
    "著者": "Author",
    "発行日": "Date of issue",
    "収録記録数": "Records included",
    "⚠ 注意・似たキノコ": "⚠ Caution & look-alikes",
    "データを読み込めませんでした。": "The data could not be loaded.",
    "ローカルで開く場合は簡易サーバー（python3 -m http.server）経由でご覧ください。":
      "When opening locally, serve the folder (e.g. python3 -m http.server).",
    "食毒の最終判断は、必ずご自身の責任で。少しでも不安なキノコは、口にしないでください。「採らない勇気」こそ、十年以上続けてきた一番の秘訣です。":
      "Any final decision about edibility must be your own. If a mushroom worries you at all, do not eat it. The courage NOT to pick is the single greatest secret of these ten-plus years.",

    /* ゲーム */
    "きのこクイズ": "Mushroom quiz",
    "モードを選ぶ": "Choose a mode",
    "名前あて": "Name it",
    "写真から名前を4択で当てる（全10問）": "Pick the name from four choices (10 questions)",
    "食毒あて": "Edible or not",
    "食べられる？毒？を当てる（全10問）": "Edible or poisonous? (10 questions)",
    "神経衰弱": "Memory",
    "写真と名前のペアを合わせる": "Match each photo to its name",
    "タイムアタック": "Time attack",
    "60秒で何問正解できるか": "How many can you get in 60 seconds?",
    "本物のキノコ写真": "Real mushroom photos",
    "石原さんが長岡で撮った": "taken by Iwao in Nagaoka",
    "で挑戦！": "— give it a try!",
    "やさしい": "Easy",
    "ふつう": "Normal",
    "むずかしい": "Hard",
    "もう一度": "Play again",
    "やめる": "Quit",
    "次へ →": "Next →",
    "スコア": "Score",
    "のこり": "Left",
    "秒": "s",
    "回": "",
    "読み込み中…": "Loading…",
    "きのこ山歩き": "Mountain walk",
    "巖さんと山を歩く採集アドベンチャー。写真だけで「採る／採らない」を判断、毒を採ると体力が減る。上級者向け。":
      "A foraging adventure with Iwao. Judge \"pick it or leave it\" from the photo alone; picking poison costs you health. For the confident.",
    "キノコハンター IWAO": "Mushroom Hunter IWAO",
    "ファミコン風アクション。ドット絵の巖さんと山を進み、本物の写真を見て A=とる／B=とばす。ステージ制・ハイスコア。":
      "Famicom-style action. Walk the mountain as pixel Iwao; look at the real photo and press A to pick, B to skip. Stages and high scores.",

    /* 山歩き */
    "巖さんと山を歩いて、キノコを採ろう。": "Walk the mountain with Iwao and gather mushrooms.",
    "あそびかた": "How to play",
    "山道でキノコを": "When you find a mushroom on the trail",
    "を見て「採る？採らない？」を判断。毒を採ると体力が減るよ。":
      " — decide whether to pick it or leave it. Picking poison costs you health.",
    "山頂（15回の出会い）に着くか、❤️が0になったら終わり": "It ends at the summit (15 encounters) or when ❤️ reaches 0",
    "食べられるキノコを採ると": "Picking an edible mushroom earns ",
    "毒キノコを採ると": "Picking a poisonous mushroom ",
    "毒を見抜いて残せば": "Spotting the poison and leaving it earns ",
    "❤️ が1つ減る": "costs one ❤️",
    "（連続で採るとボーナス）": " (a streak earns a bonus)",
    "設定を変える": "Settings",
    "むずかしさ": "Difficulty",
    "名前つき": "With names",
    "写真だけ": "Photo only",
    "写真だけ・5秒": "Photo only · 5s",
    "10秒": "10s", "8秒": "8s",
    "毒が多い": "more poison",
    "季節（景色と出やすいキノコが変わる）": "Season (changes the scenery and what appears)",
    "あそぶ人数": "Players",
    "🧑 ひとりで": "🧑 Solo",
    "👥 ふたりで対戦": "👥 Two players",
    "🔊 効果音 ON": "🔊 Sound ON",
    "🥾 山へ出発！": "🥾 Set off!",
    "もう一度 山へ": "Back to the mountain",
    "📖 発見図鑑": "📖 Discoveries",
    "🧺 カゴの中身": "🧺 In the basket",
    "🧺 カゴに入れる": "🧺 Put in the basket",
    "🍃 そっとしておく": "🍃 Leave it be",
    "🍄 キノコを見つけた！": "🍄 A mushroom!",
    "このキノコ、採る？": "Pick this one?",
    "食べられると思う": "I think it's edible",
    "あやしい・毒かも": "Looks suspicious",
    "山道を歩いています…": "Walking the trail…",
    "山のデータを読み込んでいます…": "Loading the mountain…",
    "登山口": "Trailhead", "山頂": "Summit", "朝": "Morning",
    "+10点": "+10", "+5点": "+5",
    "※ゲームは学習用です。実際の採集では必ず図鑑・専門家で確認してください。":
      "* This game is for learning. In the field, always confirm with a guide or an expert.",
    "※あそび用です。本物の採集は図鑑・専門家で確認を。":
      "* Just a game. In the field, always confirm with a guide or an expert.",
    "♪ おと ON": "♪ Sound ON",
    "キーボード：": "Keyboard:",
    "スペース": "Space",
    "＝A（とる）　": "= A (pick)　",
    "＝B（とばす）　": "= B (skip)　",
    "＝START": "= START",
    "とる": "pick", "とばす": "skip",
    "山歩きへ ▶": "Mountain walk ▶",

    /* 採集地 */
    "東山": "Higashiyama",
    "悠久山公園": "Yukyuzan Park",
    "悠久山 公園": "Yukyuzan Park",
    "東山公園": "Higashiyama Park",
    "乙吉町地内": "Otoyoshi-cho",
    "乙吉町": "Otoyoshi-cho",
    "乙吉町地区": "Otoyoshi-cho",
    "乙吉地内": "Otoyoshi area",
    "桝形山自然公園": "Masugatayama Nature Park",
    "桝形山公園": "Masugatayama Park",
    "桝形山": "Masugatayama",
    "越路中": "Koshiji",
    "越後おぐに森林公園": "Echigo-Oguni Forest Park",
    "おぐに森林公園": "Oguni Forest Park",
    "悠久山": "Yukyuzan",
    "めし塚公園": "Meshizuka Park",
    "巴ヶ丘自然公園": "Tomoegaoka Nature Park",
    "斑尾高原": "Madarao Highland",
    "酒造モミジ園": "Shuzo Momiji Garden",
    "アサヒ酒造モミジ園": "Asahi-Shuzo Momiji Garden",
    "長谷川運動公園": "Hasegawa Sports Park",
    "妙高池の平": "Myoko Ikenotaira",
    "東山自然公園": "Higashiyama Nature Park",
    "大池県民いこいの森": "Oike Prefectural Forest",
    "上越自宅": "Joetsu (home)",
    "自宅": "Home",
    "自宅栽培": "Home-grown",
    "自宅プラタン": "Home (planter)",
    "南陽公園": "Nanyo Park",
    "東山地内": "Higashiyama area",
    "竹之高地（キノコ会長畑）": "Takenokochi (a friend's field)",
    "竹之高地": "Takenokochi",
    "妙見神社": "Myoken Shrine",
    "阿賀野市 五頭山麓県民いこいの森": "Agano ― Gozu Foothills Forest",
    "安田 五頭山麓県民いこいの森": "Yasuda ― Gozu Foothills Forest",
    "十和田湖": "Lake Towada",
    "東山公園(ブナ平)": "Higashiyama Park (Buna-daira)",
    "東山(ブナ平)": "Higashiyama (Buna-daira)",
    "栃尾地内": "Tochio area",
    "高床山(旧中郷）": "Takatokoyama (former Nakago)",
    "八方台": "Happodai",
    "今宮公園": "Imamiya Park",
    "名立自宅": "Nadachi (home)",
    "柿町": "Kakimachi",

    /* ── 図鑑・日誌の項目値 ── */
    "キノコ図鑑 ｜ イワオトキノコ": "Field guide ｜ IWAO to KINOKO",
    "石原巖が長岡の山で採集したキノコの全記録。検索・食毒での絞り込み・図鑑モードに対応。":
      "Every mushroom Iwao Ishihara gathered in the mountains of Nagaoka — searchable, filterable by edibility, with a grid view.",
    "新潟県長岡市の山を十年以上歩いて記録した、石原巖のキノコ採集アーカイブ。長岡の森が育む、小さな命の記録。":
      "Iwao Ishihara's mushroom archive, recorded over more than ten years in the mountains of Nagaoka, Niigata. Small lives, raised by the forests of Nagaoka.",
    "石原巖の採集日誌（2015〜2020）。いつ・どこで・どのキノコに出会ったかの日々の記録。":
      "Iwao Ishihara's foraging diary (2015–2020): when, where and which mushroom, day by day.",
    "石原巖のキノコ採集記録を、そのまま製本できる本のレイアウトで出力します。印刷ダイアログから「PDFで保存」を選ぶと書籍用の原稿になります。":
      "Lays out the whole archive as a book you can bind. Choose \"Save as PDF\" in the print dialog to get the manuscript.",
    "和名・学名・場所・環境で検索…": "Search by name, place or habitat…",
    "絞り込み": "Filter",
    "食毒で絞り込み": "Filter by edibility",
    "並び順": "Sort",
    "Language / 言語": "Language / 言語",

    /* 食毒・味の記述 */
    "食": "Edible", "可食": "Edible", "(食)": "(edible)", "(可食)": "(edible)",
    "食毒不明": "Edibility unknown", "(食毒不明)": "(edibility unknown)",
    "食土不明": "Edibility unknown", "不明": "Unknown",
    "食用価値なし": "No culinary value", "?食用価値なし": "No culinary value",
    "食の価値ない": "No culinary value",
    "食用に適さない": "Not suitable for eating",
    "食用にしない方が良い": "Better not eaten",
    "食しない": "Not eaten",
    "美味": "Delicious", "老菌": "Past its prime",
    "生食厳禁": "Never eat raw",
    "加熱すれば食することが出来る。": "Edible once thoroughly cooked.",
    "本種で軽い中毒種がある": "Some in this group cause mild poisoning",
    "本種で軽い中毒種がある。": "Some in this group cause mild poisoning.",
    "湯がいてから使用。過食に注意": "Parboil before use; do not overeat",
    "湯がいてから使用する。過食に注意": "Parboil before use; do not overeat",
    "煮こぼしする。": "Parboil and discard the water.",
    "煮こぼし塩漬けにする": "Parboil, then salt-cure",
    "栽培": "Cultivated", "室内栽培": "Indoor cultivation", "自宅栽培": "Home-grown",

    /* 天気 */
    "晴": "Sunny", "曇": "Cloudy", "雨": "Rain", "雪": "Snow",
    "霙": "Sleet", "霧": "Fog", "雷": "Thunder", "風": "Windy", "嵐": "Storm",

    /* 数量 */
    "小量": "small", "少量": "a few", "多量": "many", "大量": "a lot",
    "適量": "some", "採取": "picked",

    /* 書籍 */
    "長岡きのこ採集記": "Nagaoka Mushroom Field Notes",
    "石原 巖": "Iwao Ishihara",
    "石原巖": "Iwao Ishihara",
    "このページは「本のレイアウト」です。右上の": "This page is the book layout. Press",
    "を押し、 印刷ダイアログで": "at the top right, then in the print dialog choose",
    "を押し、印刷ダイアログで": "at the top right, then in the print dialog choose",
    "）を選ぶと、そのまま製本用のPDFになります。": ") and you get a print-ready PDF.",
    "本書は Web サイト「イワオトキノコ」より自動生成した書籍用原稿です。":
      "This manuscript is generated automatically from the website \"IWAO to KINOKO\".",
    "© 石原 巖 ｜ 長岡キノコ採集記録 無断転載を禁じます。":
      "© Iwao Ishihara ｜ Nagaoka Mushroom Records. All rights reserved.",
    "キノコは同じ木に毎年のように顔を出すもの。足が覚えた「シロ」を巡り、似た毒キノコを見分けながら、山の恵みと危うさの両方を記録してきました。本書は、その十年以上の覚え書きをまとめたものです。":
      "Mushrooms come back to the same tree year after year. Walking the \"shiro\" — the spots his feet remember — and telling them apart from their poisonous look-alikes, he has recorded both the gifts and the dangers of the mountain. This book gathers more than ten years of those notes.",
    "新潟県西頸城郡名立町（現・上越市名立区）の生まれ。雪深い越後の山と海に育ち、長岡市に移り住んでからは周辺の山を十年以上歩き続けてきました。春の雪解けから晩秋の初雪前まで、季節ごとに姿を変える森のキノコを訪ね、採れた日と場所、天気、生えていた木、味や食べ方を一つひとつ書き留めています。":
      "Born in Nadachi, Niigata (now Nadachi, Joetsu City). Raised among the deep-snow mountains and the sea of Echigo, he moved to Nagaoka and has walked the surrounding mountains for more than ten years. From the spring thaw to the first snow of late autumn, he visits the forest mushrooms as they change with the season, writing down each catch — the date and the place, the weather, the tree it grew on, its taste and how to cook it.",

    /* コラム本文（全文） */
    "キノコ採りは、長靴とカゴ、そして小さなナイフがあれば始められます。ただし「採れること」より先に覚えたいのは「採らない勇気」です。少しでも分からないキノコは口にしない――この一線を守るだけで、山は驚くほど豊かな場所になります。":
      "Boots, a basket and a small knife are all you need to start. But before learning how to pick, learn the courage not to pick. Never put in your mouth a mushroom you are not sure of — hold that one line, and the mountain becomes a surprisingly generous place.",
    "はじめは、誰かが採っている安全な里山のアカマツ林から。アミタケやハナイグチのような見分けやすい種から覚えていくと、目が自然と『キノコの居場所』に慣れていきます。":
      "Begin in a safe red-pine wood near the village, one that others already forage. Learn the easy ones first — Suillus species such as amitake and hanaiguchi — and your eye soon learns where mushrooms live.",
    "キノコは、まとまった雨の数日後にどっと出ます。とくに秋、気温がぐっと下がった後の雨上がりは狙い目。前の週に空振りだった倒木が、翌週には一面のナメコに変わっていることも珍しくありません。":
      "Mushrooms come up all at once a few days after a good rain. Autumn, just after the rain that follows a sharp drop in temperature, is the moment. A fallen log that was bare last week is often covered in nameko the next.",
    "長岡の山は雪が早い。初雪の前、晩秋の冷え込みに合わせてムキタケやヒラタケが出始めます。天気予報の気温と雨を見ながら、山に入る日を決めるのも楽しみのひとつです。":
      "Snow comes early to the mountains of Nagaoka. Before the first fall, as late autumn turns cold, mukitake and oyster mushrooms begin. Choosing the day to go up by watching the forecast is part of the pleasure.",
    "新潟県で食中毒がいちばん多いのは、ブナの倒木に出る猛毒ツキヨタケ。ムキタケやヒラタケと間違えやすいので、必ず縦に裂いて、柄の付け根に黒紫色のシミが無いかを確かめます。":
      "The commonest poisoning in Niigata is tsukiyotake, the deadly species on fallen beech. It is easily mistaken for mukitake or oyster mushroom, so always split it lengthwise and check the stem base for a blackish-purple stain.",
    "ウラベニホテイシメジに化けるクサウラベニタケ、クリタケにそっくりなニガクリタケも要注意。『迷ったら採らない・食べない』が、十年以上続けてきた一番の秘訣です。":
      "Watch out too for kusaurabenitake, which passes for urabenihoteishimeji, and nigakuritake, the image of kuritake. \"If in doubt, don't pick and don't eat\" is the single greatest secret of these ten-plus years.",
    "持ち帰ったキノコは、その日のうちに下処理を。ナラタケのように加熱が必須のものは、よく茹でこぼしてから。":
      "Prepare what you bring home the same day. Anything that must be cooked, like honey fungus, should be parboiled and the water thrown away.",
    "天然ナメコのぬめりとおろしの相性、乾燥させたコウタケで炊くご飯の香り、揚げたてのマイタケの天ぷら――栽培物では出せない、森の味がそこにあります。採る楽しみは、食べる楽しみまで続いています。":
      "Wild nameko's slipperiness against grated radish, the scent of rice cooked with dried koutake, maitake tempura straight from the pan — a taste of the forest no farmed mushroom can give. The pleasure of picking runs right through to the pleasure of eating.",

    /* ゲーム・山歩きの断片 */
    "石原さんが長岡で撮った": "Try it with ",
    "本物のキノコ写真": "real mushroom photos",
    "で挑戦！": " taken by Iwao in Nagaoka!",
    "※クイズは学習用です。実際の採集では必ず図鑑や専門家で確認し、少しでも不安なキノコは食べないでください。":
      "* This quiz is for learning. In the field always confirm with a guide or an expert, and never eat a mushroom you are unsure of.",
    "見つけたキノコ": "the mushroom you find",
    "見つけたら": ",",
    "を選ぶ": ".",
    "か": " or ",
    "、時間内に": " choose within the time limit: ",
    "。毒を見抜いて残せば": ". Spot the poison and leave it and you get ",
    "＝A（とる）": "= A (pick)",
    "＝B（とばす）": "= B (skip)",
    "大平森林公園": "Odaira Forest Park",

    /* ── 日誌の採集地 ── */
    "出雲崎": "Izumozaki",
    "越後小国森林公園": "Echigo-Oguni Forest Park",
    "小国森林公園": "Oguni Forest Park",
    "朝日酒造もみじ園": "Asahi-Shuzo Momiji Garden",
    "朝日酒造モミジ園": "Asahi-Shuzo Momiji Garden",
    "東山ファミリーランド": "Higashiyama Family Land",
    "飯塚公園": "Iizuka Park",
    "飯塚公園・桝形山": "Iizuka Park / Masugatayama",
    "大池いこいの森": "Oike Forest Park",
    "いこいの森": "Ikoi-no-Mori Park",
    "ヒュッテ2階": "the hut, 2F",
    "釜沢": "Kamasawa",
    "釜沢町石の道": "Kamasawa, Ishi-no-michi",
    "乙吉": "Otoyoshi",
    "乙由町": "Otoyoshi-cho",
    "悠久山公園・東山": "Yukyuzan Park / Higashiyama",
    "東山・悠久山公園": "Higashiyama / Yukyuzan Park",
    "悠久山・東山": "Yukyuzan / Higashiyama",
    "東山・悠久山": "Higashiyama / Yukyuzan",
    "(東山・悠久山)": "(Higashiyama / Yukyuzan)",
    "(東山)": "(Higashiyama)",
    "(悠久山公園)": "(Yukyuzan Park)",
    "(山の方)": "(up the mountain)",
    "（希望湖）": "(Lake Kibo)",
    "名立": "Nadachi",
    "山田海岸": "Yamada Beach",
    "桝形山砂利林道": "Masugatayama gravel road",
    "桝形山下": "below Masugatayama",
    "増形山": "Masugatayama",
    "濁り沢": "Nigorisawa",
    "東山スキー場": "Higashiyama ski area",
    "東山スキー場2階": "Higashiyama ski lodge, 2F",
    "赤倉温泉": "Akakura Onsen",
    "赤松山森林公園": "Akamatsuyama Forest Park",
    "寺泊": "Teradomari", "寺泊港": "Teradomari Port",
    "寺泊・出雲崎": "Teradomari / Izumozaki",
    "妙高市": "Myoko City",
    "笹ヶ峰牧場": "Sasagamine pasture",
    "笹崎": "Sasazaki",
    "中央病院": "the central hospital",
    "公園": "the park",
    "五頭山麓県民": "Gozu Foothills Forest",
    "十日町市松代": "Matsudai, Tokamachi",
    "戸隠神社": "Togakushi Shrine",
    "愛の風公園": "Ai-no-Kaze Park",
    "柏崎市科学博物館": "Kashiwazaki Science Museum",
    "越路河川公園": "Koshiji Riverside Park",
    "越路総合福祉センター": "Koshiji Welfare Centre",
    "越路中脇松林": "Koshiji, the pine wood",
    "雁田神社公園": "Karita Shrine Park",
    "高柳県立こども自然": "Takayanagi Children's Nature Park",
    "採集場所": "the usual spot",
    "PM悠久山": "PM Yukyuzan",

    "イワオトキノコ ｜ 長岡の森が育む、小さな命の記録。": "IWAO to KINOKO ｜ Small lives, raised by the forests of Nagaoka.",
    "フッターナビ": "Footer navigation",
    "閉じる": "Close",
    "キノコの写真": "mushroom photo",
    "難易度": "Difficulty",
    "写真": "Photo",

    /* ── クイズ・山歩きの実行中テキスト ── */
    "このキノコの名前は？": "What is this mushroom?",
    "このキノコ、食べられる？": "Is this one edible?",
    "結果を見る →": "See the results →",
    "自己ベスト更新！ 🎉": "New personal best! 🎉",
    "最短記録を更新！ 🎉": "New fastest clear! 🎉",
    "⭕ 正解！": "⭕ Correct!",
    "❌ 残念…": "❌ Not quite…",
    "🌟 お見事！": "🌟 Superb!",
    "🏆 全問正解！キノコ博士！": "🏆 All correct — a true mushroom expert!",
    "🏆 達人級！": "🏆 Master level!",
    "🏆 パーフェクト記憶！": "🏆 Perfect memory!",
    "🍄 いい調子！": "🍄 Nice going!",
    "🍄 なかなか！": "🍄 Not bad!",
    "🍄 クリア！": "🍄 Cleared!",
    "🌱 また挑戦！": "🌱 Try again!",
    "🌱 これから覚えていきましょう": "🌱 Plenty still to learn",
    "🍽 食べられる": "🍽 Edible",
    "😖 食べない方がいい": "😖 Better not eaten",
    "☠️ 毒": "☠️ Poison",
    "手数": "Moves",
    "石原巖が長岡で採集した本物のキノコ写真で挑戦する、名前あて・食毒あて・神経衰弱・タイムアタック。":
      "Name it, edible-or-not, memory and time attack — all played with real mushroom photos taken by Iwao Ishihara in Nagaoka.",
    "⏱ 時間切れ…": "⏱ Time's up…",
    "⏱ 時間切れ…でも毒！セーフ": "⏱ Time's up… but it was poisonous. Safe!",
    "☠️ 毒キノコだった！": "☠️ That one was poisonous!",
    "⭕ 食べられる！": "⭕ Edible!",
    "あなた": "You",
    "体力がなくなった…": "Out of health…",
    "たいりょくが なくなった…": "Out of health…",
    "どちらも体力切れ": "Both out of health",
    "引き分け！": "A draw!",
    "山頂に到着": "Summit reached",
    "山頂に着いた！": "You reached the summit!",
    "もったいない…": "What a waste…",
    "みのがした…": "Missed it…",
    "まずい… -50": "Bad call… -50",
    "たべない キノコ +20": "Left it alone +20",
    "どくを みぬいた! +50": "Spotted the poison! +50",
    "名前はナイショ。写真で見きわめて！": "No names — judge from the photo!",
    "ふたり対戦：交代でキノコを判断。スコアが高いほうの勝ち！":
      "Two players: take turns judging. The higher score wins!",
    "巖さんと山を歩いてキノコを採る採集アドベンチャー。本物の写真を見て「採る／採らない」を判断しよう。":
      "A foraging adventure: walk the mountain with Iwao and decide, from a real photo, whether to pick or leave.",
    "8ビット風アクション。ドット絵の巖さんと山を進み、本物のキノコ写真を見て A=とる B=とばす。":
      "8-bit action: advance through the mountain as pixel Iwao and, from a real photo, press A to pick or B to skip.",
    "ファミコンふう キノコさいしゅう アクション": "Famicom-style mushroom-foraging action",
    "A=とる B=とばす": "A = pick, B = skip",
    "♪ おと OFF": "♪ Sound OFF",
    "昼": "Midday", "夕方": "Evening",
    "・無傷": " · unhurt",
    " ／ ": " / ",

    /* ── きのこつみ ── */
    "きのこつみ": "Mushroom Stack",
    "きのこつみ ｜ イワオトキノコ": "Mushroom Stack ｜ IWAO to KINOKO",
    "STACK ― きのこつみ": "STACK ― Mushroom Stack",
    "落ちてきたキノコが自然に積み重なる。同じキノコが3つくっつくとポンッと大きく育つ。モミタケまで育てられるかな？":
      "Mushrooms tumble down and pile up. Three of a kind touching pop into something bigger. Can you grow one all the way to a momitake?",
    "落ちてきたキノコが自然に積み重なる。同じキノコが3つくっつくと、ポンッと大きなキノコに育つ落ちものゲーム。":
      "A falling-block game where mushrooms pile up naturally and three of a kind pop into a bigger one.",
    "落ちてきたキノコが、自然に積み重なる。": "Mushrooms tumble down and pile up, just as they fall.",
    "同じキノコが3つくっつくと、ポンッと大きく育ちます。": "Three of a kind touching pop into something bigger.",
    "つぎ": "Next", "ベスト": "Best", "おとす": "Drop",
    "そだつ順番（小 → 大）": "How they grow (small → large)",
    "左右に動かして": "Move left and right, then",
    "。キノコは山の斜面のように自然に転がって積もります。": ". They roll and settle like mushrooms on a slope.",
    "同じキノコが": "When",
    "3つくっつく": "three of a kind touch",
    "と、ポンッと1つ上のキノコに育ちます。": ", they pop into the next mushroom up.",
    "続けて育つと": "Keep them going for a",
    "れんさボーナス": "chain bonus",
    "。大きいほど点が高い。": ". The bigger the mushroom, the more points.",
    "いちばん大きな": "Get",
    "モミタケが3つ": "three momitake",
    "つながると": "together for a",
    "大爆発": "huge explosion",
    "！ まわりごと消えて大量得点。": "! Everything nearby is cleared for a big score.",
    "赤い線より上にキノコが積もったままになると終わりです。": "If mushrooms come to rest above the red line, the game ends.",
    "キーボード：← → で移動、スペース／↓ でおとす": "Keyboard: ← → to move, Space / ↓ to drop",
    "おしまい": "Game over",
    "自己ベスト！": "Personal best!",
    "もう一度": "Play again",
    "左へ": "Left", "右へ": "Right",

    /* ── きのこマッチパズル ── */
    "きのこマッチパズル": "Mushroom Match",
    "きのこマッチパズル ｜ イワオトキノコ": "Mushroom Match ｜ IWAO to KINOKO",
    "MATCH ― きのこマッチパズル": "MATCH ― Mushroom Match",
    "同じキノコを3つつなげて、キノコを育てよう。": "Line up three of a kind and grow your mushrooms.",
    "大きくなったキノコがはじけると、森に胞子が舞う。": "When a grown mushroom bursts, spores drift through the forest.",
    "同じキノコを3つつなげて育てよう。大きくなったキノコをさらに3つつなげると、はじけて森に胞子が舞う。30手でどこまで伸ばせるか。":
      "Line up three of a kind to grow them. Line up three grown ones and they burst, scattering spores. How far can you get in 30 moves?",
    "同じキノコを3つつなげて育てよう。大きくなったキノコがはじけると、森に胞子が舞う。":
      "Line up three of a kind to grow them; when a grown mushroom bursts, spores drift through the forest.",
    "キノコを用意しています…": "Getting the mushrooms ready…",
    "のこり手数": "Moves left",
    "ゲームの流れ": "How it works",
    "となりどうしを入れかえて、": "Swap two neighbours to ",
    "同じキノコを3つつなげる": "line up three of a kind",
    "と…": "…",
    "キノコが": "and the mushroom",
    "1段階大きくなる！": "grows one size bigger!",
    "大きいキノコを": "Line up",
    "さらに3つつなげる": "three grown ones",
    "と、はじけて": "and they burst,",
    "まわりごと消える！": "clearing everything around them!",
    "すきまに": "Mushrooms",
    "キノコが落ちてくる": "fall in to fill the gaps",
    "。つながって消えると": ". Clearing again right away earns a",
    "れんさボーナス": "chain bonus",
    "。": ".",
    "出てくるキノコ": "The mushrooms you will meet",
    "✨ はじける演出を見る": "✨ Watch the burst",
    "スマホは指でなぞって入れかえ、PCはドラッグかクリックで入れかえます。":
      "On a phone, swipe to swap; on a computer, drag or click two neighbours.",
    "森じゅうに胞子が舞った！": "Spores drifted across the whole forest!",
    "よく育てたね": "Nicely grown",
    "また森へおいで": "Come back to the forest",
    "手がないのでまぜ直すよ": "No moves left — shuffling",
    "ベニテングタケ": "Amanita muscaria",
    "ヤマドリタケモドキ": "Boletus reticulatus",
    "マツタケ": "Tricholoma matsutake",
    "カラマツタケ": "Karamatsutake",
    "毒キノコの代表格。鮮やかな赤い傘と白いイボが特徴。森の中でとても目立ちます。":
      "The classic poisonous mushroom — a brilliant red cap with white warts. Hard to miss in the woods.",
    "秋の森に現れる美しいキノコ。傘の裏はひだではなく、スポンジ状の管孔です。":
      "A handsome autumn species. Under the cap are sponge-like pores rather than gills.",
    "香り高く、秋の味覚の王様。松の木の根元に生える希少なキノコです。":
      "Wonderfully fragrant, the king of autumn flavours. A rare find at the foot of pine trees.",
    "ぬめりのある傘が特徴。主に広葉樹の倒木などに群生します。":
      "Known for its slippery cap. It grows in clusters, mostly on fallen broadleaf trees.",
    "美しい紫色のキノコ。カラマツ林に多く、食用としても人気があります。":
      "A beautiful violet mushroom, common in larch woods and popular on the table.",

    /* ── みんなのランキング ── */
    "🎵 音楽 ON": "🎵 Music ON",
    "🎵 音楽 OFF": "🎵 Music OFF",
    "みんなのベスト5": "Everyone's top 5",
    "なまえ（12文字まで）": "Your name (up to 12 characters)",
    "なまえ": "name",
    "登録する": "Register",
    "まだ誰も登録していません。いちばんのりになろう！": "Nobody has registered yet — be the first!",
    "ベスト5に入りました！ 名前を残せます。": "You made the top 5! Leave your name.",
    "登録しています…": "Registering…",
    "うまく登録できませんでした。また試してね。": "That didn't go through. Please try again.",
    "登録しました！": "Registered!",

    /* ページタイトル */
    "採集日誌 ｜ イワオトキノコ": "Foraging diary ｜ IWAO to KINOKO",
    "きのこクイズ ｜ イワオトキノコ": "Mushroom quiz ｜ IWAO to KINOKO",
    "きのこ山歩き ｜ イワオトキノコ": "Mountain walk ｜ IWAO to KINOKO",
    "キノコハンター IWAO ｜ イワオトキノコ": "Mushroom Hunter IWAO ｜ IWAO to KINOKO"
  };

  var MONTH = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  /* ---------------- 規則（パターン） ---------------- */
  var RULES = [
    [/^📅\s*(\d{4})年(\d{1,2})月(\d{1,2})日$/, function (m) { return "📅 " + MONTH[+m[2]-1] + " " + (+m[3]) + ", " + m[1]; }],
    [/^(\d{4})年(\d{1,2})月(\d{1,2})日$/, function (m) { return MONTH[+m[2]-1] + " " + (+m[3]) + ", " + m[1]; }],
    [/^(\d{4})年$/, function (m) { return m[1]; }],
    [/^(\d{1,3})年$/, function (m) { return m[1] + " yrs"; }],
    [/^(\d+)件・(\d+)種を記録$/, function (m) { return m[1] + " records · " + m[2] + " species"; }],
    [/^（(\d+)件）$/, function (m) { return "(" + m[1] + ")"; }],
    [/^(\d+)件$/, function (m) { return m[1]; }],
    [/^(\d+)種$/, function (m) { return m[1]; }],
    [/^(\d+)篇$/, function (m) { return m[1]; }],
    [/^注意：(.*)$/, function (m) { return "Caution: " + tr1(m[1]); }],
    [/^📍\s*(.+)$/, function (m) { return "📍 " + tr1(m[1]); }],
    [/^🌲\s*(.+)$/, function (m) { return "🌲 " + tr1(m[1]); }],
    [/^⚠\s*(.+)$/, function (m) { return "⚠ " + tr1(m[1]); }],
    [/^（(.*)）$/, function (m) { var i = tr1(m[1]); return i === m[1] ? null : "(" + i + ")"; }],
    [/^(.+)のキノコ$/, function (m) { return tr1(m[1]) + " mushrooms"; }],
    [/^（\s*）$/, function () { return ""; }],
    [/^(\d{1,2})月$/, function (m) { return MONTH[+m[1]-1]; }],
    [/^(\d{4})年(\d{1,2})月$/, function (m) { return MONTH[+m[2]-1] + " " + m[1]; }],
    [/^第\s*(\d+)\s*\/\s*(\d+)\s*問$/, function (m) { return "Q " + m[1] + " / " + m[2]; }],
    [/^(\d+)問正解$/, function (m) { return m[1] + " correct"; }],
    [/^正解\s*(\d+)$/, function (m) { return "Correct " + m[1]; }],
    [/^(\d+)手でクリア$/, function (m) { return "cleared in " + m[1] + " moves"; }],
    [/^最短\s*(\d+)手$/, function (m) { return "best " + m[1] + " moves"; }],
    [/^ベスト\s*(.+)$/, function (m) { return "Best " + m[1]; }],
    [/^自己ベスト\s*(.+)$/, function (m) { return "Personal best " + m[1]; }],
    [/^(\d+)ペア$/, function (m) { return m[1] + " pairs"; }],
    [/^出会い(\d+)・正解(\d+)$/, function (m) { return "Seen " + m[1] + " · right " + m[2]; }],
    [/^いちばん大きく育ったのは (.+)$/, function (m) { return "Biggest grown: " + tr1(m[1]); }],
    [/^(\d+)位に登録しました！$/, function (m) { return "Registered at #" + m[1] + "!"; }],
    [/^(.+)が育った！(?:　(\d+)れんさ)?$/, function (m) { return tr1(m[1]) + " grew!" + (m[2] ? "　" + m[2] + " chain" : ""); }],
    [/^はじけた！ 胞子が舞う(?:　(\d+)れんさ)?$/, function (m) { return "Burst! Spores everywhere" + (m[1] ? "　" + m[1] + " chain" : ""); }],
    [/^「(.+)」は…？$/, function (m) { return "Is \u201c" + tr1(m[1]) + "\u201d …?"; }],
    /* 「10月1日～11月5日」などの適期 */
    [/^(\d{1,2})月\s*(\d{1,2})日\s*[～~]\s*(\d{1,2})月\s*(\d{1,2})日$/, function (m) {
      return MONTH[+m[1]-1] + " " + (+m[2]) + " – " + MONTH[+m[3]-1] + " " + (+m[4]);
    }],
    [/^(\d{1,2})月\s*(\d{1,2})日\s*[～~]\s*(\d{1,2})日$/, function (m) {
      return MONTH[+m[1]-1] + " " + (+m[2]) + "–" + (+m[3]);
    }],
    [/^(\d{1,2})月\s*(\d{1,2})日$/, function (m) { return MONTH[+m[1]-1] + " " + (+m[2]); }],
    [/^(\d+)(本|株|個|匹)位$/, function (m) { return "approx. " + m[1]; }],
    [/^(\d+)(本|株|個|匹)$/, function (m) { return m[1]; }],
    [/^(\d+)株$/, function (m) { return m[1]; }],
    [/^(\d+)個$/, function (m) { return m[1]; }],
    /* 天気（・区切り）＋そのあとの覚え書き */
    [/^([晴曇雨雪霙霧雷風嵐](?:・[晴曇雨雪霙霧雷風嵐])*)(\s*・\s*(.*))?$/, function (m) {
      var w = m[1].split("・").map(tr1).join(" / ");
      return m[3] ? w + " · " + m[3] : w;
    }],
    /* 「イグチ科 ／ 桝形山自然公園 ／ 2016年8月」のような区切り行 */
    [/^[^／]+(?:\s*／\s*[^／]+)+$/, function (m) {
      var parts = m[0].split("／").map(function (x) { var y = x.trim(); return tr(y) != null ? tr(y) : y; });
      return parts.join(" / ");
    }],
    /* 「和名（場所）」＝書籍の索引 */
    [/^([^（）]+)（(.+)）$/, function (m) {
      var a = tr(m[1]), b = tr1(m[2]);
      if (a == null && b === m[2]) return null;
      return (a || m[1]) + " (" + b + ")";
    }]
  ];

  /* ---------------- 種名・科名（data/species-en.json） ---------------- */
  var SP = {}, FAM = {};

  function spLabel(ja) {
    var e = SP[ja];
    if (!e) return null;
    return e.sci ? e.sci : e.romaji;
  }

  /* 1語だけ訳す（訳が無ければそのまま返す） */
  function tr1(s) {
    var k = String(s).replace(/\s+/g, " ").trim();
    if (DICT[k] != null) return DICT[k];
    if (FAM[k] != null) return FAM[k];
    if (SP[k]) return spLabel(k);
    return s;
  }

  /* 訳す（見つからなければ null） */
  function tr(s) {
    var k = String(s).replace(/\s+/g, " ").trim();
    if (!k) return null;
    if (DICT[k] != null) return DICT[k];
    if (FAM[k] != null) return FAM[k];
    if (SP[k]) return spLabel(k);
    for (var i = 0; i < RULES.length; i++) {
      var m = k.match(RULES[i][0]);
      if (m) { var r = RULES[i][1](m); if (r != null && r !== k) return r; }
    }
    return null;
  }

  /* ---------------- DOM への適用 ---------------- */
  var SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, NOSCRIPT: 1, CANVAS: 1 };
  var NOTR = ".langbtn, [data-notr]";
  var ATTRS = ["placeholder", "aria-label", "title", "alt", "data-label"];
  var busy = false;
  var gen = 0;

  function walkText(root, fn) {
    if (root.nodeType === 3) { fn(root); return; }
    if (root.nodeType !== 1 && root.nodeType !== 11) return;
    if (root.nodeType === 1 && SKIP[root.tagName]) return;
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var p = n.parentElement;
        if (!p || SKIP[p.tagName] || p.closest(NOTR)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var n; while ((n = w.nextNode())) fn(n);
  }

  function applyNode(n) {
    if (lang === "en") {
      if (n.__en != null && n.textContent === n.__en) {
        if (n.__gen === gen) return;            // すでに最新の辞書で英語化済み
        n.textContent = n.__ja;                 // 辞書が増えたので訳し直す
      }
      n.__gen = gen;
      n.__ja = n.textContent;
      var t = tr(n.__ja);
      if (t != null) {
        var lead = /^\s*/.exec(n.__ja)[0] ? " " : "";
        var tail = /\s*$/.exec(n.__ja)[0] ? " " : "";
        t = lead + t + tail;
        n.__en = t; n.textContent = t;
      } else { n.__en = null; }
    } else {
      if (n.__en != null && n.__ja != null && n.textContent === n.__en) n.textContent = n.__ja;
      n.__en = null;
    }
  }

  function applyEl(el) {
    if (el.nodeType !== 1) return;
    if (el.closest && el.closest(NOTR)) return;
    for (var i = 0; i < ATTRS.length; i++) {
      var a = ATTRS[i], v = el.getAttribute(a);
      if (v == null) continue;
      var ja = "__ja_" + a, en = "__en_" + a;
      if (lang === "en") {
        if (el[en] != null && v === el[en]) {
          if (el["__gen_" + a] === gen) continue;
          v = el[ja];
        }
        el["__gen_" + a] = gen;
        el[ja] = v;
        var t2 = tr(v);
        if (t2 != null) { el[en] = t2; el.setAttribute(a, t2); } else { el[en] = null; el.setAttribute(a, v); }
      } else {
        if (el[en] != null && el[ja] != null && v === el[en]) el.setAttribute(a, el[ja]);
        el[en] = null;
      }
    }
  }

  function apply(root) {
    root = root || document.body;
    if (!root) return;
    busy = true;
    try {
      walkText(root, applyNode);
      if (root.nodeType === 1) {
        applyEl(root);
        var els = root.querySelectorAll ? root.querySelectorAll("*") : [];
        for (var i = 0; i < els.length; i++) applyEl(els[i]);
      }
    } finally { busy = false; }
    applyHead();
  }

  var jaTitle = null, jaDesc = null;
  function applyHead() {
    if (jaTitle == null) jaTitle = document.title;
    var d = document.querySelector('meta[name="description"]');
    if (d && jaDesc == null) jaDesc = d.getAttribute("content");
    if (lang === "en") {
      var t = tr(jaTitle); if (t) document.title = t;
      if (d) { var dd = tr(jaDesc); if (dd) d.setAttribute("content", dd); }
    } else {
      document.title = jaTitle;
      if (d && jaDesc != null) d.setAttribute("content", jaDesc);
    }
    document.documentElement.setAttribute("lang", lang);
    document.documentElement.setAttribute("data-lang", lang);
  }

  /* ---------------- 切り替えボタン ---------------- */
  function makeToggle(cls) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "langbtn " + (cls || "");
    b.setAttribute("aria-label", "Language / 言語");
    b.innerHTML = '<span class="langbtn__ja">日本語</span><span class="langbtn__sep">/</span><span class="langbtn__en">EN</span>';
    b.addEventListener("click", function () { setLang(lang === "ja" ? "en" : "ja"); });
    return b;
  }

  function mountToggle() {
    var rail = document.querySelector(".rail");
    if (rail && !rail.querySelector(".langbtn")) {
      var since = rail.querySelector(".rail__since");
      var t = makeToggle("langbtn--rail");
      if (since) rail.insertBefore(t, since); else rail.appendChild(t);
    }
    document.querySelectorAll(".topbar, .topbar--solid").forEach(function (tb) {
      if (tb.querySelector(".langbtn")) return;
      var burger = tb.querySelector(".hamburger");
      var t = makeToggle("langbtn--bar");
      if (burger) tb.insertBefore(t, burger); else tb.appendChild(t);
    });
    var dr = document.querySelector(".drawer");
    if (dr && !dr.querySelector(".langbtn")) dr.appendChild(makeToggle("langbtn--drawer"));
    // どのナビも無いページ（ゲーム等）は右上に浮かせる
    if (!document.querySelector(".langbtn")) document.body.appendChild(makeToggle("langbtn--float"));
    syncToggle();
  }

  function syncToggle() {
    document.querySelectorAll(".langbtn").forEach(function (b) {
      b.setAttribute("data-lang", lang);
      b.title = lang === "ja" ? "Switch to English" : "日本語に切り替え";
    });
  }

  function setLang(next) {
    lang = next === "en" ? "en" : "ja";
    try { localStorage.setItem(KEY, lang); } catch (e) {}
    apply(document.body);
    syncToggle();
    window.dispatchEvent(new CustomEvent("langchange", { detail: { lang: lang } }));
  }

  /* ---------------- 後から描画される要素に追従 ---------------- */
  var queued = false, pending = [];
  function schedule(nodes) {
    if (nodes) pending.push.apply(pending, nodes);
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () {
      queued = false;
      var list = pending; pending = [];
      if (lang !== "en") return;
      busy = true;
      try {
        for (var i = 0; i < list.length; i++) {
          var n = list[i];
          if (!n || !n.isConnected) continue;
          if (n.nodeType === 3) applyNode(n);
          else { walkText(n, applyNode); applyEl(n);
            var els = n.querySelectorAll ? n.querySelectorAll("*") : [];
            for (var j = 0; j < els.length; j++) applyEl(els[j]); }
        }
      } finally { busy = false; }
    });
  }

  function observe() {
    var mo = new MutationObserver(function (muts) {
      if (busy) return;
      var add = [];
      for (var i = 0; i < muts.length; i++) {
        var m = muts[i];
        if (m.type === "childList") {
          for (var j = 0; j < m.addedNodes.length; j++) add.push(m.addedNodes[j]);
        } else if (m.type === "characterData") add.push(m.target);
      }
      if (add.length) schedule(add);
    });
    mo.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  /* ---------------- 起動 ---------------- */
  function boot() {
    mountToggle();
    apply(document.body);
    observe();
    fetch("data/species-en.json", { cache: "force-cache" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d) return;
        SP = d.species || {}; FAM = d.family || {};
        gen++;
        if (lang === "en") apply(document.body);
      })
      .catch(function () {});
  }

  window.I18N = {
    get lang() { return lang; },
    setLang: setLang,
    t: tr1,
    apply: apply,
    species: spLabel
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
