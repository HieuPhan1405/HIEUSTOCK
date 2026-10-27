// T+ CAO (Hieu 27/10/2026: "T+ co the T+ cao chu khong nhat quyet T+2 ban luon"): cac kieu vao lenh ngan han, GIU DEN KHI DAT DIEU KIEN RA thay vi ban co dinh T+2.
// Vao: mo cua phien sau tin hieu (e = i+1). Ra som nhat o phien e+2 (chieu T+2: chi xet gia dong cua), tu e+3 xet trong ngay (cat lo / chot loi neu cham gia; mo cua vuot thi khop o gia mo cua; cam ca 2 thi uu tien cat lo).
// Cach ra: H2/H5/H10/H20 = giu co dinh N phien (dong cua); TP8/SL5 = chot +8% / cat -5% toi da 20 phien; TP12/SL6 = +12% / -6% toi da 30 phien; TR7 = ra khi dong cua <= dinh dong cua tu luc mua -7% (toi da 30);
//   MA10 = ra khi dong cua < MA10 (toi da 30 phien). Phi + truot 0,4%/vong. "vuot" = tru ket qua cung cach ra cua cac cap (ma, ngay) thanh khoan (lay moi 5 phien) KHONG co tin hieu.
// Chay: node engine/dich-vu/nghienCuuTCao.mjs  (TU=2026-01-01 de chi xem 2026)
import { readFileSync } from "node:fs";
import { docNenMoiNhat } from "./docNenMoiNhat.mjs";

const nen = process.env.NEN === "dai" ? JSON.parse(readFileSync(new URL("../output/nen_dai.json", import.meta.url), "utf8")) : docNenMoiNhat(); // NEN=dai: 13 nam (den 21/10); mac dinh nen_gan (700 phien ~ tu 12/2023)
const vni = JSON.parse(readFileSync(new URL("../output/vnindex_dai.json", import.meta.url), "utf8"));
const TU = process.env.TU ?? "2022-04-01";
const PHI = 0.4;
const THANH_KHOAN = 5;
const MAX = 30;

const sma = (a, n) => { const r = new Array(a.length).fill(NaN); let s = 0; for (let i = 0; i < a.length; i++) { s += a[i]; if (i >= n) s -= a[i - n]; if (i >= n - 1) r[i] = s / n; } return r; };
function rsi(c, n) {
  const r = new Array(c.length).fill(NaN);
  let g = 0, l = 0;
  for (let i = 1; i < c.length; i++) {
    const d = c[i] - c[i - 1], up = Math.max(d, 0), dn = Math.max(-d, 0);
    if (i <= n) { g += up / n; l += dn / n; } else { g = (g * (n - 1) + up) / n; l = (l * (n - 1) + dn) / n; }
    if (i >= n) r[i] = l === 0 ? 100 : 100 - 100 / (1 + g / l);
  }
  return r;
}
const rollMax = (a, n) => a.map((_, i) => (i < n - 1 ? NaN : Math.max(...a.slice(i - n + 1, i + 1))));
const rollMin = (a, n) => a.map((_, i) => (i < n - 1 ? NaN : Math.min(...a.slice(i - n + 1, i + 1))));
const vniMap = new Map(vni.map((x, i) => [x.t, i > 5 ? (x.c / vni[i - 5].c - 1) * 100 : NaN]));

