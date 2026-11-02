// CHOT LOI CHO DIEM MUA THUONG (A) BANG CHI BAO PINE: KET HOP hoac THAY THE cach thoat hien tai (Hieu 04/11/2026: "bo cai R, chi ket hop hoac thay the cac chi bao cu voi diem mua thuong, test, xem co cach chot loi").
// Diem A = tin hieu MUA thuong (loai 1) cua engine (backtestChung.mjs chayEngine). Quy uoc THUC TE nhu moPhongThucTe: mua o gia MO CUA phien sau tin hieu, ban duoc tu chieu T+2 (vao + 2): cham cat lo / co tin hieu thoat truoc do thi ban gia mo cua phien dau duoc ban; phi 0,4%.
// Cat lo S va TP1 / TP2 la cua engine; "BAN" = tin hieu BAN cua he thong (ban gia dong cua phien do, nhu he thong). Tin hieu Pine biet sau khi dong cua phien i: "dong cua" = ban luon gia dong cua phien i (loc quan, nhu BAN cua he thong), "mo cua" = ban gia MO CUA phien i+1 (that hon).
// Tin hieu Pine (KHONG dung nen R): OUT = Banker mirrorExit (trend cat xuong bull/bear khi bull/bear > 75) hoac obRoll (trend cat xuong 80); XC = nen dao chieu GIAM co dau xac nhan (bearConfirm); OB = chi obRoll; FL = trend cat xuong bull/bear khong dieu kien vung.
// Cach ra (H0 = hien tai: 30% TP1 + 30% TP2, con lai giu den BAN, cat lo S, sau TP2 hoa von):
//   ket hop = them tin hieu Pine vao cac tin hieu thoat; thay the = bo BAN / TP, chi dung Pine; ATR Pine = chot loi 3 ATR / cat lo 1,5 ATR tu gia dong cua tin hieu.
// Do: lai TB / lenh (sau phi), trung vi, ty le thang, so phien giu TB, chia 2 giai doan (truoc / tu 2022.5). Lenh chua thoat sau 250 phien dong theo gia dong cua. CHI DOC cache.
// Chay: node engine/dich-vu/nghienCuuChotLoiChiBaoPine.mjs
import { docJson, chayEngine, tb, md, f } from "./backtestChung.mjs";

const nen = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");
const CP = 0.4;
const sma = (a, n) => { const o = new Array(a.length).fill(null); let s = 0, c = 0; for (let i = 0; i < a.length; i++) { if (a[i] != null) { s += a[i]; c++; } if (i >= n && a[i - n] != null) { s -= a[i - n]; c--; } if (i >= n - 1 && c === n) o[i] = s / n; } return o; };
const hhv = (a, n) => a.map((_, i) => (i >= n - 1 ? Math.max(...a.slice(i - n + 1, i + 1)) : null));
const llv = (a, n) => a.map((_, i) => (i >= n - 1 ? Math.min(...a.slice(i - n + 1, i + 1)) : null));
function ema(a, n) { const o = new Array(a.length).fill(null), k = 2 / (n + 1); let cnt = 0, s = 0, prev = null; for (let i = 0; i < a.length; i++) { if (a[i] == null) { prev = null; cnt = 0; s = 0; continue; } if (prev == null) { cnt++; s += a[i]; if (cnt === n) { prev = s / n; o[i] = prev; } continue; } prev = k * a[i] + (1 - k) * prev; o[i] = prev; } return o; }
function rma(a, n) { const o = new Array(a.length).fill(null); let prev = null, s = 0, cnt = 0; for (let i = 0; i < a.length; i++) { if (a[i] == null) continue; if (prev == null) { cnt++; s += a[i]; if (cnt === n) { prev = s / n; o[i] = prev; } continue; } prev = (prev * (n - 1) + a[i]) / n; o[i] = prev; } return o; }
function wsa(src, length, weight) {
  const n = src.length, sum = new Array(n).fill(null), out = new Array(n).fill(null);
  for (let t = 0; t < n; t++) {
    const prev = t > 0 && sum[t - 1] != null ? sum[t - 1] : 0;
    const sub = t - length >= 0 && src[t - length] != null ? src[t - length] : 0;
    sum[t] = src[t] == null ? null : prev - sub + src[t];
    const ma = t - length < 0 || src[t - length] == null || sum[t] == null ? null : sum[t] / length;
    const po = t > 0 ? out[t - 1] : null;
    out[t] = po == null ? ma : src[t] == null ? null : (src[t] * weight + po * (length - weight)) / length;
  }
  return out;
}
const crossU = (a, b, i) => i > 0 && a[i] != null && b[i] != null && a[i - 1] != null && b[i - 1] != null && a[i] < b[i] && a[i - 1] >= b[i - 1];
const cross = (a, b, i) => i > 0 && a[i] != null && b[i] != null && a[i - 1] != null && b[i - 1] != null && a[i] > b[i] && a[i - 1] <= b[i - 1];
const lvl = (a, v) => a.map(() => v);

