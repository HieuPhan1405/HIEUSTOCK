// NGHIEN CUU T+ (phan 2, 2026-10-14): thu DO BEN cua ung vien tot nhat tu nghienCuuTPlus.mjs:
//   "Gia DONG CUA thung BIEN DUOI Bollinger trong khi KHOI NGOAI VAN MUA RONG MANH" -> mua mo cua phien sau.
// Kiem: (1) lieu luong (ngoai mua cang nhieu cang tot?), (2) doi tham so, (3) tung nam, (4) cach THOAT lenh, (5) do tap trung theo ngay, (6) trang thai thi truong,
//       (7) thanh khoan, (8) cho xac nhan nen xanh. Cach tinh lenh / phi / chia giai doan giong phan 1.
// Chay: node engine/dich-vu/nghienCuuTPlus2.mjs
import { docJson } from "./backtestChung.mjs";
import { bollinger } from "../../lib/chiBaoPhu.js";
import { sma } from "../loi/mang.js";

const CHI_PHI = 0.4, TU = "2018-09-10", MOC = "2022-07-01";
const cache = docJson("nen_dai.json"), vni = docJson("vnindex_dai.json"), ngoai = docJson("ngoai.json");
const vIdx = new Map(vni.map((b, i) => [b.t, i]));
const vC = vni.map((b) => b.c), vBB = bollinger(vC, 20, 2), vMa50 = sma(vC, 50);
const f = (v, d = 2) => (Number.isFinite(v) ? v.toFixed(d) : "-");
const tb = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN);

const MA = [];
for (const [ma, nen] of Object.entries(cache)) {
  if (ma === "VNINDEX" || nen.length < 300 || !ngoai[ma]) continue;
  const n = nen.length, o = nen.map((b) => b.o), h = nen.map((b) => b.h), l = nen.map((b) => b.l), c = nen.map((b) => b.c), v = nen.map((b) => b.v), ngay = nen.map((b) => b.t);
  const fm = new Map(ngoai[ma].t.map((d, i) => [d, i]));
  const fnet = ngay.map((d) => { const k = fm.get(d); return k == null ? null : ngoai[ma].bv[k] - ngoai[ma].sv[k]; });
  const tyLe = (w) => { const r = new Array(n).fill(null); for (let i = w - 1; i < n; i++) { let s = 0, sv = 0, ok = true; for (let k = i - w + 1; k <= i; k++) { if (fnet[k] == null) { ok = false; break; } s += fnet[k]; sv += v[k]; } if (ok && sv > 0) r[i] = Math.max(-1, Math.min(1, s / sv)); } return r; };
  const bb = {}; for (const k of [1.5, 2, 2.5]) bb[k] = bollinger(c, 20, k);
  MA.push({ ma, n, o, h, l, c, v, ngay, bb, mid: bb[2].mid, gt20: sma(c.map((x, i) => (x * v[i]) / 1e6), 20), r5: tyLe(5), r10: tyLe(10) });
}
const du = (st, i) => st.ngay[i] >= TU && st.gt20[i] != null && st.gt20[i] >= 5 && i + 21 < st.n && i >= 120;
// phan vi cua ty le ngoai mua rong (chi tu giai doan kham pha)
const PV = {};
for (const w of [5, 10]) { const a = []; for (const st of MA) for (let i = 120; i < st.n; i += 3) if (du(st, i) && st.ngay[i] < MOC && st["r" + w][i] != null) a.push(st["r" + w][i]); a.sort((x, y) => x - y); PV[w] = (p) => a[Math.floor(a.length * p)]; }
console.log(`Nguong ngoai mua rong 5 phien / KL 5 phien theo phan vi: 70 = ${f(PV[5](0.7) * 100, 1)}% | 80 = ${f(PV[5](0.8) * 100, 1)}% | 85 = ${f(PV[5](0.85) * 100, 1)}% | 90 = ${f(PV[5](0.9) * 100, 1)}% | 95 = ${f(PV[5](0.95) * 100, 1)}%`);
const NG = PV[5](0.85);

