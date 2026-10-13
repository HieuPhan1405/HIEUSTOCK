// NGHIEN CUU (2026-10-14): TIM PHUONG PHAP DANH T+ (giu vai phien) - bat dau tu kieu danh cua "thay" Hieu ke:
//   B1 nuoc ngoai mua nhieu danh len BIEN TREN -> B2 dap nhe roi VUOT DINH -> B3 dap manh THUNG BIEN DUOI -> B4 chay song to 50-100%.
// "Bien" duoc thu theo 2 cach hieu: (bb) dai Bollinger 20,2 ; (hop) bien cua vung di ngang 30 phien (hop gia, rong <= 25%).
// Du lieu: nen ngay nen_dai.json + khoi ngoai theo ma ngoai.json (taiDuLieuNgoai.mjs, tu 30/08/2018) + VN-Index. Thanh khoan TB 20 phien >= 5 ty.
// Cach tinh lenh T+: tin hieu luc DONG CUA phien i -> mua MO CUA phien i+1 (= T) -> ban DONG CUA phien i+3 (chieu T+2, som nhat duoc ban = "T+2,5"), hoac i+5 / i+10 / i+20.
//   Bo lenh neu gia mo cua phien mua cao hon dong cua tin hieu >= 6,5% (sat tran, khong chac mua duoc). Phi + thue 0,4% / vong. "Vuot TT" = lai tru di VN-Index cung khoang.
// Chia 2 giai doan de tranh tu lua minh: KHAM PHA 09/2018 - 06/2022, KIEM CHUNG 07/2022 - 09/2026. CI: bootstrap theo cum THANG.
// Chay: node engine/dich-vu/nghienCuuTPlus.mjs
import { docJson } from "./backtestChung.mjs";
import { bollinger } from "../../lib/chiBaoPhu.js";
import { hhv, llv, sma } from "../loi/mang.js";

const CHI_PHI = 0.4, TU = "2018-09-10", MOC = "2022-07-01";
const cache = docJson("nen_dai.json"), vni = docJson("vnindex_dai.json"), ngoai = docJson("ngoai.json");
const vIdx = new Map(vni.map((b, i) => [b.t, i]));
const f = (v, d = 2) => (Number.isFinite(v) ? v.toFixed(d) : "-");
const tb = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN);

// ---------- chuan bi tung ma ----------
const MA = [];
for (const [ma, nen] of Object.entries(cache)) {
  if (ma === "VNINDEX" || nen.length < 300 || !ngoai[ma]) continue;
  const n = nen.length, o = nen.map((b) => b.o), h = nen.map((b) => b.h), l = nen.map((b) => b.l), c = nen.map((b) => b.c), v = nen.map((b) => b.v), ngay = nen.map((b) => b.t);
  const bb = bollinger(c, 20, 2);
  const fm = new Map(ngoai[ma].t.map((d, i) => [d, i]));
  const fnet = ngay.map((d) => { const k = fm.get(d); return k == null ? null : ngoai[ma].bv[k] - ngoai[ma].sv[k]; });
  const tyLe = (w) => { const r = new Array(n).fill(null); for (let i = w - 1; i < n; i++) { let s = 0, sv = 0, ok = true; for (let k = i - w + 1; k <= i; k++) { if (fnet[k] == null) { ok = false; break; } s += fnet[k]; sv += v[k]; } if (ok && sv > 0) r[i] = Math.max(-1, Math.min(1, s / sv)); } return r; };
  MA.push({ ma, n, o, h, l, c, v, ngay, tren: bb.tren, duoi: bb.duoi, mid: bb.mid, ma50: sma(c, 50), ma100: sma(c, 100), gt20: sma(c.map((x, i) => (x * v[i]) / 1e6), 20), v20: sma(v, 20),
    r5: tyLe(5), r10: tyLe(10), hh20: hhv(h, 20), hh30: hhv(h, 30), ll30: llv(l, 30), ll20: llv(l, 20) });
}
const du = (st, i) => st.ngay[i] >= TU && st.gt20[i] != null && st.gt20[i] >= 5 && i + 21 < st.n && i >= 120;

