// AP LUC CHOT LOI (Hieu 2026-10-21: "nhieu nguoi mua o duoi, luc minh mua ho chot loi nhieu lam co phieu khong len duoc nua"). Do cac dau hieu AP LUC CHOT LOI luc vao lenh Mua thuong cua engine, xem nhom nao KEM hon:
//  - ty le KL "dang lai sau": % khoi luong 120 phien gan nhat co gia (trung binh H-L-C moi phien) <= 90% / <= 80% gia dong cua hien tai (nguoi mua o duoi da lai >= 10% / >= 20%);
//  - ty le KL "treo tren dau": % khoi luong 120 phien nam o gia >= 105% gia hien tai (nguoi ket dinh);
//  - da chay bao nhieu: % tang 10 / 20 phien, % cao hon day 60 phien;
//  - nen tin hieu co BONG TREN dai (tuong chot loi khi tang) va KL lon.
// Moi dac trung chia 4 NHOM (tu thap den cao); in lai TB / thang% / PF (ATC + T+2, 30/30 + chay, phi 0,4%) va do chenh Q4 - Q1 (t-stat). CHI DOC cache. CACH CHAY: node engine/dich-vu/nghienCuuChotLoi.mjs
import { docJson, chayEngine, thongKe, tb, f } from "./backtestChung.mjs";
import { mo } from "./moBaoVeLai.mjs";

const cache = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");
const { lenh } = chayEngine({ cache, vni });
const ds = lenh.filter((t) => t.loai === 1 && t.iv >= 130);
const dacTrung = (t) => {
  const { iv, close, high, low, vol, relVol } = t;
  const c = close[iv];
  let tong = 0, lai10 = 0, lai20 = 0, treo = 0;
  for (let j = iv - 119; j <= iv; j++) {
    const g = (high[j] + low[j] + close[j]) / 3, v = vol[j] || 0;
    tong += v;
    if (g <= 0.9 * c) lai10 += v;
    if (g <= 0.8 * c) lai20 += v;
    if (g >= 1.05 * c) treo += v;
  }
  let day60 = Infinity;
  for (let j = iv - 59; j <= iv; j++) day60 = Math.min(day60, low[j]);
  const rng = high[iv] - low[iv];
  return {
    "KL dang lai >= 10% (% KL 120 phien)": (lai10 / tong) * 100,
    "KL dang lai >= 20% (% KL 120 phien)": (lai20 / tong) * 100,
    "KL treo tren dau >= +5% (% KL 120 phien)": (treo / tong) * 100,
    "% tang 10 phien": (c / close[iv - 10] - 1) * 100,
    "% tang 20 phien": (c / close[iv - 20] - 1) * 100,
    "% cao hon day 60 phien": (c / day60 - 1) * 100,
    "Bong tren nen tin hieu (% bien do)": rng > 0 ? ((high[iv] - c) / rng) * 100 : 0,
    "KL nen tin hieu / TB20": relVol[iv],
  };
};
const mauTT = ds.map((t) => ({ t, r: mo(t, { atc: true }), d: dacTrung(t) })).filter((x) => x.r);
const DS_R = (a) => a.map((x) => x.r.ret);
const tong = thongKe(DS_R(mauTT).map((r) => ({ ret: r, phien: 1 })));
console.log(`${mauTT.length} lenh Mua thuong (tu phien thu 130): lai TB ${f(tong.tb)}% | thang ${f(tong.thang, 0)}% | PF ${f(tong.pf)}\n`);
const tt = (a, b) => { // t-stat chenh trung binh
  const m = (x) => tb(x), v = (x) => { const u = m(x); return x.reduce((s, y) => s + (y - u) ** 2, 0) / (x.length - 1); };
  return (m(a) - m(b)) / Math.sqrt(v(a) / a.length + v(b) / b.length);
};
for (const ten of Object.keys(mauTT[0].d)) {
  const sx = [...mauTT].sort((p, q) => p.d[ten] - q.d[ten]);
  const n4 = Math.floor(sx.length / 4);
  const nhom = [0, 1, 2, 3].map((k) => sx.slice(k * n4, k === 3 ? sx.length : (k + 1) * n4));
  const stats = nhom.map((g) => {
    const r = DS_R(g); const k = thongKe(r.map((x) => ({ ret: x, phien: 1 })));
    return { lo: g[0].d[ten], hi: g[g.length - 1].d[ten], tb: k.tb, thang: k.thang, pf: k.pf, r };
  });
  const t41 = tt(stats[3].r, stats[0].r);
  console.log(`${ten.padEnd(42)} ${stats.map((s, i) => `Q${i + 1}[${f(s.lo, 0)}..${f(s.hi, 0)}] ${f(s.tb, 2)}% PF ${f(s.pf, 2)}`).join(" | ")} | Q4-Q1 ${f(stats[3].tb - stats[0].tb, 2)}pp (t ${f(t41, 1)})`);
}
// nhom "chot loi nang": nhieu khoi luong dang lai >= 20% + bong tren dai
const lai20 = (x) => x.d["KL dang lai >= 20% (% KL 120 phien)"];
const bong = (x) => x.d["Bong tren nen tin hieu (% bien do)"];
const nhom = (ten, a) => { const k = thongKe(DS_R(a).map((r) => ({ ret: r, phien: 1 }))); console.log(`  ${ten.padEnd(66)} n=${String(a.length).padStart(5)} lai ${f(k.tb).padStart(6)}%  thang ${f(k.thang, 0)}%  PF ${f(k.pf)}`); };
console.log("\n=== NHOM CU THE ===");
nhom("Tat ca", mauTT);
nhom("KL dang lai >= 20% cao (>= 40% KL 120 phien)", mauTT.filter((x) => lai20(x) >= 40));
nhom("KL dang lai >= 20% thap (< 10%)", mauTT.filter((x) => lai20(x) < 10));
nhom("Bong tren >= 50% bien do va KL nen >= 1,5x (nghi chot loi khi tang)", mauTT.filter((x) => bong(x) >= 50 && x.d["KL nen tin hieu / TB20"] >= 1.5));
nhom("Bong tren < 20% (dong cua sat dinh nen)", mauTT.filter((x) => bong(x) < 20));
nhom("Tang 20 phien >= 20% VA KL dang lai >= 20% >= 40%", mauTT.filter((x) => x.d["% tang 20 phien"] >= 20 && lai20(x) >= 40));
nhom("Tang 20 phien < 5% (chua chay)", mauTT.filter((x) => x.d["% tang 20 phien"] < 5));
const hien = mauTT.filter((x) => x.t.ngay >= "2022-05-01");
console.log(`\n(giai doan 2022.5+: ${hien.length} lenh)`);
nhom("  2022.5+ KL dang lai >= 20% cao (>= 40%)", hien.filter((x) => lai20(x) >= 40));
nhom("  2022.5+ KL dang lai >= 20% thap (< 10%)", hien.filter((x) => lai20(x) < 10));