// ---- cach ra: tra ve { ret (% truoc phi), giu (so phien sau phien mua) }
function raTK(d, e, sch) {
  // Tenkan/Kijun: chi "thung" khi truoc do gia da tung dong cua TREN duong do (tu luc mua tro di) - ma vao luc dang duoi duong thi cho gia len tren truoc.
  // Ban 1/2 khi dong cua < Tenkan, ban not (phan con lai) khi dong cua < Kijun; tu phien e+2 (chieu T+2). Het han (toi da sch.max phien) ban not o dong cua. sl: cat lo cung (% so voi gia mua, tu phien e+3 theo gia thap nhat trong ngay).
  const vao = d.o[e];
  const n = d.c.length;
  const gioiHan = Math.min(n - 1, e + sch.max);
  let lenT = false, lenK = false, daBanNua = false, giaNua = 0, tong = 0;
  for (let k = 0; e + k <= gioiHan; k++) {
    const j = e + k;
    if (d.c[j] > d.tenkan[j]) lenT = true;
    if (d.c[j] > d.kijun[j]) lenK = true;
    if (k < 2) continue;
    if (sch.sl && k >= 3 && d.l[j] <= vao * (1 - sch.sl / 100)) {
      const gia = Math.min(d.o[j], vao * (1 - sch.sl / 100));
      const r = daBanNua ? 0.5 * giaNua + 0.5 * (gia / vao - 1) * 100 : (gia / vao - 1) * 100;
      return { ret: r, giu: k };
    }
    if (!daBanNua && lenT && d.c[j] < d.tenkan[j]) { daBanNua = true; giaNua = (d.c[j] / vao - 1) * 100; tong = k; }
    if (lenK && d.c[j] < d.kijun[j]) {
      const gia = (d.c[j] / vao - 1) * 100;
      return { ret: daBanNua ? 0.5 * giaNua + 0.5 * gia : gia, giu: daBanNua ? (tong + k) / 2 : k };
    }
    if (e + k === gioiHan) {
      const gia = (d.c[j] / vao - 1) * 100;
      return { ret: daBanNua ? 0.5 * giaNua + 0.5 * gia : gia, giu: daBanNua ? (tong + k) / 2 : k };
    }
  }
  return null;
}
function ra(d, e, sch) {
  if (sch.kieu === "TK") return raTK(d, e, sch);
  const vao = d.o[e];
  const n = d.c.length;
  const gioiHan = Math.min(n - 1, e + (sch.max ?? sch.n));
  if (sch.kieu === "H") {
    if (e + sch.n >= n) return null;
    return { ret: (d.c[e + sch.n] / vao - 1) * 100, giu: sch.n };
  }
  let dinh = d.c[e];
  const stop = vao * (1 - (sch.sl ?? 0) / 100), tp = vao * (1 + (sch.tp ?? 0) / 100);
  for (let k = 1; k + e <= gioiHan; k++) {
    const j = e + k;
    if (k >= 2) {
      const homNayChi = k === 2; // chieu T+2: chi xet gia dong cua
      if (sch.kieu === "TPSL") {
        if (homNayChi) {
          if (d.c[j] <= stop) return { ret: (d.c[j] / vao - 1) * 100, giu: k };
          if (d.c[j] >= tp) return { ret: (d.c[j] / vao - 1) * 100, giu: k };
        } else {
          if (d.o[j] <= stop) return { ret: (d.o[j] / vao - 1) * 100, giu: k };
          if (d.l[j] <= stop) return { ret: -sch.sl, giu: k };
          if (d.o[j] >= tp) return { ret: (d.o[j] / vao - 1) * 100, giu: k };
          if (d.h[j] >= tp) return { ret: sch.tp, giu: k };
        }
      } else if (sch.kieu === "TR") {
        if (d.c[j] <= dinh * (1 - sch.pct / 100)) return { ret: (d.c[j] / vao - 1) * 100, giu: k };
      } else if (sch.kieu === "MA") {
        if (d.c[j] < d.ma10[j]) return { ret: (d.c[j] / vao - 1) * 100, giu: k };
      }
    }
    dinh = Math.max(dinh, d.c[j]);
    if (j === gioiHan) return { ret: (d.c[j] / vao - 1) * 100, giu: k };
  }
  return null;
}
const SCH = [
  { ten: "H2  giu 2 phien (T+2)", kieu: "H", n: 2 },
  { ten: "H5  giu 5", kieu: "H", n: 5 },
  { ten: "H10 giu 10", kieu: "H", n: 10 },
  { ten: "H20 giu 20", kieu: "H", n: 20 },
  { ten: "H15 giu 15", kieu: "H", n: 15 },
  { ten: "S10 giu 20, cat lo -10%", kieu: "TPSL", tp: 1000, sl: 10, max: 20 },
  { ten: "S7  giu 20, cat lo -7%", kieu: "TPSL", tp: 1000, sl: 7, max: 20 },
  { ten: "TK  ban 1/2 thung Tenkan, not thung Kijun (toi da 40)", kieu: "TK", max: 40 },
  { ten: "TKS TK + cat lo -10%", kieu: "TK", max: 40, sl: 10 },
  { ten: "TP8/SL5  (toi da 20)", kieu: "TPSL", tp: 8, sl: 5, max: 20 },
  { ten: "TP12/SL6 (toi da 30)", kieu: "TPSL", tp: 12, sl: 6, max: 30 },
  { ten: "TR7  trailing 7% (toi da 30)", kieu: "TR", pct: 7, max: MAX },
  { ten: "MA10 ra khi <MA10 (toi da 30)", kieu: "MA", max: MAX },
];
// VN-Index tren / duoi MA200 (loc che do thi truong)
const vniMa200 = new Map(vni.map((x, i) => [x.t, i >= 200 ? x.c > vni.slice(i - 199, i + 1).reduce((a, b) => a + b.c, 0) / 200 : null]));
const KIEU = {
  "1 Qua ban RSI<30 + thung Bollinger duoi": (d, i) => d.rsi[i] < 30 && d.c[i] < d.bbLo[i],
  "2 Giam 3 phien (>MA50) tong >=4%": (d, i) => d.c[i] > d.ma50[i] && d.c[i] < d.c[i - 1] && d.c[i - 1] < d.c[i - 2] && d.c[i - 2] < d.c[i - 3] && d.c[i] / d.c[i - 3] - 1 <= -0.04,
  "3 Pullback xu huong tang (>MA50, ve MA20, RSI 35-50, nen xanh)": (d, i) => d.c[i] > d.ma50[i] && d.ma50[i] > d.ma50[i - 10] && d.c[i] <= d.ma20[i] * 1.01 && d.c[i] >= d.ma20[i] * 0.97 && d.rsi[i] >= 35 && d.rsi[i] <= 50 && d.c[i] > d.c[i - 1],
  "4 Pha dinh 20 phien + KL>=1,5x": (d, i) => d.c[i] > d.hh20p[i] && d.v[i] >= 1.5 * d.vTB[i],
  "5 Hoi xac nhan (giam>=15% tu dinh 20p, len tren Tenkan+Kijun lan dau)": (d, i) => d.c[i] / d.hh20[i] - 1 <= -0.15 && d.c[i] > d.tenkan[i] && d.c[i] > d.kijun[i] && d.c[i - 1] <= Math.max(d.tenkan[i - 1], d.kijun[i - 1]),
  "6 Qua ban + VN-Index giam >3%/5 phien": (d, i) => d.rsi[i] < 30 && d.c[i] < d.bbLo[i] && vniMap.get(d.t[i]) < -3,
  "6b Qua ban + VN-Index giam >3%/5p + VN-Index TREN MA200": (d, i) => d.rsi[i] < 30 && d.c[i] < d.bbLo[i] && vniMap.get(d.t[i]) < -3 && vniMa200.get(d.t[i]) === true,
  "6c Qua ban + VN-Index giam >3%/5p + VN-Index DUOI MA200 (thi truong gau)": (d, i) => d.rsi[i] < 30 && d.c[i] < d.bbLo[i] && vniMap.get(d.t[i]) < -3 && vniMa200.get(d.t[i]) === false,
  "9 Cham Tenkan bat len (xu huong tang: Tenkan>Kijun, Kijun dang len; hom truoc tren Tenkan, nen xanh dong tren Tenkan)": (d, i) => d.tenkan[i] > d.kijun[i] && d.c[i] > d.kijun[i] && d.kijun[i] > d.kijun[i - 5] && d.c[i - 1] > d.tenkan[i - 1] && d.l[i] <= d.tenkan[i] * 1.003 && d.c[i] > d.tenkan[i] && d.c[i] > d.o[i],
  "10 Cham Tenkan bat len + dong cua o nua tren nen + KL >= TB20": (d, i) => d.tenkan[i] > d.kijun[i] && d.c[i] > d.kijun[i] && d.kijun[i] > d.kijun[i - 5] && d.c[i - 1] > d.tenkan[i - 1] && d.l[i] <= d.tenkan[i] * 1.003 && d.c[i] > d.tenkan[i] && d.c[i] > d.o[i] && d.h[i] > d.l[i] && (d.c[i] - d.l[i]) / (d.h[i] - d.l[i]) >= 0.5 && d.v[i] >= d.vTB[i],
  "11 Cham Kijun bat len (xu huong tang: Tenkan>Kijun, Kijun dang len, nen xanh dong tren Kijun)": (d, i) => d.tenkan[i] > d.kijun[i] && d.kijun[i] > d.kijun[i - 5] && d.l[i] <= d.kijun[i] * 1.003 && d.c[i] > d.kijun[i] && d.c[i] > d.o[i] && d.c[i - 1] > d.kijun[i - 1],
  "7 Tang >=5% + KL>=1,5x (dong luong)": (d, i) => d.c[i] / d.c[i - 1] - 1 >= 0.05 && d.v[i] >= 1.5 * d.vTB[i],
  "8 Cat len tren MA20 sau >=5 phien duoi MA20, MA50 dang len": (d, i) => d.c[i] > d.ma20[i] && d.c[i - 1] <= d.ma20[i - 1] && d.c[i - 2] <= d.ma20[i - 2] && d.c[i - 3] <= d.ma20[i - 3] && d.c[i - 4] <= d.ma20[i - 4] && d.c[i - 5] <= d.ma20[i - 5] && d.ma50[i] > d.ma50[i - 10],
};

