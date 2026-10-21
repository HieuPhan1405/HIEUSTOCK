// NANG CAP CHECKLIST DO DAY (Hieu 2026-10-21: "mo rong checklist ra toan bo ma, ban xem nang cap duoc gi nua ko va test").
// Tai tao diem checklist (engine/loi/checklistBatDay.js, 8 thanh phan: C1 chiet khau >= 20% so dinh 252p; C2 RSI<35 / MFI<30 (0,5 moi cai); C3 Williams %R < -80; C4 gia <= MA200 - 12%; C6 capitulation (giam + KL > 2x + bien do > 1,5x);
// C7 phan ky RSI tai day; C8 day sau cao hon; C9 FTD (tang >= 1,25% kem KL hon hom truoc khi da giam >= 15%) = 2 diem), su kien = diem vuot tu < nguong len >= nguong. Do ket qua THUC TE: vao MO CUA phien sau, phi 0,4%, lai 5 / 10 / 20 phien, tu 2022-05.
// Thu: (1) PHAM VI: VN100 vs toan bo ma GTGD TB20 >= 3 ty vs toan bo ma (khong loc); (2) NGUONG diem 4 / 5 / 6 / 7; (3) tung THANH PHAN co them gia tri khong (su kien >= 5 diem, co / khong thanh phan do);
// (4) THEM THANH PHAN MOI: C10 = KL quanh day >= 2x TB20 truoc day (ban thao co KL, kiem chung o nghienCuuQuyLuatNhipHoi.mjs) +1 diem; C11 = gia dong cua tren Tenkan 9 + Kijun 17 (xac nhan quay dau, giong diem B) +1 diem;
// (5) BO loc xac nhan: su kien chi tinh khi dong cua tren Tenkan va Kijun (nhu diem B). CHI DOC cache. CACH CHAY: node engine/dich-vu/nghienCuuNangCapChecklist.mjs
import { docJson } from "./backtestChung.mjs";
import { VN100 } from "../danh-sach/vn100.js";
import { hhv, llv, sma, valueWhen } from "../loi/mang.js";
import { rsi, mfi } from "../loi/taChiBao.js";

const cache = docJson("nen_dai.json");
const vn = new Set(VN100);
const CP = 0.4;
const tb = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const f = (x, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : "-");
const th = (a) => (a.length ? (a.filter((x) => x > 0).length / a.length) * 100 : NaN);

const ev = []; // moi dong: mot (ma, ngay) co diem; luu thanh phan de gom lai theo cach tinh khac nhau
for (const [ma, nen] of Object.entries(cache)) {
  const n = nen.length; if (n < 300) continue;
  const high = nen.map((b) => b.h), low = nen.map((b) => b.l), close = nen.map((b) => b.c), open = nen.map((b) => b.o), volume = nen.map((b) => b.v);
  const h252 = hhv(high, 252);
  const ck = close.map((c, i) => (h252[i] > 0 ? ((h252[i] - c) / h252[i]) * 100 : null));
  const rs = rsi({ close }, 14), mf = mfi({ high, low, close, volume }, 14);
  const hh14 = hhv(high, 14), ll14 = llv(low, 14);
  const wpr = close.map((c, i) => (hh14[i] != null && ll14[i] != null && hh14[i] !== ll14[i] ? ((hh14[i] - c) / (hh14[i] - ll14[i])) * -100 : 0));
  const ma200 = sma(close, 200); const dev = close.map((c, i) => (ma200[i] > 0 ? ((c - ma200[i]) / ma200[i]) * 100 : 0));
  const av = sma(volume, 20); const bd = high.map((h, i) => h - low[i]); const ab = sma(bd, 20);
  const cap = close.map((c, i) => i > 0 && av[i] != null && ab[i] != null && c < close[i - 1] && volume[i] > av[i] * 2 && bd[i] > ab[i] * 1.5);
  const d20 = llv(low, 20), loc = low.map((l, i) => d20[i] != null && l === d20[i]);
  const pR = valueWhen(loc, rs, 2), pP = valueWhen(loc, low, 2);
  const c7 = low.map((l, i) => loc[i] && pP[i] != null && l < pP[i] && rs[i] != null && pR[i] != null && rs[i] > pR[i]);
  const c8 = low.map((l, i) => loc[i] && pP[i] != null && l > pP[i]);
  const ftd = close.map((c, i) => i > 0 && c >= close[i - 1] * 1.0125 && volume[i] > volume[i - 1] && ck[i] >= 15);
  const tk = close.map((_, i) => (i >= 8 ? (hhv(high, 9)[i] + llv(low, 9)[i]) / 2 : null)); // tinh lai 1 lan ben duoi
  const H9 = hhv(high, 9), L9 = llv(low, 9), H17 = hhv(high, 17), L17 = llv(low, 17);
  let gtTong = 0; const gtgd = close.map((c, i) => { gtTong += (c * volume[i]) / 1e6; if (i >= 20) gtTong -= (close[i - 20] * volume[i - 20]) / 1e6; return i >= 19 ? gtTong / 20 : 0; });
  void tk;
  const rows = [];
  for (let i = 252; i < n - 21; i++) {
    const c1 = ck[i] >= 20, c2 = (rs[i] != null && rs[i] < 35 ? 0.5 : 0) + (mf[i] != null && mf[i] < 30 ? 0.5 : 0), c3 = wpr[i] < -80, c4 = dev[i] <= -12;
    const k = [c1, c2, c3, c4, cap[i], c7[i], c8[i], ftd[i]];
    const diem = (c1 ? 1 : 0) + c2 + (c3 ? 1 : 0) + (c4 ? 1 : 0) + (cap[i] ? 1 : 0) + (c7[i] ? 1 : 0) + (c8[i] ? 1 : 0) + (ftd[i] ? 2 : 0);
    // C10: KL lon nhat 5 nen gan nhat / TB20 truoc do; C11: dong cua tren Tenkan 9 va Kijun 17
    let vMax = 0; for (let j = i - 4; j <= i; j++) vMax = Math.max(vMax, volume[j]);
    const tbv = av[i - 5];
    const c10 = tbv > 0 && vMax >= 2 * tbv;
    const c11 = H9[i] != null && H17[i] != null && close[i] > (H9[i] + L9[i]) / 2 && close[i] > (H17[i] + L17[i]) / 2;
    rows.push({ i, diem, k, c10, c11 });
  }
  // su kien theo nhieu nguong / bien the: vuot tu < nguong len >= nguong; moi ma 1 su kien / 10 nen (khong tinh nhieu lan cung dot)
  ev.push({ ma, nen, rows, close, open, high, low, gtgd });
}