const D = new Map();
for (const [ma, b] of Object.entries(nen)) {
  if (b.length < 300) continue;
  const n = b.length, o = b.map((x) => x.o), h = b.map((x) => x.h), l = b.map((x) => x.l), c = b.map((x) => x.c), v = b.map((x) => x.v);
  const gt = new Array(n).fill(0); { let s = 0; for (let i = 0; i < n; i++) { s += (c[i] * v[i]) / 1e6; if (i >= 20) s -= (c[i - 20] * v[i - 20]) / 1e6; gt[i] = s / 20; } }
  const tp = c.map((x, i) => (2 * x + h[i] + l[i] + o[i]) / 5);
  const ll34 = llv(l, 34), hh34 = hhv(h, 34), ll27 = llv(l, 27), hh27 = hhv(h, 27);
  const raw = c.map((x, i) => (ll27[i] == null || hh27[i] === ll27[i] ? null : ((x - ll27[i]) / (hh27[i] - ll27[i])) * 100));
  const fast = wsa(raw, 5, 1), slow = wsa(fast, 3, 1);
  const trend = fast.map((x, i) => (x == null || slow[i] == null ? null : (3 * x - 2 * slow[i] - 50) * 1.032 + 50));
  const bb = ema(tp.map((x, i) => (ll34[i] == null || hh34[i] === ll34[i] ? null : ((x - ll34[i]) / (hh34[i] - ll34[i])) * 100)), 13);
  const ob = lvl(c, 80);
  const outEv = new Array(n).fill(false), obEv = new Array(n).fill(false), flEv = new Array(n).fill(false), xcEv = new Array(n).fill(false);
  const tr = c.map((x, i) => (i === 0 ? h[i] - l[i] : Math.max(h[i] - l[i], Math.abs(h[i] - c[i - 1]), Math.abs(l[i] - c[i - 1]))));
  const atr = rma(tr, 14);
  const basis = sma(c, 19);
  const std = c.map((_, i) => { if (i < 18) return null; const w = c.slice(i - 18, i + 1), m = w.reduce((s, x) => s + x, 0) / 19; return Math.sqrt(w.reduce((s, x) => s + (x - m) ** 2, 0) / 19); });
  const upper = basis.map((x, i) => (x == null ? null : x + 2 * std[i]));
  for (let i = 2; i < n; i++) {
    obEv[i] = crossU(trend, ob, i);
    outEv[i] = (crossU(trend, bb, i) && bb[i] > 75) || obEv[i];
    flEv[i] = crossU(trend, bb, i);
    if (upper[i] != null && upper[i - 1] != null && upper[i - 2] != null) xcEv[i] = h[i - 2] > upper[i - 2] && c[i - 2] > o[i - 2] && c[i - 1] < upper[i - 1] && c[i - 1] < o[i - 1] && c[i] < l[i - 1];
  }
  const bullC = new Array(n).fill(false);
  const lower = basis.map((x, i) => (x == null ? null : x - 2 * std[i]));
  for (let i = 2; i < n; i++) if (lower[i] != null && lower[i - 1] != null && lower[i - 2] != null) bullC[i] = l[i - 2] < lower[i - 2] && c[i - 2] < o[i - 2] && c[i - 1] > lower[i - 1] && c[i - 1] > o[i - 1] && c[i] > h[i - 1];
  const goi = (a, i, k = 5) => { for (let j = Math.max(0, i - k + 1); j <= i; j++) if (a[j]) return true; return false; };
  D.set(ma, { ma, n, trend, bb, atr, gt, outEv, obEv, flEv, xcEv, bullC, goi });
}
const { lenh } = chayEngine({ cache: nen, vni });
const evA = lenh.filter((t) => t.loai === 1 && D.has(t.ma)).map((t) => ({ t, d: D.get(t.ma) })).filter((e) => e.d.gt[e.t.iv] >= 3);
console.log(`Diem A (mua thuong): ${evA.length} lenh (GTGD TB20 >= 3 ty)`);