// Nguong "nuoc ngoai mua nhieu": phan vi 85 cua ty le mua rong 5 phien / khoi luong 5 phien, CHI lay tu giai doan kham pha
let NG;
{ const a = []; for (const st of MA) for (let i = 120; i < st.n; i += 3) if (du(st, i) && st.ngay[i] < MOC && st.r5[i] != null) a.push(st.r5[i]); a.sort((x, y) => x - y); NG = a[Math.floor(a.length * 0.85)];
  console.log(`So ma: ${MA.length} | nguong "nuoc ngoai mua nhieu" (phan vi 85 giai doan kham pha): mua rong 5 phien >= ${f(NG * 100, 1)}% khoi luong 5 phien | phan vi 50: ${f(a[Math.floor(a.length * 0.5)] * 100, 2)}% | phan vi 15: ${f(a[Math.floor(a.length * 0.15)] * 100, 1)}%`); }

// ---------- ket qua 1 lenh ----------
function lenh(st, i) {
  const e = st.o[i + 1]; if (!(e > 0) || e / st.c[i] - 1 >= 0.065) return null;
  const a = vIdx.get(st.ngay[i + 1]); const r = { ngay: st.ngay[i], ma: st.ma };
  for (const H of [3, 5, 10, 20]) {
    if (i + H >= st.n) { r["r" + H] = null; continue; }
    r["r" + H] = (st.c[i + H] / e - 1) * 100 - CHI_PHI;
    const b = vIdx.get(st.ngay[i + H]); r["x" + H] = a != null && b != null ? r["r" + H] - ((vni[b].c / vni[a].o - 1) * 100) : null;
  }
  // B4: gia cao nhat trong 60 / 120 phien toi so voi gia mua
  let m60 = -Infinity, m120 = -Infinity; for (let k = i + 1; k <= Math.min(st.n - 1, i + 120); k++) { if (k <= i + 60) m60 = Math.max(m60, st.h[k]); m120 = Math.max(m120, st.h[k]); }
  r.len60 = (m60 / e - 1) * 100; r.len120 = i + 120 < st.n ? (m120 / e - 1) * 100 : null;
  return r;
}
function cumBoot(g, khoa) {
  const G = new Map(); for (const x of g) { if (x[khoa] == null) continue; const m = x.ngay.slice(0, 7); const a = G.get(m) || [0, 0]; a[0] += x[khoa]; a[1]++; G.set(m, a); }
  const th = [...G.values()]; if (th.length < 3) return [NaN, NaN];
  let seed = 2026; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const kq = []; for (let k = 0; k < 1500; k++) { let s = 0, n = 0; for (let i = 0; i < th.length; i++) { const a = th[Math.floor(rnd() * th.length)]; s += a[0]; n += a[1]; } if (n) kq.push(s / n); }
  kq.sort((x, y) => x - y); return [kq[Math.floor(kq.length * 0.025)], kq[Math.floor(kq.length * 0.975)]];
}
function baoCao(ten, ev) {
  const dong = (nhan, g) => {
    const cot = (k) => { const a = g.map((x) => x[k]).filter((x) => x != null); return `${f(tb(a)).padStart(6)}% (${f((a.filter((x) => x > 0).length / (a.length || 1)) * 100, 0)}%)`; };
    const [lo3, hi3] = cumBoot(g, "r3"), [lo10, hi10] = cumBoot(g, "r10"); const x3 = g.map((x) => x.x3).filter((x) => x != null), x10 = g.map((x) => x.x10).filter((x) => x != null);
    console.log(`     ${nhan} n=${String(g.length).padStart(5)} | T+2,5 ${cot("r3")} [${f(lo3)}..${f(hi3)}] vuot TT ${f(tb(x3)).padStart(5)} | T+5 ${cot("r5")} | T+10 ${cot("r10")} [${f(lo10)}..${f(hi10)}] vuot TT ${f(tb(x10)).padStart(5)} | T+20 ${cot("r20")}`);
  };
  console.log(`  ${ten}`);
  dong("kham pha ", ev.filter((x) => x.ngay < MOC)); dong("KIEM CHUNG", ev.filter((x) => x.ngay >= MOC));
}