function suKien(tong, nguong, { diemFn = (r) => r.diem, loc = () => true, pham = () => true, nam = "2022-05-01" }) {
  const out = [];
  for (const m of tong) {
    if (!pham(m)) continue;
    let ult = -99; let truoc = null;
    for (const r of m.rows) {
      const d = diemFn(r);
      const vuot = truoc != null && d >= nguong && truoc < nguong;
      truoc = d;
      if (!vuot || r.i - ult < 10) continue;
      if (m.nen[r.i].t < nam) continue;
      if (!loc(r, m)) continue;
      ult = r.i;
      const E = m.open[r.i + 1], c = m.close;
      out.push({ ma: m.ma, t: m.nen[r.i].t, k: r.k, c10: r.c10, c11: r.c11, r5: (c[r.i + 6] / E - 1) * 100 - CP, r10: (c[r.i + 11] / E - 1) * 100 - CP, r20: (c[r.i + 21] / E - 1) * 100 - CP });
    }
  }
  return out;
}
const dong = (ten, a) => (a.length < 30
  ? console.log(`   ${ten.padEnd(46)} n=${String(a.length).padStart(5)} (it mau)`)
  : console.log(`   ${ten.padEnd(46)} n=${String(a.length).padStart(5)} | 5p ${f(tb(a.map((x) => x.r5))).padStart(5)} | 10p ${f(tb(a.map((x) => x.r10))).padStart(5)} [${f(th(a.map((x) => x.r10)), 0)}%] | 20p ${f(tb(a.map((x) => x.r20))).padStart(5)} [${f(th(a.map((x) => x.r20)), 0)}%]`));
const dayGtgd = (r, m) => m.gtgd[r.i] >= 3;

console.log("######## (1) PHAM VI (nguong 5 diem, tu 2022-05) ########");
dong("VN100", suKien(ev, 5, { pham: (m) => vn.has(m.ma), loc: dayGtgd }));
dong("toan bo ma, GTGD TB20 >= 3 ty", suKien(ev, 5, { loc: dayGtgd }));
dong("toan bo ma, khong loc thanh khoan", suKien(ev, 5, {}));
dong("ngoai VN100, GTGD >= 3 ty", suKien(ev, 5, { pham: (m) => !vn.has(m.ma), loc: dayGtgd }));

console.log("\n######## (2) NGUONG DIEM (toan bo ma GTGD >= 3 ty, tu 2022-05) ########");
for (const ng of [4, 5, 6, 7]) dong(`vuot nguong ${ng}`, suKien(ev, ng, { loc: dayGtgd }));

console.log("\n######## (3) TUNG THANH PHAN (su kien >= 5, toan bo ma GTGD >= 3 ty): co / khong thanh phan ########");
const e5 = suKien(ev, 5, { loc: dayGtgd });
const TEN_K = ["C1 chiet khau", "C2 RSI/MFI qua ban", "C3 Williams %R", "C4 duoi MA200", "C6 capitulation", "C7 phan ky RSI", "C8 day sau cao hon", "C9 FTD"];
TEN_K.forEach((ten, j) => { dong(`${ten} = co`, e5.filter((x) => Number(x.k[j]) > 0)); dong(`${ten} = khong`, e5.filter((x) => !(Number(x.k[j]) > 0))); });

