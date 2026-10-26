// RRG (Relative Rotation Graph) theo NGANH so voi VN-Index, tinh tu nen tuan cua ~390 ma (engine/output/nen_dai.json + nganh_map.json).
// Chi so nganh = trung binh DEU loi suat tuan cua cac ma co GTGD TB20 >= 2 ty (loai ma ma thanh khoan thap lam nhieu). RS = chi so nganh / BENCHMARK. Benchmark mac dinh = chi so TRUNG BINH DEU cua cung tap ma (VN-Index tinh theo von hoa nen bi VIC/VHM/ngan hang keo, gan nhu moi nganh deu 'thang' no); them --vni de dung VN-Index.
// RS-Ratio = 100 + 100*(RS/SMA(RS,10 tuan) - 1) lam muot 3 tuan (>100 = manh hon thi truong); RS-Momentum = 100 + 100*(Ratio/Ratio 4 tuan truoc - 1) (>100 = dang tang toc).
// Goc: Leading (ratio>100, mom>100) / Weakening (ratio>100, mom<100) / Lagging (<100,<100) / Improving (ratio<100, mom>100).
// DONG TIEN: GTGD tuan gan nhat / TB 10 tuan truoc (do nong cua dong tien) va "tien rong uoc tinh" = tong(GTGD * (2*dong-thap-cao)/(cao-thap)) 5 phien / tong GTGD 20 phien (thuoc do vi tri dong cua, khong phai mua-ban chu dong).
// Chay: node engine/dich-vu/tinhRRG.mjs [--json]
import { readFileSync, writeFileSync } from "node:fs";

const doc = (f) => JSON.parse(readFileSync(new URL(`../output/${f}`, import.meta.url), "utf8"));
const nen = doc("nen_dai.json");
const nganh = doc("nganh_map.json");
const vni = doc("vnindex_dai.json");
const TUAN = 10, MOM = 4, LAM_MUOT = 3, DUOI = 8;

const tuanCua = (t) => { const d = new Date(t + "T00:00:00Z"); const dow = (d.getUTCDay() + 6) % 7; d.setUTCDate(d.getUTCDate() - dow); return d.toISOString().slice(0, 10); };
const sma = (a, n, i) => { if (i < n - 1) return NaN; let s = 0; for (let j = i - n + 1; j <= i; j++) s += a[j]; return s / n; };

// gom nen tuan: dong cua cuoi tuan
function nenTuan(ds) {
  const m = new Map();
  for (const x of ds) m.set(tuanCua(x.t), x.c);
  return m;
}
const bVni = nenTuan(vni);
const DUNG_VNI = process.argv.includes("--vni");
const cacTuan = [...bVni.keys()].sort().slice(-130);

// thanh khoan TB20 (ty dong) cua tung ma
const ma = {};
for (const [k, ds] of Object.entries(nen)) {
  const n = ds.length;
  if (n < 80 || !nganh[k]) continue;
  let gt = 0;
  for (let j = n - 20; j < n; j++) gt += ds[j].c * ds[j].v;
  if (gt / 20 / 1e6 < 2) continue; // gia nghin dong * KL = nghin dong -> /1e6 = ty
  ma[k] = { ds, tuan: nenTuan(ds) };
}

