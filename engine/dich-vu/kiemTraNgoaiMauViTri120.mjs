// KIEM TRA NGOAI MAU: loc "vi tri gia trong bien do 120 phien" (phanTichNhomLenhYeu.mjs: top 20% bien do HT +2,23% vs trung binh +0,15%). pos = (close - thap nhat 120 phien) / (cao nhat - thap nhat), tai dong cua ngay tin hieu.
// Cach ra HT va KIJ, quy uoc THUC TE (mua mo cua phien sau, ban tu T+2), phi 0,4%. (1) Theo nam: pos >= 0,8 (dat truoc, theo ghi chu cu "20% tren cung"). (2) Tach moc 1/5/2022: chon nguong CHI tu TRAIN, do tren TEST; bootstrap theo ngay; DM K=10/20.
// (3) Ket hop voi d5 > 1%. Chay: node engine/dich-vu/kiemTraNgoaiMauViTri120.mjs
import { docJson, chayEngine, danhMucNhieuLan, tb, f } from "./backtestChung.mjs";
import { mp, HAI_TP } from "./moPhongTK.mjs";

const cache = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");
const { lenh: tatCa } = chayEngine({ cache, vni });
const chiSo = new Map(vni.map((b, i) => [b.t, i]));
const vc = vni.map((b) => b.c);
const CACH = { HT: { moc: HAI_TP, baoVe: true, theoSell: true }, KIJ: { moc: [], baoVe: false, theoSell: false, tk: "kijun" } };
const D = [];
for (const t of tatCa.filter((x) => x.loai === 1)) {
  const i = chiSo.get(t.ngay);
  if (i == null || i < 6 || t.iv < 120) continue;
  const a = mp(t, { ...CACH.HT, vao: t.iv + 1, banTu: t.iv + 3 }), b = mp(t, { ...CACH.KIJ, vao: t.iv + 1, banTu: t.iv + 3 });
  if (!a || !b) continue;
  let mn = Infinity, mx = -Infinity;
  for (let k = t.iv - 119; k <= t.iv; k++) { mn = Math.min(mn, t.low[k]); mx = Math.max(mx, t.high[k]); }
  D.push({ t, ngay: t.ngay, nam: +t.ngay.slice(0, 4), HT: a.ret, KIJ: b.ret, pos: mx > mn ? (t.close[t.iv] - mn) / (mx - mn) : null, d5: (vc[i] / vc[i - 5] - 1) * 100 });
}
const ok = D.filter((x) => x.pos != null);
const m = (a, c) => tb(a.map((x) => x[c]));
const rngS = (() => { let s = 99; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; })();
function boot(all, giuSet, c, B = 2000) {
  const g = new Map();
  for (const x of all) { if (!g.has(x.ngay)) g.set(x.ngay, []); g.get(x.ngay).push(x); }
  const ng = [...g.keys()], res = [];
  for (let b = 0; b < B; b++) {
    let sA = 0, nA = 0, sG = 0, nG = 0;
    for (let k = 0; k < ng.length; k++) for (const x of g.get(ng[Math.floor(rngS() * ng.length)])) { sA += x[c]; nA++; if (giuSet.has(x)) { sG += x[c]; nG++; } }
    if (nG) res.push(sG / nG - sA / nA);
  }
  res.sort((a, b) => a - b);
  return [res[Math.floor(0.025 * res.length)], res[Math.floor(0.975 * res.length)], res.filter((v) => v <= 0).length / res.length];
}
const dm = (arr, c) => {
  const cfg = CACH[c];
  const ds = arr.map((x) => x.t), kq = arr.map((x) => mp(x.t, { ...cfg, vao: x.t.iv + 1, banTu: x.t.iv + 3 }));
  return [10, 20].map((K) => danhMucNhieuLan(kq, ds, K, 20, {}));
};
console.log(`${ok.length} lenh | HT ${f(m(ok, "HT"))} | KIJ ${f(m(ok, "KIJ"))} | trung vi pos ${f([...ok.map((x) => x.pos)].sort((a, b) => a - b)[Math.floor(ok.length / 2)], 2)}`);

