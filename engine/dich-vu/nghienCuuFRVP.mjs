// NGHIEN CUU (2026-10-14): bo loc VI TRI bang FRVP (POC / VAH / VAL / HVN) + Price Action tren cac lenh MUA cua he thong. Y tuong tu 1 bai tu van AI Hieu dan vao.
// FRVP tu dong, KHONG nhin truoc: diem dau = pivot LOW gan nhat da XAC NHAN (thap nhat trong +-5 nen, xac nhan sau 5 nen) cach tin hieu >= 10 nen; khong co thi lay 60 nen.
// Khoi luong theo muc gia: xap xi tu nen ngay (chia deu KL moi nen tren [thap, cao], 1 bin = 0,5% gia) - KHONG phai du lieu khop lenh that.
// Quy tac (dung nhu bai dan):
//   A  pullback co ho tro: gia dong cua nam trong [VAL*0,99 .. POC*1,03]
//   B  han che mua sat khang cu: R/R = (muc can gan nhat phia tren - E) / (E - SL) >= 2  (muc can = POC, VAH, HVN, dinh swing 120 nen; khong co muc can nao = dinh moi -> dat)
//   C  breakout khoi vung gia tri: dong cua > VAH cua vung tinh den HOM QUA, KL tuong doi >= 1,5, E khong cao hon VAH qua 4%
//   PA xac nhan gia: nen tu choi (rau duoi >= 50% bien do, dong cua o nua tren) HOAC dong cua vuot dinh 3 nen truoc
// Phuong an: A = he thong hien tai | B = + FRVP (R/R>=2 VA (pullback hoac breakout)) | C = B + Price Action. Kem cac bien the don le.
// Vao lenh: mo cua phien sau, thoat theo luat he thong (mo()). Chi phi da tru (CHI_PHI).
// Chay: node engine/dich-vu/nghienCuuFRVP.mjs
import { taiLenh, mo, tb, f, boot } from "./nghienCuuLenh.mjs";

const BIN = 0.005, PIVOT_K = 5;

function pivotLowGanNhat(t, iv) {
  for (let j = iv - PIVOT_K - 10; j >= Math.max(PIVOT_K, iv - 200); j--) {
    let ok = true;
    for (let k = j - PIVOT_K; k <= j + PIVOT_K; k++) if (k !== j && t.low[k] <= t.low[j]) { ok = false; break; }
    if (ok) return j;
  }
  return null;
}
function frvp(t, tu, den) {
  let lo = Infinity, hi = -Infinity;
  for (let j = tu; j <= den; j++) { lo = Math.min(lo, t.low[j]); hi = Math.max(hi, t.high[j]); }
  if (!(lo > 0) || !(hi > lo)) return null;
  const nBin = Math.max(8, Math.ceil(Math.log(hi / lo) / Math.log(1 + BIN)) + 1);
  const bin = (g) => Math.min(nBin - 1, Math.max(0, Math.floor(Math.log(g / lo) / Math.log(1 + BIN))));
  const gia = (x) => lo * (1 + BIN) ** (x + 0.5);
  const kl = new Array(nBin).fill(0);
  for (let j = tu; j <= den; j++) { const v = t.vol[j]; if (!(v > 0)) continue; const a = bin(t.low[j]), b = bin(t.high[j]); for (let x = a; x <= b; x++) kl[x] += v / (b - a + 1); }
  const tong = kl.reduce((x, y) => x + y, 0); if (!(tong > 0)) return null;
  let poc = 0; for (let x = 1; x < nBin; x++) if (kl[x] > kl[poc]) poc = x;
  let a = poc, b = poc, s = kl[poc];
  while (s < 0.7 * tong && (a > 0 || b < nBin - 1)) { const l = a > 0 ? kl[a - 1] : -1, r = b < nBin - 1 ? kl[b + 1] : -1; if (l >= r) { a--; s += kl[a]; } else { b++; s += kl[b]; } }
  const tbBin = tong / nBin; const hvn = [];
  for (let x = 1; x < nBin - 1; x++) if (kl[x] >= kl[x - 1] && kl[x] >= kl[x + 1] && kl[x] >= 1.5 * tbBin) hvn.push(gia(x));
  return { poc: gia(poc), vah: gia(b), val: gia(a), hvn, kl, tbBin, bin, nBin, lo };
}

