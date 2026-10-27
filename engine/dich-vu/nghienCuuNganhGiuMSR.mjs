// TIN HIEU NGANH CO GIU DUOC LENH NHU MSR KHONG? (Hieu 27/10/2026). Chi tieu nganh tai dong cua ngay tin hieu, KHONG gom chinh ma do (loai tru 1 ma, tranh tu thuong phat), nganh theo engine/danh-sach/nganh.js (>= 4 ma khac trong nganh moi tinh):
//   secRS20  = loi suat 20 phien TB (trong so deu) cua cac ma khac cung nganh - loi suat 20 phien TB cua toan thi truong (diem %)       secBreadth = % ma khac cung nganh dang tren SMA50
//   secRank  = thu hang nganh theo loi suat 20 phien (0 = manh nhat, 1 = yeu nhat) trong cac nganh co >= 5 ma
// Bo loc dat truoc (khong chinh nguong): S1 secRS20 > 0 | S2 secBreadth >= 50% | S3 nganh nua tren (secRank <= 0,5) | S4 = S1 & S2; va hop "d5 > 1% HOAC nganh manh" de GIU lenh nhu MSR (d5 0,0%, nganh manh). HT va KIJ thuc te, CO tinh lenh dang mo, phi 0,4%.
// So sanh: n, lai TB toan ky / tu 5/2022 / 2026, chenh giu - bo (bootstrap theo ngay, tu 5/2022), DM K=10, ty le trong top 20 lenh lai nhat 2026 duoc giu, va bang cac lenh cu the (MSR 13/8, PET 20/5, PVP, CDC, TNG...).
// Chay: node engine/dich-vu/nghienCuuNganhGiuMSR.mjs
import { docJson, chayEngine, danhMucNhieuLan, tb, f } from "./backtestChung.mjs";
import { mp, HAI_TP } from "./moPhongTK.mjs";
import { nganhCuaMa } from "../danh-sach/nganh.js";

