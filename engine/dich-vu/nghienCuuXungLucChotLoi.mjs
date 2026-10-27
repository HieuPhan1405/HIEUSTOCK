// NGHIEN CUU XUNG LUC TANG / XAC SUAT MA CON TANG DE CHOT LOI (Hieu 27/10/2026: "co chi bao do duoc xung luc tang khong, hay do xac suat ma con tang de tinh moc chot loi").
// Lenh Mua thuong cua engine (nen_dai.json, ~2018 -> 21/10/2026). Hai phan:
//  (1) CHI BAO LUC VAO co doan duoc muc tang toi da (MFE 20 phien, cho den khi cham cat lo S) khong? Spearman voi MFE, voi P(MFE >= 10%); tung giai doan (<2019 | 2019-22.4 | 22.5+) de xem co on dinh khong; + tu phan vi duoi/tren (TB MFE, P10).
//  (2) CHI BAO TRONG LENH bao hieu "het da tang": khi mau xuat hien (va dang lai >= nguong) thi ban het / nua phan con lai (phan sau TP1+TP2), con lai Tenkan 1/2 + Kijun not (TK3 = 30/30; T40 = 40/40). Mau: RSI14 >= 70/75/80, gian xa Tenkan (>= k ATR), nen dao chieu bong tren dai + KL lon, RSI giam 2 phien tu >=65, MACD histogram cat xuong khi dang lai.
// Quy uoc THUC TE (mua mo cua phien sau, ban tu chieu T+2) va LY TUONG (gia engine E, ban tu phien sau). Phi 0,4%. Chi tin khi cung huong o ca 3 giai doan + 2026.
// Chay: node engine/dich-vu/nghienCuuXungLucChotLoi.mjs
import { docJson, chayEngine, thongKe, danhMucNhieuLan, tb, f, kyOf } from "./backtestChung.mjs";
import { mp, HAI_TP } from "./moPhongTK.mjs";

const cache = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");
const { lenh: tatCa } = chayEngine({ cache, vni });
const lenh = tatCa.filter((t) => t.loai === 1);
const chiSo = new Map(vni.map((b, i) => [b.t, i]));
const vc = vni.map((b) => b.c);

// ---------- chi bao tren mang gia ----------
const rsiWilder = (c, n = 14) => {
  const r = new Array(c.length).fill(null);
  let g = 0, l = 0;
  for (let i = 1; i < c.length; i++) {
    const d = c[i] - c[i - 1];
    const up = Math.max(d, 0), dn = Math.max(-d, 0);
    if (i <= n) { g += up; l += dn; if (i === n) { g /= n; l /= n; r[i] = l === 0 ? 100 : 100 - 100 / (1 + g / l); } }
    else { g = (g * (n - 1) + up) / n; l = (l * (n - 1) + dn) / n; r[i] = l === 0 ? 100 : 100 - 100 / (1 + g / l); }
  }
  return r;
};
const ema = (a, n) => { const k = 2 / (n + 1), r = new Array(a.length).fill(null); let e = null; for (let i = 0; i < a.length; i++) { e = e == null ? a[i] : a[i] * k + e * (1 - k); r[i] = e; } return r; };
const macdHist = (c) => { const m = ema(c, 12).map((x, i) => x - ema(c, 26)[i]); return null; };
function macdHistogram(c) {
  const e12 = ema(c, 12), e26 = ema(c, 26), m = c.map((_, i) => e12[i] - e26[i]), s = ema(m, 9);
  return m.map((x, i) => x - s[i]);
}
const CH = new WeakMap(); // t.close -> { rsi, hist }
const chiBao = (t) => {
  let x = CH.get(t.close);
  if (!x) { x = { rsi: rsiWilder(t.close), hist: macdHistogram(t.close) }; CH.set(t.close, x); }
  return x;
};
void macdHist;