function lenh(st, i) {
  const e = st.o[i + 1]; if (!(e > 0) || e / st.c[i] - 1 >= 0.065) return null;
  const a = vIdx.get(st.ngay[i + 1]); const r = { ngay: st.ngay[i], ma: st.ma, i, st, e, gt: st.gt20[i] };
  for (const H of [3, 5, 10, 20]) { if (i + H >= st.n) { r["r" + H] = null; continue; } r["r" + H] = (st.c[i + H] / e - 1) * 100 - CHI_PHI; const b = vIdx.get(st.ngay[i + H]); r["x" + H] = a != null && b != null ? r["r" + H] - (vni[b].c / vni[a].o - 1) * 100 : null; }
  return r;
}
function cumBoot(a) { // a: [{ngay, v}]
  const G = new Map(); for (const x of a) { if (x.v == null) continue; const m = x.ngay.slice(0, 7); const g = G.get(m) || [0, 0]; g[0] += x.v; g[1]++; G.set(m, g); }
  const th = [...G.values()]; if (th.length < 3) return [NaN, NaN];
  let seed = 2026; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const kq = []; for (let k = 0; k < 1500; k++) { let s = 0, n = 0; for (let i = 0; i < th.length; i++) { const g = th[Math.floor(rnd() * th.length)]; s += g[0]; n += g[1]; } if (n) kq.push(s / n); }
  kq.sort((x, y) => x - y); return [kq[Math.floor(kq.length * 0.025)], kq[Math.floor(kq.length * 0.975)]];
}
const o1 = (g, k) => { const a = g.map((x) => x[k]).filter((x) => x != null); return `${f(tb(a)).padStart(6)}% (${f((a.filter((x) => x > 0).length / (a.length || 1)) * 100, 0)}%)`; };
const haiGD = (ten, ev, cot = ["r3", "r5", "r10", "x10"]) => {
  for (const [nhan, g] of [["kham pha ", ev.filter((x) => x.ngay < MOC)], ["KIEM CHUNG", ev.filter((x) => x.ngay >= MOC)]]) {
    const [lo, hi] = cumBoot(g.map((x) => ({ ngay: x.ngay, v: x.r10 })));
    console.log(`   ${ten.padEnd(46)} ${nhan} n=${String(g.length).padStart(5)} | T+2,5 ${o1(g, "r3")} | T+5 ${o1(g, "r5")} | T+10 ${o1(g, "r10")} [${f(lo)}..${f(hi)}] | T+10 vuot TT ${f(tb(g.map((x) => x.x10).filter((x) => x != null))).padStart(5)}`);
  }
};
// su kien: dong cua thung bien duoi (he so k), ngay DAU cua chuoi; kem ty le ngoai
function suKien(k = 2, dk = () => true) {
  const ev = [];
  for (const st of MA) { const d = st.bb[k].duoi; for (let i = 121; i < st.n - 21; i++) { if (!du(st, i) || d[i] == null || !(st.c[i] < d[i])) continue; if (d[i - 1] != null && st.c[i - 1] < d[i - 1]) continue; if (!dk(st, i)) continue; const r = lenh(st, i); if (r) ev.push(r); } }
  return ev;
}

// ---- (1) lieu luong ----
console.log("\n=== (1) LIEU LUONG: trong cac lan dong cua thung bien duoi (ngay dau), chia theo muc khoi ngoai mua / ban rong 5 phien ===");
{ const ev = suKien(2, (st, i) => st.r5[i] != null).map((x) => ({ ...x, r: x.st.r5[x.i] }));
  const muc = [[-1, PV[5](0.15), "ban manh (<= phan vi 15)"], [PV[5](0.15), -0.002, "ban nhe"], [-0.002, 0.002, "gan nhu khong giao dich"], [0.002, PV[5](0.85), "mua nhe"], [PV[5](0.85), PV[5](0.95), "mua nhieu (phan vi 85-95)"], [PV[5](0.95), 1.01, "mua rat nhieu (> phan vi 95)"]];
  for (const [a, b, ten] of muc) haiGD(ten, ev.filter((x) => x.r >= a && x.r < b)); }

// ---- (2) doi tham so ----
console.log("\n=== (2) DOI THAM SO: T+5 va T+10 (% lai TB sau phi) - o nao cung phai duong thi moi dang tin ===");
for (const k of [1.5, 2, 2.5]) for (const w of [5, 10]) {
  const cot = [0.7, 0.8, 0.85, 0.9, 0.95].map((p) => { const ng = PV[w](p); const ev = suKien(k, (st, i) => st["r" + w][i] != null && st["r" + w][i] >= ng); const D = ev.filter((x) => x.ngay < MOC), V = ev.filter((x) => x.ngay >= MOC); const m = (g, c) => f(tb(g.map((x) => x[c]).filter((x) => x != null)), 1);
    return `pv${p * 100}: KP ${m(D, "r5")}/${m(D, "r10")} (n${D.length}) KC ${m(V, "r5")}/${m(V, "r10")} (n${V.length})`; });
  console.log(`   Bollinger 20,${k} | ngoai ${String(w).padStart(2)} phien | ${cot.join(" | ")}`);
}

