// THAY MFI TRONG DIEM MUA A BANG DONG TIEN BANKER FUND FLOW? (Hieu 04/11/2026: "cai nay co thay the duoc mfi trong diem mua A ko").
// Diem A = tin hieu MUA thuong (loai 1) cua engine. Thanh phan "dong tien" cua diem so = mfScore (trong so 1,2) = MFI bac thang (> 80: -0,5, < 20: +0,5, con lai > 50: +0,5 nguoc lai -0,5) + khoi luong tuong doi.
// Ba cach thay MFI (cac thanh phan khac, nguong diem, cong khoi luong, cat lo, TP giu NGUYEN; chi doi gia tri dua vao bac thang MFI):
//   BK1  trend > bull/bear (green) = +0,5, nguoc lai -0,5
//   BK2  dung chinh gia tri trend (0-100) thay MFI voi cung bac thang (> 80: -0,5, < 20: +0,5, con lai > 50: +0,5 nguoc lai -0,5)
//   BK3  nhu BK1 nhung trend > 80 (qua nong) = -0,5
//   BK4  KET HOP: chi cho diem A moi cua cach HIEN TAI khi dong tien Banker green (trend > bull/bear) tai ngay tin hieu (khong doi diem so, chi loc)
// Do: so lenh, lai TB / lenh theo cach quan ly he thong (moPhongThucTe: 30% TP1 + 30% TP2, con lai theo BAN, cat lo, T+2, mua mo cua phien sau), trung vi, ty le thang, chia 2 giai doan; do trung lap tap lenh voi cach hien tai.
// Chay: node engine/dich-vu/nghienCuuThayMfiBangDongTien.mjs
import { docJson, chayEngine, moPhongThucTe, tb, md, f } from "./backtestChung.mjs";
import { tinhDongTienBanker } from "../../lib/dongTienBanker.js";

const nen = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");
const MFI_GIA_TRI = { xanh: 60, do: 40, nong: 90 }; // gia tri tong hop: 60 -> +0,5, 40 -> -0,5, 90 -> -0,5 theo bac thang MFI
const thayThe = (kieu) => ({ open, high, low, close }) => {
  const { trend, bb } = tinhDongTienBanker({ open, high, low, close });
  return trend.map((t, i) => {
    if (t == null || bb[i] == null) return null; // thieu du lieu: giong MFI chua co (mf = -0,5)
    if (kieu === "BK2") return t;
    const xanh = t > bb[i];
    if (kieu === "BK3" && t > 80) return MFI_GIA_TRI.nong;
    return xanh ? MFI_GIA_TRI.xanh : MFI_GIA_TRI.do;
  });
};
const CACH = { "HT  MFI (hien tai)": null, "BK1 Banker green / khong green": "BK1", "BK2 gia tri trend thay MFI (cung bac thang)": "BK2", "BK3 green, qua nong (>80) = -0,5": "BK3" };
const KQ = {};
for (const [ten, kieu] of Object.entries(CACH)) {
  const { lenh } = chayEngine({ cache: nen, vni, thamSoThem: kieu ? { mfiThayThe: thayThe(kieu) } : {} });
  KQ[ten] = lenh.filter((t) => t.loai === 1);
  console.log(`${ten}: ${KQ[ten].length} diem A`);
}
const khoa = (t) => `${t.ma}|${t.ngayArr[t.iv]}`;
const goc = new Set(KQ["HT  MFI (hien tai)"].map(khoa));
const ql = (t) => moPhongThucTe(t, { E: t.open[t.iv + 1], vao: t.iv + 1, banTu: t.iv + 3 });
function dong(ten, ds) {
  const out = [];
  for (const [kyTen, kyF] of [["tat ca", () => true], ["<2022.5", (t) => t.ngayArr[t.iv] < "2022-05-01"], [">=2022.5", (t) => t.ngayArr[t.iv] >= "2022-05-01"]]) {
    const r = ds.filter(kyF).map(ql).filter((x) => x != null);
    out.push(`${String(r.length).padStart(5)} lenh ${f(tb(r), 2).padStart(6)}% (tv ${f(md(r), 1).padStart(5)}, thang ${f((r.filter((x) => x > 0).length / r.length) * 100, 0).padStart(2)}%)`);
  }
  console.log(ten.padEnd(48), out.join(" | "));
}
console.log("\nCot: so lenh, lai TB % / lenh (cach quan ly he thong), trung vi, ty le thang   (tat ca | <2022.5 | >=2022.5)");
for (const [ten, ds] of Object.entries(KQ)) dong(ten, ds);
// trung lap voi cach hien tai
console.log("\nTrung lap tap lenh voi cach hien tai:");
for (const [ten, ds] of Object.entries(KQ)) {
  const chung = ds.filter((t) => goc.has(khoa(t))).length;
  console.log(ten.padEnd(48), `chung ${chung}, rieng ${ds.length - chung}, mat ${goc.size - chung}`);
}
// lenh RIENG cua tung cach (khong co o cach hien tai) va lenh HT bi bo di
for (const ten of Object.keys(CACH).slice(1)) {
  const ds = KQ[ten], set = new Set(ds.map(khoa));
  dong(`${ten}: lenh MOI (khong co o HT)`, ds.filter((t) => !goc.has(khoa(t))));
  dong(`${ten}: lenh HT BI BO`, KQ["HT  MFI (hien tai)"].filter((t) => !set.has(khoa(t))));
}
// BK4 loc: diem A hien tai + Banker green tai ngay tin hieu
console.log("\nBK4 loc (khong doi diem so):");
const dtCache = new Map();
const green = (t) => {
  if (!dtCache.has(t.ma)) dtCache.set(t.ma, tinhDongTienBanker({ open: t.open, high: t.high, low: t.low, close: t.close }));
  const d = dtCache.get(t.ma);
  return d.trend[t.iv] != null && d.bb[t.iv] != null && d.trend[t.iv] > d.bb[t.iv];
};
const ht = KQ["HT  MFI (hien tai)"];
dong("HT + chi khi Banker green (loc)", ht.filter(green));
dong("HT + chi khi Banker KHONG green", ht.filter((t) => !green(t)));