// ---------- Phan 1: dac trung luc vao + MFE ----------
for (const t of lenh) {
  const { rsi } = chiBao(t);
  const { close, high, low, open, tenkan, kijun, atr, cloudTop, iv, E, S, tp } = t;
  let mx = E;
  for (let j = iv + 1; j < Math.min(t.n, iv + 21); j++) {
    if (low[j] <= S) break;
    mx = Math.max(mx, high[j]);
  }
  t.mfe = (mx / E - 1) * 100;
  const i = chiSo.get(t.ngay);
  t.F = {
    "RSI14": rsi[iv],
    "RSI14 doi 3 phien": rsi[iv] != null && rsi[iv - 3] != null ? rsi[iv] - rsi[iv - 3] : null,
    "Gian xa Tenkan (close-Tenkan)/ATR": tenkan[iv] != null ? (close[iv] - tenkan[iv]) / atr[iv] : null,
    "Gian xa Kijun (close-Kijun)/ATR": kijun[iv] != null ? (close[iv] - kijun[iv]) / atr[iv] : null,
    "Doc Tenkan 5 phien %": tenkan[iv] != null && tenkan[iv - 5] > 0 ? (tenkan[iv] / tenkan[iv - 5] - 1) * 100 : null,
    "Doc Kijun 5 phien %": kijun[iv] != null && kijun[iv - 5] > 0 ? (kijun[iv] / kijun[iv - 5] - 1) * 100 : null,
    "ATR % gia": (atr[iv] / close[iv]) * 100,
    "Tang 5 phien %": iv >= 5 ? (close[iv] / close[iv - 5] - 1) * 100 : null,
    "Tang 20 phien %": iv >= 20 ? (close[iv] / close[iv - 20] - 1) * 100 : null,
    "Vi tri dong cua trong nen (0-1)": high[iv] > low[iv] ? (close[iv] - low[iv]) / (high[iv] - low[iv]) : null,
    "Than nen % (close/open)": (close[iv] / open[iv] - 1) * 100,
    "Khoi luong tuong doi RelVol": t.relVol?.[iv] ?? null,
    "Khoang cach len TP1 %": (tp[0] / E - 1) * 100,
    "Khoang cach len TP2 %": (tp[1] / E - 1) * 100,
    "Cat lo % (E-S)/E": ((E - S) / E) * 100,
    "Gia tren dinh may %": cloudTop[iv] > 0 ? (close[iv] / cloudTop[iv] - 1) * 100 : null,
    "Diem tong luc vao": t.dacTrung["Tong diem luc vao (diem)"],
    "ADX": t.dacTrung["ADX"],
    "RS 20 phien so voi VN-Index": t.dacTrung["Suc manh so voi VN-Index (RS 20 phien)"],
    "trendScore": t.trendScore?.[iv] ?? null,
    "momScore": t.momScore?.[iv] ?? null,
    "mfScore": t.mfScore?.[iv] ?? null,
    "VN-Index d5 %": i != null && i >= 5 ? (vc[i] / vc[i - 5] - 1) * 100 : null,
  };
}
const rank = (a) => { const idx = a.map((v, i) => [v, i]).sort((x, y) => x[0] - y[0]); const r = new Array(a.length); for (let i = 0; i < idx.length;) { let j = i; while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++; const m = (i + j) / 2 + 1; for (let k = i; k <= j; k++) r[idx[k][1]] = m; i = j + 1; } return r; };
const pear = (a, b) => { const n = a.length, ma = tb(a), mb = tb(b); let s = 0, sa = 0, sb = 0; for (let i = 0; i < n; i++) { s += (a[i] - ma) * (b[i] - mb); sa += (a[i] - ma) ** 2; sb += (b[i] - mb) ** 2; } return s / Math.sqrt(sa * sb); };
const spearman = (a, b) => (a.length > 30 ? pear(rank(a), rank(b)) : NaN);
const ten = Object.keys(lenh[0].F);
console.log(`${lenh.length} lenh Mua thuong. MFE 20 phien: TB ${f(tb(lenh.map((t) => t.mfe)))}%, P(>=5%) ${f(100 * lenh.filter((t) => t.mfe >= 5).length / lenh.length, 0)}%, P(>=10%) ${f(100 * lenh.filter((t) => t.mfe >= 10).length / lenh.length, 0)}%`);
console.log("\n===== PHAN 1: chi bao luc vao vs MFE 20 phien (Spearman) =====");
console.log("Chi bao".padEnd(38), "n".padStart(5), "rho MFE".padStart(8), "| theo giai doan (<2019, 19-22.4, 22.5+)".padEnd(40), "| 20% thap: MFE / P10 | 20% cao: MFE / P10");
const hang = [];
for (const k of ten) {
  const ds = lenh.filter((t) => t.F[k] != null && Number.isFinite(t.F[k]));
  const rho = spearman(ds.map((t) => t.F[k]), ds.map((t) => t.mfe));
  const ky = [0, 1, 2].map((p) => { const d = ds.filter((t) => kyOf(t.ngay) === p); return spearman(d.map((t) => t.F[k]), d.map((t) => t.mfe)); });
  const s = [...ds].sort((a, b) => a.F[k] - b.F[k]), q = Math.floor(s.length / 5);
  const lo = s.slice(0, q), hi = s.slice(-q);
  const p10 = (a) => (100 * a.filter((t) => t.mfe >= 10).length) / a.length;
  hang.push({ k, n: ds.length, rho, ky, lo: [tb(lo.map((t) => t.mfe)), p10(lo)], hi: [tb(hi.map((t) => t.mfe)), p10(hi)] });
}
hang.sort((a, b) => Math.abs(b.rho) - Math.abs(a.rho));
for (const h of hang) console.log(h.k.padEnd(38), String(h.n).padStart(5), f(h.rho, 3).padStart(8), "|", h.ky.map((x) => f(x, 3).padStart(7)).join(" "), "".padEnd(11), "|", `${f(h.lo[0]).padStart(5)}% / ${f(h.lo[1], 0).padStart(2)}%`, "|", `${f(h.hi[0]).padStart(5)}% / ${f(h.hi[1], 0).padStart(2)}%`);