const { lenh } = taiLenh();
const dong = [];
for (const t of lenh) {
  const iv = t.iv, E = t.open[iv + 1];
  if (!(E > 0) || iv < 130) continue;
  const r = mo(t, { E, vao: iv + 1, banTu: iv + 3, S: t.S }); if (!r) continue;
  let pj = pivotLowGanNhat(t, iv); if (pj == null) pj = iv - 60; if (iv - pj < 10) pj = iv - 60;
  const fr = frvp(t, pj, iv); if (!fr) continue;
  const frHomQua = frvp(t, pj, iv - 1);
  const c = t.close[iv];
  const khoangSwing = Math.max(...t.high.slice(iv - 120, iv));
  const canTren = [fr.poc, fr.vah, ...fr.hvn, khoangSwing].filter((g) => g > E * 1.005);
  const rui = E - t.S;
  // PHAN 3: khoang cach toi vung can THEO KL (POC / VAH / HVN) tinh bang % gia vao, va "lo trong" (LVN): ty le muc gia trong (E, E+8%] co KL < 0,5 trung binh
  const canKL = [fr.poc, fr.vah, ...fr.hvn].filter((g) => g > E * 1.005);
  const dCan = canKL.length ? (Math.min(...canKL) / E - 1) * 100 : 99;
  let nTrong = 0, nTong = 0;
  if (E * 1.005 > fr.lo) for (let x = fr.bin(E * 1.005); x <= Math.min(fr.nBin - 1, fr.bin(E * 1.08)); x++) { nTong++; if (fr.kl[x] < 0.5 * fr.tbBin) nTrong++; }
  const loTrong = nTong ? nTrong / nTong : 1; // khong co du lieu phia tren (gia cao hon moi dinh trong vung) = coi la trong hoan toan
  const ruiPct = (rui / E) * 100;
  const dGan = (muc) => { const c = muc.filter((g) => g > E * 1.002); return c.length ? (Math.min(...c) / E - 1) * 100 : 99; };
  const dPoc = dGan([fr.poc]), dVah = dGan([fr.vah]), dHvn = dGan(fr.hvn);
  const rr = canTren.length ? (Math.min(...canTren) - E) / rui : Infinity;
  const A = c >= fr.val * 0.99 && c <= fr.poc * 1.03;
  const C = !!frHomQua && c > frHomQua.vah && (t.relVol[iv] ?? 0) >= 1.5 && E <= frHomQua.vah * 1.04;
  const rangeBar = t.high[iv] - t.low[iv];
  const tuChoi = rangeBar > 0 && (Math.min(t.open[iv], c) - t.low[iv]) / rangeBar >= 0.5 && c >= (t.high[iv] + t.low[iv]) / 2;
  const vuotDinh = c > Math.max(t.high[iv - 1], t.high[iv - 2], t.high[iv - 3]);
  dong.push({ dCan, dPoc, dVah, dHvn, loTrong, ruiPct, ret: r.ret, nam: t.ngayArr[iv].slice(0, 4), ngay: t.ngayArr[iv], A, C, rr, B2: rr >= 2, B15: rr >= 1.5, B1: rr >= 1, PA: tuChoi || vuotDinh, stop: /STOP/.test(r.ly) });
}

