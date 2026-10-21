// GIAI NGAN 1 PHAN O VUNG GAN DAY - THEP va BDS (Hieu 2026-10-21): (1) nhip hoi VUA QUA cua tung ma thep / BDS: day that, cac diem vao theo quy tac (gia cach day bao nhieu %), hien tai; (2) kiem tren TOAN LICH SU cua hai nganh
// (va doi chieu toan thi truong): quy tac nao cho diem vao SAT DAY nhat ma it bi THUNG DAY / sut nhieu nhat. Boi canh: da giam >= 15% tu dinh 20 phien trong 10 phien gan nhat. Quy tac (dong cua = vao ATC, dedupe 15 phien/ma):
//  A  : dong cua len tren Tenkan (9) lan dau sau day;
//  B  : dong cua tren CA Tenkan va Kijun (17), day 20 phien cach >= 3 phien;
//  C  : B + RSI14 dang len (>= +3 diem / 3 phien);
//  D  : dong cua vuot dinh 10 phien truoc + KL >= 1,3x TB20 (breakout co volume);
//  E  : "retest": sau B, phien dau tien gia chinh ve cham Kijun (low <= Kijun x 1,01) roi dong cua > Kijun (trong 10 phien).
// Do: khoang cach vao so voi DAY 20 phien truoc do (% cao hon day), ty le THUNG DAY (low trong 20 phien sau < day truoc do), SUT (low trong 10 phien sau <= -5% so voi gia vao), lai 10 / 20 phien sau phi 0,4%.
// CHI DOC cache (nen_dai.json den het hom nay). CACH CHAY: node engine/dich-vu/nghienCuuGiaiNganThepBds.mjs
import { docJson } from "./backtestChung.mjs";
import { NGANH, nganhCuaMa } from "../danh-sach/nganh.js";

const cache = docJson("nen_dai.json");
const hh = (a, i, n) => { let m = -Infinity; for (let j = i - n + 1; j <= i; j++) if (a[j] > m) m = a[j]; return m; };
const ll = (a, i, n) => { let m = Infinity; for (let j = i - n + 1; j <= i; j++) if (a[j] < m) m = a[j]; return m; };
function rsi14(c) {
  const o = new Array(c.length).fill(null); let ag = 0, al = 0;
  for (let i = 1; i < c.length; i++) {
    const d = c[i] - c[i - 1], g = Math.max(d, 0), l = Math.max(-d, 0);
    if (i <= 14) { ag += g / 14; al += l / 14; } else { ag = (ag * 13 + g) / 14; al = (al * 13 + l) / 14; }
    if (i >= 14) o[i] = al === 0 ? 100 : 100 - 100 / (1 + ag / al);
  }
  return o;
}
const NHOM = { Thep: [...(NGANH.get("Thep") ?? [])], "Bat dong san": [...(NGANH.get("Bat dong san") ?? []), ...(NGANH.get("BDS Khu cong nghiep") ?? [])] };
const RULES = ["A Tenkan", "B Tenkan+Kijun", "C B+RSI len", "D Breakout+KL", "E Retest Kijun"];

// Tin hieu cua 1 ma: danh sach { rule, i } (i = chi so phien vao)
function tinHieu(b) {
  const n = b.length;
  const c = b.map((x) => x.c), h = b.map((x) => x.h), l = b.map((x) => x.l), v = b.map((x) => x.v);
  const r = rsi14(c);
  const tk = c.map((_, i) => (i >= 16 ? (hh(h, i, 9) + ll(l, i, 9)) / 2 : null)), kj = c.map((_, i) => (i >= 16 ? (hh(h, i, 17) + ll(l, i, 17)) / 2 : null));
  const ra = [], ult = {}, ctxIdx = [];
  const them = (rule, i) => { if (ult[rule] != null && i - ult[rule] < 15) return; ult[rule] = i; ra.push({ rule, i }); };
  let bI = -99;
  for (let i = 130; i < n; i++) {
    let gt = 0; for (let j = i - 19; j <= i; j++) gt += (c[j] * v[j]) / 1e6;
    if (gt / 20 < 3) continue;
    let ctx = false; for (let k = 0; k <= 10 && !ctx; k++) if (c[i - k] <= 0.85 * hh(h, i - k, 20)) ctx = true;
    if (!ctx || tk[i] == null) continue;
    const day = ll(l, i, 20); let kDay = i; for (let j = i - 19; j <= i; j++) if (l[j] <= day) kDay = j;
    if (c[i] > tk[i] && c[i - 1] <= tk[i - 1]) them("A Tenkan", i);
    const xn = c[i] > tk[i] && c[i] > kj[i] && i - kDay >= 3;
    if (xn) {
      them("B Tenkan+Kijun", i);
      if (r[i] != null && r[i - 3] != null && r[i] - r[i - 3] >= 3) them("C B+RSI len", i);
      if (i - bI > 15) bI = i;
    }
    let s = 0; for (let j = i - 20; j < i; j++) s += v[j]; s /= 20;
    if (c[i] > hh(h, i - 1, 10) && s > 0 && v[i] >= 1.3 * s) them("D Breakout+KL", i);
    if (bI >= 0 && i > bI && i - bI <= 10 && l[i] <= kj[i] * 1.01 && c[i] > kj[i]) { them("E Retest Kijun", i); bI = -99; }
  }
  return { ra, c, h, l, v, tk, kj };
}
const tb = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const f = (x, d = 1) => (Number.isFinite(x) ? x.toFixed(d) : "-");

