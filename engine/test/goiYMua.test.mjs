// Test tay: node engine/test/goiYMua.test.mjs
import { kiemTraDieuKien, goiYTheoDanhMuc, rsiTai, cachSmaTai } from "../../lib/goiYMua.js";
let loi = 0;
const dat = (ten, dk, them = "") => { if (dk) console.log("ok:", ten); else { console.log("SAI:", ten, them); loi++; } };
const gan = (a, b, e = 1e-6) => Math.abs(a - b) <= e;

// chi bao
const tang = Array.from({ length: 60 }, (_, i) => 10 + i * 0.1);
dat("RSI chuoi chi tang = 100", rsiTai(tang, 59) === 100);
const zz = Array.from({ length: 60 }, (_, i) => 10 + (i % 2 ? 0.2 : -0.2));
dat("RSI chuoi len xuong deu ~ 50", Math.abs(rsiTai(zz, 59) - 50) < 5, rsiTai(zz, 59));
dat("cach SMA50: gia = TB -> 0%", gan(cachSmaTai(Array(60).fill(20), 59), 0));
dat("thieu du lieu -> null", rsiTai([1, 2, 3], 2) === null && cachSmaTai([1, 2], 1) === null);

// dieu kien
const u = { gia: 20.1, moc: 20, sma50Pct: 2, rsi14: 55 };
dat("dat du dieu kien", kiemTraDieuKien(u, { vni20: 3 }).dat);
dat("gia vuot vung mua (+2%) -> khong dat", !kiemTraDieuKien({ ...u, gia: 20.4 }, { vni20: 3 }).dat);
dat("xa SMA50 4% -> khong dat", !kiemTraDieuKien({ ...u, sma50Pct: 4 }, { vni20: 3 }).dat);
dat("RSI 62 -> khong dat", !kiemTraDieuKien({ ...u, rsi14: 62 }, { vni20: 3 }).dat);
dat("VN-Index 20 phien +6% -> khong dat", !kiemTraDieuKien(u, { vni20: 6 }).dat);
dat("ma cho (khong co moc): bo dieu kien vung mua", kiemTraDieuKien({ gia: 20, sma50Pct: 1, rsi14: 50 }, { vni20: 1 }).cac.length === 3);

// theo danh muc
const uv = [
  { ma: "A", nganh: "Thép", gia: 20, moc: 20, stop_loss: 19, cachMoc: 0.5, diem: 5 },
  { ma: "B", nganh: "Ngân hàng", gia: 30, moc: 30, stop_loss: 25, cachMoc: 0.2, diem: 6 },
  { ma: "C", nganh: "Chứng khoán", gia: 15, moc: 15, stop_loss: 14, cachMoc: 0.1, diem: 4 },
];
const g = goiYTheoDanhMuc(uv, { dangCam: [{ ma: "X", nganh: "Ngân hàng" }, { ma: "C", nganh: "Chứng khoán" }], taiSan: { tienMat: 60e6, no: 0, nav: 120e6 } });
dat("bo ma dang cam (C)", !g.goiY.some((x) => x.ma === "C"));
dat("ma trung nganh (B - Ngan hang) xep sau", g.goiY[0].ma === "A" && g.goiY[1].ma === "B" && g.goiY[1].trungNganh?.[0] === "X");
dat("con 4 cho (6 - 2 ma dang cam)", g.conCho === 4);
dat("moi ma 1/6 tai san = 20tr, tien mat 60tr / 2 goi y = 30tr -> 20tr", gan(g.moiMa, 20e6) && gan(g.tienMoiMa, 20e6));
dat("A: 20tr / 20k = 1000 cp, cat lo 19 (cach 5%)", g.goiY[0].kl === 1000 && g.goiY[0].catLo === 19);
dat("B: cat lo he thong 25 xa 16,7% -> chan 6% (28,2)", gan(g.goiY[1].catLo, 30 * 0.94));
dat("rui ro A = 1000 x 1 x 1000 = 1tr (0,83% tai san)", gan(g.goiY[0].ruiRo, 1e6) && gan(g.goiY[0].ruiRoPctNav, (1e6 / 120e6) * 100));
const het = goiYTheoDanhMuc(uv, { dangCam: ["P", "Q", "R", "S", "T", "U"].map((ma) => ({ ma })), taiSan: { tienMat: 10e6, nav: 100e6 } });
dat("du 6 ma -> 0 cho, khong mua", het.conCho === 0 && het.goiY.every((x) => x.kl === 0 && !x.trongCho) && het.ghiChu.some((t) => /tối đa 6/.test(t)));
dat("dang dung margin -> khong mua", goiYTheoDanhMuc(uv, { taiSan: { tienMat: 50e6, no: 20e6, nav: 100e6 } }).goiY.every((x) => x.kl === 0));
const moi = goiYTheoDanhMuc(uv, { dangCam: [], taiSan: { tienMat: 90e6, no: 0, nav: 90e6 } });
dat("khach moi (chi tien mat 90tr): 6 cho, moi ma 15tr", moi.conCho === 6 && gan(moi.moiMa, 15e6) && moi.goiY.every((x) => x.kl > 0));
dat("chua nhap tien mat, chua co ma -> nhac nhap tien", goiYTheoDanhMuc(uv, {}).ghiChu.some((t) => /Nhập tiền mặt/.test(t)));

console.log(loi ? `\n${loi} test SAI` : "\nTat ca dung");
process.exit(loi ? 1 : 0);
