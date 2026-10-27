// NGHIEN CUU "PREDICTIVE MONTE CARLO ENGINE" (LuxAlgo, Hieu dan 27/10/2026: "thu chi bao nay nua, test nhe"). Dung lai logic chi bao: tu N phien gan nhat (mac dinh 100) lay loi suat -> mo phong 200 duong gia tuong lai
// (GBM = Geometric Brownian Motion theo mu/sigma cua log-return; HS = Historical Shuffle boc ngau nhien loi suat qua khu), tuy chon loc theo CHE DO (gia > SMA50 hay khong, chi lay mau cung che do hien tai). Moi duong cho gia cuoi sau H phien; chi bao lay
// trung binh (Mean), trung vi, P90 (R1), P10 (S1), Max, Min; "Forecasted Candle" = Bullish neu Mean > gia hien tai. KHONG nhin truoc: moi lenh chi dung nen den het ngay tin hieu (iv).
// Hai cach test tren lenh Mua thuong cua engine (4.436): (E) VAO LENH - Mean/P90/xac suat cham +10% co doan duoc MFE / lai lenh khong; loc Bullish / Mean > 0 / xac suat cao;
// (X) CHOT LOI - dat TP1/TP2 theo muc Monte Carlo (P75/P90 cua gia cuoi, H = 10 / 20 phien) thay cho TP engine, so voi TP engine va moc co dinh +5/+10.
// Quy uoc THUC TE (mua mo cua phien sau, ban tu T+2) va LY TUONG; phi 0,4%; cach ra HT (30/30 + BAN) va KIJ. Chay: node engine/dich-vu/nghienCuuMonteCarlo.mjs
import { docJson, chayEngine, thongKe, danhMucNhieuLan, tb, f, kyOf } from "./backtestChung.mjs";
import { mp, HAI_TP } from "./moPhongTK.mjs";

const cache = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");
const { lenh: tatCa } = chayEngine({ cache, vni });
const lenh = tatCa.filter((t) => t.loai === 1 && t.iv >= 160);
const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const mulberry = (a) => () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const gauss = (r) => { const u1 = Math.max(r(), 1e-5), u2 = r(); return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2); };
const phanVi = (s, p) => s[Math.min(s.length - 1, Math.max(0, Math.ceil((p / 100) * s.length) - 1))];
const avg = (a) => a.reduce((u, w) => u + w, 0) / a.length;
const sd = (a) => { const m = avg(a); return Math.sqrt(avg(a.map((v) => (v - m) ** 2))); }; // chi bao dung stdev tong the

// Mo phong Monte Carlo tai nen iv. cfg: { phuongPhap: "GBM" | "HS", cheDo: false | true (SMA50), H, soDuong, lookback, volNhan }
function monteCarlo(t, iv, { phuongPhap, cheDo, H, soDuong = 200, lookback = 100, volNhan = 1 }) {
  const { close, sma50 } = t;
  const lr = [], sr = [], rg = [];
  for (let k = iv - lookback + 1; k <= iv; k++) {
    lr.push(Math.log(close[k] / close[k - 1]));
    sr.push(close[k] - close[k - 1]);
    rg.push(close[k] > (sma50[k] ?? close[k]) ? 1 : -1);
  }
  const cur = rg[rg.length - 1];
  let idx = lr.map((_, i) => i).filter((i) => !cheDo || rg[i] === cur);
  if (!idx.length) idx = lr.map((_, i) => i);
  const L = idx.map((i) => lr[i]), S = idx.map((i) => sr[i]);
  const mu = avg(L), sg = sd(L) * volNhan;
  const r = mulberry(hash(t.ma) + iv * 7919 + (phuongPhap === "GBM" ? 1000 : 3000));
  const P0 = close[iv];
  const ends = [];
  let cham5 = 0, cham10 = 0;
  for (let i = 0; i < soDuong; i++) {
    let p = P0, mx = P0;
    for (let j = 1; j <= H; j++) {
      if (phuongPhap === "HS") p += S[Math.floor(r() * S.length)];
      else p *= Math.exp(mu - (sg * sg) / 2 + sg * gauss(r));
      if (p > mx) mx = p;
    }
    ends.push(p);
    if (mx >= P0 * 1.05) cham5++;
    if (mx >= P0 * 1.10) cham10++;
  }
  ends.sort((a, b) => a - b);
  const pc = (x) => (x / P0 - 1) * 100;
  return { mean: pc(avg(ends)), med: pc(phanVi(ends, 50)), p75: pc(phanVi(ends, 75)), p90: pc(phanVi(ends, 90)), p10: pc(phanVi(ends, 10)), max: pc(ends[ends.length - 1]), min: pc(ends[0]), pUp: ends.filter((v) => v > P0).length / ends.length, cham5: cham5 / soDuong, cham10: cham10 / soDuong, mu: mu * 100, sg: sg * 100 };
}

