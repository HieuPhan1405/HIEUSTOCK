// NGHIEN CUU NHIP HOI PHUC THEO NGANH (Hieu 2026-10-21: "lam sao bat duoc nhung lenh phuc hoi nhu thep, bds vua qua; mua bay gio co the la dinh phuc hoi ngan han, de bi trap").
// Chi so nganh = trung binh cong loi suat ngay cua cac ma trong nganh (engine/danh-sach/nganh.js, GTGD TB20 >= 3 ty). SU KIEN NHIP HOI tai ngay t: truoc do chi so nganh GIAM >= 10% (tu dinh 30 ngay den day), day nam trong 10 ngay gan nhat,
// va tu day chi so da HOI >= {8, 12, 16}% (lan dau vuot nguong; cach nhau >= 20 ngay). Do chi so nganh SAU ngay t: lai 5 / 10 / 20 ngay, ty le "TRAP" (quay lai thung day nhip hoi trong 20 ngay), ty le HOI PHUC THAT
// (vuot dinh truoc khi giam trong 40 ngay), sut sau khi vao (thap nhat trong 10 ngay), roi kiem cac dac trung co phan biet duoc trap / tiep dien khong (do rong, KL nganh, vi tri so voi MA50, toc do hoi, VN-Index) va cach vao CHO CHINH nhip.
// Chi DOC cache nen_dai.json + vnindex_dai.json. CACH CHAY: node engine/dich-vu/nghienCuuHoiPhucNganh.mjs [--hien-tai]
import { docJson } from "./backtestChung.mjs";
import { NGANH } from "../danh-sach/nganh.js";

const cache = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");
const ngay = vni.map((b) => b.t);
const viTri = new Map(ngay.map((d, i) => [d, i]));
const N = ngay.length;
const sma = (a, n) => a.map((_, i) => (i >= n - 1 ? a.slice(i - n + 1, i + 1).reduce((s, x) => s + x, 0) / n : null));

const NG = [];
for (const [ten, tap] of NGANH) {
  const ma = [...tap].filter((m) => cache[m] && cache[m].length > 300);
  if (ma.length < 6) continue;
  const ret = Array.from({ length: N }, () => ({ s: 0, n: 0, tren20: 0, n20: 0, klS: 0, klN: 0 }));
  for (const m of ma) {
    const b = cache[m];
    const c = b.map((x) => x.c), v = b.map((x) => x.v);
    const sm20 = sma(c, 20);
    for (let k = 21; k < b.length; k++) {
      const i = viTri.get(b[k].t);
      if (i == null) continue;
      let gt = 0;
      for (let j = k - 19; j <= k; j++) gt += (c[j] * v[j]) / 1e6;
      if (gt / 20 < 3) continue;
      const r = c[k] / c[k - 1] - 1;
      if (Math.abs(r) > 0.15) continue;
      ret[i].s += r; ret[i].n++;
      if (sm20[k] != null) { ret[i].n20++; if (c[k] > sm20[k]) ret[i].tren20++; }
      const tb20 = v.slice(k - 20, k).reduce((s, x) => s + x, 0) / 20;
      if (tb20 > 0) { ret[i].klS += v[k] / tb20; ret[i].klN++; }
    }
  }
  const I = new Array(N).fill(null); let cur = 100, bd = false;
  const rongHang = new Array(N).fill(null), klHang = new Array(N).fill(null);
  for (let i = 0; i < N; i++) {
    if (ret[i].n >= Math.min(5, ma.length - 1)) { cur *= 1 + ret[i].s / ret[i].n; bd = true; rongHang[i] = ret[i].n20 ? ret[i].tren20 / ret[i].n20 : null; klHang[i] = ret[i].klN ? ret[i].klS / ret[i].klN : null; }
    I[i] = bd ? cur : null;
  }
  NG.push({ ten, I, rongHang, klHang, soMa: ma.length });
}
const vc = vni.map((b) => b.c), vMA50 = sma(vc, 50);