// ---- (2) LICH SU: do chat luong diem vao ----
function thongKeLichSu(tenNhom, dsMa) {
  const kq = Object.fromEntries(RULES.map((r) => [r, []]));
  for (const ma of dsMa) {
    const b = cache[ma]; if (!b || b.length < 300) continue;
    const t = tinHieu(b);
    for (const s of t.ra) {
      const i = s.i; if (i + 20 >= b.length) continue;
      const dayTruoc = ll(t.l, i, 20), E = t.c[i];
      let minSau10 = Infinity, minSau20 = Infinity;
      for (let j = i + 1; j <= i + 10; j++) minSau10 = Math.min(minSau10, t.l[j]);
      for (let j = i + 1; j <= i + 20; j++) minSau20 = Math.min(minSau20, t.l[j]);
      kq[s.rule].push({ cachDay: (E / dayTruoc - 1) * 100, thung: minSau20 < dayTruoc, sut: minSau10 <= E * 0.95, r10: (t.c[i + 10] / E - 1) * 100 - 0.4, r20: (t.c[i + 20] / E - 1) * 100 - 0.4, ky: b[i].t < "2022-05-01" ? 0 : 1 });
    }
  }
  console.log(`\n=== ${tenNhom}: ${dsMa.length} ma ===`);
  console.log(`${"Quy tac".padEnd(18)} ${"n".padStart(5)} | ${"cach day TB".padStart(11)} ${"trung vi".padStart(8)} | ${"THUNG DAY 20p".padStart(13)} ${"SUT >=5% /10p".padStart(13)} | ${"lai10".padStart(6)} ${"lai20".padStart(6)} | lai10 <2022.5 / 2022.5+`);
  for (const r of RULES) {
    const a = kq[r]; if (a.length < 20) { console.log(`${r.padEnd(18)} ${String(a.length).padStart(5)} (it mau)`); continue; }
    const cd = a.map((x) => x.cachDay).sort((p, q) => p - q);
    console.log(`${r.padEnd(18)} ${String(a.length).padStart(5)} | ${(f(tb(cd)) + "%").padStart(11)} ${(f(cd[Math.floor(cd.length / 2)]) + "%").padStart(8)} | ${(f((a.filter((x) => x.thung).length / a.length) * 100, 0) + "%").padStart(13)} ${(f((a.filter((x) => x.sut).length / a.length) * 100, 0) + "%").padStart(13)} | ${f(tb(a.map((x) => x.r10)), 2).padStart(6)} ${f(tb(a.map((x) => x.r20)), 2).padStart(6)} | ${f(tb(a.filter((x) => x.ky === 0).map((x) => x.r10)), 2)} / ${f(tb(a.filter((x) => x.ky === 1).map((x) => x.r10)), 2)}`);
  }
}
thongKeLichSu("THEP (lich su 2013-2026)", NHOM.Thep);
thongKeLichSu("BDS + BDS KCN (lich su 2013-2026)", NHOM["Bat dong san"]);
thongKeLichSu("DOI CHIEU: toan thi truong", Object.keys(cache));

// ---- (1) NHIP HOI VUA QUA ----
console.log("\n\n=== NHIP HOI VUA QUA (day trong 45 phien gan nhat; gia = nghin dong; % so voi DAY THAT) ===");
for (const [tenNhom, dsMa] of Object.entries(NHOM)) {
  console.log(`\n--- ${tenNhom} ---`);
  console.log(`${"Ma".padEnd(5)} ${"Day (ngay, gia)".padEnd(22)} ${"Hien".padStart(7)} ${"hoi%".padStart(5)} ${"dinh sau day".padStart(12)} | ${RULES.map((r) => r.split(" ")[0].padStart(16)).join("")}`);
  const dong = [];
  for (const ma of dsMa) {
    const b = cache[ma]; if (!b || b.length < 300) continue;
    const n = b.length;
    let gt = 0; for (let j = n - 20; j < n; j++) gt += (b[j].c * b[j].v) / 1e6;
    if (gt / 20 < 10) continue;
    const t = tinHieu(b);
    let day = n - 1, mn = Infinity;
    for (let j = n - 45; j < n; j++) if (t.l[j] < mn) { mn = t.l[j]; day = j; }
    if (day > n - 4) continue; // day moi 3 phien: chua co nhip hoi de xet
    const dinhSau = hh(t.h, n - 1, n - 1 - day);
    const cot = RULES.map((r) => {
      const s = t.ra.filter((x) => x.rule === r && x.i > day).sort((p, q) => p.i - q.i)[0];
      return s ? `${b[s.i].t.slice(5)} +${f((t.c[s.i] / mn - 1) * 100)}%`.padStart(16) : "-".padStart(16);
    }).join("");
    dong.push({ ma, ord: (t.c[n - 1] / mn - 1) * 100, txt: `${ma.padEnd(5)} ${(b[day].t.slice(5) + " " + f(mn, 2)).padEnd(22)} ${f(t.c[n - 1], 2).padStart(7)} ${f((t.c[n - 1] / mn - 1) * 100).padStart(5)} ${f((dinhSau / mn - 1) * 100).padStart(11)}% | ${cot}` });
  }
  dong.sort((p, q) => q.ord - p.ord).forEach((d) => console.log(d.txt));
}
