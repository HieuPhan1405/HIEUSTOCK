// NGHIEN CUU (2026-10-14): VWAP ket hop POC co nang cap duoc HE THONG CO SO (lenh MUA cua he thong tren co phieu) khong?
// Lenh: cac lan vao lenh goc cua he thong (taiLenh), vao = MO CUA phien sau tin hieu, thoat theo luat he thong (mo()), phi 0,4% / vong.
// Moi dac trung chi dung du lieu DEN HET phien tin hieu (gia tham chieu = gia dong cua phien tin hieu c).
//   VWAP W phien     = tong (gia dien hinh x KL) / tong KL cua W phien gan nhat (gia dien hinh = (cao + thap + dong cua) / 3)
//   VWAP neo tu DAY  = VWAP tinh tu phien co gia thap nhat trong 120 phien (gia von binh quan cua nhung nguoi mua tu day)
//   VWAP neo tu DINH = VWAP tinh tu phien co gia cao nhat trong 250 phien (gia von binh quan cua nhung nguoi mua tu dinh -> nguon cung phia tren)
//   POC W phien      = muc gia co khoi luong lon nhat trong W phien (xap xi tu nen ngay: KL moi nen rai deu tren [thap, cao], 1 bac = 0,5% gia)
// Phan 1: VWAP rieng | Phan 2: POC rieng | Phan 3: KET HOP | Phan 4: dung lam diem THOAT them vao luat he thong.
// KP = lenh truoc 05/2022, KC = tu 05/2022 (giai doan kiem chung). Chenh lech co khoang tin cay 95% (lay mau lai).
// Chay: node engine/dich-vu/nghienCuuVwapPoc.mjs
import { taiLenh, mo, tb, f, boot } from "./nghienCuuLenh.mjs";

const BIN = 0.005;
function vwap(t, tu, den) {
  let a = 0, b = 0;
  for (let j = Math.max(0, tu); j <= den; j++) { const v = t.vol[j]; if (!(v > 0)) continue; a += ((t.high[j] + t.low[j] + t.close[j]) / 3) * v; b += v; }
  return b > 0 ? a / b : null;
}
function hoSo(t, tu, den) {
  tu = Math.max(0, tu); let lo = Infinity, hi = -Infinity;
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
  return { poc: gia(poc), vah: gia(b), val: gia(a) };
}