const NGUONG = [8, 12, 16];
const SK = [];
for (const ng of NG) {
  const { I } = ng;
  const MA50 = sma(I.map((x) => x ?? 0), 50);
  for (const nguong of NGUONG) {
    let ult = -999;
    for (let t = 80; t < N - 41; t++) {
      if (I[t] == null || t - ult < 20) continue;
      // day trong 10 ngay gan nhat
      let k = t, mn = I[t];
      for (let j = t - 10; j <= t; j++) if (I[j] < mn) { mn = I[j]; k = j; }
      if (t - k < 3 || I[t] / I[k] - 1 < nguong / 100 || I[t - 1] / I[k] - 1 >= nguong / 100) continue;
      let dinh = 0; for (let j = Math.max(0, k - 30); j <= k; j++) dinh = Math.max(dinh, I[j]);
      if (I[k] / dinh - 1 > -0.10 || I[t] >= dinh) continue;
      ult = t;
      let phai = null, pOk = null; // trap: quay thung day trong 20 ngay; hoi phuc that: vuot dinh trong 40 ngay (truoc khi thung day)
      for (let j = t + 1; j <= t + 40; j++) { if (I[j] < I[k]) { phai = j; break; } if (I[j] > dinh) { pOk = j; break; } }
      let sut = 0; for (let j = t + 1; j <= t + 10; j++) sut = Math.min(sut, I[j] / I[t] - 1);
      let dinhSau = I[t], jd = t; for (let j = t + 1; j <= t + 10; j++) if (I[j] > dinhSau) { dinhSau = I[j]; jd = j; }
      SK.push({
        ng: ng.ten, t, ngay: ngay[t], nguong, ky: ngay[t] < "2019-01-01" ? 0 : ngay[t] < "2022-05-01" ? 1 : 2,
        r5: (I[t + 5] / I[t] - 1) * 100, r10: (I[t + 10] / I[t] - 1) * 100, r20: (I[t + 20] / I[t] - 1) * 100,
        trap: phai != null && phai <= t + 20, ok: pOk != null, sut10: sut * 100,
        duoiMA50: MA50[t] != null && I[t] < MA50[t], rong: ng.rongHang[t], kl: ng.klHang[t], tocDo: t - k, hoiPct: (I[t] / I[k] - 1) * 100,
        vniTrenMA50: vMA50[t] != null && vc[t] > vMA50[t], I, tt: t, kk: k, dinh,
      });
    }
  }
}
const tb = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const f = (x, d = 1) => (Number.isFinite(x) ? x.toFixed(d) : "-");
const pct = (a, g) => (a.length ? (a.filter(g).length / a.length) * 100 : NaN);
const DONG = (ten, a) => console.log(`  ${ten.padEnd(46)} n=${String(a.length).padStart(4)} | r5 ${f(tb(a.map((x) => x.r5))).padStart(5)}% r10 ${f(tb(a.map((x) => x.r10))).padStart(5)}% r20 ${f(tb(a.map((x) => x.r20))).padStart(5)}% | TRAP ${f(pct(a, (x) => x.trap), 0).padStart(3)}% | HOI PHUC THAT ${f(pct(a, (x) => x.ok), 0).padStart(3)}% | sut10 TB ${f(tb(a.map((x) => x.sut10))).padStart(5)}%`);
console.log(`${NG.length} nganh, ${SK.length} su kien nhip hoi (cach nhau >= 20 ngay / nganh / nguong)\n`);
for (const ng of NGUONG) {
  const a = SK.filter((x) => x.nguong === ng);
  console.log(`=== HOI >= ${ng}% tu day (sau khi giam >= 10%) ===`);
  DONG("Tat ca", a);
  DONG("Con DUOI MA50 chi so nganh (hoi ky thuat)", a.filter((x) => x.duoiMA50));
  DONG("Da TREN MA50", a.filter((x) => !x.duoiMA50));
  DONG("Hoi NHANH (day cach <= 5 ngay)", a.filter((x) => x.tocDo <= 5));
  DONG("Hoi CHAM (day cach > 5 ngay)", a.filter((x) => x.tocDo > 5));
  const md = (k) => { const v = a.map((x) => x[k]).filter((x) => x != null).sort((p, q) => p - q); return v[Math.floor(v.length / 2)]; };
  DONG(`Do rong (ma tren MA20) CAO (> ${f(md("rong") * 100, 0)}%)`, a.filter((x) => x.rong != null && x.rong > md("rong")));
  DONG(`Do rong THAP (<= ${f(md("rong") * 100, 0)}%)`, a.filter((x) => x.rong != null && x.rong <= md("rong")));
  DONG(`KL nganh CAO (> ${f(md("kl"), 2)}x TB20)`, a.filter((x) => x.kl != null && x.kl > md("kl")));
  DONG(`KL nganh THAP`, a.filter((x) => x.kl != null && x.kl <= md("kl")));
  DONG("VN-Index tren MA50", a.filter((x) => x.vniTrenMA50));
  DONG("VN-Index duoi MA50", a.filter((x) => !x.vniTrenMA50));
  console.log(`  theo giai doan: ${[0, 1, 2].map((k) => { const z = a.filter((x) => x.ky === k); return `${["<2019", "2019-22.4", "22.5+"][k]}: r10 ${f(tb(z.map((x) => x.r10)))}% trap ${f(pct(z, (x) => x.trap), 0)}% (n ${z.length})`; }).join(" | ")}\n`);
}