if (!DUNG_VNI) {
  let idx = 100;
  for (let w = 0; w < cacTuan.length; w++) {
    if (w > 0) {
      const r = [];
      for (const v of Object.values(ma)) { const a = v.tuan.get(cacTuan[w - 1]), b = v.tuan.get(cacTuan[w]); if (a > 0 && b > 0) r.push(b / a - 1); }
      idx *= 1 + r.reduce((s, x) => s + x, 0) / r.length;
    }
    bVni.set(cacTuan[w], idx);
  }
}
const ketQua = [];
const dsNganh = [...new Set(Object.values(nganh))];
for (const ng of dsNganh) {
  const cac = Object.entries(ma).filter(([k]) => nganh[k] === ng);
  if (cac.length < 3) continue;
  // chi so nganh: trung binh deu loi suat tuan
  let idx = 100;
  const chiSo = [];
  for (let w = 0; w < cacTuan.length; w++) {
    if (w > 0) {
      const r = [];
      for (const [, v] of cac) {
        const a = v.tuan.get(cacTuan[w - 1]), b = v.tuan.get(cacTuan[w]);
        if (a > 0 && b > 0) r.push(b / a - 1);
      }
      if (r.length) idx *= 1 + r.reduce((s, x) => s + x, 0) / r.length;
    }
    chiSo.push(idx);
  }
  const rs = chiSo.map((x, w) => x / bVni.get(cacTuan[w]));
  const ratioTho = rs.map((x, w) => 100 + 100 * (x / sma(rs, TUAN, w) - 1));
  const ratio = ratioTho.map((_, w) => sma(ratioTho, LAM_MUOT, w));
  const momTho = ratio.map((x, w) => (w >= MOM ? 100 + 100 * (x / ratio[w - MOM] - 1) : NaN));
  const mom = momTho.map((_, w) => sma(momTho, LAM_MUOT, w));
  const duoi = [];
  for (let w = cacTuan.length - DUOI; w < cacTuan.length; w++) duoi.push({ tuan: cacTuan[w], ratio: +ratio[w].toFixed(2), mom: +mom[w].toFixed(2) });
  const r = ratio.at(-1), m = mom.at(-1);
  // dong tien
  const ngayCuoi = nen.VCB.at(-1).t;
  const gtTuan = (offs) => { // tong GTGD (ty) cua nganh trong 5 phien [n-5-offs, n-offs)
    let s = 0;
    for (const [, v] of cac) { const n = v.ds.length; for (let j = n - 5 - offs; j < n - offs; j++) s += (v.ds[j].c * v.ds[j].v) / 1e6; }
    return s;
  };
  const g5 = gtTuan(0), gTruoc = (gtTuan(5) + gtTuan(10) + gtTuan(15) + gtTuan(20) + gtTuan(25) + gtTuan(30) + gtTuan(35) + gtTuan(40) + gtTuan(45) + gtTuan(50)) / 10;
  let clvTong = 0, gtTong = 0;
  for (const [, v] of cac) { const n = v.ds.length; for (let j = n - 5; j < n; j++) { const x = v.ds[j]; const gt = (x.c * x.v) / 1e6; gtTong += gt; if (x.h > x.l) clvTong += (gt * (2 * x.c - x.l - x.h)) / (x.h - x.l); } }
  const rs20 = (() => { // loi suat 20 phien chi so nganh trung vi cac ma - VN-Index (phan tram)
    const rr = cac.map(([, v]) => { const n = v.ds.length; return (v.ds[n - 1].c / v.ds[n - 21].c - 1) * 100; }).sort((a, b) => a - b);
    const trungVi = rr[rr.length >> 1];
    const tatCa = Object.values(ma).map((v) => { const n = v.ds.length; return (v.ds[n - 1].c / v.ds[n - 21].c - 1) * 100; }).sort((a, b) => a - b);
    const vv = DUNG_VNI ? (vni.at(-1).c / vni.at(-21).c - 1) * 100 : tatCa[tatCa.length >> 1];
    return trungVi - vv;
  })();
  ketQua.push({
    nganh: ng, soMa: cac.length, ratio: +r.toFixed(2), mom: +m.toFixed(2),
    goc: r >= 100 ? (m >= 100 ? "Leading" : "Weakening") : m >= 100 ? "Improving" : "Lagging",
    duoi, gtTuan: +g5.toFixed(0), nongDongTien: +(g5 / gTruoc).toFixed(2), tienRong5p: +((clvTong / gtTong) * 100).toFixed(1), rs20: +rs20.toFixed(1),
  });
}
ketQua.sort((a, b) => b.ratio - a.ratio);
if (process.argv.includes("--json")) writeFileSync(new URL("../output/rrg_nganh.json", import.meta.url), JSON.stringify({ ngay: nen.VCB.at(-1).t, tuanCuoi: cacTuan.at(-1), ketQua }));
console.log(`RRG nganh den tuan ${cacTuan.at(-1)} (du lieu den ${nen.VCB.at(-1).t}); ratio/mom: >100 la tot`);
console.log("nganh".padEnd(34), "goc".padEnd(10), "ratio".padStart(7), "mom".padStart(7), "RS20".padStart(6), "GTGD5p(ty)".padStart(11), "nong".padStart(6), "tienRong%".padStart(10), "  duoi 8 tuan (ratio)");
for (const k of ketQua) console.log(k.nganh.padEnd(34), k.goc.padEnd(10), String(k.ratio).padStart(7), String(k.mom).padStart(7), String(k.rs20).padStart(6), String(k.gtTuan).padStart(11), String(k.nongDongTien).padStart(6), String(k.tienRong5p).padStart(10), " ", k.duoi.map((d) => d.ratio.toFixed(1)).join(" "));