const { lenh } = taiLenh();
const dong = [];
for (const t of lenh) {
  const iv = t.iv, E = t.open[iv + 1];
  if (!(E > 0) || iv < 260) continue;
  const r = mo(t, { E, vao: iv + 1, banTu: iv + 3, S: t.S }); if (!r) continue;
  const c = t.close[iv], ngay = t.ngayArr[iv];
  const row = { t, ret: r.ret, stop: /STOP/.test(r.ly), ngay, nam: ngay.slice(0, 4), kc: ngay >= "2022-05-01" };
  let du = true;
  for (const W of [20, 60, 120]) { const v = vwap(t, iv - W + 1, iv); if (!v) { du = false; break; } row["v" + W] = (c / v - 1) * 100; row["V" + W] = v; }
  if (!du) continue;
  for (const W of [60, 120]) { const h = hoSo(t, iv - W + 1, iv); if (!h) { du = false; break; } row["p" + W] = (c / h.poc - 1) * 100; row["P" + W] = h.poc; row["vp" + W] = (row["V" + W] / h.poc - 1) * 100; row["va" + W] = c > h.vah ? 1 : c < h.val ? -1 : 0; }
  if (!du) continue;
  let jl = iv - 119, jh = iv - 249;
  for (let j = iv - 119; j <= iv; j++) if (t.low[j] < t.low[jl]) jl = j;
  for (let j = iv - 249; j <= iv; j++) if (t.high[j] >= t.high[jh]) jh = j;
  row.tuDay = iv - jl; row.tuDinh = iv - jh;
  const aL = vwap(t, jl, iv), aH = vwap(t, jh, iv);
  row.aL = aL ? (c / aL - 1) * 100 : null; row.aH = aH ? (c / aH - 1) * 100 : null; row.jl = jl;
  const hL = iv - jl >= 10 ? hoSo(t, jl, iv) : null; row.pL = hL ? (c / hL.poc - 1) * 100 : null; row.vpL = hL && aL ? (aL / hL.poc - 1) * 100 : null;
  dong.push(row);
}
const pf = (g) => { const w = g.filter((x) => x.ret > 0).reduce((s, x) => s + x.ret, 0), l = -g.filter((x) => x.ret <= 0).reduce((s, x) => s + x.ret, 0); return l > 0 ? w / l : NaN; };
const R = (g) => g.map((x) => x.ret);
const mota = (g) => `n=${String(g.length).padStart(4)} TB ${f(tb(R(g))).padStart(6)}% thang ${f((g.filter((x) => x.ret > 0).length / (g.length || 1)) * 100, 0).padStart(2)}% cat lo ${f((g.filter((x) => x.stop).length / (g.length || 1)) * 100, 0).padStart(2)}% PF ${f(pf(g)).padStart(4)}`;
const hang = (ten, g) => console.log(`   ${ten.padEnd(58)} ${mota(g)} | KP ${f(tb(R(g.filter((x) => !x.kc)))).padStart(6)}% (n${g.filter((x) => !x.kc).length}) | KC ${f(tb(R(g.filter((x) => x.kc)))).padStart(6)}% (n${g.filter((x) => x.kc).length})`);
const nams = [...new Set(dong.map((x) => x.nam))].sort();
function ss(ten, fn, tap = dong) {
  const giu = tap.filter(fn), bo = tap.filter((x) => !fn(x));
  hang(ten + " - CO", giu); hang(" ".repeat(Math.min(ten.length, 50)) + " - KHONG", bo);
  if (giu.length < 20 || bo.length < 20) return;
  const c1 = (a, b) => { if (a.length < 15 || b.length < 15) return "-"; const [lo, hi] = boot(R(a), R(b)); return `${f(tb(R(a)) - tb(R(b)))}% [${f(lo)} .. ${f(hi)}]`; };
  const du = nams.filter((y) => giu.filter((x) => x.nam === y).length >= 10 && bo.filter((x) => x.nam === y).length >= 10);
  const tot = du.filter((y) => tb(R(giu.filter((x) => x.nam === y))) > tb(R(bo.filter((x) => x.nam === y)))).length;
  console.log(`      -> chenh (co - khong): ${c1(giu, bo)} | KP ${c1(giu.filter((x) => !x.kc), bo.filter((x) => !x.kc))} | KC ${c1(giu.filter((x) => x.kc), bo.filter((x) => x.kc))} | nam 'co' tot hon: ${tot}/${du.length}`);
}
function chia(ten, khoa, tap = dong) {
  const s = tap.filter((x) => x[khoa] != null).sort((a, b) => a[khoa] - b[khoa]); const n = s.length;
  console.log(`  -- ${ten} (4 nhom tu thap den cao) --`);
  [0, 1, 2, 3].forEach((k) => { const g = s.slice(Math.floor((k * n) / 4), Math.floor(((k + 1) * n) / 4)); hang(`Q${k + 1}: ${f(g[0][khoa], 1)} .. ${f(g[g.length - 1][khoa], 1)}`, g); });
}

console.log(`\nSo lenh: ${dong.length} (${dong[0] ? [...dong].sort((a, b) => (a.ngay < b.ngay ? -1 : 1))[0].ngay : ""} -> ${[...dong].sort((a, b) => (a.ngay < b.ngay ? -1 : 1)).pop().ngay})`);
hang("HE THONG HIEN TAI (moc so sanh)", dong);

console.log("\n=== 1. VWAP RIENG ===");
for (const W of [20, 60, 120]) ss(`Gia dong cua TREN VWAP ${W} phien`, (x) => x["v" + W] > 0);
chia("Khoang cach gia so voi VWAP 60 phien (%)", "v60");
ss("Gia TREN VWAP neo tu day 120 phien", (x) => x.aL > 0, dong.filter((x) => x.aL != null && x.tuDay >= 3));
ss("Gia TREN VWAP neo tu dinh 250 phien (het nguon cung tu dinh)", (x) => x.aH > 0, dong.filter((x) => x.aH != null && x.tuDinh >= 10));
ss("Dinh 250 phien vua lap trong 10 phien gan day (dang o vung dinh)", (x) => x.tuDinh < 10);

console.log("\n=== 2. POC RIENG ===");
for (const W of [60, 120]) ss(`Gia dong cua TREN POC ${W} phien`, (x) => x["p" + W] > 0);
chia("Khoang cach gia so voi POC 120 phien (%)", "p120");
ss("Gia TREN POC cua nhip tang (ho so tu day 120 phien)", (x) => x.pL > 0, dong.filter((x) => x.pL != null));

