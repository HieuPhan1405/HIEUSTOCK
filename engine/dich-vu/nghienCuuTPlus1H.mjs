// NGHIEN CUU T+ THEO KHUNG 1 GIO (27/10/2026): hanh vi TRONG PHIEN i (sang 9h-11h30, chieu 13h-14h, cuoi phien 14h-14h45) co du doan loi nhuan khi MUA trong phien i va BAN chieu T+2 khong?
// Du lieu: engine/output/nen_1h.json (DNSE, 10/2023 -> nay, 5 nen/ngay: 09h, 10h, 11h (chi 30 phut), 13h, 14h (den 14h45 gom ATC)). Gia vao = dong cua nen quanh gio mua (xap xi gia luc do), gia ra = dong cua phien T+2.
//   r11 = tu dong cua hom truoc den 11h30; chieu1 = nen 13h; cuoi = nen 14h. Phi + truot 0,4%/vong; vuot = tru TB deu cac ma thanh khoan cung ngay (cung kieu gia vao). Thanh khoan >= 5 ty (tu nen 1 gio).
// Chay: node engine/dich-vu/nghienCuuTPlus1H.mjs
import { readFileSync } from "node:fs";

const j = JSON.parse(readFileSync(new URL("../output/nen_1h.json", import.meta.url), "utf8"));
const PHI = 0.4;
const TU = process.env.TU ?? "0000"; // TU=2026-01-01 de chi xem tu 2026 (nen 1 gio co tu 10/2023)
const gio = (s) => { const d = new Date((s + 7 * 3600) * 1000); return { ngay: d.toISOString().slice(0, 10), h: d.getUTCHours() }; };
const tb = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const p = (x, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : "—");

