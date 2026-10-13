// NGHIEN CUU T+ (phan 3, 2026-10-14): TACH BACH nguon loi the cua "thung bien duoi + khoi ngoai gom".
// Phan 2 cho thay loi the don vao cac ngay thi truong BAN THAO. Cau hoi:
//   (A) Chi rieng "thi truong ban thao" (VN-Index giam manh 5 phien) da du chua? Mua 1 ma bat ky luc do thi sao?
//   (B) TRONG cac ngay ban thao: ma thung bien duoi co hon ma thuong khong? Co khoi ngoai gom co hon khong co khong?
//   (C) Liet ke TUNG DOT ban thao (so dot doc lap thuc su la bao nhieu) + ket qua.
//   (D) Phuong phap de xuat: dieu kien + cach thoat, ket qua theo dot va theo giai doan; so sanh "vao ngay" voi "cho VN-Index co phien xanh dau tien".
// Cach tinh lenh / phi 0,4% / chia giai doan giong phan 1-2. Chay: node engine/dich-vu/nghienCuuTPlus3.mjs
import { docJson } from "./backtestChung.mjs";
import { bollinger } from "../../lib/chiBaoPhu.js";
import { sma } from "../loi/mang.js";

const CHI_PHI = 0.4, TU = "2018-09-10", MOC = "2022-07-01";
const cache = docJson("nen_dai.json"), vni = docJson("vnindex_dai.json"), ngoai = docJson("ngoai.json");
const vIdx = new Map(vni.map((b, i) => [b.t, i])); const vC = vni.map((b) => b.c), vBB = bollinger(vC, 20, 2);
const f = (v, d = 2) => (Number.isFinite(v) ? v.toFixed(d) : "-");
const tb = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN);
const vG5 = (ngay) => { const k = vIdx.get(ngay); return k != null && k >= 5 ? (vC[k] / vC[k - 5] - 1) * 100 : null; };
const vDuoiBien = (ngay) => { const k = vIdx.get(ngay); return k != null && vBB.duoi[k] != null && vC[k] < vBB.duoi[k]; };

const MA = [];
for (const [ma, nen] of Object.entries(cache)) {
  if (ma === "VNINDEX" || nen.length < 300 || !ngoai[ma]) continue;
  const n = nen.length, o = nen.map((b) => b.o), h = nen.map((b) => b.h), l = nen.map((b) => b.l), c = nen.map((b) => b.c), v = nen.map((b) => b.v), ngay = nen.map((b) => b.t);
  const fm = new Map(ngoai[ma].t.map((d, i) => [d, i]));
  const fnet = ngay.map((d) => { const k = fm.get(d); return k == null ? null : ngoai[ma].bv[k] - ngoai[ma].sv[k]; });
  const r5 = new Array(n).fill(null); for (let i = 4; i < n; i++) { let s = 0, sv = 0, ok = true; for (let k = i - 4; k <= i; k++) { if (fnet[k] == null) { ok = false; break; } s += fnet[k]; sv += v[k]; } if (ok && sv > 0) r5[i] = Math.max(-1, Math.min(1, s / sv)); }
  const bb = bollinger(c, 20, 2);
  MA.push({ ma, n, o, h, l, c, v, ngay, duoi: bb.duoi, mid: bb.mid, gt20: sma(c.map((x, i) => (x * v[i]) / 1e6), 20), r5 });
}
const du = (st, i) => st.ngay[i] >= TU && st.gt20[i] != null && st.gt20[i] >= 5 && i + 21 < st.n && i >= 120;
let NG; { const a = []; for (const st of MA) for (let i = 120; i < st.n; i += 3) if (du(st, i) && st.ngay[i] < MOC && st.r5[i] != null) a.push(st.r5[i]); a.sort((x, y) => x - y); NG = a[Math.floor(a.length * 0.85)]; }