const pf = (g) => { const w = g.filter((x) => x.ret > 0).reduce((s, x) => s + x.ret, 0), l = -g.filter((x) => x.ret <= 0).reduce((s, x) => s + x.ret, 0); return l > 0 ? w / l : NaN; };
const mdd = (g) => { const s = [...g].sort((a, b) => (a.ngay < b.ngay ? -1 : 1)); let c = 0, pk = 0, dd = 0; for (const x of s) { c += x.ret; pk = Math.max(pk, c); dd = Math.max(dd, pk - c); } return dd; };
const nams = [...new Set(dong.map((x) => x.nam))].sort();
const hang = (ten, g) => {
  const r = g.map((x) => x.ret);
  console.log(`   ${ten.padEnd(52)} n=${String(g.length).padStart(4)} | TB ${f(tb(r)).padStart(6)}% | thang ${f((g.filter((x) => x.ret > 0).length / (g.length || 1)) * 100, 0).padStart(3)}% | PF ${f(pf(g)).padStart(5)} | tong ${f(r.reduce((s, v) => s + v, 0), 0).padStart(6)}% | sut toi da ${f(mdd(g), 0).padStart(5)}%`);
};
const sosanh = (ten, giu, bo) => {
  const [lo, hi] = boot(giu.map((x) => x.ret), bo.map((x) => x.ret));
  const nTot = nams.filter((y) => { const a = giu.filter((x) => x.nam === y), b = bo.filter((x) => x.nam === y); return a.length >= 15 && b.length >= 15 && tb(a.map((x) => x.ret)) > tb(b.map((x) => x.ret)); }).length;
  const nDu = nams.filter((y) => giu.filter((x) => x.nam === y).length >= 15 && bo.filter((x) => x.nam === y).length >= 15).length;
  console.log(`      -> ${ten}: giu - bo = ${f(tb(giu.map((x) => x.ret)) - tb(bo.map((x) => x.ret)))}% [95% CI ${f(lo)} .. ${f(hi)}] | nam giu tot hon: ${nTot}/${nDu}`);
};

console.log("so lenh:", dong.length, "| ty le co R/R>=2:", f((dong.filter((x) => x.B2).length / dong.length) * 100, 0) + "%", "| A:", f((dong.filter((x) => x.A).length / dong.length) * 100, 0) + "%", "| C:", f((dong.filter((x) => x.C).length / dong.length) * 100, 0) + "%", "| PA:", f((dong.filter((x) => x.PA).length / dong.length) * 100, 0) + "%");
console.log("\n=== QUY TAC DON LE ===");
hang("Tat ca lenh (he thong hien tai)", dong);
hang("A: pullback co ho tro - CO", dong.filter((x) => x.A)); hang("A: - KHONG", dong.filter((x) => !x.A)); sosanh("A", dong.filter((x) => x.A), dong.filter((x) => !x.A));
hang("B: R/R >= 2 - DAT", dong.filter((x) => x.B2)); hang("B: R/R >= 2 - KHONG DAT (sat khang cu)", dong.filter((x) => !x.B2)); sosanh("B (R/R>=2)", dong.filter((x) => x.B2), dong.filter((x) => !x.B2));
hang("B: R/R >= 1.5 - DAT", dong.filter((x) => x.B15)); hang("B: R/R >= 1.5 - KHONG DAT", dong.filter((x) => !x.B15)); sosanh("B (R/R>=1.5)", dong.filter((x) => x.B15), dong.filter((x) => !x.B15));
hang("B: R/R >= 1 - DAT", dong.filter((x) => x.B1)); hang("B: R/R >= 1 - KHONG DAT", dong.filter((x) => !x.B1)); sosanh("B (R/R>=1)", dong.filter((x) => x.B1), dong.filter((x) => !x.B1));
hang("C: breakout khoi vung gia tri - CO", dong.filter((x) => x.C)); hang("C: - KHONG", dong.filter((x) => !x.C)); sosanh("C", dong.filter((x) => x.C), dong.filter((x) => !x.C));
hang("PA: xac nhan gia - CO", dong.filter((x) => x.PA)); hang("PA: - KHONG", dong.filter((x) => !x.PA)); sosanh("PA", dong.filter((x) => x.PA), dong.filter((x) => !x.PA));