const lenh = []; // { kieu, t, r: [..theo SCH] }
const co = []; // cap (ma, ngay) KHONG tin hieu, lay moi 5 phien: r theo SCH
const coTT = []; // cap (ma, ngay) trong nhip VN-Index giam >3%/5 phien nhung KHONG co tin hieu "qua ban" (co so cung boi canh thi truong cho kieu 6)
for (const [ma, ds] of Object.entries(nen)) {
  const n = ds.length;
  if (n < 160) continue;
  const o = ds.map((x) => x.o), h = ds.map((x) => x.h), l = ds.map((x) => x.l), c = ds.map((x) => x.c), v = ds.map((x) => x.v), t = ds.map((x) => x.t);
  const ma20 = sma(c, 20), ma50 = sma(c, 50), ma10 = sma(c, 10), vTB = sma(v, 20);
  const sd = c.map((_, i) => { if (i < 19) return NaN; let s = 0; for (let j = i - 19; j <= i; j++) s += (c[j] - ma20[i]) ** 2; return Math.sqrt(s / 20); });
  const hh9 = rollMax(h, 9), ll9 = rollMin(l, 9), hh26 = rollMax(h, 26), ll26 = rollMin(l, 26), hh20 = rollMax(h, 20);
  const d = { t, o, h, l, c, v, ma10, ma20, ma50, vTB, rsi: rsi(c, 14), bbLo: ma20.map((m, i) => m - 2 * sd[i]), tenkan: hh9.map((x, i) => (x + ll9[i]) / 2), kijun: hh26.map((x, i) => (x + ll26[i]) / 2), hh20, hh20p: hh20.map((_, i) => (i ? hh20[i - 1] : NaN)) };
  const cuoi = {};
  for (let i = 100; i < n - 2; i++) {
    if (t[i] < TU) continue;
    let tb = 0;
    for (let j = i - 19; j <= i; j++) tb += c[j] * v[j];
    if (tb / 20 / 1e6 < THANH_KHOAN) continue;
    const e = i + 1;
    if (!(o[e] > 0)) continue;
    let coTin = false;
    for (const [ten, dk] of Object.entries(KIEU)) {
      let ok = false;
      try { ok = dk(d, i); } catch { ok = false; }
      if (!ok) continue;
      coTin = true;
      if (i - (cuoi[ten] ?? -99) < 10) continue;
      cuoi[ten] = i;
      const r = SCH.map((s) => ra(d, e, s));
      lenh.push({ ten, ma, t: t[i], r: r.map((x) => (x ? { ret: x.ret - PHI, giu: x.giu } : null)) });
    }
    if (!coTin && vniMap.get(t[i]) < -3) coTT.push({ t: t[i], r: SCH.map((s) => { const x = ra(d, e, s); return x ? x.ret - PHI : null; }) });
    if (!coTin && i % 5 === 0) co.push({ t: t[i], r: SCH.map((s) => { const x = ra(d, e, s); return x ? x.ret - PHI : null; }) });
  }
}
const tb = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const p = (x, dd = 2) => (Number.isFinite(x) ? x.toFixed(dd) : "—");
const nenMoc = SCH.map((_, k) => tb(co.map((x) => x.r[k]).filter((x) => x != null)));
const nenTT = SCH.map((_, k) => tb(coTT.map((x) => x.r[k]).filter((x) => x != null)));
console.log(`T+ cao, ${TU} -> nay, thanh khoan >= ${THANH_KHOAN} ty, phi+truot ${PHI}%/vong, 1 lenh / 10 phien / ma / kieu. Co so = cap (ma, ngay) khong tin hieu: n ${co.length}`);
console.log(`Co so cung boi canh thi truong (VN-Index giam >3%/5 phien, khong co tin hieu qua ban): n ${coTT.length} |`, SCH.map((s, k) => `${s.ten.split(" ")[0]} ${p(nenTT[k])}`).join(" | "));
console.log("Co so (lai TB sau phi):", SCH.map((s, k) => `${s.ten.split(" ")[0]} ${p(nenMoc[k])}`).join(" | "), "\n");
for (const ten of Object.keys(KIEU)) {
  if (process.env.ONLY && !process.env.ONLY.split(",").some((q) => ten.startsWith(q))) continue;
  const a = lenh.filter((x) => x.ten === ten);
  console.log(`${ten}  (n ${a.length})`);
  SCH.forEach((s, k) => {
    const r = a.map((x) => x.r[k]).filter((x) => x);
    if (r.length < 20) return console.log("    ", s.ten.padEnd(32), "(it mau)");
    const rets = r.map((x) => x.ret);
    const th = rets.filter((x) => x > 0), lo = rets.filter((x) => x <= 0);
    const pf = lo.length ? th.reduce((s, x) => s + x, 0) / -lo.reduce((s, x) => s + x, 0) : NaN;
    const nam = ["2022", "2023", "2024", "2025", "2026"].map((y) => { const b = a.filter((x) => x.t.startsWith(y) && x.r[k]); return b.length >= 15 ? p(tb(b.map((x) => x.r[k].ret)), 1) : "·"; }).join(" ");
    console.log("    ", s.ten.padEnd(32), "n", String(r.length).padStart(5), "| lai", p(tb(rets)).padStart(6), "vuot co so", p(tb(rets) - nenMoc[k]).padStart(6), "| thang", (p((th.length / rets.length) * 100, 0) + "%").padStart(4), "PF", p(pf).padStart(5), "| giu TB", p(tb(r.map((x) => x.giu)), 1).padStart(4), ten.startsWith("6") ? `| vuot co so cung boi canh ${p(tb(rets) - nenTT[k])}` : "", "| lai theo nam 22-26:", nam);
  });
}


// ---------- Theo thang (kieu 1 va 6, giu 20 phien): xem co tap trung vai dot khong
for (const ten of Object.keys(KIEU).filter((k) => k.startsWith("1") || k.startsWith("6"))) {
  const k20 = SCH.findIndex((q) => q.ten.startsWith("H20"));
  const a = lenh.filter((x) => x.ten === ten && x.r[k20]);
  const m = new Map();
  for (const x of a) (m.get(x.t.slice(0, 7)) ?? m.set(x.t.slice(0, 7), []).get(x.t.slice(0, 7))).push(x.r[k20].ret);
  const th = [...m.entries()].sort();
  console.log(`\n${ten}: giu 20 phien theo thang vao (n lenh | lai TB)`);
  console.log("  " + th.map(([k, v]) => `${k} ${v.length}|${p(tb(v), 1)}`).join("   "));
  const vt = th.map(([, v]) => tb(v));
  console.log(`  ${th.length} thang co lenh, ${vt.filter((x) => x > 0).length} thang lai; lai TB cac thang ${p(tb(vt))}%`);
}