console.log("\n=== 3. KET HOP VWAP + POC ===");
for (const W of [60, 120]) {
  console.log(`  -- 4 trang thai theo VWAP ${W} va POC ${W} --`);
  hang("Tren CA HAI", dong.filter((x) => x["v" + W] > 0 && x["p" + W] > 0));
  hang("Tren VWAP, duoi POC (POC la can phia tren)", dong.filter((x) => x["v" + W] > 0 && x["p" + W] <= 0));
  hang("Tren POC, duoi VWAP", dong.filter((x) => x["v" + W] <= 0 && x["p" + W] > 0));
  hang("Duoi CA HAI", dong.filter((x) => x["v" + W] <= 0 && x["p" + W] <= 0));
  ss(`Tren ca VWAP ${W} lan POC ${W}`, (x) => x["v" + W] > 0 && x["p" + W] > 0);
  ss(`POC ${W} nam NGAY TREN dau (0..5% tren gia) va gia tren VWAP`, (x) => x["v" + W] > 0 && x["p" + W] <= 0 && x["p" + W] > -5);
  console.log(`  -- VWAP ${W} so voi POC ${W} --`);
  hang("VWAP cao hon POC > 1,5% (gia von TB nam tren vung KL lon)", dong.filter((x) => x["vp" + W] > 1.5));
  hang("VWAP ~ POC (cach < 1,5%): hop luu", dong.filter((x) => Math.abs(x["vp" + W]) <= 1.5));
  hang("VWAP thap hon POC > 1,5%", dong.filter((x) => x["vp" + W] < -1.5));
  const hl = dong.filter((x) => Math.abs(x["vp" + W]) <= 1.5);
  ss(`HOP LUU va gia nam ngay tren vung do (0..5%)`, (x) => { const m = Math.min(x["v" + W], x["p" + W]); return m > 0 && Math.max(x["v" + W], x["p" + W]) <= 5; }, hl);
  ss(`HOP LUU va gia nam ngay tren vung do (0..5%) - so voi TAT CA lenh con lai`, (x) => Math.abs(x["vp" + W]) <= 1.5 && Math.min(x["v" + W], x["p" + W]) > 0 && Math.max(x["v" + W], x["p" + W]) <= 5);
  ss(`HOP LUU nam ngay TREN dau (vung do cach gia 0..5% phia tren)`, (x) => Math.abs(x["vp" + W]) <= 1.5 && Math.max(x["v" + W], x["p" + W]) <= 0 && Math.min(x["v" + W], x["p" + W]) > -5);
  ss(`Gia da di XA ca hai (> 8% tren VWAP va POC)`, (x) => Math.min(x["v" + W], x["p" + W]) > 8);
  ss(`Gia gan ca hai (0..3% tren VWAP va POC)`, (x) => Math.min(x["v" + W], x["p" + W]) > 0 && Math.max(x["v" + W], x["p" + W]) <= 3);
}
console.log("  -- Kieu VWAP neo (gia tren moi gia von) --");
const coNeo = dong.filter((x) => x.aL != null && x.aH != null && x.pL != null);
ss("Gia tren VWAP neo tu day + tren VWAP neo tu dinh + tren POC 120", (x) => x.aL > 0 && x.aH > 0 && x.p120 > 0, coNeo);
ss("Gia tren VWAP neo tu day + tren POC cua nhip tang", (x) => x.aL > 0 && x.pL > 0, coNeo);
ss("Gia hoi ve sat VWAP neo tu day (0..3%) va tren POC nhip tang", (x) => x.aL > 0 && x.aL <= 3 && x.pL > 0, coNeo);
ss("Gia DUOI VWAP neo tu dinh nhung TREN POC 120 (dang leo qua nguon cung)", (x) => x.aH <= 0 && x.p120 > 0, coNeo);
ss("Gia DUOI ca VWAP neo tu dinh lan POC 120", (x) => x.aH <= 0 && x.p120 <= 0, coNeo);