// ---- ung vien chinh ----
const UV = suKien(2, (st, i) => st.r5[i] != null && st.r5[i] >= NG);
const NEN = []; for (const st of MA) for (let i = 121; i < st.n - 21; i += 4) if (du(st, i)) { const r = lenh(st, i); if (r) NEN.push(r); }

// ---- (3) tung nam ----
console.log("\n=== (3) TUNG NAM: ung vien (thung bien duoi + ngoai mua nhieu) so voi mua 1 ngay bat ky ===");
for (const y of ["2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025", "2026"]) { const g = UV.filter((x) => x.ngay.startsWith(y)), b = NEN.filter((x) => x.ngay.startsWith(y)); const m = (a, c) => f(tb(a.map((x) => x[c]).filter((x) => x != null)), 2).padStart(6);
  console.log(`   ${y}: ung vien n=${String(g.length).padStart(4)} | T+2,5 ${m(g, "r3")}% | T+5 ${m(g, "r5")}% | T+10 ${m(g, "r10")}% (thang ${f((g.filter((x) => x.r10 > 0).length / (g.length || 1)) * 100, 0)}%) | T+20 ${m(g, "r20")}%   ||  ngay bat ky: T+5 ${m(b, "r5")}% | T+10 ${m(b, "r10")}% | T+20 ${m(b, "r20")}%`); }

// ---- (4) cach thoat ----
console.log("\n=== (4) CACH THOAT LENH (mua mo cua phien sau tin hieu; som nhat ban duoc tu chieu T+2 = phien i+3; ban theo gia DONG CUA) ===");
function thoat(x, { chamGiua = false, chot = 0, cat = 0, toiDa = 10, chamTren = false }) {
  const { st, i, e } = x; const cuoi = Math.min(st.n - 1, i + toiDa);
  for (let k = i + 3; k <= cuoi; k++) {
    const c = st.c[k];
    if (cat && c <= e * (1 - cat / 100)) return { r: (c / e - 1) * 100 - CHI_PHI, ngayGiu: k - i };
    if (chot && c >= e * (1 + chot / 100)) return { r: (c / e - 1) * 100 - CHI_PHI, ngayGiu: k - i };
    if (chamGiua && st.mid[k] != null && c >= st.mid[k]) return { r: (c / e - 1) * 100 - CHI_PHI, ngayGiu: k - i };
    if (chamTren && st.bb[2].tren[k] != null && c >= st.bb[2].tren[k]) return { r: (c / e - 1) * 100 - CHI_PHI, ngayGiu: k - i };
  }
  return { r: (st.c[cuoi] / e - 1) * 100 - CHI_PHI, ngayGiu: cuoi - i };
}
for (const [ten, tc] of [["Ban dong cua T+2,5 (phien i+3)", { toiDa: 3 }], ["Ban dong cua T+5", { toiDa: 5 }], ["Ban dong cua T+10", { toiDa: 10 }], ["Ban dong cua T+20", { toiDa: 20 }],
  ["Ban khi gia ve duong giua (MA20), toi da 15 phien", { chamGiua: true, toiDa: 15 }], ["Ban khi ve duong giua, cat lo -7%, toi da 15 phien", { chamGiua: true, cat: 7, toiDa: 15 }],
  ["Chot +5% hoac het 10 phien", { chot: 5, toiDa: 10 }], ["Chot +7% / cat -7% / het 15 phien", { chot: 7, cat: 7, toiDa: 15 }], ["Chot +10% / cat -7% / het 20 phien", { chot: 10, cat: 7, toiDa: 20 }], ["Ban khi cham bien tren, cat -8%, toi da 30 phien", { chamTren: true, cat: 8, toiDa: 30 }]]) {
  for (const [nhan, g] of [["kham pha ", UV.filter((x) => x.ngay < MOC)], ["KIEM CHUNG", UV.filter((x) => x.ngay >= MOC)]]) {
    const kq = g.map((x) => ({ ngay: x.ngay, ...thoat(x, tc) })); const r = kq.map((x) => x.r); const w = r.filter((x) => x > 0), ls = r.filter((x) => x <= 0);
    const [lo, hi] = cumBoot(kq.map((x) => ({ ngay: x.ngay, v: x.r })));
    console.log(`   ${ten.padEnd(50)} ${nhan} n=${g.length} | TB ${f(tb(r)).padStart(6)}% [${f(lo)}..${f(hi)}] | thang ${f((w.length / r.length) * 100, 0)}% | lai TB ${f(tb(w), 1)}% / lo TB ${f(tb(ls), 1)}% | PF ${f(w.reduce((s, v) => s + v, 0) / -ls.reduce((s, v) => s + v, 0))} | giu TB ${f(tb(kq.map((x) => x.ngayGiu)), 1)} phien | lo nang nhat ${f(Math.min(...r), 0)}%`);
  }
}

