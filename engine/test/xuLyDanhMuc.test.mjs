// Test tay: node engine/test/xuLyDanhMuc.test.mjs
import { giaVonSauMua, soCpDeVeGiaVon, goiYXuLy, apDungKeHoach, thoatTungPhan, trungBinhGiaCoDieuKien, maCungNganhKhoe } from "../../lib/xuLyDanhMuc.js";
import { apDungGiaoDich, thongKeNhatKy } from "../../lib/nhatKyGiaoDich.js";
let loi = 0;
const dat = (ten, dk, them = "") => { if (dk) console.log("ok:", ten); else { console.log("SAI:", ten, them); loi++; } };
const gan = (a, b, e = 1e-6) => Math.abs(a - b) <= e;

dat("gia von sau mua: 1000 x 30 + 1000 x 20 = 25", giaVonSauMua(1000, 30, 1000, 20) === 25);
dat("can mua bao nhieu de ve 25: 1000 cp", soCpDeVeGiaVon(1000, 30, 20, 25) === 1000);
dat("muc tieu khong hop le -> null", soCpDeVeGiaVon(1000, 30, 20, 31) === null && soCpDeVeGiaVon(1000, 30, 20, 19) === null);

// danh muc: A thoat (lo), B giam (duoi Kijun), C giu (dang lai, du dieu kien mua them)
const hang = [
  { ma: "A", kl: 1000, giaVon: 50, gia: 40 },
  { ma: "B", kl: 2000, giaVon: 20, gia: 22 },
  { ma: "C", kl: 500, giaVon: 30, gia: 33 },
];
const nhan = { A: { nhan: "thoat", muc: 3, lyDo: ["Hệ thống đang báo BÁN"] }, B: { nhan: "giam", muc: 2, lyDo: ["Giá dưới Kijun — xu hướng trung hạn yếu"] }, C: { nhan: "giu", muc: 0, lyDo: ["ok"] } };
const kh = goiYXuLy({ hang, nhanTheoMa: nhan, phongCach: "trung_han", taiSan: { tienMat: 100e6, no: 0 } });
const a = kh.hanhDong.find((x) => x.ma === "A");
const b = kh.hanhDong.find((x) => x.ma === "B");
const c = kh.hanhDong.find((x) => x.ma === "C");
dat("A: cat lo toan bo", a?.loai === "ban_het" && a.kl === 1000 && /Cắt lỗ/.test(a.tieuDe));
dat("B: giam mot nua (1000 cp)", b?.loai === "ban_bot" && b.kl === 1000, JSON.stringify(b));
dat("C: mua them theo xu huong, lo 100, mac dinh khong chon", c?.loai === "mua_them" && c.kl % 100 === 0 && c.kl > 0 && c.chon === false, JSON.stringify(c));
dat("thu tu: ban truoc mua", kh.hanhDong[0].loai === "ban_het" && kh.hanhDong.at(-1).loai === "mua_them");

// dang dung margin -> khong de xuat mua; dem mong -> giam no
const kh2 = goiYXuLy({ hang: [{ ma: "C", kl: 1000, giaVon: 30, gia: 33 }, { ma: "D", kl: 10000, giaVon: 30, gia: 30 }], nhanTheoMa: { C: nhan.C, D: nhan.C }, phongCach: "trung_han", taiSan: { tienMat: 0, no: 200e6 }, margin: { no: 200e6 }, nguong: { canhBao: 35 } });
dat("margin: khong mua them", !kh2.hanhDong.some((x) => x.loai === "mua_them") && kh2.ghiChu.some((g) => /margin/.test(g)));
const tn = kh2.hanhDong.find((x) => x.loai === "tra_no");
dat("margin mong (333tr co phieu, no 200tr) -> de xuat giam no", tn && tn.giaTri > 0, JSON.stringify(kh2));