console.log("\n=== 4. DUNG LAM DIEM THOAT: giu nguyen luat he thong, THEM thoat khi gia DONG CUA thung ... (tinh lai moi phien) ===");
function thoatThem(ten, dk) {
  const g = [];
  for (const x of dong) {
    const t = x.t, iv = t.iv, sell2 = t.sell.slice();
    for (let i = iv + 1; i < Math.min(t.n, iv + 400); i++) if (!sell2[i] && dk(t, i, x)) sell2[i] = true;
    const r = mo({ ...t, sell: sell2 }, { E: t.open[iv + 1], vao: iv + 1, banTu: iv + 3, S: t.S });
    if (r) g.push({ ...x, ret: r.ret, stop: /STOP/.test(r.ly), phien: r.phien });
  }
  hang(ten, g); return g;
}
hang("GOC (luat he thong)", dong);
thoatThem("+ dong cua duoi VWAP 20 phien", (t, i) => t.close[i] < vwap(t, i - 19, i));
thoatThem("+ dong cua duoi VWAP 60 phien", (t, i) => t.close[i] < vwap(t, i - 59, i));
thoatThem("+ dong cua duoi VWAP neo tu day (neo co dinh luc mua)", (t, i, x) => x.tuDay >= 3 && t.close[i] < vwap(t, x.jl, i));
thoatThem("+ dong cua duoi POC 60 phien", (t, i) => { const h = hoSo(t, i - 59, i); return !!h && t.close[i] < h.poc; });
thoatThem("+ dong cua duoi CA VWAP 60 va POC 60", (t, i) => { const h = hoSo(t, i - 59, i); return !!h && t.close[i] < h.poc && t.close[i] < vwap(t, i - 59, i); });
thoatThem("+ dong cua duoi CA VWAP 20 va POC 60", (t, i) => { const h = hoSo(t, i - 59, i); return !!h && t.close[i] < h.poc && t.close[i] < vwap(t, i - 19, i); });