function lenh(st, i, iMua = i + 1) {
  const e = st.o[iMua]; if (!(e > 0) || e / st.c[iMua - 1] - 1 >= 0.065) return null;
  const r = { ngay: st.ngay[i], ma: st.ma, st, i, iMua, e };
  for (const H of [3, 5, 10, 20]) r["r" + H] = iMua - 1 + H < st.n ? (st.c[iMua - 1 + H] / e - 1) * 100 - CHI_PHI : null;
  return r;
}
// thoat: ban khi dong cua ve duong giua MA20, cat lo -7%, toi da 15 phien; som nhat tu phien iMua+2 (chieu T+2)
function thoat(x, toiDa = 15, cat = 7) {
  const { st, iMua, e } = x; const cuoi = Math.min(st.n - 1, iMua - 1 + toiDa);
  for (let k = iMua + 2; k <= cuoi; k++) { const c = st.c[k]; if (c <= e * (1 - cat / 100) || (st.mid[k] != null && c >= st.mid[k])) return { r: (c / e - 1) * 100 - CHI_PHI, giu: k - iMua + 1 }; }
  return { r: (st.c[cuoi] / e - 1) * 100 - CHI_PHI, giu: cuoi - iMua + 1 };
}
const o1 = (g, k) => { const a = g.map((x) => x[k]).filter((x) => x != null); return `${f(tb(a)).padStart(6)}% (${f((a.filter((x) => x > 0).length / (a.length || 1)) * 100, 0)}%)`; };
// TB theo NGAY (moi ngay tin hieu 1 phieu) de khong bi vai ngay dong lenh chi phoi
const theoNgay = (g, k) => { const G = new Map(); for (const x of g) { if (x[k] == null) continue; const a = G.get(x.ngay) || []; a.push(x[k]); G.set(x.ngay, a); } const d = [...G.values()].map(tb); return `${f(tb(d)).padStart(6)}% (${d.length} ngay, ${f((d.filter((x) => x > 0).length / (d.length || 1)) * 100, 0)}% ngay lai)`; };
const haiGD = (ten, ev) => { for (const [nhan, g] of [["kham pha ", ev.filter((x) => x.ngay < MOC)], ["KIEM CHUNG", ev.filter((x) => x.ngay >= MOC)]]) console.log(`   ${ten.padEnd(50)} ${nhan} n=${String(g.length).padStart(6)} | T+2,5 ${o1(g, "r3")} | T+5 ${o1(g, "r5")} | T+10 ${o1(g, "r10")} | theo NGAY T+5 ${theoNgay(g, "r5")} | theo NGAY T+10 ${theoNgay(g, "r10")}`); };

// ---- tat ca (ma, ngay) du dieu kien, gan co ----
const TAT = [];
for (const st of MA) for (let i = 121; i < st.n - 21; i++) {
  if (!du(st, i)) continue; const g5 = vG5(st.ngay[i]); if (g5 == null) continue;
  const thung = st.duoi[i] != null && st.c[i] < st.duoi[i], dau = thung && !(st.duoi[i - 1] != null && st.c[i - 1] < st.duoi[i - 1]);
  const r = lenh(st, i); if (!r) continue;
  TAT.push(Object.assign(r, { g5, thung, dau, ngoaiMua: st.r5[i] != null && st.r5[i] >= NG, ngoaiBan: st.r5[i] != null && st.r5[i] <= -NG, vDuoi: vDuoiBien(st.ngay[i]) }));
}
console.log(`Tong (ma, ngay): ${TAT.length} | nguong ngoai mua nhieu: ${f(NG * 100, 1)}% KL 5 phien`);

console.log("\n=== (A) CHI RIENG TRANG THAI THI TRUONG: mua 1 ma BAT KY (du thanh khoan) theo muc giam 5 phien cua VN-Index ===");
for (const [a, b, ten] of [[-100, -7, "VN-Index giam > 7% / 5 phien"], [-7, -5, "giam 5 - 7%"], [-5, -3, "giam 3 - 5%"], [-3, -1, "giam 1 - 3%"], [-1, 1, "di ngang (-1..+1%)"], [1, 100, "tang > 1%"]]) haiGD(ten, TAT.filter((x) => x.g5 >= a && x.g5 < b));

console.log("\n=== (B) TRONG CAC NGAY VN-INDEX GIAM > 3% / 5 PHIEN: loai ma nao hoi tot hon? ===");
{ const P = TAT.filter((x) => x.g5 < -3);
  haiGD("Ma bat ky", P); haiGD("Ma KHONG thung bien duoi", P.filter((x) => !x.thung)); haiGD("Ma thung bien duoi (ngay dau)", P.filter((x) => x.dau));
  haiGD("  thung bien duoi + ngoai MUA nhieu", P.filter((x) => x.dau && x.ngoaiMua)); haiGD("  thung bien duoi + ngoai khong mua nhieu", P.filter((x) => x.dau && !x.ngoaiMua)); haiGD("  thung bien duoi + ngoai BAN nhieu", P.filter((x) => x.dau && x.ngoaiBan));
  haiGD("Ngoai MUA nhieu (khong can thung bien)", P.filter((x) => x.ngoaiMua)); haiGD("Ngoai BAN nhieu (khong can thung bien)", P.filter((x) => x.ngoaiBan)); }
console.log("\n=== (B2) NGOAI CAC NGAY DO (VN-Index khong giam qua 3% / 5 phien) ===");
{ const P = TAT.filter((x) => x.g5 >= -3); haiGD("Ma bat ky", P.filter((x, k) => k % 5 === 0)); haiGD("Thung bien duoi + ngoai MUA nhieu", P.filter((x) => x.dau && x.ngoaiMua)); haiGD("Thung bien duoi + ngoai khong mua nhieu", P.filter((x) => x.dau && !x.ngoaiMua)); }

