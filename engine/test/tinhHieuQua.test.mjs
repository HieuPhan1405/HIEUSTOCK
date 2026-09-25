// Test tay cho lib/tinhHieuQua.js (ty suat sinh loi theo thoi gian so voi VN-Index). Chay: node engine/test/tinhHieuQua.test.mjs
import { tinhHieuQua, cuaSoLuyKe, chiSoBatDauCuaSo, cacLatCat } from "../../lib/tinhHieuQua.js";

let loi = 0;
const ok = (ten, dk, them = "") => {
  if (!dk) {
    loi++;
    console.log("SAI:", ten, them);
  } else console.log("ok:", ten);
};
const gan = (a, b, e = 1e-9) => Math.abs(a - b) <= e;

// 5 ngay giao dich; d0 = 09-01 la moc goc (khong co lenh nao vao hom do).
const ngay = ["2026-09-01", "2026-09-02", "2026-09-03", "2026-09-04", "2026-09-07"];
const map = (o) => new Map(Object.entries(o).map(([ma, c]) => [ma, { close: c, adClose: c }]));
const vn = [1000, 1010, 1000, 1020, 1030];

// 1 lenh A: vao 09-02 gia 10, dong cua 10.5, 10.5, 11, 11.55; dang giu
const gia1 = [map({ A: 10 }), map({ A: 10.5 }), map({ A: 10.5 }), map({ A: 11 }), map({ A: 11.55 })];
let r = tinhHieuQua({ slices: [{ ma: "A", ngayVao: "2026-09-02", giaVao: 10, ngayRa: null, giaRa: null, trongSo: 1 }], ngay, giaTheoNgay: gia1, vn });
ok("1 lenh dang giu: luy ke = gia cuoi / gia vao - 1 (15.5%)", gan(r.tssl[4], 15.5, 1e-9) && r.tssl[0] === 0, JSON.stringify(r.tssl));
ok("ngay vao lenh tinh so voi gia VAO (5%)", gan(r.tssl[1], 5));
ok("so lat cat hoat dong tung ngay", r.soHoatDong.join() === "0,1,1,1,1");
ok("VN-Index luy ke", gan(r.vn[1], 1) && gan(r.vn[2], 0) && gan(r.vn[4], 3));

// 2 lat cat A(w=1, dang giu) + B(w=1, vao 09-03 gia 20, dong 09-04 gia ra 21): ngay 09-03: A +0% (10.5->10.5), B vao: dong 21? -> dong cua B 09-03 la 20.4
const gia2 = [map({ A: 10, B: 20 }), map({ A: 10.5, B: 20 }), map({ A: 10.5, B: 20.4 }), map({ A: 11, B: 21 }), map({ A: 11.55, B: 22 })];
r = tinhHieuQua({
  slices: [
    { ma: "A", ngayVao: "2026-09-02", giaVao: 10, ngayRa: null, giaRa: null, trongSo: 1 },
    { ma: "B", ngayVao: "2026-09-03", giaVao: 20, ngayRa: "2026-09-04", giaRa: 21, trongSo: 1 },
  ],
  ngay,
  giaTheoNgay: gia2,
  vn,
});
// ngay 09-03: A 0%, B 20.4/20-1 = 2% -> tb 1% ; ngay 09-04: A 11/10.5-1 = 4.7619%, B ra 21/20.4-1 = 2.941% -> tb ; ngay 09-07: chi con A 5%
const r03 = (0 + 0.02) / 2;
const r04 = (11 / 10.5 - 1 + (21 / 20.4 - 1)) / 2;
const r07 = 11.55 / 11 - 1;
const ky = 1.05 * (1 + r03) * (1 + r04) * (1 + r07);
ok("2 lat cat: luy ke noi tiep trung binh ngay", gan(r.tssl[4], (ky - 1) * 100, 1e-9), `${r.tssl[4]} vs ${(ky - 1) * 100}`);
ok("B het hoat dong sau ngay ra", r.soHoatDong.join() === "0,1,2,2,1", r.soHoatDong.join());

// Trong so: lat cat 0.15 (phan con lai) it anh huong hon lat cat 1 khi cung dang giu
const gia3 = [map({ A: 10, B: 10 }), map({ A: 10, B: 10 }), map({ A: 11, B: 9 }), map({ A: 11, B: 9 }), map({ A: 11, B: 9 })];
r = tinhHieuQua({
  slices: [
    { ma: "A", ngayVao: "2026-09-02", giaVao: 10, ngayRa: null, giaRa: null, trongSo: 1 },
    { ma: "B", ngayVao: "2026-09-02", giaVao: 10, ngayRa: null, giaRa: null, trongSo: 0.25 },
  ],
  ngay,
  giaTheoNgay: gia3,
  vn,
});
ok("trong so: (1x10% + 0.25x(-10%)) / 1.25 = 6%", gan(r.tssl[2], 6, 1e-9), String(r.tssl[2]));

