// Lai TB theo KHOANG (khong chong lan) cua vi tri gia trong bien do 120 phien: co dung "pos cang cao lenh cang tot" khong? HT va KIJ, thuc te (mua mo cua phien sau), toan ky va tu 2022. Chay: node engine/dich-vu/bangPos120TheoKhoang.mjs
import { docJson, chayEngine, tb, f } from "./backtestChung.mjs";
import { mp, HAI_TP } from "./moPhongTK.mjs";
const { lenh } = chayEngine({ cache: docJson("nen_dai.json"), vni: docJson("vnindex_dai.json") });
const HT = { moc: HAI_TP, baoVe: true, theoSell: true }, KIJ = { moc: [], baoVe: false, theoSell: false, tk: "kijun" };
const D = [];
for (const t of lenh.filter((x) => x.loai === 1 && x.iv >= 120)) {
  const a = mp(t, { ...HT, vao: t.iv + 1, banTu: t.iv + 3 }), b = mp(t, { ...KIJ, vao: t.iv + 1, banTu: t.iv + 3 });
  if (!a || !b) continue;
  let mn = Infinity, mx = -Infinity;
  for (let k = t.iv - 119; k <= t.iv; k++) { mn = Math.min(mn, t.low[k]); mx = Math.max(mx, t.high[k]); }
  D.push({ ngay: t.ngay, ht: a.ret, kij: b.ret, mfe: 0, pos: (t.close[t.iv] - mn) / (mx - mn) });
}
const B = [[0, 0.2], [0.2, 0.4], [0.4, 0.5], [0.5, 0.6], [0.6, 0.7], [0.7, 0.8], [0.8, 0.9], [0.9, 1.01]];
for (const [ten, loc] of [["TOAN KY", () => true], ["TU 2022", (x) => x.ngay >= "2022-01-01"], ["TRUOC 2022", (x) => x.ngay < "2022-01-01"]]) {
  console.log(`\n=== ${ten} ===  khoang pos | n | HT lai TB | thang% | KIJ lai TB | lenh lai>=10% (HT)`);
  for (const [lo, hi] of B) {
    const g = D.filter((x) => loc(x) && x.pos >= lo && x.pos < hi);
    if (!g.length) continue;
    console.log(`  ${lo.toFixed(1)}-${hi > 1 ? "1.0" : hi.toFixed(1)} | ${String(g.length).padStart(4)} | ${f(tb(g.map((x) => x.ht))).padStart(6)} | ${f(100 * g.filter((x) => x.ht > 0).length / g.length, 0).padStart(2)}% | ${f(tb(g.map((x) => x.kij))).padStart(6)} | ${f(100 * g.filter((x) => x.ht >= 10).length / g.length, 0)}%`);
  }
}