// ---- (C) tung dot ban thao ----
console.log("\n=== (C) TUNG DOT: cac ngay VN-Index giam > 3% / 5 phien, gop cac ngay cach nhau <= 10 phien thanh 1 dot. Lenh = ma thung bien duoi (ngay dau) + ngoai mua nhieu ===");
const UV = TAT.filter((x) => x.g5 < -3 && x.dau && x.ngoaiMua);
const ngayTT = [...new Set(TAT.filter((x) => x.g5 < -3).map((x) => x.ngay))].sort();
const dot = []; for (const d of ngayTT) { const k = vIdx.get(d); const c = dot[dot.length - 1]; if (c && k - c.kCuoi <= 10) { c.kCuoi = k; c.den = d; } else dot.push({ tu: d, den: d, kCuoi: k }); }
let soDotCoLenh = 0, dotLai = 0;
for (const c of dot) {
  const g = UV.filter((x) => x.ngay >= c.tu && x.ngay <= c.den); const tatCa = TAT.filter((x) => x.ngay >= c.tu && x.ngay <= c.den);
  const k0 = vIdx.get(c.tu), k1 = vIdx.get(c.den); let day = Infinity; for (let k = k0; k <= Math.min(vni.length - 1, k1 + 10); k++) day = Math.min(day, vni[k].l);
  const t = g.map((x) => thoat(x).r);
  if (g.length) { soDotCoLenh++; if (tb(g.map((x) => x.r10).filter((x) => x != null)) > 0) dotLai++; }
  console.log(`   ${c.tu} -> ${c.den} | VN-Index giam them toi day: ${f((day / vC[k0] - 1) * 100, 1).padStart(6)}% | lenh ung vien: ${String(g.length).padStart(3)} | T+2,5 ${f(tb(g.map((x) => x.r3).filter((x) => x != null))).padStart(6)}% | T+5 ${f(tb(g.map((x) => x.r5).filter((x) => x != null))).padStart(6)}% | T+10 ${f(tb(g.map((x) => x.r10).filter((x) => x != null))).padStart(6)}% | thoat ve MA20/-7% ${f(tb(t)).padStart(6)}% || ma bat ky cung dot: T+10 ${f(tb(tatCa.map((x) => x.r10).filter((x) => x != null))).padStart(6)}%`);
}
console.log(`   => ${dot.length} dot trong 8 nam; ${soDotCoLenh} dot co lenh ung vien; ${dotLai} dot co lai TB T+10 duong`);

// ---- (D) phuong phap de xuat ----
console.log("\n=== (D) PHUONG PHAP DE XUAT: VN-Index giam > 3% / 5 phien + ma dong cua thung bien duoi Bollinger (ngay dau) + khoi ngoai mua rong 5 phien >= nguong ===");
{ const bc = (ten, ev, lay) => { for (const [nhan, g] of [["kham pha ", ev.filter((x) => x.ngay < MOC)], ["KIEM CHUNG", ev.filter((x) => x.ngay >= MOC)]]) { const r = g.map(lay).filter((x) => x != null); const w = r.filter((x) => x > 0), ls = r.filter((x) => x <= 0); const G = new Map(); g.forEach((x) => { const v = lay(x); if (v == null) return; const a = G.get(x.ngay) || []; a.push(v); G.set(x.ngay, a); }); const d = [...G.values()].map(tb);
    console.log(`   ${ten.padEnd(52)} ${nhan} n=${String(r.length).padStart(4)} | TB ${f(tb(r)).padStart(6)}% | thang ${f((w.length / (r.length || 1)) * 100, 0)}% | lai TB ${f(tb(w), 1)}% / lo TB ${f(tb(ls), 1)}% | PF ${f(w.reduce((s, v) => s + v, 0) / -ls.reduce((s, v) => s + v, 0))} | lo nang nhat ${f(Math.min(...r), 0)}% | theo NGAY ${f(tb(d))}% (${d.length} ngay, ${f((d.filter((x) => x > 0).length / (d.length || 1)) * 100, 0)}% lai)`); } };
  bc("Vao ngay phien sau, ban T+5", UV, (x) => x.r5); bc("Vao ngay phien sau, ban T+10", UV, (x) => x.r10); bc("Vao ngay, thoat ve MA20 / cat -7% / toi da 15 phien", UV, (x) => thoat(x).r);
  // cho VN-Index co phien xanh dau tien (dong cua cao hon hom truoc) trong 7 phien roi moi mua mo cua phien ke
  const CHO = []; for (const x of UV) { const k = vIdx.get(x.ngay); for (let m = k + 1; m <= Math.min(vni.length - 1, k + 7); m++) if (vC[m] > vC[m - 1]) { const j = x.st.ngay.indexOf(vni[m].t); if (j > 0 && j + 22 < x.st.n) { const r = lenh(x.st, x.i, j + 1); if (r) CHO.push(r); } break; } }
  bc("Cho VN-Index xanh phien dau roi mua, ban T+5", CHO, (x) => x.r5); bc("Cho VN-Index xanh phien dau roi mua, ban T+10", CHO, (x) => x.r10); bc("Cho VN-Index xanh, thoat ve MA20 / cat -7% / 15 phien", CHO, (x) => thoat(x).r);
  // khong can khoi ngoai (de biet dieu kien ngoai dong gop bao nhieu)
  const KN = TAT.filter((x) => x.g5 < -3 && x.dau && !x.ngoaiMua);
  bc("(so sanh) KHONG co ngoai mua nhieu, ban T+10", KN, (x) => x.r10); bc("(so sanh) KHONG co ngoai mua nhieu, thoat MA20/-7%", KN, (x) => thoat(x).r);
}
process.exit(0);