console.log("\n=== 5. DOI CHUNG cho diem duy nhat nhat quan: 'gia dong cua TREN POC 120 phien'. La do POC that, hay chi la XU HUONG tra hinh? ===");
// cac thuoc do xu huong KHONG dung khoi luong theo muc gia, cung cua so 120 phien
for (const x of dong) {
  const t = x.t, iv = t.iv; let s = 0, hh = -Infinity, ll = Infinity; const cs = [];
  for (let j = iv - 119; j <= iv; j++) { s += t.close[j]; hh = Math.max(hh, t.high[j]); ll = Math.min(ll, t.low[j]); cs.push(t.close[j]); }
  cs.sort((a, b) => a - b); const c = t.close[iv];
  x.sma = c > s / 120; x.giua = c > (hh + ll) / 2; x.trungVi = c > (cs[59] + cs[60]) / 2; x.dongLuong = c > t.close[iv - 120];
  x.cbT = t.cbTop[iv] != null ? c > t.cbTop[iv] : null; x.cbB = t.cbBot[iv] != null ? c > t.cbBot[iv] : null;
  x.vt = (c - ll) / (hh - ll); // vi tri trong bien do 120 phien (0 = day, 1 = dinh)
  x.poc = x.p120 > 0;
  for (const W of [90, 150, 200, 250]) { const h = hoSo(t, iv - W + 1, iv); x["poc" + W] = h ? c > h.poc : null; }
}
console.log("  -- Cac thuoc do xu huong thuong (khong dung khoi luong) --");
ss("Gia tren POC 120 (nhac lai)", (x) => x.poc);
ss("Gia tren SMA 120", (x) => x.sma);
ss("Gia tren GIUA bien do 120 phien ((cao nhat + thap nhat) / 2)", (x) => x.giua);
ss("Gia tren trung vi gia dong cua 120 phien", (x) => x.trungVi);
ss("Gia cao hon 120 phien truoc (dong luong duong)", (x) => x.dongLuong);
ss("Gia tren VWAP 120", (x) => x.v120 > 0);
ss("Gia tren duong can bang dai han PHIA TREN (he thong da co)", (x) => x.cbT, dong.filter((x) => x.cbT != null));
ss("Gia tren duong can bang dai han PHIA DUOI", (x) => x.cbB, dong.filter((x) => x.cbB != null));
console.log("  -- POC voi cua so khac --");
for (const W of [90, 150, 200, 250]) ss(`Gia tren POC ${W} phien`, (x) => x["poc" + W], dong.filter((x) => x["poc" + W] != null));
console.log("  -- Bang cheo: TRONG CUNG trang thai xu huong, POC con tach duoc khong? --");
for (const [ten, khoa] of [["SMA 120", "sma"], ["giua bien do 120", "giua"], ["trung vi 120", "trungVi"], ["duong can bang dai han phia tren", "cbT"], ["VWAP 120", "v120"]]) {
  const co = (x) => (khoa === "v120" ? x.v120 > 0 : x[khoa]);
  const tap = dong.filter((x) => (khoa === "v120" ? true : x[khoa] != null));
  ss(`[gia TREN ${ten}] va tren POC 120`, (x) => x.poc, tap.filter((x) => co(x)));
  ss(`[gia DUOI ${ten}] va tren POC 120`, (x) => x.poc, tap.filter((x) => !co(x)));
}
console.log("  -- Nguoc lai: TRONG CUNG phia POC, thuoc do thuong con tach duoc khong? --");
ss("[tren POC 120] va tren giua bien do", (x) => x.giua, dong.filter((x) => x.poc));
ss("[duoi POC 120] va tren giua bien do", (x) => x.giua, dong.filter((x) => !x.poc));
ss("[tren POC 120] va tren SMA 120", (x) => x.sma, dong.filter((x) => x.poc));
ss("[duoi POC 120] va tren SMA 120", (x) => x.sma, dong.filter((x) => !x.poc));
chia("Vi tri gia trong bien do 120 phien (0 = day, 1 = dinh)", "vt");
console.log("  -- Theo nam: lenh TREN POC 120 | lenh DUOI POC 120 (TB %, n) --");
for (const y of nams) { const a = dong.filter((x) => x.nam === y && x.poc), b = dong.filter((x) => x.nam === y && !x.poc); console.log(`     ${y}: tren ${f(tb(R(a))).padStart(6)}% (n${String(a.length).padStart(3)}) | duoi ${f(tb(R(b))).padStart(6)}% (n${String(b.length).padStart(3)}) | chenh ${f(tb(R(a)) - tb(R(b))).padStart(6)}%`); }
// khoang tin cay lay mau lai theo CUM THANG (cac lenh cung thang khong doc lap)
function chenhThang(tap, fn) {
  const th = [...new Set(tap.map((x) => x.ngay.slice(0, 7)))]; const theo = new Map(th.map((m) => [m, [0, 0, 0, 0]]));
  for (const x of tap) { const g = theo.get(x.ngay.slice(0, 7)); if (fn(x)) { g[0] += x.ret; g[1]++; } else { g[2] += x.ret; g[3]++; } }
  let seed = 4242; const r = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const ds = [];
  for (let k = 0; k < 3000; k++) { let a = 0, na = 0, b = 0, nb = 0; for (let i = 0; i < th.length; i++) { const g = theo.get(th[Math.floor(r() * th.length)]); a += g[0]; na += g[1]; b += g[2]; nb += g[3]; } if (na && nb) ds.push(a / na - b / nb); }
  ds.sort((x, y) => x - y); const A = tap.filter(fn), B = tap.filter((x) => !fn(x));
  return `${f(tb(R(A)) - tb(R(B)))}% [${f(ds[Math.floor(ds.length * 0.025)])} .. ${f(ds[Math.floor(ds.length * 0.975)])}]`;
}
console.log("  -- Khoang tin cay 95% lay mau lai theo CUM THANG (chat hon) --");
for (const [ten, fn] of [["tren POC 120", (x) => x.poc], ["tren giua bien do 120", (x) => x.giua], ["tren SMA 120", (x) => x.sma], ["tren VWAP 120", (x) => x.v120 > 0], ["tren ca VWAP 120 lan POC 120", (x) => x.v120 > 0 && x.poc]])
  console.log(`     ${ten.padEnd(30)} toan bo ${chenhThang(dong, fn)} | KP ${chenhThang(dong.filter((x) => !x.kc), fn)} | KC ${chenhThang(dong.filter((x) => x.kc), fn)} | tu 2024 ${chenhThang(dong.filter((x) => x.ngay >= "2024-01-01"), fn)}`);

