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

console.log(loi ? `\n${loi} test SAI` : "\nTat ca dung");
process.exit(loi ? 1 : 0);