// ---------- Phan 2: mau het da tang -> chot phan con lai ----------
const maxRel = (t, i) => (t.relVol?.[i] ?? 0);
const MAU = [
  ["Khong mau (co so)", null, 0, 1],
  ["RSI14 >= 70", (t, i) => chiBao(t).rsi[i] >= 70, 0, 1],
  ["RSI14 >= 75", (t, i) => chiBao(t).rsi[i] >= 75, 0, 1],
  ["RSI14 >= 80", (t, i) => chiBao(t).rsi[i] >= 80, 0, 1],
  ["RSI14 >= 75, ban 1/2 con lai", (t, i) => chiBao(t).rsi[i] >= 75, 0, 0.5],
  ["Gian xa Tenkan >= 2,5 ATR", (t, i) => t.tenkan[i] != null && (t.close[i] - t.tenkan[i]) / t.atr[i] >= 2.5, 0, 1],
  ["Gian xa Tenkan >= 3,5 ATR", (t, i) => t.tenkan[i] != null && (t.close[i] - t.tenkan[i]) / t.atr[i] >= 3.5, 0, 1],
  ["Gian xa Tenkan >= 4,5 ATR", (t, i) => t.tenkan[i] != null && (t.close[i] - t.tenkan[i]) / t.atr[i] >= 4.5, 0, 1],
  ["Gian xa Tenkan >= 3,5 ATR, ban 1/2 con lai", (t, i) => t.tenkan[i] != null && (t.close[i] - t.tenkan[i]) / t.atr[i] >= 3.5, 0, 0.5],
  ["Nen dao chieu: bong tren >= 60% + KL >= 1,5 lan", (t, i) => t.high[i] > t.low[i] && (t.high[i] - t.close[i]) / (t.high[i] - t.low[i]) >= 0.6 && t.close[i] < t.open[i] && maxRel(t, i) >= 1.5, 3, 1],
  ["RSI giam 2 phien tu >= 65", (t, i) => { const r = chiBao(t).rsi; return r[i - 2] >= 65 && r[i] < r[i - 1] && r[i - 1] < r[i - 2]; }, 3, 1],
  ["MACD histogram cat xuong (dang lai >= 5%)", (t, i) => { const h = chiBao(t).hist; return h[i - 1] > 0 && h[i] <= 0; }, 5, 1],
  ["MACD histogram cat xuong (dang lai >= 5%), 1/2 con lai", (t, i) => { const h = chiBao(t).hist; return h[i - 1] > 0 && h[i] <= 0; }, 5, 0.5],
];
const CACH = [
  ["TK3 (30/30 + Tenkan 1/2 + Kijun not)", { moc: HAI_TP, baoVe: true, theoSell: true, tk: "nua" }],
  ["T40 (40/40 + Tenkan 1/2 + Kijun not)", { moc: [{ w: 0.4, i: 0 }, { w: 0.4, i: 1 }], baoVe: true, theoSell: true, tk: "nua" }],
];
const QUY_UOC = [["THUC TE", (t) => ({ vao: t.iv + 1, banTu: t.iv + 3 })], ["LY TUONG", (t) => ({ E: t.E, vao: t.iv + 1, banTu: t.iv + 1 })]];
const SO_LAN = 20;
console.log("\n\n===== PHAN 2: mau het da tang -> chot phan con lai (sau TP1+TP2) =====");
for (const [tenQU, cfgVao] of QUY_UOC) {
  for (const [tenCach, cfgCach] of CACH) {
    console.log(`\n=========== ${tenQU} | ${tenCach} ===========`);
    console.log("Mau".padEnd(52), "n".padStart(5), "lai TB".padStart(7), "thang%".padStart(7), "PF".padStart(5), "phien".padStart(6), "| giai doan (<2019, 19-22.4, 22.5+)".padStart(38), "| 2026 (n, lai) | DM K=10 / K=20");
    for (const [ten, fn, nguong, tyle] of MAU) {
      const cfg = { ...cfgCach, ...(fn ? { mau: fn, mauNguong: nguong, mauTyLe: tyle } : {}) };
      const kqs = lenh.map((t) => mp(t, { ...cfg, ...cfgVao(t) }));
      const ds = lenh.filter((_, i) => kqs[i]), kg = kqs.filter(Boolean);
      const k = thongKe(kg);
      const ky = [[], [], []];
      ds.forEach((t, i) => ky[kyOf(t.ngay)].push(kg[i].ret));
      const r26 = ds.map((t, i) => (t.ngay >= "2026-01-01" ? kg[i].ret : null)).filter((x) => x != null);
      const d10 = danhMucNhieuLan(kg, ds, 10, SO_LAN, {}), d20 = danhMucNhieuLan(kg, ds, 20, SO_LAN, {});
      console.log(ten.padEnd(52), String(k.n).padStart(5), f(k.tb).padStart(7), f(k.thang, 0).padStart(7), f(k.pf).padStart(5), f(k.phienTB, 1).padStart(6), "|", ky.map((a) => (a.length ? f(tb(a)) : "-").padStart(7)).join(" "), "|", `${String(r26.length).padStart(3)} ${f(tb(r26)).padStart(6)}`, `| ${f(d10.cagr, 1).padStart(5)}%/${f(d10.sut, 0).padStart(2)}% ${f(d20.cagr, 1).padStart(5)}%/${f(d20.sut, 0)}%`);
    }
  }
}