console.log("\n=== 6. CAI THAT SU DUNG SAU: gia dang o DAU trong bien do (gan dinh hay khong). POC / VWAP co them duoc gi sau khi da biet dieu do? ===");
for (const x of dong) {
  const t = x.t, iv = t.iv, c = t.close[iv];
  for (const W of [60, 250]) { let hh = -Infinity, ll = Infinity; for (let j = iv - W + 1; j <= iv; j++) { hh = Math.max(hh, t.high[j]); ll = Math.min(ll, t.low[j]); } x["vt" + W] = (c - ll) / (hh - ll); }
}
const kq3 = (ten, fn) => console.log(`     ${ten.padEnd(44)} co n=${String(dong.filter(fn).length).padStart(4)} TB ${f(tb(R(dong.filter(fn)))).padStart(6)}% | khong n=${String(dong.filter((x) => !fn(x)).length).padStart(4)} TB ${f(tb(R(dong.filter((x) => !fn(x))))).padStart(6)}% | chenh toan bo ${chenhThang(dong, fn)} | KP ${chenhThang(dong.filter((x) => !x.kc), fn)} | KC ${chenhThang(dong.filter((x) => x.kc), fn)} | tu 2024 ${chenhThang(dong.filter((x) => x.ngay >= "2024-01-01"), fn)}`);
console.log("  -- Gia nam o phan tren cua bien do (khoang tin cay theo cum thang) --");
for (const [W, khoa] of [[60, "vt60"], [120, "vt"], [250, "vt250"]]) for (const ng of [0.7, 0.8, 0.9]) kq3(`bien do ${W} phien, vi tri >= ${ng}`, (x) => x[khoa] >= ng);
kq3("tren duong can bang dai han phia tren", (x) => x.cbT === true);
kq3("tren POC 120", (x) => x.poc);
console.log("  -- Sau khi da biet vi tri trong bien do 120 phien, POC / VWAP / duong can bang con tach duoc khong? --");
const gan = dong.filter((x) => x.vt >= 0.8), xa = dong.filter((x) => x.vt < 0.8);
ss("[vi tri >= 0,8] va tren POC 120", (x) => x.poc, gan); ss("[vi tri < 0,8] va tren POC 120", (x) => x.poc, xa);
ss("[vi tri >= 0,8] va tren VWAP 120", (x) => x.v120 > 0, gan); ss("[vi tri < 0,8] va tren VWAP 120", (x) => x.v120 > 0, xa);
ss("[vi tri < 0,8] va tren ca VWAP 120 lan POC 120", (x) => x.v120 > 0 && x.poc, xa);
ss("[vi tri < 0,8] va tren duong can bang dai han phia tren", (x) => x.cbT === true, xa);
ss("[tren POC 120] va vi tri >= 0,8", (x) => x.vt >= 0.8, dong.filter((x) => x.poc)); ss("[duoi POC 120] va vi tri >= 0,8", (x) => x.vt >= 0.8, dong.filter((x) => !x.poc));
console.log("  -- Theo nam: vi tri >= 0,8 | < 0,8 (bien do 120 phien) --");
for (const y of nams) { const a = dong.filter((x) => x.nam === y && x.vt >= 0.8), b = dong.filter((x) => x.nam === y && x.vt < 0.8); console.log(`     ${y}: gan dinh ${f(tb(R(a))).padStart(6)}% (n${String(a.length).padStart(3)}) | con lai ${f(tb(R(b))).padStart(6)}% (n${String(b.length).padStart(3)}) | chenh ${f(tb(R(a)) - tb(R(b))).padStart(6)}%`); }
console.log("  -- Nhom te nhat --");
hang("Duoi POC 120 VA duoi duong can bang dai han phia tren", dong.filter((x) => !x.poc && x.cbT === false));
hang("Duoi POC 120 VA vi tri < 0,5 trong bien do 120 phien", dong.filter((x) => !x.poc && x.vt < 0.5));
hang("Con lai (khong thuoc nhom 'duoi POC va duoi can bang')", dong.filter((x) => !(!x.poc && x.cbT === false)));

