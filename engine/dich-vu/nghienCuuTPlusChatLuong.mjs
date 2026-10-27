// NGHIEN CUU DANH T+ CHI TREN MA "DAT YEU CAU" (Hieu 27/10/2026): cac kieu vao lenh ngan han (bat nhip hoi, hoi xac nhan, pullback xu huong, giam 3 phien, pha vo doi chung) tren
// (a) toan bo ma thanh khoan >= 5 ty va (b) chi ma co CHAT LUONG TAI THOI DIEM DO: ROE 4 quy >= 10%, loi nhuan 4 quy > 0, dong tien kinh doanh 4 quy > 0, Z2 (Altman) khong o vung nguy co
// (ngan hang / chung khoan / bao hiem: chi ROE >= 10% va loi nhuan > 0). Bao cao tai chinh chi duoc dung SAU ngay cong bo gia dinh (quy 1-3: +45 ngay, quy 4: +90 ngay) de tranh nhin truoc.
// Lenh: tin hieu o gia DONG CUA phien i -> MUA MO CUA phien i+1 -> BAN DONG CUA phien i+3 (chieu T+2) hoac i+5; phi + truot 0,4%/vong. Ket qua tinh THEO TRUNG BINH DEU cac ma cung ngay (excess).
// Du lieu: engine/output/nen_dai.json (gia dieu chinh), vnindex_dai.json, bctc_dai.json (taiBaoCaoTaiChinh.mjs --tu=2020-12-31 --ra=bctc_dai.json). Giai doan kiem tra 2022-04 -> nay.
// Chay: node engine/dich-vu/nghienCuuTPlusChatLuong.mjs
import { readFileSync } from "node:fs";

const doc = (f) => JSON.parse(readFileSync(new URL(`../output/${f}`, import.meta.url), "utf8"));
const nen = doc("nen_dai.json");
const vni = doc("vnindex_dai.json");
const bctc = doc("bctc_dai.json");
const nganh = doc("nganh_map.json");
const TU = "2022-04-01";
const PHI = 0.4;
const KY_HAN = [3, 5];
const THANH_KHOAN = 5; // ty/phien