const cache = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");
const chiSo = new Map(vni.map((b, i) => [b.t, i])), vc = vni.map((b) => b.c);
// ---- chi tieu nganh theo ngay ----
const nganhMa = (ma) => { const n = nganhCuaMa(ma); return n && n !== "Khac" ? n : null; };
const THEO_NGAY = new Map(); // ngay -> { M: {s,n}, N: Map(nganh -> {s,n,a}) }
const own = new Map(); // ma -> Map(ngay -> {r, a})
for (const [ma, bars] of Object.entries(cache)) {
  if (ma === "VNINDEX" || bars.length < 80) continue;
  const ng = nganhMa(ma), c = bars.map((b) => b.c), m = new Map();
  for (let i = 50; i < bars.length; i++) {
    if (!(c[i - 20] > 0)) continue;
    let s50 = 0;
    for (let k = i - 49; k <= i; k++) s50 += c[k];
    const r = (c[i] / c[i - 20] - 1) * 100, a = c[i] > s50 / 50 ? 1 : 0;
    m.set(bars[i].t, { r, a });
    let d = THEO_NGAY.get(bars[i].t);
    if (!d) { d = { M: { s: 0, n: 0 }, N: new Map() }; THEO_NGAY.set(bars[i].t, d); }
    d.M.s += r; d.M.n++;
    if (ng) { let x = d.N.get(ng); if (!x) { x = { s: 0, n: 0, a: 0 }; d.N.set(ng, x); } x.s += r; x.n++; x.a += a; }
  }
  own.set(ma, m);
}
function chiTieuNganh(ma, ngay) {
  const ng = nganhMa(ma), d = THEO_NGAY.get(ngay), o = own.get(ma)?.get(ngay);
  if (!ng || !d || !o) return null;
  const x = d.N.get(ng);
  if (!x || x.n - 1 < 4 || d.M.n < 50) return null;
  const sec = (x.s - o.r) / (x.n - 1), mkt = (d.M.s - o.r) / (d.M.n - 1);
  const xep = [...d.N.entries()].filter(([, v]) => v.n >= 5).map(([k, v]) => [k, v.s / v.n]).sort((a, b) => b[1] - a[1]);
  const vt = xep.findIndex(([k]) => k === ng);
  return { ng, secRS20: sec - mkt, secBreadth: ((x.a - o.a) / (x.n - 1)) * 100, secRank: vt >= 0 && xep.length > 1 ? vt / (xep.length - 1) : null, nMa: x.n };
}
// ---- lenh ----
const { lenh } = chayEngine({ cache, vni, giuLenhDangMo: true });
const HT = { moc: HAI_TP, baoVe: true, theoSell: true }, KIJ = { moc: [], baoVe: false, theoSell: false, tk: "kijun" };
const D = [];
for (const t of lenh.filter((x) => x.loai === 1 && x.iv >= 120)) {
  const i = chiSo.get(t.ngay);
  if (i == null || i < 5) continue;
  const a = mp(t, { ...HT, danhGiaCuoi: true, vao: t.iv + 1, banTu: t.iv + 3 }), b = mp(t, { ...KIJ, danhGiaCuoi: true, vao: t.iv + 1, banTu: t.iv + 3 });
  if (!a) continue;
  let mn = Infinity, mx = -Infinity;
  for (let k = t.iv - 119; k <= t.iv; k++) { mn = Math.min(mn, t.low[k]); mx = Math.max(mx, t.high[k]); }
  const cs = chiTieuNganh(t.ma, t.ngay);
  D.push({ t, ma: t.ma, ngay: t.ngay, HT: a.ret, rHT: a, KIJ: b ? b.ret : null, rKIJ: b, moDen: !!a.dangMo, pos: (t.close[t.iv] - mn) / (mx - mn), d5: (vc[i] / vc[i - 5] - 1) * 100, cs });
}
console.log(`${D.length} lenh | co chi tieu nganh: ${D.filter((x) => x.cs).length}`);
const dsX = D.filter((x) => x.cs);
const m = (a, c = "HT") => (a.length ? tb(a.map((x) => x[c])) : NaN);
const S1 = (x) => x.cs && x.cs.secRS20 > 0, S2 = (x) => x.cs && x.cs.secBreadth >= 50, S3 = (x) => x.cs && x.cs.secRank != null && x.cs.secRank <= 0.5, S4 = (x) => S1(x) && S2(x);
const BL = [
  ["Khong loc (co chi tieu nganh)", () => true],
  ["S1 nganh manh hon thi truong (secRS20 > 0)", S1],
  ["S2 nganh co >= 50% ma tren SMA50", S2],
  ["S3 nganh nua tren theo RS20", S3],
  ["S4 = S1 va S2", S4],
  ["d5 > 1%", (x) => x.d5 > 1],
  ["d5 > 1% HOAC S1", (x) => x.d5 > 1 || S1(x)],
  ["d5 > 1% HOAC S4", (x) => x.d5 > 1 || S4(x)],
  ["d5 > 1% VA S1", (x) => x.d5 > 1 && S1(x)],
  ["pos >= 0,6 HOAC S4", (x) => x.pos >= 0.6 || S4(x)],
  ["(d5 > 1% HOAC S1) VA pos >= 0,6", (x) => (x.d5 > 1 || S1(x)) && x.pos >= 0.6],
];
const rngS = (() => { let s = 4242; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; })();
function boot(all, fn, c, B = 2000) {
  const g = new Map();
  for (const x of all) { if (!g.has(x.ngay)) g.set(x.ngay, []); g.get(x.ngay).push(x); }
  const ng = [...g.keys()], res = [];
  for (let b = 0; b < B; b++) {
    let s1 = 0, n1 = 0, s0 = 0, n0 = 0;
    for (let k = 0; k < ng.length; k++) for (const x of g.get(ng[Math.floor(rngS() * ng.length)])) { if (fn(x)) { s1 += x[c]; n1++; } else { s0 += x[c]; n0++; } }
    if (n1 && n0) res.push(s1 / n1 - s0 / n0);
  }
  res.sort((a, b) => a - b);
  return [res[Math.floor(0.025 * res.length)], res[Math.floor(0.975 * res.length)]];
}
const test = dsX.filter((x) => x.ngay >= "2022-05-01"), n26 = dsX.filter((x) => x.ngay >= "2026-01-01");
const top20 = [...n26].sort((a, b) => b.HT - a.HT).slice(0, 20), top10 = top20.slice(0, 10);
const msr = D.find((x) => x.ma === "MSR" && x.ngay === "2026-08-13");
console.log(`\n===== BO LOC NGANH (HT thuc te; co lenh dang mo). Cot: n toan ky | lai TB toan ky | n/lai tu 5/2022 | chenh giu-bo (CI95) tu 5/2022 | 2026 n/lai | DM K=10 tu 5/2022 | top10/top20 2026 duoc giu | MSR 13/8 =====`);
for (const [ten, fn] of BL) {
  const G = dsX.filter(fn), Gt = test.filter(fn), G26 = n26.filter(fn);
  const [lo, hi] = boot(test, fn, "HT");
  const dmT = Gt.length > 30 ? danhMucNhieuLan(Gt.map((x) => x.rHT), Gt.map((x) => x.t), 10, 20, {}) : { cagr: NaN, sut: NaN };
  console.log(ten.padEnd(44), String(G.length).padStart(4), f(m(G)).padStart(6), "|", String(Gt.length).padStart(4), f(m(Gt)).padStart(6), "|", `${f(m(Gt) - m(test.filter((x) => !fn(x)))).padStart(5)} [${f(lo)}..${f(hi)}]`.padEnd(18), "|", String(G26.length).padStart(3), f(m(G26)).padStart(6), "|", `${f(dmT.cagr, 1)}%/${f(dmT.sut, 0)}%`.padEnd(11), "|", `${top10.filter(fn).length}/10 ${top20.filter(fn).length}/20`, "|", msr && fn(msr) ? "GIU" : "bo");
}
console.log(`\nCAC LENH LON 2026 (HT thuc te): nganh | so ma nganh | secRS20 | secBreadth | secRank | d5 | pos | S1 S2 S3`);
for (const x of D.filter((y) => y.ngay >= "2026-01-01").sort((a, b) => b.HT - a.HT).slice(0, 16)) {
  const c = x.cs;
  console.log(`  ${x.ngay} ${x.ma.padEnd(4)} ${f(x.HT).padStart(6)}%${x.moDen ? "*" : " "} | ${c ? `${c.ng} (${c.nMa}) RS20 ${f(c.secRS20).padStart(6)} breadth ${f(c.secBreadth, 0).padStart(3)}% rank ${c.secRank != null ? f(c.secRank, 2) : "-"}` : "khong co chi tieu nganh"} | d5 ${f(x.d5, 1)} pos ${f(x.pos, 2)} | ${c ? [S1(x) ? "S1" : "--", S2(x) ? "S2" : "--", S3(x) ? "S3" : "--"].join(" ") : ""}`);
}
console.log("(* = lenh dang mo)");
console.log(`\nMSR 13/8: ${msr?.cs ? JSON.stringify({ ...msr.cs, secRS20: +f(msr.cs.secRS20), secBreadth: +f(msr.cs.secBreadth, 0) }) : "khong co chi tieu nganh (nganh it ma?)"}`);
