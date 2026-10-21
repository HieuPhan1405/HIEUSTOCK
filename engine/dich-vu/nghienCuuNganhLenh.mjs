// LENH MUA CUA ENGINE THEO TRANG THAI NGANH LUC VAO (Hieu 2026-10-21: bat nhip phuc hoi nganh ma khong bi trap). Voi moi lenh Mua thuong (ATC ngay tin hieu + T+2, 30/30 + chay, phi 0,4%) xem NGANH cua ma luc do:
//  - tren / duoi MA50 cua chi so nganh (trung binh cong loi suat cac ma trong nganh, nhu nghienCuuHoiPhucNganh.mjs);
//  - do rong nganh (% ma tren MA20) va khoi luong nganh (KL / TB20 trung binh);
//  - dang trong NHIP HOI (chi so nganh hoi >= 8% tu day 10 ngay sau khi giam >= 10%) hay khong.
// So sanh lai TB / PF cua cac nhom de biet "ma trong nganh dang phuc hoi that" co tot hon "hoi ky thuat" khong. CACH CHAY: node engine/dich-vu/nghienCuuNganhLenh.mjs
import { docJson, chayEngine, thongKe, tb, f, kyOf, TEN_KY } from "./backtestChung.mjs";
import { mo } from "./moBaoVeLai.mjs";
import { NGANH, nganhCuaMa } from "../danh-sach/nganh.js";

const cache = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");
const ngay = vni.map((b) => b.t);
const viTri = new Map(ngay.map((d, i) => [d, i]));
const N = ngay.length;
const sma = (a, n) => a.map((_, i) => (i >= n - 1 ? a.slice(i - n + 1, i + 1).reduce((s, x) => s + x, 0) / n : null));

const TT = {}; // nganh -> { I, MA50, rong, kl }
for (const [ten, tap] of NGANH) {
  const ma = [...tap].filter((m) => cache[m] && cache[m].length > 300);
  if (ma.length < 6) continue;
  const ret = Array.from({ length: N }, () => ({ s: 0, n: 0, t20: 0, n20: 0, kS: 0, kN: 0 }));
  for (const m of ma) {
    const b = cache[m];
    const c = b.map((x) => x.c), v = b.map((x) => x.v), s20 = sma(c, 20);
    for (let k = 21; k < b.length; k++) {
      const i = viTri.get(b[k].t);
      if (i == null) continue;
      let gt = 0;
      for (let j = k - 19; j <= k; j++) gt += (c[j] * v[j]) / 1e6;
      if (gt / 20 < 3) continue;
      const r = c[k] / c[k - 1] - 1;
      if (Math.abs(r) > 0.15) continue;
      ret[i].s += r; ret[i].n++;
      if (s20[k] != null) { ret[i].n20++; if (c[k] > s20[k]) ret[i].t20++; }
      const tb20 = v.slice(k - 20, k).reduce((s, x) => s + x, 0) / 20;
      if (tb20 > 0) { ret[i].kS += v[k] / tb20; ret[i].kN++; }
    }
  }
  const I = new Array(N).fill(null), rong = new Array(N).fill(null), kl = new Array(N).fill(null);
  let cur = 100, bd = false;
  for (let i = 0; i < N; i++) {
    if (ret[i].n >= Math.min(5, ma.length - 1)) { cur *= 1 + ret[i].s / ret[i].n; bd = true; rong[i] = ret[i].n20 ? ret[i].t20 / ret[i].n20 : null; kl[i] = ret[i].kN ? ret[i].kS / ret[i].kN : null; }
    I[i] = bd ? cur : null;
  }
  TT[ten] = { I, MA50: sma(I.map((x) => x ?? 0), 50), rong, kl };
}
// nhip hoi hien dang dien ra tai ngay i: hoi >= 8% tu day 10 ngay sau khi giam >= 10% (tu dinh 30 ngay den day), chua vuot dinh do
function dangHoi(I, i) {
  let k = i, mn = I[i];
  for (let j = i - 10; j <= i; j++) if (I[j] != null && I[j] < mn) { mn = I[j]; k = j; }
  if (i - k < 3 || I[i] / I[k] - 1 < 0.08) return false;
  let dinh = 0;
  for (let j = Math.max(0, k - 30); j <= k; j++) dinh = Math.max(dinh, I[j] ?? 0);
  return I[k] / dinh - 1 <= -0.1 && I[i] < dinh;
}

const { lenh } = chayEngine({ cache, vni });
const ds = lenh.filter((t) => t.loai === 1);
const kq = ds.map((t) => {
  const ng = nganhCuaMa(t.ma);
  const T = ng ? TT[ng] : null;
  const i = viTri.get(t.ngay);
  const r = mo(t, { atc: true });
  if (!T || i == null || !T.I[i] || !r) return { t, r, ok: false };
  return { t, r, ok: true, tren50: T.I[i] > T.MA50[i], rong: T.rong[i], kl: T.kl[i], hoi: dangHoi(T.I, i), ng };
});
const cs = kq.filter((x) => x.ok);
console.log(`${cs.length} lenh Mua thuong co trang thai nganh (tong ${ds.length})\n`);
const DAU = `${"Nhom (trang thai nganh luc vao)".padEnd(62)} ${"n".padStart(5)} ${"laiTB".padStart(6)} ${"thang%".padStart(6)} ${"PF".padStart(5)} | ${TEN_KY.map((k) => k.padStart(8)).join(" ")}`;
console.log(DAU);
const dong = (ten, a) => {
  const r = a.map((x) => x.r.ret);
  const k = thongKe(r.map((x) => ({ ret: x, phien: 1 })));
  const ky = [0, 1, 2].map((j) => f(tb(a.filter((x) => kyOf(x.t.ngay) === j).map((x) => x.r.ret)), 2));
  console.log(`${ten.padEnd(62)} ${String(r.length).padStart(5)} ${f(k.tb).padStart(6)} ${f(k.thang, 0).padStart(6)} ${f(k.pf).padStart(5)} | ${ky.map((v) => v.padStart(8)).join(" ")}`);
};
dong("Tat ca", cs);
dong("Nganh TREN MA50", cs.filter((x) => x.tren50));
dong("Nganh DUOI MA50", cs.filter((x) => !x.tren50));
dong("Do rong nganh > 60% (ma tren MA20)", cs.filter((x) => x.rong != null && x.rong > 0.6));
dong("Do rong nganh <= 40%", cs.filter((x) => x.rong != null && x.rong <= 0.4));
dong("KL nganh > 1,2x TB20", cs.filter((x) => x.kl != null && x.kl > 1.2));
dong("KL nganh < 0,9x TB20", cs.filter((x) => x.kl != null && x.kl < 0.9));
dong("PHUC HOI THAT: tren MA50 + rong > 60% + KL > 1,1x", cs.filter((x) => x.tren50 && x.rong > 0.6 && x.kl > 1.1));
dong("HOI KY THUAT: duoi MA50 + rong <= 50%", cs.filter((x) => !x.tren50 && x.rong != null && x.rong <= 0.5));
dong("Nganh DANG TRONG NHIP HOI (>= 8% tu day, truoc do giam >= 10%)", cs.filter((x) => x.hoi));
dong("  - nhip hoi + tren MA50", cs.filter((x) => x.hoi && x.tren50));
dong("  - nhip hoi + duoi MA50", cs.filter((x) => x.hoi && !x.tren50));
dong("Khong trong nhip hoi", cs.filter((x) => !x.hoi));