console.log("\n===== (1) THEO NAM: pos >= 0,8 (dat truoc), lai TB giu vs tat ca (HT | KIJ) =====");
let tot = 0, tot2 = 0, nam = 0;
for (let y = 2018; y <= 2026; y++) {
  const A = ok.filter((x) => x.nam === y), G = A.filter((x) => x.pos >= 0.8);
  if (A.length < 20 || G.length < 5) continue;
  nam++;
  if (m(G, "HT") > m(A, "HT")) tot++;
  if (m(G, "KIJ") > m(A, "KIJ")) tot2++;
  console.log(`  ${y}: tat ca ${String(A.length).padStart(4)} HT ${f(m(A, "HT")).padStart(6)} KIJ ${f(m(A, "KIJ")).padStart(6)} | giu ${String(G.length).padStart(3)} HT ${f(m(G, "HT")).padStart(6)} KIJ ${f(m(G, "KIJ")).padStart(6)}`);
}
console.log(`  => loc tot hon: HT ${tot}/${nam} nam, KIJ ${tot2}/${nam} nam`);

const MOC = "2022-05-01";
const train = ok.filter((x) => x.ngay < MOC), test = ok.filter((x) => x.ngay >= MOC);
const NG = [0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
for (const c of ["HT", "KIJ"]) {
  console.log(`\n===== (2) TACH MOC ${MOC} | cach ra ${c} | luoi nguong tren TRAIN (n ${train.length}, lai TB ${f(m(train, c))}) =====`);
  let best = null;
  for (const th of NG) {
    const G = train.filter((x) => x.pos >= th);
    const mm = m(G, c);
    console.log(`  pos >= ${th}: giu ${String(G.length).padStart(4)} (${f(100 * G.length / train.length, 0)}%), lai TB ${f(mm).padStart(6)}`);
    if (G.length >= 0.15 * train.length && (best == null || mm > best.mm)) best = { th, mm };
  }
  console.log(`  -> nguong chon tu TRAIN: pos >= ${best.th}`);
  for (const [ten, tap] of [[`TEST >= ${MOC}`, test], ["TEST rieng 2026", test.filter((x) => x.ngay >= "2026-01-01")]]) {
    const G = tap.filter((x) => x.pos >= best.th), L = tap.filter((x) => x.pos < best.th);
    const [lo, hi, p] = boot(tap, new Set(G), c);
    const a = dm(tap, c), g = dm(G, c);
    console.log(`  ${ten}: n ${tap.length} lai TB ${f(m(tap, c))} | giu ${G.length}: ${f(m(G, c))} (thang ${f(100 * G.filter((x) => x[c] > 0).length / G.length, 0)}%) | loai ${L.length}: ${f(m(L, c))} | chenh ${f(m(G, c) - m(tap, c))} [CI95 ${f(lo)}..${f(hi)}; P(<=0) ${f(p, 3)}]`);
    console.log(`     DM K=10: ${f(a[0].cagr, 1)}%/${f(a[0].sut, 0)}% -> ${f(g[0].cagr, 1)}%/${f(g[0].sut, 0)}% | K=20: ${f(a[1].cagr, 1)}%/${f(a[1].sut, 0)}% -> ${f(g[1].cagr, 1)}%/${f(g[1].sut, 0)}%`);
  }
}

console.log("\n===== (3) KET HOP voi d5 > 1% (TEST >= 2022-05; nguong pos 0,8 / 0,6; HT | KIJ) =====");
for (const [ten, fn] of [["Khong loc", () => true], ["d5 > 1%", (x) => x.d5 > 1], ["pos >= 0,6", (x) => x.pos >= 0.6], ["pos >= 0,8", (x) => x.pos >= 0.8], ["d5 > 1% VA pos >= 0,6", (x) => x.d5 > 1 && x.pos >= 0.6], ["d5 > 1% VA pos >= 0,8", (x) => x.d5 > 1 && x.pos >= 0.8]]) {
  const G = test.filter(fn), G26 = G.filter((x) => x.ngay >= "2026-01-01");
  const a = dm(G, "HT"), k = dm(G, "KIJ");
  console.log(`  ${ten.padEnd(24)} n ${String(G.length).padStart(4)} | HT ${f(m(G, "HT")).padStart(6)} (2026 n ${G26.length}: ${f(m(G26, "HT")).padStart(6)}; DM K=10 ${f(a[0].cagr, 1)}%/${f(a[0].sut, 0)}%) | KIJ ${f(m(G, "KIJ")).padStart(6)} (2026: ${f(m(G26, "KIJ")).padStart(6)}; DM K=10 ${f(k[0].cagr, 1)}%/${f(k[0].sut, 0)}%)`);
}