// ---------- 1. CHUOI CUA THAY ----------
// tra ve { b1: [i], b2: [i], b3: [i] } cho 1 ma. kieu: "bb" | "hop"; canNgoai: co bat buoc nuoc ngoai mua nhieu o B1 khong
function chuoi(st, kieu, canNgoai) {
  const kq = { b1: [], b2: [], b3: [] };
  const tren = (i) => (kieu === "bb" ? st.tren[i] : st.hh30[i - 1] * 0.98), duoiDong = (i) => st.duoi[i];
  const laB1 = (i) => {
    if (!du(st, i) || tren(i) == null) return false;
    if (kieu === "hop" && !(st.hh30[i - 1] / st.ll30[i - 1] - 1 <= 0.25)) return false;
    if (!(st.c[i] >= tren(i))) return false;
    return !canNgoai || (st.r5[i] != null && st.r5[i] >= NG);
  };
  let i = 121;
  while (i < st.n - 25) {
    if (!(laB1(i) && !laB1(i - 1))) { i++; continue; }
    kq.b1.push(i);
    const giuaCo = kieu === "bb" ? null : (st.hh30[i - 1] + st.ll30[i - 1]) / 2, dayHop = st.ll30[i - 1];
    let dinh = st.h[i], dap = false, b = -1, hetHan = i + 15;
    for (let k = i + 1; k <= Math.min(st.n - 22, hetHan); k++) {
      if (!dap) { if (st.c[k] <= dinh * 0.98) { dap = true; hetHan = Math.min(hetHan, k + 10); } else dinh = Math.max(dinh, st.h[k]); }
      if (dap) {
        const giua = kieu === "bb" ? st.mid[k] : giuaCo;
        if (st.c[k] < giua || st.c[k] < dinh * 0.92) break; // dap qua manh: khong con la "dap nhe"
        if (st.c[k] > dinh) { b = k; break; }
      }
    }
    if (b < 0) { i++; continue; }
    kq.b2.push(b);
    let c3 = -1;
    for (let m = b + 1; m <= Math.min(st.n - 22, b + 20); m++) { const bien = kieu === "bb" ? duoiDong(m) : dayHop; if (bien != null && st.c[m] < bien) { c3 = m; break; } }
    if (c3 >= 0) kq.b3.push(c3);
    i = (c3 >= 0 ? c3 : b) + 1;
  }
  return kq;
}
console.log("\n=== 1. CHUOI CUA THAY: B1 (ngoai mua nhieu + gia len bien tren) -> B2 (dap nhe roi vuot dinh) -> B3 (thung bien duoi) -> B4 (song 50-100%) ===");
const nen120 = []; for (const st of MA) for (let i = 121; i < st.n; i += 7) if (du(st, i)) { const r = lenh(st, i); if (r && r.len120 != null) nen120.push(r); }
const tl = (g, k, m) => { const a = g.map((x) => x[k]).filter((x) => x != null); return a.length ? `${f((a.filter((x) => x >= m).length / a.length) * 100, 0)}%` : "-"; };
console.log(`  MOC SO SANH - mua 1 ngay bat ky: tang >= 50% trong 120 phien toi: ${tl(nen120, "len120", 50)} | >= 30%: ${tl(nen120, "len120", 30)} | >= 20% trong 60 phien: ${tl(nen120, "len60", 20)} (n=${nen120.length})`);
for (const [kieu, tenKieu] of [["bb", "BIEN = DAI BOLLINGER 20,2"], ["hop", "BIEN = HOP GIA 30 PHIEN (rong <= 25%)"]]) {
  for (const canNgoai of [true, false]) {
    let n1 = 0, n2 = 0, n3 = 0; const e2 = [], e3 = [];
    for (const st of MA) { const q = chuoi(st, kieu, canNgoai); n1 += q.b1.length; n2 += q.b2.length; n3 += q.b3.length; for (const i of q.b2) { const r = lenh(st, i); if (r) e2.push(r); } for (const i of q.b3) { const r = lenh(st, i); if (r) e3.push(r); } }
    console.log(`\n  -- ${tenKieu} | ${canNgoai ? "CO dieu kien nuoc ngoai mua nhieu o B1" : "KHONG can nuoc ngoai (chi hinh thai gia)"} --`);
    console.log(`     so lan: B1 ${n1} -> B2 ${n2} (${f((n2 / n1) * 100, 0)}% so B1) -> B3 ${n3} (${f((n3 / (n2 || 1)) * 100, 0)}% so B2)`);
    console.log(`     B4 sau B3 (mua mo cua phien sau B3): tang >= 50% trong 120 phien: ${tl(e3, "len120", 50)} | >= 30%: ${tl(e3, "len120", 30)} | >= 20% trong 60 phien: ${tl(e3, "len60", 20)}`);
    console.log(`     B4 sau B2 (mua mo cua phien sau khi vuot dinh): tang >= 50% trong 120 phien: ${tl(e2, "len120", 50)} | >= 30%: ${tl(e2, "len120", 30)} | >= 20% trong 60 phien: ${tl(e2, "len60", 20)}`);
    baoCao("Danh T+ mua sau B2 (vuot dinh)", e2); baoCao("Danh T+ mua sau B3 (thung bien duoi)", e3);
  }
}