// ---- DO BEN: KL treo tren dau theo giai doan va loc o cap danh muc ----
import { danhMucNhieuLan, kyOf, TEN_KY } from "./backtestChung.mjs";
const treo = (x) => x.d["KL treo tren dau >= +5% (% KL 120 phien)"];
console.log("\n=== KL TREO TREN DAU: theo giai doan (lai TB %, n) ===");
for (const [ten, fn] of [["< 15% (it nguoi ket)", (x) => treo(x) < 15], [">= 15%", (x) => treo(x) >= 15], [">= 37% (nhieu nguoi ket)", (x) => treo(x) >= 37]]) {
  const a = mauTT.filter(fn);
  console.log(`  ${ten.padEnd(26)} ${[0, 1, 2].map((j) => { const z = a.filter((x) => kyOf(x.t.ngay) === j); return `${TEN_KY[j]}: ${f(tb(DS_R(z)), 2)} (${z.length})`; }).join(" | ")}`);
}
const dsX = mauTT.map((x) => x.t), kqX = mauTT.map((x) => x.r);
const loc = (t) => { const x = mauTT[dsX.indexOf(t)]; return x ? treo(x) < 15 : true; };
for (const K of [10, 20]) {
  const a = danhMucNhieuLan(kqX, dsX, K, 40), b = danhMucNhieuLan(kqX, dsX, K, 40, { loc });
  console.log(`  Danh muc K=${K}: tat ca ${f(a.cagr, 1)}%/sut ${f(a.sut, 0)}%  ->  chi lenh KL treo < 15%: ${f(b.cagr, 1)}%/sut ${f(b.sut, 0)}%`);
}
