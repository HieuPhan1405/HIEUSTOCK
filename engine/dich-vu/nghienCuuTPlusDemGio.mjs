// NGHIEN CUU T+ THEO TAI LIEU (27/10/2026): cac kieu dao chieu ngan han da biet tren the gioi (IBS - Connors, RSI(2) - Connors, giam lien tiep, giam sau 1 ngay manh, doi chung dong luong) +
// TACH LOI NHUAN QUA DEM (dong cua -> mo cua) va TRONG NGAY (mo cua -> dong cua) de biet loi the nam o dau, roi thu cac cach VAO / RA phu hop T+2,5 cua Viet Nam:
//   E1 = mua MO CUA phien sau tin hieu (cach cu), E2 = mua o gia DONG CUA phien tin hieu (lenh ATC; tin hieu doc luc ~14h30 nen co chenh lech nho voi dong cua that - xem kiem tra voi nen 15 phut ben duoi).
//   Thoat: X2 = dong cua ngay T+2 (chieu T+2 co hang ve), X3 = dong cua T+3. Phi + truot 0,4%/vong (thu them 0,6%).
// "vuot" = tru lai trung binh deu cua moi ma thanh khoan cung ngay vao lenh / cung ky han. Giai doan 2022-04 -> nay, thanh khoan TB20 >= 5 ty, 1 lenh / 5 phien / ma / kieu.
// Chay: node engine/dich-vu/nghienCuuTPlusDemGio.mjs
import { readFileSync } from "node:fs";

const nen = JSON.parse(readFileSync(new URL("../output/nen_dai.json", import.meta.url), "utf8"));
const TU = "2022-04-01";
const THANH_KHOAN = 5;
const PHI = 0.4;

const sma = (a, n) => { const r = new Array(a.length).fill(NaN); let s = 0; for (let i = 0; i < a.length; i++) { s += a[i]; if (i >= n) s -= a[i - n]; if (i >= n - 1) r[i] = s / n; } return r; };
function rsi(c, n) {
  const r = new Array(c.length).fill(NaN);
  let g = 0, l = 0;
  for (let i = 1; i < c.length; i++) {
    const d = c[i] - c[i - 1], up = Math.max(d, 0), dn = Math.max(-d, 0);
    if (i <= n) { g += up / n; l += dn / n; } else { g = (g * (n - 1) + up) / n; l = (l * (n - 1) + dn) / n; }
    if (i >= n) r[i] = l === 0 ? 100 : 100 - 100 / (1 + g / l);
  }
  return r;
}

const KIEU = {
  "A IBS<0,2 + phien giam (Connors)": (d, i) => d.ibs[i] < 0.2 && d.c[i] < d.c[i - 1],
  "B IBS<0,1 + phien giam >=3%": (d, i) => d.ibs[i] < 0.1 && d.c[i] / d.c[i - 1] - 1 <= -0.03,
  "C RSI(2)<10 + gia>MA100 (Connors)": (d, i) => d.rsi2[i] < 10 && d.c[i] > d.ma100[i],
  "D Giam 3 phien lien tiep tren MA50, tong giam>=4%": (d, i) => d.c[i] > d.ma50[i] && d.c[i] < d.c[i - 1] && d.c[i - 1] < d.c[i - 2] && d.c[i - 2] < d.c[i - 3] && d.c[i] / d.c[i - 3] - 1 <= -0.04,
  "E Giam >=5% 1 phien (dao chieu sau cu soc), thanh khoan >=1,5x": (d, i) => d.c[i] / d.c[i - 1] - 1 <= -0.05 && d.v[i] >= 1.5 * d.vTB[i],
  "F Giam >=5% + dong cua o 25% tren bien do nen (rut chan)": (d, i) => d.c[i] / d.c[i - 1] - 1 <= -0.03 && d.ibs[i] > 0.75,
  "G (doi chung) IBS>0,8 + phien tang": (d, i) => d.ibs[i] > 0.8 && d.c[i] > d.c[i - 1],
  "H (doi chung) tang >=5% + KL>=1,5x": (d, i) => d.c[i] / d.c[i - 1] - 1 >= 0.05 && d.v[i] >= 1.5 * d.vTB[i],
};
const CACH = { "E1 mua mo cua i+1": 1, "E2 mua dong cua i (ATC)": 0 }; // chi so phien vao
const THOAT = { "ra dong cua T+2": 2, "ra dong cua T+3": 3 };

// gia vao / gia ra theo (cach, thoat) cho phien i: E1: vao o[i+1], phien vao = i+1, ra c[i+1+ (thoat-1)]; chu y "T+2" tinh tu NGAY MUA: E1 mua i+1 -> ra c[i+3]; E2 mua i -> ra c[i+2]
function gia(d, i, cach, tx) {
  const vao = cach === 1 ? d.o[i + 1] : d.c[i];
  const ngayMua = i + cach;
  const ra = d.c[ngayMua + tx];
  return { vao, ra, ngayVao: d.t[ngayMua] };
}