console.log("\n=== 3 PHUONG AN DOI CHUNG (theo bai dan) ===");
const pB = (x) => x.B2 && (x.A || x.C);
const pC = (x) => pB(x) && x.PA;
hang("A: he thong hien tai", dong);
hang("B: + FRVP (R/R>=2 VA (pullback HOAC breakout))", dong.filter(pB)); sosanh("B", dong.filter(pB), dong.filter((x) => !pB(x)));
hang("C: + FRVP + Price Action", dong.filter(pC)); sosanh("C", dong.filter(pC), dong.filter((x) => !pC(x)));
console.log("\n   Theo nam (TB %/lenh):  nam | he thong | B | C");
for (const y of nams) { const g = dong.filter((x) => x.nam === y); console.log(`     ${y} | ${f(tb(g.map((x) => x.ret))).padStart(6)} (n=${g.length}) | ${f(tb(g.filter(pB).map((x) => x.ret))).padStart(6)} (n=${g.filter(pB).length}) | ${f(tb(g.filter(pC).map((x) => x.ret))).padStart(6)} (n=${g.filter(pC).length})`); }
// ---------- PHAN 2 (2026-10-14): chi thu quy tac A (pullback co ho tro) va C (breakout khoi vung gia tri), KHONG dung quy tac B (R/R) ----------
console.log("\n=== PHAN 2: CHI QUY TAC A + C ===");
const nguonMau = dong.map((x) => x.ret);
let seed = 24680; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const hoanVi = (n, tbQuanSat) => { let dem = 0; const SO = 3000; for (let k = 0; k < SO; k++) { let s = 0; for (let i = 0; i < n; i++) s += nguonMau[Math.floor(rnd() * nguonMau.length)]; if (s / n >= tbQuanSat) dem++; } return dem / SO; };
const phuongAn = [
  ["A", (x) => x.A], ["C", (x) => x.C],
  ["A HOAC C", (x) => x.A || x.C], ["A VA C", (x) => x.A && x.C],
  ["A + Price Action", (x) => x.A && x.PA], ["C + Price Action", (x) => x.C && x.PA],
  ["(A HOAC C) + Price Action", (x) => (x.A || x.C) && x.PA],
];
hang("He thong hien tai (moc)", dong);
for (const [ten, fn] of phuongAn) {
  const g = dong.filter(fn), bo = dong.filter((x) => !fn(x));
  hang(ten, g); sosanh(ten, g, bo);
  console.log(`      -> xac suat chon NGAU NHIEN cung so lenh cung dat TB >= ${f(tb(g.map((x) => x.ret)))}%: ${f(hoanVi(g.length, tb(g.map((x) => x.ret))) * 100, 1)}%`);
}
console.log("\n   Theo nam (TB %/lenh): nam | moc | A | C | A hoac C");
for (const y of nams) { const g = dong.filter((x) => x.nam === y); const m = (fn) => { const h = g.filter(fn); return `${f(tb(h.map((x) => x.ret))).padStart(6)} (n=${h.length})`; }; console.log(`     ${y} | ${f(tb(g.map((x) => x.ret))).padStart(6)} | ${m((x) => x.A)} | ${m((x) => x.C)} | ${m((x) => x.A || x.C)}`); }
// nua dau / nua sau thoi gian (out-of-sample thô)
const moc = dong.map((x) => x.ngay).sort()[Math.floor(dong.length / 2)];
for (const [ten, fn] of [["A", (x) => x.A], ["C", (x) => x.C], ["A hoac C", (x) => x.A || x.C]]) {
  const t1 = dong.filter((x) => x.ngay < moc), t2 = dong.filter((x) => x.ngay >= moc);
  console.log(`   ${ten.padEnd(9)} nua dau: ${f(tb(t1.filter(fn).map((x) => x.ret)))}% vs ${f(tb(t1.map((x) => x.ret)))}% | nua sau: ${f(tb(t2.filter(fn).map((x) => x.ret)))}% vs ${f(tb(t2.map((x) => x.ret)))}%  (giu vs moc)`);
}
// ---------- PHAN 3 (2026-10-14): CHI tang 3 FRVP - khoang cach toi vung can (POC/VAH/HVN) bang %, va "lo trong" LVN phia tren ----------
console.log("\n=== PHAN 3: KHOANG CACH TOI VUNG CAN KL + LO TRONG (LVN) ===");
const chia4 = (ten, khoa, dat = (v) => f(v, 2)) => {
  const sx = [...dong].sort((a, b) => a[khoa] - b[khoa]); const n = sx.length;
  console.log(`\n-- ${ten} (4 nhom, thap -> cao) --`);
  const nh = [0, 1, 2, 3].map((k) => sx.slice(Math.floor((k * n) / 4), Math.floor(((k + 1) * n) / 4)));
  nh.forEach((g, k) => hang(`Q${k + 1}: ${dat(g[0][khoa])} .. ${dat(g[g.length - 1][khoa])}`, g));
  const [lo, hi] = boot([...nh[0], ...nh[1]].map((x) => x.ret), [...nh[2], ...nh[3]].map((x) => x.ret));
  console.log(`      -> chenh (nua thap - nua cao) = ${f(tb([...nh[0], ...nh[1]].map((x) => x.ret)) - tb([...nh[2], ...nh[3]].map((x) => x.ret)))}% [CI ${f(lo)} .. ${f(hi)}]`);
};
chia4("Khoang cach toi vung can KL gan nhat phia tren (% so voi gia vao)", "dCan");
chia4("Ty le 'lo trong' LVN trong +0,5..8% phia tren (cao = it can)", "loTrong");
chia4("Khoang cach cat lo (% gia vao) - de doi chung, vi R/R bi lan voi cai nay", "ruiPct");
// kiem soat: trong tung nhom do rong cat lo, vung can gan (< 3%) co kem hon vung can xa (>= 3%) khong
console.log("\n-- Kiem soat do rong cat lo: vung can gan (<3%) so voi xa (>=3%) trong tung nhom cat lo --");
{ const sx = [...dong].sort((a, b) => a.ruiPct - b.ruiPct), n = sx.length;
  for (let k = 0; k < 3; k++) { const g = sx.slice(Math.floor((k * n) / 3), Math.floor(((k + 1) * n) / 3)); const gan = g.filter((x) => x.dCan < 3), xa = g.filter((x) => x.dCan >= 3);
    console.log(`   cat lo ${f(g[0].ruiPct, 1)}..${f(g[g.length - 1].ruiPct, 1)}%: can GAN n=${gan.length} TB ${f(tb(gan.map((x) => x.ret)))}% | can XA n=${xa.length} TB ${f(tb(xa.map((x) => x.ret)))}%`); } }
