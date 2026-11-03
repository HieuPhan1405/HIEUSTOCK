// Test tay: node engine/test/phongCachDauTu.test.mjs
import { nhanTrangThai, diemDoanhNghiepMa, PHONG_CACH, dauVaoNhan } from "../../lib/phongCachDauTu.js";
import { tomTatCoBan, trungViThiTruong } from "../../lib/coBanDanhMuc.js";
import { chamDiemSucKhoe } from "../../lib/ruiRoDanhMuc.js";
let loi = 0;
const dat = (ten, dk, them = "") => { if (dk) console.log("ok:", ten); else { console.log("SAI:", ten, them); loi++; } };

for (const [k, pc] of Object.entries(PHONG_CACH)) dat(`trong so ${k} tong 100`, Object.values(pc.trongSo).reduce((s, x) => s + x, 0) === 100);

const khoe = { loai: "pi", f: 7, vungZ2: "an toàn", lnTTM: 1000, lnYoY: 30, lnQuyYoY: 20, cfoLN: 1.1, pe: 10, peNganh: 12, sucKhoe: 7, hieuQua: 7, tangTruong: 8, dinhGia: 6, coTuc360: 5 };
const xau = { ...khoe, vungZ2: "nguy cơ", f: 2, lnTTM: -50, lnYoY: -80, sucKhoe: 2 };
const co = { gia: 30, tenkan: 29, kijun: 28, ggBot: 25, tyTrong: 0.15, laiLoPct: 5 };

// TRUNG HAN (he thong)
dat("trung han: tren cac duong -> Giu", nhanTrangThai(co, "trung_han").nhan === "giu");
dat("trung han: he thong BAN -> Thoat", nhanTrangThai({ ...co, tin: "BAN", coTinHieu: true }, "trung_han").nhan === "thoat");
dat("trung han: cham cat lo -> Thoat", nhanTrangThai({ ...co, stopLoss: 31 }, "trung_han").nhan === "thoat");
dat("trung han: duoi Kijun -> Giam", nhanTrangThai({ ...co, gia: 27.5 }, "trung_han").nhan === "giam");
dat("trung han: duoi duong can bang dai han -> Thoat", nhanTrangThai({ ...co, gia: 24 }, "trung_han").nhan === "thoat");
dat("trung han: duoi Tenkan -> Theo doi", nhanTrangThai({ ...co, gia: 28.5 }, "trung_han").nhan === "theo_doi");
dat("trung han: lo 11% -> Giam, lo 16% -> Thoat", nhanTrangThai({ ...co, laiLoPct: -11 }, "trung_han").nhan === "giam" && nhanTrangThai({ ...co, laiLoPct: -16 }, "trung_han").nhan === "thoat");
dat("ty trong 45% (tran 30%) -> Giam", nhanTrangThai({ ...co, tyTrong: 0.45 }, "trung_han").nhan === "giam");
// CHI CON 2 PHONG CACH (03/11/2026): luot song va tang truong da bo; phong cach cu tu ve mac dinh
dat("chi con 2 phong cach: trung_han, dai_han", Object.keys(PHONG_CACH).join() === "trung_han,dai_han");
dat("phong cach cu ngan_han / tang_truong -> xu ly nhu xu huong (mac dinh)", nhanTrangThai({ ...co, gia: 24 }, "ngan_han").nhan === nhanTrangThai({ ...co, gia: 24 }, "trung_han").nhan && nhanTrangThai({ ...co, gia: 28.5 }, "tang_truong").nhan === "theo_doi");
// DAI HAN
dat("dai han: gia thung Kijun nhung DN khoe -> khong ban (Giu)", nhanTrangThai({ ...co, gia: 27.5, cb: khoe }, "dai_han").nhan === "giu");
dat("dai han: duoi can bang -> chi Theo doi", nhanTrangThai({ ...co, gia: 24, cb: khoe }, "dai_han").nhan === "theo_doi");
dat("dai han: Z nguy co -> Thoat", nhanTrangThai({ ...co, cb: xau }, "dai_han").nhan === "thoat");
dat("dai han: he thong BAN khong lam ban", nhanTrangThai({ ...co, tin: "BAN", coTinHieu: true, cb: khoe }, "dai_han").nhan === "giu");
dat("dai han: P/E gap 2 nganh -> Theo doi", nhanTrangThai({ ...co, cb: { ...khoe, pe: 30, peNganh: 12 } }, "dai_han").nhan === "theo_doi");
dat("ly do o muc cao nhat duoc tra ve", nhanTrangThai({ ...co, gia: 24 }, "trung_han").lyDo.some((l) => /cân bằng dài hạn/.test(l)));