// ---------- chat luong theo thoi diem
const cong = (q, n) => { const d = new Date(q + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
function dsChatLuong(ma) {
  const b = bctc[ma];
  if (!b) return [];
  const qs = Object.keys(b.q).sort();
  const kq = [];
  for (let i = 3; i < qs.length; i++) {
    const q = qs[i];
    const bon = qs.slice(i - 3, i + 1);
    // 4 quy lien tiep (cach nhau ~3 thang)
    if ((new Date(bon[3]) - new Date(bon[0])) / 86400000 > 300) continue;
    const t = (it) => bon.reduce((s, k) => s + (Number(b.q[k]?.[it]) || 0), 0);
    const x = b.q[q];
    const TS = x["12700"], VCSH = (x["14000"] ?? NaN) + (x["15000"] ?? 0);
    if (!(TS > 0) || !(VCSH > 0)) continue;
    const lnst = t("23003"), cfo = t("32000");
    const roe = lnst / VCSH;
    let ok = roe >= 0.1 && lnst > 0;
    if (b.loai === "pi") {
      const No = Number.isFinite(x["13000"]) ? x["13000"] : TS - VCSH;
      const ebit = t("23800") + t("22510");
      const X1 = ((x["11000"] ?? 0) - (x["13100"] ?? 0)) / TS, X2 = (x["14200"] ?? 0) / TS, X3 = ebit / TS, X4 = VCSH / No;
      const z2 = 6.56 * X1 + 3.26 * X2 + 6.72 * X3 + 1.05 * X4 + 3.25;
      ok = ok && cfo > 0 && z2 >= 4.15;
    }
    kq.push({ pub: cong(q, q.slice(5, 7) === "12" ? 90 : 45), ok });
  }
  return kq.sort((a, c) => (a.pub < c.pub ? -1 : 1));
}

// ---------- chi bao
const sma = (a, n) => { const r = new Array(a.length).fill(NaN); let s = 0; for (let i = 0; i < a.length; i++) { s += a[i]; if (i >= n) s -= a[i - n]; if (i >= n - 1) r[i] = s / n; } return r; };
function rsi14(c) {
  const r = new Array(c.length).fill(NaN);
  let g = 0, l = 0;
  for (let i = 1; i < c.length; i++) {
    const d = c[i] - c[i - 1];
    const up = Math.max(d, 0), dn = Math.max(-d, 0);
    if (i <= 14) { g += up / 14; l += dn / 14; } else { g = (g * 13 + up) / 14; l = (l * 13 + dn) / 14; }
    if (i >= 14) r[i] = l === 0 ? 100 : 100 - 100 / (1 + g / l);
  }
  return r;
}
const rollMax = (a, n) => a.map((_, i) => (i < n - 1 ? NaN : Math.max(...a.slice(i - n + 1, i + 1))));
const rollMin = (a, n) => a.map((_, i) => (i < n - 1 ? NaN : Math.min(...a.slice(i - n + 1, i + 1))));

// VN-Index: thay doi 5 phien
const vniMap = new Map(vni.map((x, i) => [x.t, i > 5 ? (x.c / vni[i - 5].c - 1) * 100 : NaN]));

// VN-Index tren MA50 (thi truong trong xu huong tang)
const vniMa50 = new Map(vni.map((x, i) => [x.t, i >= 50 ? x.c > vni.slice(i - 49, i + 1).reduce((a, b) => a + b.c, 0) / 50 : null]));
const giamBaPhien = (d, i) => d.c[i] > d.ma50[i] && d.c[i] < d.c[i - 1] && d.c[i - 1] < d.c[i - 2] && d.c[i - 2] < d.c[i - 3];
const KIEU = {
  "1 Qua ban (RSI<30 + thung Bollinger duoi)": (d, i) => d.rsi[i] < 30 && d.c[i] < d.bbLo[i],
  "2 Hoi xac nhan (giam>=15% tu dinh 20p, dong cua len tren Tenkan+Kijun lan dau)": (d, i) => d.c[i] / d.hh20[i] - 1 <= -0.15 && d.c[i] > d.tenkan[i] && d.c[i] > d.kijun[i] && d.c[i - 1] <= Math.max(d.tenkan[i - 1], d.kijun[i - 1]),
  "3 Pullback xu huong tang (>MA50 dang len, ve sat MA20, RSI 35-50, nen xanh)": (d, i) => d.c[i] > d.ma50[i] && d.ma50[i] > d.ma50[i - 10] && d.c[i] <= d.ma20[i] * 1.01 && d.c[i] >= d.ma20[i] * 0.97 && d.rsi[i] >= 35 && d.rsi[i] <= 50 && d.c[i] > d.c[i - 1],
  "4 Giam 3 phien lien tiep trong xu huong tang (>MA50)": (d, i) => d.c[i] > d.ma50[i] && d.c[i] < d.c[i - 1] && d.c[i - 1] < d.c[i - 2] && d.c[i - 2] < d.c[i - 3],
  "4a Giam 3 phien lien tiep (>MA50) + tong giam >= 4%": (d, i) => giamBaPhien(d, i) && d.c[i] / d.c[i - 3] - 1 <= -0.04,
  "4b Giam 3 phien (>MA50) + dong cua o 30% duoi bien do nen": (d, i) => giamBaPhien(d, i) && d.h[i] > d.l[i] && (d.c[i] - d.l[i]) / (d.h[i] - d.l[i]) < 0.3,
  "4c Giam 3 phien (>MA50) + VN-Index tren MA50": (d, i) => giamBaPhien(d, i) && vniMa50.get(d.t[i]) === true,
  "4d Giam 3 phien (>MA50) + RSI14 < 40": (d, i) => giamBaPhien(d, i) && d.rsi[i] < 40,
  "4e Giam 4 phien lien tiep (>MA50)": (d, i) => d.c[i] > d.ma50[i] && d.c[i] < d.c[i - 1] && d.c[i - 1] < d.c[i - 2] && d.c[i - 2] < d.c[i - 3] && d.c[i - 3] < d.c[i - 4],
  "4f Giam 3 phien (>MA50) + khoi luong phien giam cuoi < TB20": (d, i) => giamBaPhien(d, i) && d.v[i] < d.vTB[i],
  "5 Qua ban + VN-Index giam >3%/5 phien": (d, i) => d.rsi[i] < 30 && d.c[i] < d.bbLo[i] && vniMap.get(d.t[i]) < -3,
  "6 Pha dinh 20 phien + KL>=1,5x (doi chung, da biet xau)": (d, i) => d.c[i] > d.hh20p[i] && d.v[i] >= 1.5 * d.vTB[i],
};

// ---------- sinh lenh
const lenh = []; // { kieu, ma, t, ok, y, r3, r5 }
const nenDe = {}; // du lieu theo ma
const tt = {}; // nen thi truong: ngay vao -> {3:[sum,n],5:[sum,n]} trung binh deu cac ma thanh khoan
for (const h of KY_HAN) tt[h] = new Map();
for (const [ma, ds] of Object.entries(nen)) {
  const n = ds.length;
  if (n < 120) continue;
  const o = ds.map((x) => x.o), h = ds.map((x) => x.h), l = ds.map((x) => x.l), c = ds.map((x) => x.c), v = ds.map((x) => x.v), t = ds.map((x) => x.t);
  const ma20 = sma(c, 20), ma50 = sma(c, 50), vTB = sma(v, 20);
  const sd = c.map((_, i) => { if (i < 19) return NaN; let m = ma20[i], s = 0; for (let j = i - 19; j <= i; j++) s += (c[j] - m) ** 2; return Math.sqrt(s / 20); });
  const hh9 = rollMax(h, 9), ll9 = rollMin(l, 9), hh26 = rollMax(h, 26), ll26 = rollMin(l, 26), hh20 = rollMax(h, 20);
  const hh20p = hh20.map((_, i) => (i ? hh20[i - 1] : NaN)); // dinh 20 phien truoc phien nay
  const d = { t, h, l, c, v, ma20, ma50, vTB, rsi: rsi14(c), bbLo: ma20.map((m, i) => m - 2 * sd[i]), tenkan: hh9.map((x, i) => (x + ll9[i]) / 2), kijun: hh26.map((x, i) => (x + ll26[i]) / 2), hh20, hh20p };
  const cl = dsChatLuong(ma);
  let ptr = -1;
  const cuoi = {};
  for (let i = 60; i < n - 6; i++) {
    if (t[i] < TU) continue;
    while (ptr + 1 < cl.length && cl[ptr + 1].pub <= t[i]) ptr++;
    const ok = ptr >= 0 ? cl[ptr].ok : null; // null = chua co bao cao 4 quy nao duoc cong bo
    const gt = (c[i] * v[i]) / 1e6; // gia tri phien (ty) - dung TB20 ben duoi
    let tb = 0;
    for (let j = i - 19; j <= i; j++) tb += c[j] * v[j];
    if (tb / 20 / 1e6 < THANH_KHOAN) continue;
    const vao = o[i + 1];
    if (!(vao > 0)) continue;
    const r = {};
    for (const hz of KY_HAN) {
      r[hz] = (c[i + hz] / vao - 1) * 100 - PHI;
      const a = tt[hz].get(t[i + 1]) ?? [0, 0];
      a[0] += (c[i + hz] / vao - 1) * 100 - PHI;
      a[1]++;
      tt[hz].set(t[i + 1], a);
    }
    for (const [ten, dk] of Object.entries(KIEU)) {
      try {
        if (!dk(d, i)) continue;
      } catch { continue; }
      if (i - (cuoi[ten] ?? -99) < 5) continue; // 1 lenh / 5 phien / ma / kieu
      cuoi[ten] = i;
      lenh.push({ kieu: ten, ma, t: t[i], tv: t[i + 1], ok, lq: tb / 20 / 1e6, r3: r[3], r5: r[5] });
    }
  }
}
const tb = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const p = (x, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : "—");
for (const e of lenh) {
  for (const hz of KY_HAN) { const m = tt[hz].get(e.tv); e["v" + hz] = m ? e["r" + hz] - m[0] / m[1] : NaN; }
}
// t-stat theo thang cho excess
function tThang(a, k) {
  const m = new Map();
  for (const x of a) if (Number.isFinite(x[k])) { const g = x.tv.slice(0, 7); (m.get(g) ?? m.set(g, []).get(g)).push(x[k]); }
  const v = [...m.values()].map(tb);
  if (v.length < 6) return NaN;
  const mu = tb(v), sd = Math.sqrt(v.reduce((s, x) => s + (x - mu) ** 2, 0) / (v.length - 1));
  return mu / (sd / Math.sqrt(v.length));
}
const soNgay = new Set([...tt[3].keys()]).size;
const dong = (ten, a) => {
  if (a.length < 25) return console.log("  ", ten.padEnd(22), String(a.length).padStart(5), "(it mau)");
  const nam = ["2022", "2023", "2024", "2025", "2026"].map((y) => { const b = a.filter((x) => x.tv.startsWith(y)); return b.length >= 10 ? p(tb(b.map((x) => x.v3)), 1) : "·"; });
  console.log("  ", ten.padEnd(22), String(a.length).padStart(5), (p(a.length / soNgay, 2) + "/ng").padStart(8), "| T+3: lai", p(tb(a.map((x) => x.r3))).padStart(6), "vuot", p(tb(a.map((x) => x.v3))).padStart(6), "thang", (p((a.filter((x) => x.r3 > 0).length / a.length) * 100, 0) + "%").padStart(4), "t", p(tThang(a, "v3"), 1).padStart(5), "| T+5: lai", p(tb(a.map((x) => x.r5))).padStart(6), "vuot", p(tb(a.map((x) => x.v5))).padStart(6), "| vuot T+3 theo nam 22/23/24/25/26:", nam.join(" "));
};
console.log(`Giai doan ${TU} -> nay, thanh khoan TB20 >= ${THANH_KHOAN} ty, phi+truot ${PHI}%/vong, ${soNgay} ngay vao lenh. "vuot" = tru lai TB deu cung ngay.`);
let coCL = 0, tong = 0;
for (const e of lenh) { tong++; if (e.ok != null) coCL++; }
console.log(`Lenh co thong tin chat luong: ${coCL}/${tong}\n`);
for (const ten of Object.keys(KIEU)) {
  const a = lenh.filter((x) => x.kieu === ten);
  console.log(ten);
  dong("Tat ca ma", a);
  dong("Chi ma DAT yeu cau", a.filter((x) => x.ok === true));
  dong("Ma KHONG dat", a.filter((x) => x.ok === false));
}


// ---------- KIEM TRA DO BEN cua kieu 4a (giam 3 phien lien tiep tren MA50, tong giam >= 4%)
const A = lenh.filter((x) => x.kieu.startsWith("4a"));
console.log("\n=== Do ben kieu 4a theo thanh khoan (TB20) ===");
for (const [ten, lo, hi] of [["5-10 ty", 5, 10], ["10-30 ty", 10, 30], ["30-100 ty", 30, 100], [">=100 ty", 100, 1e9]]) dong(ten, A.filter((x) => x.lq >= lo && x.lq < hi));
console.log("\n=== Theo nua nam ===");
for (const [ten, a, b] of [["2022H2", "2022-07", "2023-01"], ["2023H1", "2023-01", "2023-07"], ["2023H2", "2023-07", "2024-01"], ["2024H1", "2024-01", "2024-07"], ["2024H2", "2024-07", "2025-01"], ["2025H1", "2025-01", "2025-07"], ["2025H2", "2025-07", "2026-01"], ["2026H1", "2026-01", "2026-07"], ["2026 T7-nay", "2026-07", "2027-01"]]) dong(ten, A.filter((x) => x.tv >= a && x.tv < b));
console.log("\n=== Nhay cam voi chi phi (kieu 4a, tat ca ma): lai TB T+3 sau phi ===");
const tho = tb(A.map((x) => x.r3)) + PHI;
for (const ph of [0.2, 0.4, 0.6, 0.8, 1.0]) console.log(`  phi+truot ${ph}%/vong: ${p(tho - ph)}%/lenh`);
const hang = new Map();
for (const x of A) hang.set(x.tv, (hang.get(x.tv) ?? 0) + 1);
console.log("\nSo lenh/ngay (4a): TB", p(tb([...hang.values()])), "; ngay co >=5 lenh:", [...hang.values()].filter((v) => v >= 5).length, "/", soNgay);