console.log("\n-- Bo loc don gian: bo lenh khi vung can KL nam trong X% phia tren --");
for (const X of [1.5, 3, 5]) { const giu = dong.filter((x) => x.dCan >= X), bo = dong.filter((x) => x.dCan < X); hang(`giu khi can >= ${X}%`, giu); sosanh(`X=${X}`, giu, bo); }
// ---------- PHAN 4 (2026-10-14): "KHONG MUA KHI GIA SAT KHANG CU PROFILE": tach POC / VAH / HVN, chia min theo khoang cach ----------
console.log("\n=== PHAN 4: GIA SAT KHANG CU PROFILE (tach tung loai, chia min) ===");
const khoangCach = [[0, 0.5], [0.5, 1], [1, 2], [2, 3], [3, 5], [5, 98]];
for (const [ten, khoa] of [["Gan nhat trong POC/VAH/HVN", "dCan"], ["Chi POC phia tren", "dPoc"], ["Chi VAH phia tren", "dVah"], ["Chi HVN phia tren", "dHvn"]]) {
  console.log(`\n-- ${ten}: khoang cach tu gia vao toi muc do (neu co) --`);
  for (const [a, b] of khoangCach) hang(`${a}% .. ${b}%`, dong.filter((x) => x[khoa] >= a && x[khoa] < b));
  hang("Khong co muc nao phia tren", dong.filter((x) => x[khoa] >= 98));
  for (const X of [1, 2, 3]) { const gan = dong.filter((x) => x[khoa] < X), xa = dong.filter((x) => x[khoa] >= X); sosanh(`bo lenh khi cach < ${X}% (bo n=${gan.length})`, xa, gan); }
}
// bo loc ket hop de nghi: bo khi BAT KY muc POC/VAH/HVN nao nam trong 1% / 2% phia tren
console.log("\n-- Quy tac: KHONG MUA khi co POC / VAH / HVN nam trong X% phia tren gia vao --");
for (const X of [0.5, 1, 2]) { const giu = dong.filter((x) => x.dCan >= X), bo = dong.filter((x) => x.dCan < X); hang(`X=${X}%: GIU`, giu); hang(`X=${X}%: BO`, bo); sosanh(`X=${X}`, giu, bo);
  console.log("       theo nam (giu - bo):", nams.map((y) => { const a = giu.filter((x) => x.nam === y), b2 = bo.filter((x) => x.nam === y); return a.length >= 15 && b2.length >= 8 ? `${y}:${f(tb(a.map((x) => x.ret)) - tb(b2.map((x) => x.ret)), 1)}` : null; }).filter(Boolean).join(" ")); }
process.exit(0);