// dau vao: khach khong co tin hieu
const v = dauVaoNhan({ gia: 30, tyTrong: 0.1, laiLoPct: 2 }, { r: { tin: "BAN", stop_loss: 31, kijun: 28, gg_bot: 25 }, ls: { tenkan: 29 } });
dat("khach: khong dua tin / cat lo vao nhan", v.tin == null && v.stopLoss == null && v.kijun === 28 && v.tenkan === 29);

// diem doanh nghiep
dat("diem DN 0..1, xau < khoe", diemDoanhNghiepMa(khoe, "dai_han") > 0.5 && diemDoanhNghiepMa(xau, "dai_han") <= 0.2);
dat("diem DN khong co BCTC = null", diemDoanhNghiepMa(null) === null);

// tom tat co ban danh muc
const hang = [{ ma: "A", tyTrong: 0.5 }, { ma: "B", tyTrong: 0.3 }, { ma: "C", tyTrong: 0.2 }];
const t = tomTatCoBan(hang, { A: { ...khoe, pe: 10, roe: 20, quy: "2026-09-30" }, B: { ...xau, pe: null, roe: -5, quy: "2026-09-30" } }, { phongCach: "dai_han", thiTruong: { pe: 12, roe: 12 } });
dat("co ban: phu 80% gia tri, thieu C", Math.abs(t.phuGiaTri - 0.8) < 1e-9 && t.thieu.join() === "C");
dat("co ban: P/E dieu hoa tinh ma lo = 0 loi suat (A 10 -> danh muc 16)", Math.abs(t.pe.v - 16) < 1e-9, JSON.stringify(t.pe));
dat("co ban: co do B chiem 30% danh muc", t.coDo.length === 1 && t.coDo[0].ma === "B" && Math.abs(t.tyLeCoDo - 0.3) < 1e-9, t.tyLeCoDo);
dat("co ban: nhan xet co do la muc 0", t.nhanXet[0].tieuDe === "Cờ đỏ doanh nghiệp" && t.nhanXet[0].muc === 0);
dat("trung vi thi truong", trungViThiTruong([1, 2, 3, 4, 5].map((x) => ({ pe: x, roe: x }))).pe === 3);

// cham diem theo phong cach (5 tru)
const pb = { soMaCoGia: 2, chiTietDiem: { daDang: 30, kyThuat: 20, ruiRo: 20 }, nganh: [], nganhDangSong: false, margin: null, hang: [{ ma: "A", tyTrong: 0.6, gia: 20, r: { gg_bot: 25 }, nhanXet: [] }, { ma: "B", tyTrong: 0.4, gia: 30, r: { gg_bot: 25 }, nhanXet: [] }] };
const s = chamDiemSucKhoe(pb, null, { trongSo: PHONG_CACH.dai_han.trongSo, doanhNghiep: 0.8, xuHuongDaiHan: true, tyLeThoat: 0 });
dat("5 tru, toi da theo trong so", s.toiDa.doanhNghiep === 35 && s.tru.doanhNghiep === 28 && s.diem === Object.values(s.tru).reduce((a, b) => a + b, 0), JSON.stringify(s));
dat("xu huong dai han = ty trong tren can bang (40%) x trong so", s.tru.xuHuong === Math.round(0.4 * PHONG_CACH.dai_han.trongSo.xuHuong), s.tru.xuHuong);
dat("ty le thoat > 50% -> chan 64", chamDiemSucKhoe(pb, null, { trongSo: PHONG_CACH.dai_han.trongSo, doanhNghiep: 1, tyLeThoat: 0.6 }).diem <= 64);
dat("mac dinh van 4 tru x 25", Object.keys(chamDiemSucKhoe(pb, null).tru).length === 4);

console.log(loi ? `\n${loi} test SAI` : "\nTat ca dung");
process.exit(loi ? 1 : 0);