const lenh = [];
const tt = new Map(); // khoa "cach|tx|ngay" -> [sum, n]
for (const [ma, ds] of Object.entries(nen)) {
  const n = ds.length;
  if (n < 150) continue;
  const o = ds.map((x) => x.o), h = ds.map((x) => x.h), l = ds.map((x) => x.l), c = ds.map((x) => x.c), v = ds.map((x) => x.v), t = ds.map((x) => x.t);
  const d = { t, o, h, l, c, v, ibs: ds.map((x) => (x.h > x.l ? (x.c - x.l) / (x.h - x.l) : 0.5)), rsi2: rsi(c, 2), ma50: sma(c, 50), ma100: sma(c, 100), vTB: sma(v, 20) };
  const cuoi = {};
  for (let i = 100; i < n - 6; i++) {
    if (t[i] < TU) continue;
    let tb = 0;
    for (let j = i - 19; j <= i; j++) tb += c[j] * v[j];
    if (tb / 20 / 1e6 < THANH_KHOAN) continue;
    if (!(o[i + 1] > 0)) continue;
    // baseline thi truong (moi ngay vao lenh)
    for (const [ck, cach] of Object.entries(CACH)) {
      for (const [tk, tx] of Object.entries(THOAT)) {
        const g = gia(d, i, cach, tx);
        if (!(g.vao > 0) || !(g.ra > 0)) continue;
        const key = `${ck}|${tk}|${g.ngayVao}`;
        const a = tt.get(key) ?? [0, 0];
        a[0] += (g.ra / g.vao - 1) * 100 - PHI;
        a[1]++;
        tt.set(key, a);
      }
    }
    for (const [ten, dk] of Object.entries(KIEU)) {
      if (!dk(d, i)) continue;
      if (i - (cuoi[ten] ?? -99) < 5) continue;
      cuoi[ten] = i;
      const r = {};
      for (const [ck, cach] of Object.entries(CACH)) for (const [tk, tx] of Object.entries(THOAT)) {
        const g = gia(d, i, cach, tx);
        r[`${ck}|${tk}`] = { ret: (g.ra / g.vao - 1) * 100 - PHI, ngay: g.ngayVao };
      }
      // tach qua dem / trong ngay (tu dong cua i -> mo cua i+1 -> dong cua i+1)
      lenh.push({ ten, ma, t: t[i], r, dem: (o[i + 1] / c[i] - 1) * 100, trongNgay: (c[i + 1] / o[i + 1] - 1) * 100 });
    }
  }
}
const tb = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const p = (x, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : "—");
function vuot(e, ck, tk) {
  const x = e.r[`${ck}|${tk}`];
  const m = tt.get(`${ck}|${tk}|${x.ngay}`);
  return m ? x.ret - m[0] / m[1] : NaN;
}
function tThang(a, f) {
  const m = new Map();
  for (const e of a) { const v = f(e); if (Number.isFinite(v)) { const g = e.t.slice(0, 7); (m.get(g) ?? m.set(g, []).get(g)).push(v); } }
  const v = [...m.values()].map(tb);
  if (v.length < 6) return NaN;
  const mu = tb(v), sd = Math.sqrt(v.reduce((s, x) => s + (x - mu) ** 2, 0) / (v.length - 1));
  return mu / (sd / Math.sqrt(v.length));
}
const nam = (a, f) => ["2022", "2023", "2024", "2025", "2026"].map((y) => { const b = a.filter((e) => e.t.startsWith(y)); return b.length >= 15 ? p(tb(b.map(f)), 1) : "·"; }).join(" ");

console.log(`T+ theo tai lieu, ${TU} -> nay, thanh khoan >= ${THANH_KHOAN} ty, phi+truot ${PHI}%/vong. lai = sau phi; vuot = tru TB deu cung ngay vao/cung ky han.\n`);
// 1) tach qua dem / trong ngay (khong phi)
console.log("TACH LOI NHUAN (khong phi): qua dem (dong cua i -> mo cua i+1) | trong ngay i+1 (mo -> dong cua)");
for (const ten of Object.keys(KIEU)) {
  const a = lenh.filter((e) => e.ten === ten);
  if (a.length < 30) continue;
  console.log("  ", ten.padEnd(66), String(a.length).padStart(5), "| qua dem", p(tb(a.map((e) => e.dem))).padStart(6), "| trong ngay i+1", p(tb(a.map((e) => e.trongNgay))).padStart(6));
}
// 2) cac cach vao/ra
for (const ten of Object.keys(KIEU)) {
  const a = lenh.filter((e) => e.ten === ten);
  console.log(`\n${ten}  (n ${a.length}, ${p(a.length / new Set(a.map((e) => e.t)).size, 1)} lenh/ngay co tin hieu)`);
  for (const ck of Object.keys(CACH)) for (const tk of Object.keys(THOAT)) {
    const k = `${ck}|${tk}`;
    const th = (e) => vuot(e, ck, tk);
    console.log("  ", `${ck} / ${tk}`.padEnd(44), "lai", p(tb(a.map((e) => e.r[k].ret))).padStart(6), "vuot", p(tb(a.map(th))).padStart(6), "thang", (p((a.filter((e) => e.r[k].ret > 0).length / a.length) * 100, 0) + "%").padStart(4), "t", p(tThang(a, th), 1).padStart(5), "| vuot theo nam 22-26:", nam(a, th));
  }
}
