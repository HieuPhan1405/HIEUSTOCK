// Test tay: node engine/test/xuLyDanhMuc.test.mjs
import { giaVonSauMua, soCpDeVeGiaVon, goiYXuLy, apDungKeHoach } from "../../lib/xuLyDanhMuc.js";
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
const sau = apDungKeHoach(hang, { tienMat: 0, no: 30e6 }, [a, b]);
dat("sau: A het, B con 1000", !sau.vitri.some((x) => x.ma === "A") && sau.vitri.find((x) => x.ma === "B").kl === 1000);
dat("sau: tien ban 62tr, tra no 30tr, tien mat 32tr", gan(sau.tienBan, 62e6) && sau.no === 0 && gan(sau.tienMat, 32e6), JSON.stringify(sau));
dat("sau: lai chot = -10tr (A) + 2tr (B)", gan(sau.laiChot, -8e6));
const sau2 = apDungKeHoach(hang, { tienMat: 50e6, no: 0 }, [{ ma: "C", loai: "mua_them", kl: 500, gia: 33 }]);
dat("mua them: gia von C (30+33)/2, tien mat giam 16,5tr", gan(sau2.vitri.find((x) => x.ma === "C").giaVon, 31.5) && gan(sau2.tienMat, 33.5e6));
const tnSau = apDungKeHoach([{ ma: "C", kl: 1000, giaVon: 30, gia: 33 }, { ma: "D", kl: 10000, giaVon: 30, gia: 30 }], { tienMat: 0, no: 200e6 }, [tn]);
dat("giam no: no giam, kl giam", tnSau.no < 200e6 && tnSau.vitri[0].kl < 10000, JSON.stringify(tnSau));

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