const ngayGoc = []; // { ma, d, prev, c: {9,10,11,13,14}, v }
const theoMa = {};
for (const [ma, x] of Object.entries(j)) {
  const m = new Map();
  for (let k = 0; k < x.t.length; k++) {
    const g = gio(x.t[k]);
    const e = m.get(g.ngay) ?? m.set(g.ngay, { c: {}, v: 0 }).get(g.ngay);
    e.c[g.h] = x.c[k];
    e.v += x.v[k];
  }
  const ds = [...m.entries()].filter(([, e]) => e.c[9] && e.c[10] && e.c[11] && e.c[13] && e.c[14]).map(([d, e]) => ({ d, ...e }));
  if (ds.length > 200) theoMa[ma] = ds;
}
const lenh = [];
const bt = new Map(); // baseline: "kieu|ngay" -> [sum, n]
const KIEU_VAO = { c11: 11, c13: 13, c14: 14 };
for (const [ma, ds] of Object.entries(theoMa)) {
  for (let i = 21; i < ds.length - 3; i++) {
    const e = ds[i], prev = ds[i - 1].c[14], ra = ds[i + 2].c[14];
    if (e.d < TU) continue;
    // chi lay khi 3 phien lien tiep (khong thieu ngay)
    let gtri = 0;
    for (let k = i - 19; k <= i; k++) gtri += ds[k].c[14] * ds[k].v;
    if (gtri / 20 / 1e6 < 5) continue;
    const r11 = (e.c[11] / prev - 1) * 100, chieu1 = (e.c[13] / e.c[11] - 1) * 100, cuoi = (e.c[14] / e.c[13] - 1) * 100, r14 = (e.c[13] / prev - 1) * 100, rDay = (e.c[14] / prev - 1) * 100;
    const out = {};
    for (const [k, h] of Object.entries(KIEU_VAO)) {
      out[k] = (ra / e.c[h] - 1) * 100 - PHI;
      const key = `${k}|${e.d}`;
      const a = bt.get(key) ?? [0, 0];
      a[0] += out[k];
      a[1]++;
      bt.set(key, a);
    }
    lenh.push({ ma, d: e.d, r11, chieu1, cuoi, r14, rDay, out });
  }
}
const vuot = (e, k) => e.out[k] - (() => { const a = bt.get(`${k}|${e.d}`); return a[0] / a[1]; })();
function tThang(a, k) {
  const m = new Map();
  for (const e of a) { const v = vuot(e, k); if (Number.isFinite(v)) { const g = e.d.slice(0, 7); (m.get(g) ?? m.set(g, []).get(g)).push(v); } }
  const v = [...m.values()].map(tb);
  if (v.length < 6) return NaN;
  const mu = tb(v), sd = Math.sqrt(v.reduce((s, x) => s + (x - mu) ** 2, 0) / (v.length - 1));
  return mu / (sd / Math.sqrt(v.length));
}
const nam = (a, k) => ["2023", "2024", "2025", "2026"].map((y) => { const b = a.filter((e) => e.d.startsWith(y)); return b.length >= 15 ? p(tb(b.map((e) => vuot(e, k))), 1) : "·"; }).join(" ");
const soNgay = new Set(lenh.map((e) => e.d)).size;
function dong(ten, a, k) {
  if (a.length < 40) return console.log("  ", ten.padEnd(70), String(a.length).padStart(6), "(it mau)");
  console.log("  ", ten.padEnd(70), String(a.length).padStart(6), (p(a.length / soNgay, 1) + "/ng").padStart(7), "| mua", k, "ban T+2: lai", p(tb(a.map((e) => e.out[k]))).padStart(6), "vuot", p(tb(a.map((e) => vuot(e, k)))).padStart(6), "thang", (p((a.filter((e) => e.out[k] > 0).length / a.length) * 100, 0) + "%").padStart(4), "t", p(tThang(a, k), 1).padStart(5), "| nam 23-26:", nam(a, k), "| tu 4/2026: n", a.filter((e) => e.d >= "2026-04").length, "vuot", p(tb(a.filter((e) => e.d >= "2026-04").map((e) => vuot(e, k)))), "lai", p(tb(a.filter((e) => e.d >= "2026-04").map((e) => e.out[k]))));
}
console.log(`${Object.keys(theoMa).length} ma, ${lenh.length} (ma x ngay), ${soNgay} phien. Phi+truot ${PHI}%. "vuot" = tru TB deu cung ngay.\n`);
console.log("DOI CHUNG: gia vao theo gio (moi ma thanh khoan, ban T+2):");
for (const k of Object.keys(KIEU_VAO)) console.log("   mua o", k, "-> lai TB", p(tb(lenh.map((e) => e.out[k]))));
console.log("\nCAC KIEU TRONG PHIEN (mua trong phien i, ban dong cua T+2):");
const C = [
  ["1 Sang giam sau (r11<=-2%) roi chieu HOI (chieu1>=+0,5%) - mua 14h", (e) => e.r11 <= -2 && e.chieu1 >= 0.5, "c13"],
  ["2 Sang giam sau (r11<=-2%) chieu van yeu (chieu1<=0) - mua 14h", (e) => e.r11 <= -2 && e.chieu1 <= 0, "c13"],
  ["3 Sang giam sau (r11<=-2%) - mua luc 11h30 (bat day sang)", (e) => e.r11 <= -2, "c11"],
  ["4 Sang tang manh (r11>=+3%) chieu van tang - mua 14h (dong luong)", (e) => e.r11 >= 3 && e.chieu1 >= 0, "c13"],
  ["5 Sang tang manh (r11>=+3%) roi chieu GIAM (chieu1<=-1%) - mua 14h", (e) => e.r11 >= 3 && e.chieu1 <= -1, "c13"],
  ["6 Chieu xa hang (chieu1<=-2%) - mua 14h", (e) => e.chieu1 <= -2, "c13"],
  ["7 Nen cuoi (14h-14h45) giam >=2% (ATC/cuoi phien ban thao) - mua dong cua", (e) => e.cuoi <= -2, "c14"],
  ["8 Nen cuoi tang >=2% (keo ATC) - mua dong cua", (e) => e.cuoi >= 2, "c14"],
  ["9 Ca ngay giam >=4% va dong cua gan day (nen cuoi giam) - mua dong cua", (e) => e.rDay <= -4 && e.cuoi < 0, "c14"],
  ["10 Ca ngay giam >=4% nhung nen cuoi HOI >=+0,5% - mua dong cua", (e) => e.rDay <= -4 && e.cuoi >= 0.5, "c14"],
];
for (const [ten, f, k] of C) dong(ten, lenh.filter(f), k);