const CAUHINH = [
  ["GBM", "GBM", false, 20], ["GBM+che do", "GBM", true, 20], ["HS", "HS", false, 20], ["HS+che do", "HS", true, 20],
  ["GBM H10", "GBM", false, 10], ["HS H10", "HS", false, 10],
];
for (const t of lenh) {
  t.mc = {};
  for (const [ten, ph, cd, H] of CAUHINH) t.mc[ten] = monteCarlo(t, t.iv, { phuongPhap: ph, cheDo: cd, H });
  let mx = t.E;
  for (let j = t.iv + 1; j < Math.min(t.n, t.iv + 21); j++) { if (t.low[j] <= t.S) break; mx = Math.max(mx, t.high[j]); }
  t.mfe = (mx / t.E - 1) * 100;
}
console.log(`${lenh.length} lenh Mua thuong (du 160 phien lich su).`);

const QUY_UOC = [["THUC TE", (t) => ({ vao: t.iv + 1, banTu: t.iv + 3 })], ["LY TUONG", (t) => ({ E: t.E, vao: t.iv + 1, banTu: t.iv + 1 })]];
const HT = { moc: HAI_TP, baoVe: true, theoSell: true };
const KIJ = { moc: [], baoVe: false, theoSell: false, tk: "kijun" };
const SO_LAN = 20;
const rank = (a) => { const idx = a.map((v, i) => [v, i]).sort((x, y) => x[0] - y[0]); const r = new Array(a.length); for (let i = 0; i < idx.length;) { let j = i; while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++; const m = (i + j) / 2 + 1; for (let k = i; k <= j; k++) r[idx[k][1]] = m; i = j + 1; } return r; };
const pear = (a, b) => { const n = a.length, ma = tb(a), mb = tb(b); let s = 0, sa = 0, sb = 0; for (let i = 0; i < n; i++) { s += (a[i] - ma) * (b[i] - mb); sa += (a[i] - ma) ** 2; sb += (b[i] - mb) ** 2; } return s / Math.sqrt(sa * sb); };
const spear = (a, b) => (a.length > 30 ? pear(rank(a), rank(b)) : NaN);
const dong = (ten, ds, kqs) => {
  const k = thongKe(kqs);
  const ky = [[], [], []];
  ds.forEach((t, i) => ky[kyOf(t.ngay)].push(kqs[i].ret));
  const r26 = ds.map((t, i) => (t.ngay >= "2026-01-01" ? kqs[i].ret : null)).filter((x) => x != null);
  const d10 = danhMucNhieuLan(kqs, ds, 10, SO_LAN, {}), d20 = danhMucNhieuLan(kqs, ds, 20, SO_LAN, {});
  console.log(ten.padEnd(52), String(k.n).padStart(5), f(k.tb).padStart(7), f(k.thang, 0).padStart(7), f(k.pf).padStart(5), f(k.phienTB, 1).padStart(6), "|", ky.map((a) => (a.length ? f(tb(a)) : "-").padStart(7)).join(" "), "|", `${String(r26.length).padStart(3)} ${f(tb(r26)).padStart(6)}`, `| ${f(d10.cagr, 1).padStart(5)}%/${f(d10.sut, 0).padStart(2)}% ${f(d20.cagr, 1).padStart(5)}%/${f(d20.sut, 0)}%`);
};
const TD = ["".padEnd(52), "n".padStart(5), "lai TB".padStart(7), "thang%".padStart(7), "PF".padStart(5), "phien".padStart(6), "| giai doan (<2019, 19-22.4, 22.5+)", "| 2026 (n, lai) | DM K=10 / K=20"];