// Vao va ra CUNG NGAY: ty suat = gia ra / gia vao - 1
r = tinhHieuQua({ slices: [{ ma: "A", ngayVao: "2026-09-03", giaVao: 10, ngayRa: "2026-09-03", giaRa: 10.4, trongSo: 1 }], ngay, giaTheoNgay: gia1, vn });
ok("vao va ra cung ngay", gan(r.tssl[2], 4, 1e-9) && r.tssl[3] === r.tssl[2], JSON.stringify(r.tssl));

// Khong co lat cat nao -> 0% ca chuoi, VN-Index van tinh
r = tinhHieuQua({ slices: [], ngay, giaTheoNgay: gia1, vn });
ok("khong co lenh -> phang 0%", r.tssl.every((x) => x === 0) && gan(r.vn[4], 3));

// Lenh cu hon cua so (vao truoc ngay[0]): bat dau tu ngay 1 bang ty le gia dong cua dieu chinh
r = tinhHieuQua({ slices: [{ ma: "A", ngayVao: "2026-08-20", giaVao: 9, ngayRa: null, giaRa: null, trongSo: 1 }], ngay, giaTheoNgay: gia1, vn });
ok("lenh vao truoc cua so: ngay 1 = 10.5/10 - 1", gan(r.tssl[1], 5, 1e-9), String(r.tssl[1]));

// Ngay vao roi vao cuoi tuan (khong phai ngay giao dich): dung phien ke tiep
r = tinhHieuQua({ slices: [{ ma: "A", ngayVao: "2026-09-05", giaVao: 11, ngayRa: null, giaRa: null, trongSo: 1 }], ngay, giaTheoNgay: gia1, vn });
ok("ngay vao la cuoi tuan -> phien ke tiep (09-07): 11.55/11 - 1 = 5%", gan(r.tssl[4], 5, 1e-9) && r.tssl[3] === 0, JSON.stringify(r.tssl));

// Thieu gia 1 ngay -> ty suat 0 ngay do, khong lam vo
const gia4 = [map({ A: 10 }), map({ A: 10.5 }), map({}), map({ A: 11 }), map({ A: 11.55 })];
r = tinhHieuQua({ slices: [{ ma: "A", ngayVao: "2026-09-02", giaVao: 10, ngayRa: null, giaRa: null, trongSo: 1 }], ngay, giaTheoNgay: gia4, vn });
ok("thieu gia 1 ngay khong tao NaN", r.tssl.every(Number.isFinite), JSON.stringify(r.tssl));

// Cua so luy ke
const cs = cuaSoLuyKe([0, 10, 21, 33.1], 1);
ok("cuaSoLuyKe: ve 0 tai diem bat dau, noi tiep dung", cs[0] === null && gan(cs[1], 0) && gan(cs[2], 10, 1e-9) && gan(cs[3], 20.999999999999996, 1e-6), JSON.stringify(cs));

// Chi so bat dau cua so
const dai = Array.from({ length: 300 }, (_, i) => `${i < 100 ? "2025" : "2026"}-${String(1 + (i % 12)).padStart(2, "0")}-${String(1 + (i % 28)).padStart(2, "0")}`);
ok("1M = 21 phien cuoi", chiSoBatDauCuaSo(dai, "1M") === 299 - 21);
ok("1Y = 252 phien cuoi", chiSoBatDauCuaSo(dai, "1Y") === 299 - 252);
ok("cua so dai hon du lieu -> 0", chiSoBatDauCuaSo(ngay, "3M") === 0);
ok("YTD: moc = phien cuoi nam truoc", chiSoBatDauCuaSo(dai, "YTD") === 99, String(chiSoBatDauCuaSo(dai, "YTD")));
ok("YTD khi tat ca cung nam -> 0", chiSoBatDauCuaSo(ngay, "YTD") === 0);