// ---------- mo phong 1 lenh ----------
// cfg: moc [{w, i | atr}], baoVe, ban (dung BAN he thong), full [ten mang tin hieu Pine thoat het], half [ten mang ban nua phan con lai], next (Pine ban o MO CUA phien sau), atrStop (cat lo 1,5 ATR thay S)
function sim(e, cfg) {
  const { t, d } = e;
  const { tp, open, high, low, close, sell, n, iv } = t;
  const vao = iv + 1, banTu = iv + 3;
  const E = open[vao];
  if (!(E > 0) || vao >= n) return null;
  const atr = d.atr[iv];
  const S = cfg.atrStop ? close[iv] - 1.5 * atr : t.S;
  if (!(S < E) || (cfg.atrStop && !(atr > 0))) return null;
  const mocs = (cfg.moc ?? []).map((m) => ({ w: m.w, gia: m.atr ? close[iv] + m.atr * atr : tp[m.i], xong: false }));
  let conLai = 1, thu = 0, bars = 0, daTP2 = false, cho = false, dinhTruoc = -Infinity, daNua = false;
  const ban = (w, g, i) => { w = Math.min(w, conLai); if (!(w > 0)) return; thu += (w * g) / E; bars += w * (i - vao); conLai -= w; };
  const ket = () => ({ ret: (thu - 1) * 100 - CP, bars });
  const pineAt = (arr, i) => (cfg.next ? d[arr]?.[i - 1] : d[arr]?.[i]);
  const sigClose = (i) => (cfg.ban && sell[i]) || (!cfg.next && (cfg.full ?? []).some((k) => d[k][i]));
  const sigOpen = (i) => cfg.next && (cfg.full ?? []).some((k) => d[k][i - 1]);
  const sigHalf = (i) => (cfg.half ?? []).some((k) => pineAt(k, i));
  const cuoi = Math.min(n - 1, vao + 250);
  for (let i = vao; i <= cuoi; i++) {
    if (i < banTu) {
      if (low[i] <= S || sigClose(i) || sigOpen(i)) cho = true;
      dinhTruoc = Math.max(dinhTruoc, high[i]);
      continue;
    }
    if (i === banTu && cho) { ban(conLai, open[i], i); return ket(); }
    if (cfg.baoVe && (i === banTu ? dinhTruoc : high[i - 1]) >= tp[1]) daTP2 = true;
    const stopBV = daTP2 ? E : 0;
    for (const m of mocs) if (!m.xong && open[i] >= m.gia) { ban(m.w, open[i], i); m.xong = true; }
    if (conLai <= 1e-12) return ket();
    if (sigOpen(i)) { ban(conLai, open[i], i); return ket(); }
    if (low[i] <= S) { ban(conLai, Math.min(open[i], S), i); return ket(); }
    if (sigClose(i)) { ban(conLai, close[i], i); return ket(); }
    if (!daNua && (cfg.half ?? []).length && sigHalf(i)) { ban(conLai * 0.5, cfg.next ? open[i] : close[i], i); daNua = true; }
    if (stopBV > 0 && low[i] <= stopBV) { ban(conLai, Math.min(open[i], stopBV), i); return ket(); }
    for (const m of mocs) if (!m.xong && high[i] >= m.gia) { ban(m.w, m.gia, i); m.xong = true; }
    if (conLai <= 1e-12) return ket();
  }
  ban(conLai, close[cuoi], cuoi);
  return ket();
}
const HAI_TP = [{ w: 0.3, i: 0 }, { w: 0.3, i: 1 }];
const HT = { moc: HAI_TP, baoVe: true, ban: true, full: [], half: [] };
const CACH = [
  ["H0  HIEN TAI: 30% TP1 + 30% TP2, con lai theo BAN, cat lo S", HT],
  ["--- KET HOP (them tin hieu Pine vao cach thoat hien tai) ---", null],
  ["K1  H0 + OUT thoat het (dong cua)", { ...HT, full: ["outEv"] }],
  ["K2  H0 + OUT thoat het (mo cua phien sau)", { ...HT, full: ["outEv"], next: true }],
  ["K3  H0 + OUT ban NUA phan con lai (mo cua), con lai theo BAN", { ...HT, half: ["outEv"], next: true }],
  ["K4  H0 + nen dao chieu giam xac nhan XC thoat het (mo cua)", { ...HT, full: ["xcEv"], next: true }],
  ["K5  H0 + OUT hoac XC thoat het (mo cua)", { ...HT, full: ["outEv", "xcEv"], next: true }],
  ["K6  H0 + chi obRoll (trend cat xuong 80) thoat het (mo cua)", { ...HT, full: ["obEv"], next: true }],
  ["--- THAY THE (bo BAN va / hoac TP cua he thong) ---", null],
  ["T1  30% TP1 + 30% TP2, con lai thoat theo OUT (thay BAN), mo cua", { ...HT, ban: false, full: ["outEv"], next: true }],
  ["T2  Khong TP, chi BAN (cat lo S)", { moc: [], baoVe: false, ban: true, full: [], half: [] }],
  ["T3  Khong TP, chi OUT (thay BAN), mo cua", { moc: [], baoVe: false, ban: false, full: ["outEv"], next: true }],
  ["T4  Khong TP, BAN hoac OUT, mo cua", { moc: [], baoVe: false, ban: true, full: ["outEv"], next: true }],
  ["T5  ATR Pine: chot het 3 ATR, cat lo 1,5 ATR (thay S, TP, BAN)", { moc: [{ w: 1, atr: 3 }], baoVe: false, ban: false, full: [], half: [], atrStop: true }],
  ["T6  50% chot o 3 ATR, con lai theo BAN, cat lo 1,5 ATR", { moc: [{ w: 0.5, atr: 3 }], baoVe: false, ban: true, full: [], half: [], atrStop: true }],
  ["T7  TP1 + TP2 cua he thong, con lai thoat theo FL (trend cat xuong bull/bear), mo cua", { ...HT, ban: false, full: ["flEv"], next: true }],
];
const KY = (e) => (e.t.ngayArr[e.t.iv] < "2022-05-01" ? 0 : 1);
function in1(ten, cfg, ds) {
  if (!cfg) { console.log("\n" + ten); return; }
  const out = [];
  for (const [kyTen, kyF] of [["tat ca", () => true], ["<2022.5", (e) => KY(e) === 0], [">=2022.5", (e) => KY(e) === 1]]) {
    const r = ds.filter(kyF).map((e) => sim(e, cfg)).filter(Boolean);
    out.push(`${f(tb(r.map((x) => x.ret)), 2).padStart(6)} ${f(md(r.map((x) => x.ret)), 1).padStart(5)} ${f((r.filter((x) => x.ret > 0).length / r.length) * 100, 0).padStart(3)}% ${f(tb(r.map((x) => x.bars)), 0).padStart(3)}p`);
  }
  console.log(ten.padEnd(86), out.join(" | "));
}
console.log("\nCot: lai TB % / lenh, trung vi, thang %, so phien giu TB   (tat ca | <2022.5 | >=2022.5)");
for (const [ten, cfg] of CACH) in1(ten, cfg, evA);