// ---- CACH VAO: mua ngay t vs cho nhip chinh nong ----
console.log("=== CACH VAO (hoi >= 12%): mua ngay t vs cho chinh roi vao ===");
const A = SK.filter((x) => x.nguong === 12);
const cho = (x, sau, giuTren) => {
  // trong 10 ngay sau t: ngay dau tien chi so <= dinh sau t x (1 - sau%) VA van tren giuTren% quang hoi (day -> dinh sau t) -> vao tai dong cua
  const { I, tt, kk } = x;
  let dinhSau = I[tt];
  for (let j = tt + 1; j <= tt + 10; j++) {
    dinhSau = Math.max(dinhSau, I[j]);
    if (I[j] <= dinhSau * (1 - sau / 100)) {
      if (I[j] < I[kk] + (giuTren / 100) * (dinhSau - I[kk])) return null; // chinh qua sau -> bo
      return { r10: (I[j + 10] / I[j] - 1) * 100, r20: (I[j + 20] / I[j] - 1) * 100, trap: (() => { for (let q = j + 1; q <= j + 20; q++) if (I[q] < I[kk]) return true; return false; })() };
    }
  }
  return null;
};
DONG("Mua NGAY ngay t (co so)", A);
for (const [sau, giu] of [[3, 50], [4, 50], [5, 60], [6, 50]]) {
  const r = A.map((x) => cho(x, sau, giu)).filter((x) => x);
  console.log(`  Cho chinh -${sau}% (giu >= ${giu}% nhip hoi) roi vao: vao duoc ${f((r.length / A.length) * 100, 0)}% su kien (${r.length}) | r10 ${f(tb(r.map((x) => x.r10)))}% r20 ${f(tb(r.map((x) => x.r20)))}% | TRAP sau khi vao ${f(pct(r, (x) => x.trap), 0)}%`);
}
if (process.argv.includes("--hien-tai")) {
  console.log("\n=== HIEN TAI: chi so nganh (ngay cuoi) ===");
  const cuoi = N - 1;
  console.log("  ngay du lieu cuoi:", ngay[cuoi]);
  for (const ng of NG.filter((x) => ["Thep", "Bat dong san", "BDS Khu cong nghiep", "Chung khoan", "Ngan hang", "Dau khi", "Xay dung - Ha tang", "Vat lieu xay dung"].includes(x.ten))) {
    const I = ng.I; let day = cuoi, mn = I[cuoi];
    for (let j = cuoi - 25; j <= cuoi; j++) if (I[j] < mn) { mn = I[j]; day = j; }
    let dinh = 0; for (let j = Math.max(0, day - 30); j <= day; j++) dinh = Math.max(dinh, I[j]);
    const m50 = sma(I.map((x) => x ?? 0), 50)[cuoi];
    console.log(`  ${ng.ten.padEnd(24)} day ${ngay[day]} | giam truoc day ${f((mn / dinh - 1) * 100)}% | hoi tu day ${f((I[cuoi] / mn - 1) * 100)}% | so voi MA50 ${f((I[cuoi] / m50 - 1) * 100)}% | 5 ngay ${f((I[cuoi] / I[cuoi - 5] - 1) * 100)}% | rong MA20 ${f((ng.rongHang[cuoi] ?? NaN) * 100, 0)}% | KL ${f(ng.klHang[cuoi] ?? NaN, 2)}x`);
  }
}
