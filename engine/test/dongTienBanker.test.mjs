// Test tay: node engine/test/dongTienBanker.test.mjs
import { tinhDongTienBanker, trangThaiDongTien } from "../../lib/dongTienBanker.js";
import { tinhDiemMuaPhucHoi } from "../../engine/loi/diemMuaPhucHoi.js";
let loi = 0;
const dat = (ten, dk, them = "") => { if (dk) console.log("ok:", ten); else { console.log("SAI:", ten, them); loi++; } };

const n = 120;
const tang = Array.from({ length: n }, (_, i) => 10 + i * 0.1);
const r1 = tinhDongTienBanker({ open: tang, high: tang, low: tang, close: tang });
dat("do dai bang nhau", r1.trend.length === n && r1.bb.length === n);
dat("chua du du lieu -> null (27 / 34 nen dau)", r1.trend[10] == null && r1.bb[20] == null);
dat("chuoi chi tang: stochastic 100 -> trend 101,6, bull/bear 100", Math.abs(r1.trend[n - 1] - 101.6) < 1e-6 && Math.abs(r1.bb[n - 1] - 100) < 1e-6, `${r1.trend[n - 1]} ${r1.bb[n - 1]}`);
dat("chuoi chi tang: dong tien da quay len (1)", trangThaiDongTien(r1.trend, r1.bb, n - 1) === 1);
const giam = tang.slice().reverse();
const r2 = tinhDongTienBanker({ open: giam, high: giam, low: giam, close: giam });
dat("chuoi chi giam: trend -1,6, bull/bear 0, con yeu (0)", Math.abs(r2.trend[n - 1] + 1.6) < 1e-6 && Math.abs(r2.bb[n - 1]) < 1e-6 && trangThaiDongTien(r2.trend, r2.bb, n - 1) === 0, `${r2.trend[n - 1]} ${r2.bb[n - 1]}`);
dat("nen chua du -> null", trangThaiDongTien(r1.trend, r1.bb, 5) === null);
dat("mang rong khong loi", tinhDongTienBanker({ open: [], high: [], low: [], close: [] }).trend.length === 0);
const phang = Array.from({ length: n }, () => 10);
const r3 = tinhDongTienBanker({ open: phang, high: phang, low: phang, close: phang });
dat("gia phang (khoang 0) khong NaN / loi", r3.trend.every((x) => x == null || Number.isFinite(x)) && r3.bb.every((x) => x == null || Number.isFinite(x)));

// diem B: nhan dong tien di kem moTa khi truyen mang dong tien
const nb = 200;
const c = Array.from({ length: nb }, (_, i) => (i < 120 ? 50 : i < 150 ? 50 - (i - 120) * 0.5 : 35 + (i - 150) * 0.6));
const dat1 = { open: c, high: c.map((x) => x + 0.5), low: c.map((x) => x - 0.5), close: c, volume: c.map(() => 3e6), atr: c.map(() => 1), tenkan: c.map((x) => x - 1), kijun: c.map((x) => x - 2), cloudTop: c.map((x) => x + 5), cbTop: c.map((x) => x + 6) };
const dt = tinhDongTienBanker(dat1);
const b1 = tinhDiemMuaPhucHoi({ ...dat1, dongTienTrend: dt.trend, dongTienBB: dt.bb });
const iB = b1.laB.findIndex(Boolean);
dat("diem B tim thay trong du lieu tong hop", iB > 0);
dat("moTa(i) co dongTien 0 hoac 1 khi truyen mang", iB > 0 && [0, 1].includes(b1.moTa(iB).dongTien), JSON.stringify(b1.moTa(iB)));
const b2 = tinhDiemMuaPhucHoi(dat1);
dat("khong truyen mang dong tien -> dongTien null (khong doi hanh vi cu)", iB > 0 && b2.moTa(iB).dongTien === null);

// hien thi giong Pine: mau + nhan
{
  const { tinhBankerHienThi } = await import("../../lib/dongTienBanker.js");
  const m = 400;
  const gia = Array.from({ length: m }, (_, i) => 30 + Math.sin(i / 10) * 8 + Math.sin(i / 3) * 1.5 + i * 0.01);
  const x = { open: gia.map((v, i) => (i ? gia[i - 1] : v)), high: gia.map((v) => v + 0.6), low: gia.map((v) => v - 0.6), close: gia, volume: gia.map((_, i) => (i % 3 === 0 ? 4e6 : 1.5e6)) };
  const r = tinhBankerHienThi(x);
  dat("do dai mang khop", r.mauNen.length === m && r.mauDuong.length === m && r.nenVang.length === m);
  dat("mau nen chi co 4 gia tri hoac null", r.mauNen.every((v) => v == null || ["xanhLa", "trang", "do", "xanhDuong"].includes(v)));
  dat("trend > bull/bear: xanhLa / trang; trend < bull/bear: do / xanhDuong", r.mauNen.every((v, i) => v == null || r.trend[i] === r.bb[i] || (r.trend[i] > r.bb[i] ? ["xanhLa", "trang"].includes(v) : ["do", "xanhDuong"].includes(v))));
  dat("nhan sap xep theo nen, co IN va mot tin hieu ra", r.nhan.every((l, i) => i === 0 || r.nhan[i - 1].i <= l.i) && r.nhan.some((l) => l.loai === "IN") && r.nhan.some((l) => ["OUT", "SI", "SO"].includes(l.loai)), JSON.stringify(r.nhan.slice(0, 6)));
  // state machine: tu IN khong co IN tiep theo ma khong qua OUT / SI / TP / SL (chi RL duoc lap lai)
  let vt = 0, hopLe = true;
  for (const l of r.nhan) {
    if (l.loai === "IN") { if (vt === 1) hopLe = false; vt = 1; }
    else if (l.loai === "SI") { if (vt === -1) hopLe = false; vt = -1; }
    else if (["OUT", "SO", "TP", "SL"].includes(l.loai)) vt = 0;
    else if (l.loai === "RL" && vt !== 1) hopLe = false;
    else if (l.loai === "RS" && vt !== -1) hopLe = false;
  }
  dat("trinh tu nhan hop le (IN / SI / RL / RS / OUT / SO / TP / SL khong chong cheo)", hopLe);
  dat("cooldown 3 nen giua cac tin hieu quan tri", r.nhan.filter((l) => ["IN", "OUT", "SI", "SO", "RL", "RS"].includes(l.loai)).every((l, i, a) => i === 0 || l.i - a[i - 1].i > 3));
  dat("nen vang chi khi trend cat len bull/bear va bull/bear < 25", r.nenVang.every((v, i) => !v || (r.trend[i] > r.bb[i] && r.bb[i] < 25)));
}

console.log(loi ? `\n${loi} test SAI` : "\nTat ca dung");
process.exit(loi ? 1 : 0);