console.log("\n######## (4) THEM THANH PHAN MOI (toan bo ma GTGD >= 3 ty, tu 2022-05) ########");
for (const ng of [5, 6]) {
  dong(`goc, vuot ${ng}`, suKien(ev, ng, { loc: dayGtgd }));
  dong(`+ C10 (KL quanh day >= 2x) +1, vuot ${ng}`, suKien(ev, ng, { diemFn: (r) => r.diem + (r.c10 ? 1 : 0), loc: dayGtgd }));
  dong(`+ C11 (tren Tenkan+Kijun) +1, vuot ${ng}`, suKien(ev, ng, { diemFn: (r) => r.diem + (r.c11 ? 1 : 0), loc: dayGtgd }));
  dong(`+ C10 + C11, vuot ${ng}`, suKien(ev, ng, { diemFn: (r) => r.diem + (r.c10 ? 1 : 0) + (r.c11 ? 1 : 0), loc: dayGtgd }));
}

console.log("\n######## (5) BO LOC XAC NHAN tren su kien goc >= 5 (toan bo ma GTGD >= 3 ty) ########");
dong("goc", suKien(ev, 5, { loc: dayGtgd }));
dong("chi khi dong cua tren Tenkan + Kijun", suKien(ev, 5, { loc: (r, m) => dayGtgd(r, m) && r.c11 }));
dong("chi khi KL quanh day >= 2x", suKien(ev, 5, { loc: (r, m) => dayGtgd(r, m) && r.c10 }));
dong("tren Tenkan + Kijun VA KL quanh day >= 2x", suKien(ev, 5, { loc: (r, m) => dayGtgd(r, m) && r.c11 && r.c10 }));
dong("KHONG tren Tenkan/Kijun (som, dang bat dao)", suKien(ev, 5, { loc: (r, m) => dayGtgd(r, m) && !r.c11 }));

console.log("\n######## (6) PHAM VI x KL QUANH DAY (>= 2x), tu 2022-05 ########");
for (const ng of [5, 6]) {
  for (const [ten, pham] of [["VN100", (m) => vn.has(m.ma)], ["ngoai VN100", (m) => !vn.has(m.ma)], ["toan bo", () => true]]) {
    dong(`vuot ${ng}, ${ten}, co KL >= 2x`, suKien(ev, ng, { pham, loc: (r, m) => dayGtgd(r, m) && r.c10 }));
    dong(`vuot ${ng}, ${ten}, KHONG co KL >= 2x`, suKien(ev, ng, { pham, loc: (r, m) => dayGtgd(r, m) && !r.c10 }));
  }
}
console.log("\n######## (7) ON DINH THEO NAM: vuot 5 + KL >= 2x (toan bo ma GTGD >= 3 ty) vs khong KL ########");
for (const [nam, tu] of [["2014-2018", "2014-01-01"]]) void nam, void tu;
const tatCaNam = suKien(ev, 5, { loc: (r, m) => dayGtgd(r, m), nam: "2014-01-01" });
for (let y = 2014; y <= 2026; y++) {
  const a = tatCaNam.filter((x) => x.t.startsWith(String(y)));
  const c = a.filter((x) => x.c10), k = a.filter((x) => !x.c10);
  console.log(`   ${y}: co KL n=${String(c.length).padStart(4)} 10p ${f(tb(c.map((x) => x.r10))).padStart(6)} 20p ${f(tb(c.map((x) => x.r20))).padStart(6)} | khong KL n=${String(k.length).padStart(4)} 10p ${f(tb(k.map((x) => x.r10))).padStart(6)} 20p ${f(tb(k.map((x) => x.r20))).padStart(6)}`);
}

console.log("\n######## (8) ON DINH THEO NAM: nguong 6 vs 5 (toan bo ma GTGD >= 3 ty), 20 phien ########");
{
  const a6 = suKien(ev, 6, { loc: dayGtgd, nam: "2014-01-01" }), a5 = suKien(ev, 5, { loc: dayGtgd, nam: "2014-01-01" });
  for (let y = 2014; y <= 2026; y++) {
    const x6 = a6.filter((x) => x.t.startsWith(String(y))), x5 = a5.filter((x) => x.t.startsWith(String(y)));
    console.log(`   ${y}: vuot 6 n=${String(x6.length).padStart(4)} 10p ${f(tb(x6.map((x) => x.r10))).padStart(6)} 20p ${f(tb(x6.map((x) => x.r20))).padStart(6)} | vuot 5 n=${String(x5.length).padStart(4)} 10p ${f(tb(x5.map((x) => x.r10))).padStart(6)} 20p ${f(tb(x5.map((x) => x.r20))).padStart(6)}`);
  }
  const t6 = a6.filter((x) => x.t < "2022-05-01"), t5 = a5.filter((x) => x.t < "2022-05-01");
  console.log(`   truoc 2022-05 tong: vuot 6 n=${t6.length} 10p ${f(tb(t6.map((x) => x.r10)))} 20p ${f(tb(t6.map((x) => x.r20)))} | vuot 5 n=${t5.length} 10p ${f(tb(t5.map((x) => x.r10)))} 20p ${f(tb(t5.map((x) => x.r20)))}`);
}