// ---------- loc luc VAO LENH (thay / them dieu kien cho diem A) ----------
const loc = {
  "khong loc": () => true,
  "bo A neu vua co nen dao chieu giam xac nhan (5 phien)": (e) => !e.d.goi(e.d.xcEv, e.t.iv),
  "bo A neu dong tien qua nong (Banker trend > 80)": (e) => !(e.d.trend[e.t.iv] > 80),
  "bo A neu CA HAI (XC 5 phien hoac trend > 80)": (e) => !e.d.goi(e.d.xcEv, e.t.iv) && !(e.d.trend[e.t.iv] > 80),
};
console.log("\n=================== LOC LUC VAO LENH (cach thoat H0 hien tai | K2) ===================");
for (const [ten, fn] of Object.entries(loc)) {
  const ds = evA.filter(fn);
  const cell = (cfg) => [["tat ca", () => true], [">=2022.5", (e) => KY(e) === 1]].map(([, kyF]) => { const r = ds.filter(kyF).map((e) => sim(e, cfg)).filter(Boolean); return `${f(tb(r.map((x) => x.ret)), 2)} (n ${r.length})`; }).join(" / ");
  console.log(ten.padEnd(58), "H0:", cell(HT).padEnd(32), "K2:", cell(CACH[3][1]));
}

// ---------- do nhay nguong + on dinh theo nam cua loc "bo A khi Banker trend > X" (cach thoat H0) ----------
console.log("\n=================== LOC Banker trend > X: nguong va on dinh theo nam (H0, lai TB % / lenh) ===================");
for (const X of [60, 70, 80, 90]) {
  const ko = evA.filter((e) => !(e.d.trend[e.t.iv] > X)), co = evA.filter((e) => e.d.trend[e.t.iv] > X);
  const m = (a, kyF = () => true) => { const r = a.filter(kyF).map((e) => sim(e, HT)).filter(Boolean); return `${f(tb(r.map((x) => x.ret)), 2)} (n ${r.length})`; };
  console.log(`X=${X}`.padEnd(6), "giu (trend <= X):", m(ko).padEnd(18), "bo (trend > X):", m(co).padEnd(18), "| tu 2022.5 giu:", m(ko, (e) => KY(e) === 1).padEnd(18), "bo:", m(co, (e) => KY(e) === 1));
}
const nam = (e) => e.t.ngayArr[e.t.iv].slice(0, 4);
console.log("\nNam   giu (trend<=80) | bo (trend>80)");
for (const y of [...new Set(evA.map(nam))].sort()) {
  const a = evA.filter((e) => nam(e) === y);
  const g = (arr) => { const r = arr.map((e) => sim(e, HT)).filter(Boolean); return `${f(tb(r.map((x) => x.ret)), 2)} (${r.length})`; };
  console.log(y.padEnd(6), g(a.filter((e) => !(e.d.trend[e.t.iv] > 80))).padEnd(16), "|", g(a.filter((e) => e.d.trend[e.t.iv] > 80)));
}