// ap dung ke hoach: ban A + B, tien tra no truoc
dat("A chiem 40% danh muc -> vi the lon, mac dinh thoat 3 buoc", a.cachThoat === "tung_phan" && !!a.tungPhan);
const sau = apDungKeHoach(hang, { tienMat: 0, no: 30e6 }, [{ ...a, cachThoat: "ban_het" }, b]);
dat("sau: A het, B con 1000", !sau.vitri.some((x) => x.ma === "A") && sau.vitri.find((x) => x.ma === "B").kl === 1000);
dat("sau: tien ban 62tr, tra no 30tr, tien mat 32tr", gan(sau.tienBan, 62e6) && sau.no === 0 && gan(sau.tienMat, 32e6), JSON.stringify(sau));
dat("sau: lai chot = -10tr (A) + 2tr (B)", gan(sau.laiChot, -8e6));
const sau2 = apDungKeHoach(hang, { tienMat: 50e6, no: 0 }, [{ ma: "C", loai: "mua_them", kl: 500, gia: 33 }]);
dat("mua them: gia von C (30+33)/2, tien mat giam 16,5tr", gan(sau2.vitri.find((x) => x.ma === "C").giaVon, 31.5) && gan(sau2.tienMat, 33.5e6));
const tnSau = apDungKeHoach([{ ma: "C", kl: 1000, giaVon: 30, gia: 33 }, { ma: "D", kl: 10000, giaVon: 30, gia: 30 }], { tienMat: 0, no: 200e6 }, [tn]);
dat("giam no: no giam, kl giam", tnSau.no < 200e6 && tnSau.vitri[0].kl < 10000, JSON.stringify(tnSau));

// THOAT TUNG PHAN (vi the lon)
const tp = thoatTungPhan({ ma: "X", kl: 6000, giaVon: 30, gia: 20 }, { tenkan: 21, kijun: 23, gg_bot: 26, thap20: 19 }, { tong: 200e6, tran: 0.3, beta: 1.2 });
dat("tung phan: B1 >= 1/3, ban phan vuot tran 30%", tp.buoc[0].kl >= 2000 && tp.buoc[0].kl % 100 === 0, JSON.stringify(tp.buoc));
dat("tung phan: B2 cho hoi o Tenkan 21, B3 o Kijun 23", tp.buoc[1].gia === 21 && tp.buoc[2].gia === 23);
dat("tung phan: cat cung duoi day 20 phien, cach 3-8%", tp.catCung < 19 && tp.catCung >= 20 * 0.92 && tp.catCung <= 20 * 0.97, tp.catCung);
dat("tung phan: so voi ban het - hoi thi do lo, thung thi lo them", tp.soVoiBanHet.neuHoi > 0 && tp.soVoiBanHet.neuThung < 0 && tp.giuNguyen.vni10 < 0);
dat("tung phan: lai chot ngay = phan B1", gan(tp.banNgay.laiChot, (20 - 30) * tp.buoc[0].kl * 1000));
const khLon = goiYXuLy({ hang: [{ ma: "X", kl: 6000, giaVon: 30, gia: 20 }, { ma: "Y", kl: 1000, giaVon: 50, gia: 80 }], nhanTheoMa: { X: { nhan: "thoat", muc: 3, lyDo: ["BÁN"] }, Y: { nhan: "giu", muc: 0, lyDo: [] } }, phongCach: "trung_han", taiSan: { tienMat: 0, no: 0, nav: 200e6 }, lsTheoMa: { X: { tenkan: 21, kijun: 23, thap20: 19 } } });
const ax = khLon.hanhDong.find((x) => x.ma === "X");
dat("vi the lon -> mac dinh thoat 3 buoc", ax.cachThoat === "tung_phan" && ax.tungPhan);
const sauTP = apDungKeHoach([{ ma: "X", kl: 6000, giaVon: 30, gia: 20 }], { tienMat: 0, no: 0 }, [ax]);
dat("ap dung thoat 3 buoc: chi ban B1, phan con lai van giu", sauTP.vitri[0].kl === 6000 - ax.tungPhan.buoc[0].kl);
dat("luot song: van mac dinh ban het ngay", goiYXuLy({ hang: [{ ma: "X", kl: 6000, giaVon: 30, gia: 20 }, { ma: "Y", kl: 1000, giaVon: 50, gia: 80 }], nhanTheoMa: { X: { nhan: "thoat", muc: 3, lyDo: ["x"] }, Y: { nhan: "giu", muc: 0, lyDo: [] } }, phongCach: "ngan_han", taiSan: { nav: 200e6 } }).hanhDong.find((x) => x.ma === "X").cachThoat === "ban_het");

