// DIEM B VOI DINH "GAN NHAT" CUA TUNG MA (Hieu 2026-10-21: "hay la dinh gan nhat, hay tim dinh moi ma khac nhau di").
// Thay vi cua so co dinh L phien, moi diem B tu tim DINH CUA DOT GIAM HIEN TAI theo tung ma:
//   Z6 / Z10 = zigzag nguoc tu day: dinh cao nhat quay ve truoc cho toi khi gap nhip hoi >= 6% / 10% (low <= dinh x (1 - R)) truoc dinh do;
//   A3 / A4  = zigzag voi nguong R = 3 / 4 x ATR% cua ma (ma bien dong manh -> nguong rong hon, moi ma 1 nguong);
//   P5       = dinh xoay (pivot) gan nhat 5 nen moi ben (xac nhan day du truoc nen B);
//   F20      = doi chieu: dinh cao nhat 20 phien (cach cu).
// Diem B (nhu cu): dong cua tren Tenkan 9 + Kijun 17, day 20 phien cach >= 3 phien, GTGD TB20 >= 3 ty, moi nhip hoi 1 lan (cach >= 15 nen, tinh tren moi diem B co muc giam >= 10% theo cach do dinh dang xet).
// Muc giam = (dinh - day thap nhat 20 phien) / dinh. THOI GIAN GIAM = so nen tu dinh toi day. GIAM THEO ATR = muc giam % / ATR% (do lech giam so voi bien dong binh thuong cua chinh ma).
// Mua MO CUA phien sau (thuc te), phi 0,4%. In: (1) theo muc giam tung cach tim dinh, (2) theo THOI GIAN GIAM (Z10, giam >= 15%), (3) theo GIAM THEO ATR (tat ca). Chia toan bo / tu 2022-05.
// CHI DOC cache. CACH CHAY: node engine/dich-vu/nghienCuuDiemBDinhGanNhat.mjs
import { docJson } from "./backtestChung.mjs";

const cache = docJson("nen_dai.json");
const hh = (a, i, n) => { let m = -Infinity; for (let j = Math.max(0, i - n + 1); j <= i; j++) if (a[j] > m) m = a[j]; return m; };
const ll = (a, i, n) => { let m = Infinity; for (let j = Math.max(0, i - n + 1); j <= i; j++) if (a[j] < m) m = a[j]; return m; };
const tb = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const f = (x, d = 1) => (Number.isFinite(x) ? x.toFixed(d) : "-");
const th = (x) => (x.length ? (x.filter((y) => y > 0).length / x.length) * 100 : NaN);
const CP = 0.4;

function atrPct(h, l, c, i, n = 14) {
  let s = 0; for (let j = i - n + 1; j <= i; j++) s += Math.max(h[j] - l[j], Math.abs(h[j] - c[j - 1]), Math.abs(l[j] - c[j - 1]));
  return (s / n / c[i]) * 100;
}
// zigzag nguoc tu nen `den`: tra { idx, gia } cua dinh cua dot giam
function dinhZigzag(h, l, den, R) {
  let H = -Infinity, iH = den;
  for (let j = den; j >= Math.max(0, den - 250); j--) {
    if (h[j] > H) { H = h[j]; iH = j; } else if (l[j] <= H * (1 - R)) break;
  }
  return { idx: iH, gia: H };
}
function dinhPivot(h, den, N) {
  for (let j = den - N; j >= Math.max(N, den - 250); j--) {
    let ok = true; for (let k = j - N; k <= j + N; k++) if (h[k] > h[j]) { ok = false; break; }
    if (ok) return { idx: j, gia: h[j] };
  }
  return null;
}
const CACH = {
  Z6: (h, l, c, i, kDay) => dinhZigzag(h, l, kDay, 0.06),
  Z10: (h, l, c, i, kDay) => dinhZigzag(h, l, kDay, 0.1),
  A3: (h, l, c, i, kDay) => dinhZigzag(h, l, kDay, (3 * atrPct(h, l, c, kDay)) / 100),
  A4: (h, l, c, i, kDay) => dinhZigzag(h, l, kDay, (4 * atrPct(h, l, c, kDay)) / 100),
  P5: (h, l, c, i, kDay) => dinhPivot(h, kDay, 5),
  F20: (h, l, c, i) => { const g = hh(h, i, 20); let idx = i; for (let j = i - 19; j <= i; j++) if (h[j] === g) idx = j; return { idx, gia: g }; },
};