// ---------- 2. CAC KIEU DANH T+ DON LE ----------
console.log("\n=== 2. CAC KIEU VAO LENH T+ DON LE (% lai TB sau phi, trong ngoac = ty le thang; [..] = khoang tin cay 95%) ===");
const KIEU = [
  ["MOC: mua 1 ngay bat ky", (st, i) => i % 4 === 0, false],
  ["Nuoc ngoai MUA nhieu (5 phien)", (st, i) => st.r5[i] != null && st.r5[i] >= NG],
  ["Nuoc ngoai BAN nhieu (5 phien)", (st, i) => st.r5[i] != null && st.r5[i] <= -NG],
  ["Dong cua vuot BIEN TREN Bollinger", (st, i) => st.tren[i] != null && st.c[i] > st.tren[i]],
  ["  + nuoc ngoai mua nhieu (= B1 cua thay)", (st, i) => st.tren[i] != null && st.c[i] > st.tren[i] && st.r5[i] != null && st.r5[i] >= NG],
  ["Dong cua thung BIEN DUOI Bollinger", (st, i) => st.duoi[i] != null && st.c[i] < st.duoi[i]],
  ["  + gia van tren MA100 (dap trong xu huong tang)", (st, i) => st.duoi[i] != null && st.c[i] < st.duoi[i] && st.ma100[i] != null && st.c[i] > st.ma100[i]],
  ["  + nuoc ngoai VAN mua nhieu (ngoai gom luc dap)", (st, i) => st.duoi[i] != null && st.c[i] < st.duoi[i] && st.r5[i] != null && st.r5[i] >= NG],
  ["  + nuoc ngoai ban nhieu", (st, i) => st.duoi[i] != null && st.c[i] < st.duoi[i] && st.r5[i] != null && st.r5[i] <= -NG],
  ["Rut chan o bien duoi (thap < bien duoi, dong cua tren bien & nua tren nen)", (st, i) => st.duoi[i] != null && st.l[i] < st.duoi[i] && st.c[i] > st.duoi[i] && st.h[i] > st.l[i] && (st.c[i] - st.l[i]) / (st.h[i] - st.l[i]) >= 0.6],
  ["  + nuoc ngoai mua nhieu", (st, i) => st.duoi[i] != null && st.l[i] < st.duoi[i] && st.c[i] > st.duoi[i] && st.h[i] > st.l[i] && (st.c[i] - st.l[i]) / (st.h[i] - st.l[i]) >= 0.6 && st.r5[i] != null && st.r5[i] >= NG],
  ["Vuot dinh 20 phien + KL >= 1,5 lan TB20", (st, i) => st.c[i] > st.hh20[i - 1] && st.v20[i - 1] > 0 && st.v[i] >= 1.5 * st.v20[i - 1]],
  ["  + nuoc ngoai mua nhieu", (st, i) => st.c[i] > st.hh20[i - 1] && st.v20[i - 1] > 0 && st.v[i] >= 1.5 * st.v20[i - 1] && st.r5[i] != null && st.r5[i] >= NG],
  ["3 phien giam lien tiep, gia tren MA50", (st, i) => st.c[i] < st.c[i - 1] && st.c[i - 1] < st.c[i - 2] && st.c[i - 2] < st.c[i - 3] && st.ma50[i] != null && st.c[i] > st.ma50[i]],
  ["Thung day 20 phien roi dong cua lai tren day cu (ru hang)", (st, i) => st.l[i] < st.ll20[i - 1] && st.c[i] > st.ll20[i - 1]],
  ["  + nuoc ngoai mua nhieu", (st, i) => st.l[i] < st.ll20[i - 1] && st.c[i] > st.ll20[i - 1] && st.r5[i] != null && st.r5[i] >= NG],
];
for (const [ten, dk, dauChuoi = true] of KIEU) {
  const ev = [];
  for (const st of MA) for (let i = 121; i < st.n - 21; i++) { if (!du(st, i) || !dk(st, i)) continue; if (dauChuoi && du(st, i - 1) && dk(st, i - 1)) continue; const r = lenh(st, i); if (r) ev.push(r); }
  baoCao(ten, ev);
}
process.exit(0);