// TRUNG BINH GIA CO DIEU KIEN
const vt = { ma: "X", kl: 2000, giaVon: 30, gia: 24 };
dat("chua co diem mua -> cho, khong mua", trungBinhGiaCoDieuKien(vt, { tin: "TRUNG LAP" }, { tienMat: 100e6, nav: 200e6 }).trangThai === "chua_co");
const tb = trungBinhGiaCoDieuKien(vt, { tin: "MUA", stop_loss: 22.8 }, { tienMat: 100e6, nav: 200e6, tong: 100e6 });
dat("dang MUA: mua them theo rui ro 1% NAV (2tr / 1,2 = 1600 cp)", tb.trangThai === "dang_mua" && tb.kl === 1000, JSON.stringify(tb));
dat("gia von moi thap hon, hoi can it hon", tb.gvMoi < 30 && tb.hoiCanSau < tb.hoiCanTruoc);
dat("lo neu cham cat lo = kl x (gia - cat lo)", gan(tb.loNeuCatLo, 1000 * (24 - 22.8) * 1000));
dat("dang dung margin -> khong mua", trungBinhGiaCoDieuKien(vt, { tin: "MUA", stop_loss: 22.8 }, { tienMat: 100e6, no: 50e6, nav: 200e6 }).kl === 0);
dat("diem B gan day -> co diem mua", trungBinhGiaCoDieuKien(vt, { tin: "TRUNG LAP", pb_cach: 1, pb_gia: 23.5, pb_sl: 22 }, { tienMat: 100e6, nav: 200e6 }).trangThai === "diem_b");
dat("vung mua kich ban -> gia mua = can duoi", trungBinhGiaCoDieuKien(vt, { tin: "TRUNG LAP", mua_tu: 24.5, mua_den: 25.5 }, { tienMat: 100e6, nav: 200e6 }).giaMua === 24.5);
dat("ma dang lai -> khong ap dung", trungBinhGiaCoDieuKien({ ma: "X", kl: 100, giaVon: 20, gia: 24 }, { tin: "MUA", stop_loss: 22 }) === null);
dat("ma cung nganh khoe: loc MUA/NAM GIU tren Kijun + can bang, diem cao truoc", JSON.stringify(maCungNganhKhoe("A", { A: { ma: "A", nganh: "Thép" }, B: { ma: "B", nganh: "Thép", tin: "MUA", gia: 10, kijun: 9, gg_bot: 8, diem: 5 }, C: { ma: "C", nganh: "Thép", tin: "NAM GIU", gia: 10, kijun: 9, gg_bot: 8, diem: 7 }, D: { ma: "D", nganh: "Thép", tin: "MUA", gia: 8, kijun: 9, gg_bot: 8, diem: 9 } }).map((x) => x.ma)) === '["C","B"]');

// NHAT KY
let ds = [];
let r = apDungGiaoDich(ds, { ngay: "2026-10-01", ma: "hpg", loai: "mua", kl: 1000, gia: 25 }, { phiPct: 0.15 });
dat("mua: gia von gom phi", gan(r.ds[0].giaVon, 25.0375, 1e-3) && r.ds[0].ma === "HPG");
ds = r.ds;
r = apDungGiaoDich(ds, { ngay: "2026-10-05", ma: "HPG", loai: "mua", kl: 1000, gia: 27 });
ds = r.ds;
dat("mua lan 2: binh quan", gan(ds[0].giaVon, (25.0375 + 27) / 2, 1e-3) && ds[0].kl === 2000);
dat("ban qua so luong -> loi", !!apDungGiaoDich(ds, { ma: "HPG", loai: "ban", kl: 3000, gia: 30 }).loi);
r = apDungGiaoDich(ds, { ngay: "2026-10-10", ma: "HPG", loai: "ban", kl: 500, gia: 30 }, { phiPct: 0.15 });
const gv = (25.0375 + 27) / 2;
dat("ban: lai chot da tru phi + thue 0,1%", gan(r.ghi.laiChot, 500 * 30 * 1000 * (1 - 0.0015 - 0.001) - 500 * gv * 1000, 1) && r.ds[0].kl === 1500 && gan(r.ds[0].giaVon, gv, 1e-3));
const nk = [r.ghi, { loai: "ban", ma: "X", laiChot: -2e6, laiChotPct: -12 }, { loai: "mua", ma: "X" }];
const tk = thongKeNhatKy(nk, { catLo: -10 });
dat("thong ke: 2 lenh ban, 1 thang, vi pham cat lo 1", tk.soLenhBan === 2 && tk.soThang === 1 && tk.viPhamCatLo === 1 && tk.loLonNhat.ma === "X");

console.log(loi ? `\n${loi} test SAI` : "\nTat ca dung");
process.exit(loi ? 1 : 0);