const ev = Object.fromEntries(Object.keys(CACH).map((k) => [k, []]));
for (const ma of Object.keys(cache)) {
  const b = cache[ma]; if (!b || b.length < 400) continue;
  const n = b.length, o = b.map((x) => x.o), c = b.map((x) => x.c), h = b.map((x) => x.h), l = b.map((x) => x.l), v = b.map((x) => x.v);
  const ult = Object.fromEntries(Object.keys(CACH).map((k) => [k, -99]));
  for (let i = 270; i < n - 21; i++) {
    let gt = 0; for (let j = i - 19; j <= i; j++) gt += (c[j] * v[j]) / 1e6;
    if (gt / 20 < 3) continue;
    const tk = (hh(h, i, 9) + ll(l, i, 9)) / 2, kj = (hh(h, i, 17) + ll(l, i, 17)) / 2;
    if (!(c[i] > tk && c[i] > kj)) continue;
    const day = ll(l, i, 20); let kDay = i; for (let j = i - 19; j <= i; j++) if (l[j] <= day) kDay = j;
    if (i - kDay < 3) continue;
    const E2 = o[i + 1]; let m20 = Infinity; for (let j = i + 1; j <= i + 20; j++) m20 = Math.min(m20, l[j]);
    for (const [ten, tim] of Object.entries(CACH)) {
      if (i - ult[ten] < 15) continue;
      const d = tim(h, l, c, i, kDay); if (!d || !(d.gia > 0)) continue;
      const giam = (1 - day / d.gia) * 100;
      if (giam < 10) continue;
      ult[ten] = i;
      const ap = atrPct(h, l, c, kDay);
      ev[ten].push({
        ky: b[i].t < "2022-05-01" ? 0 : 1, giam, dur: kDay - d.idx, giamATR: giam / ap, thung: m20 < day,
        r10: (c[i + 11] / E2 - 1) * 100 - CP, r20: (c[i + 21] / E2 - 1) * 100 - CP,
      });
    }
  }
}
const dong = (ten, a) => {
  if (a.length < 25) { console.log(`    ${ten.padEnd(10)} n=${String(a.length).padStart(5)} (it mau)`); return; }
  console.log(`    ${ten.padEnd(10)} n=${String(a.length).padStart(5)} | thung day ${f((a.filter((x) => x.thung).length / a.length) * 100, 0).padStart(3)}% | 10p ${f(tb(a.map((x) => x.r10)), 2).padStart(6)} (thang ${f(th(a.map((x) => x.r10)), 0)}%) | 20p ${f(tb(a.map((x) => x.r20)), 2).padStart(6)} (thang ${f(th(a.map((x) => x.r20)), 0)}%)`);
};
const KY = [["toan bo", () => true], ["TU 2022-05", (x) => x.ky === 1]];
const bang = (tieuDe, a, truong, nhom, ten) => {
  console.log(`  ${tieuDe}`);
  for (const [tk, loc] of KY) {
    console.log(`   - ${tk}`);
    for (const [lo, hi] of nhom) dong(ten([lo, hi]), a.filter((x) => loc(x) && x[truong] >= lo && x[truong] < hi));
  }
};
const MG = [[10, 15], [15, 20], [20, 30], [30, 999]];
const tenMG = ([a, b]) => (b === 999 ? `>= ${a}%` : `${a}-${b}%`);

console.log("######## (1) THEO MUC GIAM, TUNG CACH TIM DINH ########");
for (const k of Object.keys(CACH)) {
  console.log(`\n== ${k}: ${ev[k].length} diem B (giam >= 10%), TB thoi gian giam ${f(tb(ev[k].map((x) => x.dur)), 0)} phien`);
  bang("theo muc giam", ev[k], "giam", MG, tenMG);
}
console.log("\n######## (2) THEO THOI GIAN GIAM (so nen tu dinh toi day), muc giam >= 15% ########");
for (const k of ["Z10", "A3", "P5"]) {
  const a = ev[k].filter((x) => x.giam >= 15);
  console.log(`\n== ${k}, giam >= 15%: ${a.length} diem`);
  bang("theo thoi gian giam", a, "dur", [[0, 6], [6, 11], [11, 21], [21, 41], [41, 999]], ([lo, hi]) => (hi === 999 ? `> ${lo - 1} nen` : `${lo}-${hi - 1} nen`));
}
console.log("\n######## (3) THEO MUC GIAM CHIA ATR% CUA MA (giam >= 10%) ########");
for (const k of ["Z10", "A3"]) {
  console.log(`\n== ${k}`);
  bang("giam / ATR%", ev[k], "giamATR", [[0, 4], [4, 6], [6, 8], [8, 12], [12, 999]], ([lo, hi]) => (hi === 999 ? `>= ${lo} ATR` : `${lo}-${hi} ATR`));
}
