/* インスタ用の見本セーブ。実際のゲームの中で組み立てる */
module.exports = async function seed(p) {
  return p.evaluate(() => {
    localStorage.clear();
    const done = (id, rank, score, pop) =>
      ({ count: 1 + ((score | 0) % 2), best: rank, bestScore: score, bestPop: pop,
         ace: rank === "S" || rank === "A" });
    const ids = FURNITURE.map(f => f.id);
    const picked = ids.slice(0, 18);
    const completed = {};
    picked.forEach((id, i) => {
      const r = ["S", "A", "A", "B", "S", "A"][i % 6];
      completed[id] = done(id, r, [96, 88, 83, 71, 93, 85][i % 6], 12 + (i % 7));
    });
    Object.assign(state, {
      ver: state.ver,
      exp: 1750, level: 7, money: 184000, day: 23, hoursLeft: 6,
      guide: 2, focus: 88, flaws: 0, tool: "normal",
      completed,
      player: { name: "くるみ", avatar: state.player.avatar },
      event: { doll: { day: "2026-11-08" } },
      gear: GEAR.slice(0, 4).map(g => g.id),
      materials: { walnut: 3, oak: 6, cherry: 4, brass: 5, glass: 3, cloth: 4 },
      showroom: picked.slice(0, 5).map(id => ({ id, pop: 16 })),
      totalVisitors: 312,
      knownCritical: ids.slice(0, 12)
    });
    state.craftLog = { woods: { oak: 9, walnut: 5, cherry: 4 }, finishS: { natural: true }, hi: 96, total: 23 };
    /* お部屋に、作った家具を並べておく（本物のお部屋・床 0.86） */
    const put = (id, x, h, fl) => ({ id, x, y: 0.86, h, fl: fl || 1 });
    /* 本物の Petit.Continue は k:"p"。作らなくても、はじめから置ける */
    const real = (id, x, h, fl) => ({ id, k: "p", x, y: 0.86, h, fl: fl || 1 });
    state.room = { bg: "petit", sets: {
      petit: [
        real("pt_wardrobe", 0.13, 0.36),
        put(picked[5], 0.30, 0.26),
        real("pt_tea", 0.44, 0.20),
        put(picked[2], 0.59, 0.24, -1),
        real("pt_chair", 0.74, 0.25),
        put(picked[1], 0.89, 0.33)
      ],
      day: [
        put(picked[1], 0.13, 0.34),
        real("pt_bookcase", 0.30, 0.33),
        put(picked[6], 0.46, 0.22, -1),
        real("pt_stool", 0.60, 0.18),
        put(picked[7], 0.75, 0.28),
        real("pt_mirror", 0.90, 0.32, -1)
      ],
      attic: [
        put(picked[8], 0.18, 0.30),
        put(picked[0], 0.36, 0.19),
        put(picked[4], 0.54, 0.23, -1),
        put(picked[9], 0.74, 0.29),
        put(picked[2], 0.90, 0.25)
      ],
      green: [
        real("pt_bench", 0.16, 0.24),
        put(picked[3], 0.34, 0.30),
        put(picked[0], 0.52, 0.19),
        put(picked[11], 0.70, 0.26, -1),
        put(picked[5], 0.88, 0.24)
      ],
      night: [
        { id: picked[2], x: 0.17, y: 0.87, h: 0.26, fl: 1 },
        { id: picked[12], x: 0.37, y: 0.87, h: 0.31, fl: 1 },
        { id: picked[0], x: 0.56, y: 0.87, h: 0.19, fl: -1 },
        { id: picked[6], x: 0.74, y: 0.87, h: 0.23, fl: 1 },
        { id: picked[4], x: 0.90, y: 0.87, h: 0.25, fl: 1 }
      ]
    } };
    save();
    return true;
  });
};