// ---------- (E) vao lenh ----------
{
  const kq = lenh.map((t) => mp(t, { ...HT, vao: t.iv + 1, banTu: t.iv + 3 }));
  console.log("\n===== (E1) Chi bao Monte Carlo luc vao vs MFE 20 phien va lai lenh HT thuc te (Spearman; theo giai doan <2019, 19-22.4, 22.5+) =====");
  console.log("Chi bao".padEnd(36), "rho MFE".padStart(8), "rho lai".padStart(8), "| rho lai theo giai doan");
  for (const [ten] of CAUHINH) {
    for (const [tk, g] of [["Mean %", (m) => m.mean], ["P90 % (R1)", (m) => m.p90], ["P10 % (S1)", (m) => m.p10], ["Xac suat cham +10%", (m) => m.cham10], ["Xac suat cuoi > hien tai", (m) => m.pUp]]) {
      const ok = lenh.map((_, i) => i).filter((i) => kq[i]);
      const xs = ok.map((i) => g(lenh[i].mc[ten]));
      const ky = [0, 1, 2].map((p) => { const o = ok.filter((i) => kyOf(lenh[i].ngay) === p); return f(spear(o.map((i) => g(lenh[i].mc[ten])), o.map((i) => kq[i].ret)), 3).padStart(6); });
      console.log(`${ten} ${tk}`.padEnd(36), f(spear(xs, ok.map((i) => lenh[i].mfe)), 3).padStart(8), f(spear(xs, ok.map((i) => kq[i].ret)), 3).padStart(8), "|", ky.join(" "));
    }
  }
  const mc = (t, ten = "GBM") => t.mc[ten];
  const med = (g) => [...lenh.map(g)].sort((a, b) => a - b)[Math.floor(lenh.length / 2)];
  const LOC = [
    ["Khong loc", () => true],
    ["GBM H20: Bullish (Mean > 0)", (t) => mc(t).mean > 0],
    ["GBM+che do H20: Bullish", (t) => mc(t, "GBM+che do").mean > 0],
    ["HS H20: Bullish", (t) => mc(t, "HS").mean > 0],
    ["HS+che do H20: Bullish", (t) => mc(t, "HS+che do").mean > 0],
    ["GBM H10: Bullish", (t) => mc(t, "GBM H10").mean > 0],
    ["GBM: P(cham +10%) tren trung vi", (t) => mc(t).cham10 > med((x) => x.mc.GBM.cham10)],
    ["GBM: P90 (R1) tren trung vi", (t) => mc(t).p90 > med((x) => x.mc.GBM.p90)],
    ["GBM: P(cuoi > hien tai) > 0,6", (t) => mc(t).pUp > 0.6],
    ["NGUOC: GBM Bearish (Mean <= 0)", (t) => mc(t).mean <= 0],
  ];
  for (const [tenQU, cvao] of QUY_UOC) {
    for (const [tenCach, cfg] of [["HT", HT], ["KIJ", KIJ]]) {
      const kq2 = lenh.map((t) => mp(t, { ...cfg, ...cvao(t) }));
      console.log(`\n=========== (E2) VAO LENH | ${tenQU} | cach ra ${tenCach} ===========`);
      console.log(...TD);
      for (const [ten, fn] of LOC) {
        const gi = lenh.map((_, i) => i).filter((i) => kq2[i] && fn(lenh[i]));
        dong(ten, gi.map((i) => lenh[i]), gi.map((i) => kq2[i]));
      }
    }
  }
}

// ---------- (X) chot loi theo muc Monte Carlo ----------
const mocMC = (ten, a, b, wa = 0.3, wb = 0.3) => (t) => [{ w: wa, pct: Math.max(a(t.mc[ten]), 1) }, { w: wb, pct: Math.max(b(t.mc[ten]), 2) }];
const PHUONG_AN = [
  ["TP engine 30/30 (co so)", () => HAI_TP],
  ["Co dinh +5% / +10% (30/30)", () => [{ w: 0.3, pct: 5 }, { w: 0.3, pct: 10 }]],
  ["MC GBM H10: P75 / P90", mocMC("GBM H10", (m) => m.p75, (m) => m.p90)],
  ["MC GBM H20: P75 / P90", mocMC("GBM", (m) => m.p75, (m) => m.p90)],
  ["MC GBM H20: P90 / Max", mocMC("GBM", (m) => m.p90, (m) => m.max)],
  ["MC GBM H20: Mean / P90", mocMC("GBM", (m) => m.mean, (m) => m.p90)],
  ["MC HS H20: P75 / P90", mocMC("HS", (m) => m.p75, (m) => m.p90)],
  ["MC HS H10: P75 / P90", mocMC("HS H10", (m) => m.p75, (m) => m.p90)],
  ["MC GBM+che do H20: P75 / P90", mocMC("GBM+che do", (m) => m.p75, (m) => m.p90)],
  ["MC GBM H20: P75 / P90, 40/40", mocMC("GBM", (m) => m.p75, (m) => m.p90, 0.4, 0.4)],
];
for (const [tenQU, cvao] of QUY_UOC) {
  console.log(`\n=========== (X) CHOT LOI THEO MUC MONTE CARLO | ${tenQU} | phan con lai theo BAN (HT), hoa von sau TP2 engine ===========`);
  console.log(...TD);
  for (const [ten, fm] of PHUONG_AN) {
    const kq = lenh.map((t) => mp(t, { moc: fm(t), baoVe: true, theoSell: true, ...cvao(t) }));
    const gi = lenh.map((_, i) => i).filter((i) => kq[i]);
    dong(ten, gi.map((i) => lenh[i]), gi.map((i) => kq[i]));
  }
}