// ---- (5) tap trung theo ngay ----
console.log("\n=== (5) TIN HIEU CO DON VAO IT NGAY KHONG? (gop cac lenh cung ngay tin hieu thanh 1 'dot', lai dot = TB cac lenh, T+10) ===");
{ const G = new Map(); for (const x of UV) { if (x.r10 == null) continue; const a = G.get(x.ngay) || []; a.push(x.r10); G.set(x.ngay, a); }
  const dot = [...G.entries()].map(([d, a]) => ({ d, n: a.length, r: tb(a) })); const so = dot.map((x) => x.n).sort((a, b) => b - a);
  console.log(`   so ngay co tin hieu: ${dot.length} / ~${new Set(NEN.map((x) => x.ngay)).size * 4} phien | TB ${f(UV.length / dot.length, 1)} lenh / ngay co tin hieu | 10 ngay dong nhat chiem ${f((so.slice(0, 10).reduce((s, v) => s + v, 0) / UV.length) * 100, 0)}% so lenh`);
  console.log(`   Tinh theo DOT (moi ngay 1 phieu): TB ${f(tb(dot.map((x) => x.r)))}% | ty le dot lai ${f((dot.filter((x) => x.r > 0).length / dot.length) * 100, 0)}% | kham pha ${f(tb(dot.filter((x) => x.d < MOC).map((x) => x.r)))}% (${dot.filter((x) => x.d < MOC).length} dot) | kiem chung ${f(tb(dot.filter((x) => x.d >= MOC).map((x) => x.r)))}% (${dot.filter((x) => x.d >= MOC).length} dot)`);
  const it = dot.filter((x) => x.n <= 3), nhieu = dot.filter((x) => x.n >= 10);
  console.log(`   Ngay it tin hieu (<= 3 ma): TB ${f(tb(it.map((x) => x.r)))}% (${it.length} dot) | ngay nhieu tin hieu (>= 10 ma, thuong la phien ban thao): TB ${f(tb(nhieu.map((x) => x.r)))}% (${nhieu.length} dot)`); }

// ---- (6) trang thai thi truong ----
console.log("\n=== (6) TRANG THAI VN-INDEX luc co tin hieu ===");
{ const tt = (x) => { const k = vIdx.get(x.ngay); if (k == null || vBB.duoi[k] == null) return null; return { duoiBien: vC[k] < vBB.duoi[k], trenMa50: vMa50[k] != null && vC[k] > vMa50[k], g5: k >= 5 ? (vC[k] / vC[k - 5] - 1) * 100 : null }; };
  const e = UV.map((x) => ({ ...x, tt: tt(x) })).filter((x) => x.tt);
  haiGD("VN-Index cung dang thung bien duoi", e.filter((x) => x.tt.duoiBien)); haiGD("VN-Index KHONG thung bien duoi", e.filter((x) => !x.tt.duoiBien));
  haiGD("VN-Index tren MA50", e.filter((x) => x.tt.trenMa50)); haiGD("VN-Index duoi MA50", e.filter((x) => !x.tt.trenMa50));
  haiGD("VN-Index giam > 3% trong 5 phien", e.filter((x) => x.tt.g5 != null && x.tt.g5 < -3)); haiGD("VN-Index khong giam qua 3% / 5 phien", e.filter((x) => x.tt.g5 != null && x.tt.g5 >= -3)); }

// ---- (7) thanh khoan ----
console.log("\n=== (7) THEO THANH KHOAN (gia tri giao dich TB 20 phien) ===");
for (const [a, b, ten] of [[5, 20, "5 - 20 ty / phien"], [20, 100, "20 - 100 ty / phien"], [100, 1e9, "> 100 ty / phien"]]) haiGD(ten, UV.filter((x) => x.gt >= a && x.gt < b));

// ---- (8) cho xac nhan ----
console.log("\n=== (8) CHO XAC NHAN: sau tin hieu, doi phien DAU TIEN dong cua cao hon hom truoc (trong 5 phien) roi mua mo cua phien ke ===");
{ const ev = []; for (const x of UV) { const { st, i } = x; for (let k = i + 1; k <= Math.min(st.n - 22, i + 5); k++) if (st.c[k] > st.c[k - 1]) { const r = lenh(st, k); if (r) { r.ngay = x.ngay; ev.push(r); } break; } }
  haiGD("Mua sau nen xanh dau tien", ev); haiGD("(so sanh) mua ngay phien sau tin hieu", UV); }
process.exit(0);