console.log("\n=== 7. KIEM TRA DO BEN cua 'gia o 20% tren cung cua bien do' (de biet co phai an may / thien lech khong) ===");
for (const x of dong) {
  const t = x.t, iv = t.iv, c = t.close[iv];
  for (const W of [90, 100, 150, 180, 200]) { let hh = -Infinity, ll = Infinity; for (let j = iv - W + 1; j <= iv; j++) { hh = Math.max(hh, t.high[j]); ll = Math.min(ll, t.low[j]); } x["vt" + W] = (c - ll) / (hh - ll); }
  x.gap = (t.open[iv + 1] / c - 1) * 100; let gt = 0; for (let j = iv - 19; j <= iv; j++) gt += t.close[j] * t.vol[j]; x.gtgd = gt / 20; // nghin dong x co phieu -> don vi tuy du lieu, chi dung de xep hang
  x.diem = t.dacTrung ? t.dacTrung["Tong diem luc vao (diem)"] : null;
}
console.log("  -- Cua so lan can (vi tri >= 0,8) --");
for (const W of [60, 90, 100, 120, 150, 180, 200, 250]) kq3(`bien do ${W} phien, vi tri >= 0.8`, (x) => x[W === 120 ? "vt" : "vt" + W] >= 0.8);
console.log("  -- Chenh lech gia mo cua phien sau so voi gia dong cua tin hieu (lenh gan dinh co bi 'mua khong duoc' vi tran khong?) --");
const g8 = dong.filter((x) => x.vt >= 0.8), k8 = dong.filter((x) => x.vt < 0.8);
console.log(`     gan dinh: gap TB ${f(tb(g8.map((x) => x.gap)))}%, mo cua tang >= 6,5%: ${g8.filter((x) => x.gap >= 6.5).length} lenh (${f((g8.filter((x) => x.gap >= 6.5).length / g8.length) * 100, 1)}%) | con lai: gap TB ${f(tb(k8.map((x) => x.gap)))}%, >= 6,5%: ${k8.filter((x) => x.gap >= 6.5).length} lenh (${f((k8.filter((x) => x.gap >= 6.5).length / k8.length) * 100, 1)}%)`);
ss("Vi tri >= 0,8 - BO cac lenh mo cua tang >= 6,5% (coi nhu khong mua duoc)", (x) => x.vt >= 0.8, dong.filter((x) => x.gap < 6.5));
ss("Vi tri >= 0,8 - chi lenh mo cua tang < 2%", (x) => x.vt >= 0.8, dong.filter((x) => x.gap < 2));
console.log("  -- Theo thanh khoan (gia tri giao dich TB 20 phien, chia doi) --");
{ const s = [...dong].sort((a, b) => a.gtgd - b.gtgd), giua = s[Math.floor(s.length / 2)].gtgd;
  ss("[thanh khoan THAP] vi tri >= 0,8", (x) => x.vt >= 0.8, dong.filter((x) => x.gtgd < giua)); ss("[thanh khoan CAO] vi tri >= 0,8", (x) => x.vt >= 0.8, dong.filter((x) => x.gtgd >= giua)); }
console.log("  -- Theo diem he thong luc vao (chia doi) --");
{ const co = dong.filter((x) => Number.isFinite(x.diem)); if (co.length > 100) { const s = [...co].sort((a, b) => a.diem - b.diem), giua = s[Math.floor(s.length / 2)].diem;
  ss("[diem THAP] vi tri >= 0,8", (x) => x.vt >= 0.8, co.filter((x) => x.diem < giua)); ss("[diem CAO] vi tri >= 0,8", (x) => x.vt >= 0.8, co.filter((x) => x.diem >= giua));
  ss("Diem he thong cao (nua tren) - de so sanh suc tach", (x) => x.diem >= giua, co); } else console.log("     (khong co diem)"); }
console.log("  -- Bo 5 thang tot nhat cua nhom gan dinh --");
{ const th = new Map(); for (const x of g8) { const m = x.ngay.slice(0, 7); th.set(m, (th.get(m) || 0) + x.ret); }
  const top = [...th.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map((x) => x[0]); console.log("     5 thang dong gop nhieu nhat:", top.join(", "));
  ss("Vi tri >= 0,8 - sau khi bo 5 thang do", (x) => x.vt >= 0.8, dong.filter((x) => !top.includes(x.ngay.slice(0, 7)))); }
console.log("  -- Thoi gian giu va muc am lon nhat --");
{ const them = (g) => { const r = g.map((x) => mo(x.t, { E: x.t.open[x.t.iv + 1], vao: x.t.iv + 1, banTu: x.t.iv + 3, S: x.t.S })).filter(Boolean); return `giu TB ${f(tb(r.map((y) => y.phien)), 1)} phien | am lon nhat TB ${f(tb(r.map((y) => y.mae)))}% | khoang cach cat lo TB ${f(tb(r.map((y) => y.rSize)))}% | cham TP1 ${f((r.filter((y) => y.tp1).length / r.length) * 100, 0)}%`; };
  console.log("     gan dinh:", them(g8)); console.log("     con lai :", them(k8)); }
process.exit(0);