// ---- cacLatCat: ghep lenh da dong + dang mo thanh lat cat ----
const dong = (o) => ({ ma: "ABC", ngay_mua: "2026-09-01", gia_mua: 20, ngay_ban: "2026-09-10", gia_ban: 22, lai_lo_pct: 10, ly_do: "BAN", phan_chot_pct: 100, vong: 1, ...o });
// Kieu moi: TP1 30% + TP2 30% + TP3 25% + phan con lai 15% (vong 3) - tong trong so = 1, moi lat cat co gia ra hieu dung theo lai/lo cua phan do
let ls = cacLatCat(
  [
    dong({ ly_do: "TP1", phan_chot_pct: 30, vong: 5, lai_lo_pct: 10 }),
    dong({ ly_do: "TP2", phan_chot_pct: 30, vong: 6, lai_lo_pct: 20 }),
    dong({ ly_do: "TP3", phan_chot_pct: 25, vong: 1, lai_lo_pct: 40 }),
    dong({ ly_do: "BAN", phan_chot_pct: 15, vong: 3, lai_lo_pct: 30 }),
  ],
  []
);
ok("kieu moi: 4 lat cat, tong trong so = 1", ls.length === 4 && gan(ls.reduce((s, x) => s + x.trongSo, 0), 1), JSON.stringify(ls.map((x) => x.trongSo)));
ok("kieu moi: gia ra hieu dung = gia vao x (1 + lai/lo)", gan(ls[0].giaRa, 22) && gan(ls[1].giaRa, 24) && gan(ls[2].giaRa, 28) && gan(ls[3].giaRa, 26), JSON.stringify(ls.map((x) => x.giaRa)));
// Tong dong gop theo trong so = lai cua ca vi the: 0.3x10 + 0.3x20 + 0.25x40 + 0.15x30 = 3 + 6 + 10 + 4.5 = 23.5
ok("tong lai theo trong so = 23.5%", gan(ls.reduce((s, x) => s + x.trongSo * (x.giaRa / x.giaVao - 1) * 100, 0), 23.5, 1e-9));

// Kieu cu: dong TP3 gop 85% co lai/lo tren TOAN vi the (6.9) -> chia lai cho trong so 0.85
ls = cacLatCat([dong({ ly_do: "TP3", phan_chot_pct: 85, lai_lo_pct: 6.9 }), dong({ ly_do: "BAN", phan_chot_pct: 15, vong: 3, lai_lo_pct: 5 })], []);
ok("kieu cu TP3 85%: ty suat lat cat = 6.9 / 0.85", gan((ls[0].giaRa / ls[0].giaVao - 1) * 100, 6.9 / 0.85, 1e-9), String((ls[0].giaRa / ls[0].giaVao - 1) * 100));
ok("kieu cu: 2 lat cat, tong trong so 1", ls.length === 2 && gan(ls[0].trongSo + ls[1].trongSo, 1));

// Lenh cu tinh gop (phan_chot 100, da cham TP1) van dung lai/lo tong
ls = cacLatCat([dong({ da_cham_tp: "TP1", lai_lo_pct: -1.5, gia_ban: 19 })], []);
ok("lenh cu tinh gop: gia ra hieu dung theo lai/lo (-1.5%), khong theo gia ban", gan(ls[0].giaRa, 20 * 0.985));

// Lenh dang mo: phan con lai = 100 - cac dong chot loi da ghi
const mo = { ma: "ABC", tin: "NAM GIU", gia_mua: 20, ngay_mua: "2026-09-01" };
ls = cacLatCat([dong({ ly_do: "TP1", phan_chot_pct: 30, vong: 5 })], [mo]);
const lm = ls.find((x) => x.ngayRa == null);
ok("dang mo sau TP1: con 70%", lm && gan(lm.trongSo, 0.7) && lm.giaVao === 20, JSON.stringify(ls.map((x) => [x.trongSo, x.ngayRa])));
ls = cacLatCat([dong({ ly_do: "TP3", phan_chot_pct: 85, vong: 1 })], [mo]);
ok("dang mo sau TP3 kieu cu: con 15%", gan(ls.find((x) => x.ngayRa == null).trongSo, 0.15));
ls = cacLatCat([], [mo]);
ok("dang mo chua chot: 100%", ls.length === 1 && ls[0].trongSo === 1);
ok("khong dang giu (BAN) -> bo", cacLatCat([], [{ ...mo, tin: "BAN" }]).length === 0);
// Dong chot loi cua LENH KHAC (khac ngay mua) khong tru vao lenh dang mo nay; dong Mua them (vong 2) cung khong tru
ls = cacLatCat([dong({ ly_do: "TP1", phan_chot_pct: 30, vong: 5, ngay_mua: "2026-08-01" }), dong({ ly_do: "BAN", phan_chot_pct: 100, vong: 2 })], [mo]);
ok("chot loi cua lenh khac/mua them khong tru vao lenh dang mo", gan(ls.find((x) => x.ngayRa == null).trongSo, 1));
// Lo mua them dang giu
ls = cacLatCat([], [{ ...mo, dang_giu_moi: true, gia_mua_moi: 25, ngay_mua_moi: "2026-09-20", dang_giu_giua: true, gia_mua_giua: 23, ngay_mua_giua: new Date(Date.UTC(2026, 8, 15)) }]);
ok("lo mua them (sau TP3 + giua chung) dang giu: them 2 lat cat", ls.length === 3 && ls[1].giaVao === 25 && ls[2].giaVao === 23 && ls[2].ngayVao === "2026-09-15", JSON.stringify(ls));
// Dong hong bi bo
ok("dong thieu gia mua/ngay ban bi bo", cacLatCat([dong({ gia_mua: 0 }), dong({ ngay_ban: null })], []).length === 0);

console.log(loi === 0 ? "\nTAT CA DAT" : `\n${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
