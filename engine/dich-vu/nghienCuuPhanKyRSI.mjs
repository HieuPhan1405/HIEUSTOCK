// NGHIEN CUU (2026-10-16): RSI PHAN KY (ngay, tuan) co giup canh dao chieu bat day khong? (Hieu muon dua chi bao len web.)
// Tin hieu TANG: hai day pivot +-k nen, day sau thap hon nhung RSI cao hon, RSI day truoc <= 40 (lib/phanKyRSI.js). Chi xac nhan sau k nen (khong nhin truoc).
// Vao MO CUA nen sau nen xac nhan, giu H nen (ngay: 5/10/20; tuan: 2/4/8), phi 0,4% / vong. SO SANH voi (a) trung binh moi nen cua cung tap ma cung ky (baseline), (b) cung chi so cung ngay.
// Khoang tin cay: bootstrap theo cum thang. Chay: node engine/dich-vu/nghienCuuPhanKyRSI.mjs [k]
import { docJson } from "./backtestChung.mjs";
import { rsi } from "../../lib/chiBaoPhu.js";
import { phanKyRSI, gopNenTuan } from "../../lib/phanKyRSI.js";

const K = Number(process.argv[2]) || 3;
const nen = docJson("nen_dai.json");
const PHI = 0.4;
const tb = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const f = (v, d = 2) => (Number.isFinite(v) ? v.toFixed(d) : "-");

function chay(khung, H, thamSo, loai = "tang") {
  const sk = [], base = [];
  for (const [ma, ds0] of Object.entries(nen)) {
    const ds = khung === "W" ? gopNenTuan(ds0) : ds0;
    if (ds.length < 150) continue;
    // thanh khoan toi thieu: bo ma qua mong (TB 40 nen gia * KL < 2 ty o khung ngay) - de don gian chi bo ma gia < 2 (nghin dong) hoac KL TB < 50k
    const kl = tb(ds.slice(-250).map((b) => b.v || 0));
    if (kl < 50000) continue;
    const r = rsi(ds.map((b) => b.c), 14);
    const ev = phanKyRSI(ds, r, { k: K, ...thamSo }).filter((e) => e.loai === loai);
    const ret = (vao) => (vao + H < ds.length ? ((ds[vao + H - 1].c / ds[vao].o) - 1) * 100 - PHI : null);
    // baseline: moi nen (vao mo cua nen i) - lay mot nua so nen de nhe, khong lech
    for (let i = 20; i + H + 1 < ds.length; i += 1) { const x = ret(i); if (x != null) base.push({ t: ds[i].t, ret: x }); }
    const gap = new Set();
    for (const e of ev) {
      const vao = e.xacNhan + 1; if (vao + H >= ds.length || gap.has(e.xacNhan)) continue; gap.add(e.xacNhan);
      const x = ret(vao); if (x != null) sk.push({ ma, t: ds[vao].t, ret: x, e });
    }
  }
  return { sk, base };
}
function ci(a, b) { // chenh trung binh a - b, bootstrap theo cum thang
  const th = [...new Set(a.map((x) => x.t.slice(0, 7)))];
  const ma = new Map(), mb = new Map();
  for (const x of a) { const k = x.t.slice(0, 7); (ma.get(k) || ma.set(k, []).get(k)).push(x.ret); }
  for (const x of b) { const k = x.t.slice(0, 7); (mb.get(k) || mb.set(k, []).get(k)).push(x.ret); }
  let seed = 7; const rd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const bs = [];
  for (let it = 0; it < 1000; it++) {
    let sa = 0, na = 0, sb = 0, nb = 0;
    for (let j = 0; j < th.length; j++) {
      const k = th[Math.floor(rd() * th.length)];
      for (const v of ma.get(k) || []) { sa += v; na++; }
      for (const v of mb.get(k) || []) { sb += v; nb++; }
    }
    if (na && nb) bs.push(sa / na - sb / nb);
  }
  bs.sort((x, y) => x - y);
  return `[${f(bs[Math.floor(bs.length * 0.025)])} .. ${f(bs[Math.floor(bs.length * 0.975)])}]`;
}
const mo = (a) => `n=${String(a.length).padStart(5)} TB ${f(tb(a.map((x) => x.ret))).padStart(6)}% thang ${f((100 * a.filter((x) => x.ret > 0).length) / (a.length || 1), 0)}%`;

const CAU_HINH = [
  ["Mac dinh (RSI day truoc <= 40)", {}],
  ["RSI day truoc <= 30 (qua ban)", { rsiDay: 30 }],
  ["RSI day truoc <= 35, chenh RSI >= 5", { rsiDay: 35, chenhRSI: 5 }],
  ["Khong gioi han RSI day (<= 100)", { rsiDay: 100 }],
];
console.log(`K = ${K} (pivot +-${K} nen). Phi ${PHI}%/vong. Vao mo cua nen sau nen xac nhan.\n`);
for (const khung of ["D", "W"]) {
  for (const H of khung === "D" ? [5, 10, 20] : [2, 4, 8]) {
    console.log(`=== KHUNG ${khung === "D" ? "NGAY" : "TUAN"}, giu ${H} nen ===`);
    for (const [ten, ts] of CAU_HINH) {
      const { sk, base } = chay(khung, H, ts, "tang");
      if (!sk.length) { console.log(`  ${ten}: khong co tin hieu`); continue; }
      const kp = sk.filter((x) => x.t < "2022-05-01"), kc = sk.filter((x) => x.t >= "2022-05-01");
      const bKP = base.filter((x) => x.t < "2022-05-01"), bKC = base.filter((x) => x.t >= "2022-05-01");
      console.log(`  ${ten.padEnd(40)} ${mo(sk)} | nen: ${mo(base)} | chenh ${f(tb(sk.map((x) => x.ret)) - tb(base.map((x) => x.ret)))}% CI ${ci(sk, base)}`);
      console.log(`  ${"".padEnd(40)} truoc 05/2022: ${mo(kp)} (nen ${f(tb(bKP.map((x) => x.ret)))}%) | tu 05/2022: ${mo(kc)} (nen ${f(tb(bKC.map((x) => x.ret)))}%)`);
    }
  }
}
// canh bao dinh (phan ky giam) de tham khao
console.log("\n=== PHAN KY GIAM (canh dinh), mac dinh, khung NGAY, giu 5/10/20 nen - mong doi am neu co gia tri ===");
for (const H of [5, 10, 20]) {
  const { sk, base } = chay("D", H, {}, "giam");
  console.log(`  H=${H}: ${mo(sk)} | nen: ${mo(base)} | chenh ${f(tb(sk.map((x) => x.ret)) - tb(base.map((x) => x.ret)))}% CI ${ci(sk, base)}`);
}
process.exit(0);
