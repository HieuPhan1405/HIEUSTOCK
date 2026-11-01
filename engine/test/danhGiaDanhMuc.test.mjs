// Test tay: node engine/test/danhGiaDanhMuc.test.mjs
import { docDanDanhMuc, nhanXetMa, danhGiaDanhMuc, phanTramGiamDenNguong } from "../../lib/danhGiaDanhMuc.js";
let loi = 0;
const dat = (ten, dk, them = "") => { if (dk) console.log("ok:", ten); else { console.log("SAI:", ten, them); loi++; } };
const gan = (a, b, e = 1e-6) => Math.abs(a - b) <= e;

// doc van ban dan
const d = docDanDanhMuc("hpg 1000 25,5\nVCB 500 57.2\nSSI 200\n\nXX\nFPT 100 abc\nMBB 1.000 20");
dat("doc dan: 4 dong hop le, gia dau phay -> 25.5", d.ds.length === 4 && d.ds[0].giaVon === 25.5 && d.ds[0].ma === "HPG", JSON.stringify(d));
dat("doc dan: thieu gia van duoc (giaVon null), 'XX' va 'FPT abc' bi bo qua", d.ds[2].giaVon === null && d.boQua.length === 2, JSON.stringify(d.boQua));
dat("doc dan: KL '1.000' = 1000 (dau cham la ngan cach nghin)", d.ds[3].kl === 1000, d.ds[3].kl);

const R = (o) => ({ gia: 20, tin: "NAM GIU", diem: 3, kijun: 18, gg_bot: 15, stop_loss: 17, tp1: 24, nganh: "Thep", von_hoa: "Midcap", ...o });
dat("nhan xet: BAN + gia chua duoi Kijun", nhanXetMa(R({ tin: "BAN" }), 5).some((x) => x.muc === 0 && /BÁN/.test(x.nhan)));
dat("nhan xet: gan cat lo (1,2%)", nhanXetMa(R({ stop_loss: 19.8 }), 0).some((x) => /cắt lỗ/.test(x.nhan) && x.muc === 0));
dat("nhan xet: duoi Kijun (khong co BAN)", nhanXetMa(R({ kijun: 22 }), 0).some((x) => /dưới Kijun/.test(x.nhan)));
dat("nhan xet: duoi duong can bang dai han uu tien hon Kijun", nhanXetMa(R({ gg_bot: 21, kijun: 22 }), 0).some((x) => /cân bằng dài hạn/.test(x.nhan)) && !nhanXetMa(R({ gg_bot: 21, kijun: 22 }), 0).some((x) => /dưới Kijun/.test(x.nhan)));
dat("nhan xet: gan TP1 (2%)", nhanXetMa(R({ tp1: 20.4 }), 0).some((x) => /TP1/.test(x.nhan) && x.muc === 2));
dat("nhan xet: lo 12% -> chu y", nhanXetMa(R(), -12).some((x) => /lỗ 12,0%/.test(x.nhan)));
dat("nhan xet: khong co du lieu ma", nhanXetMa(null, null)[0].muc === 1);

// danh muc: 2 ma, A chiem 75% (3 ty, lai 50%), B chiem 25%
const theoMa = { AAA: R({ gia: 30, kijun: 25, nganh: "Thep" }), BBB: R({ gia: 10, kijun: 12, tin: "BAN", nganh: "Ngan hang", stop_loss: 9 }) };
const g = danhGiaDanhMuc([{ ma: "AAA", kl: 1000, giaVon: 20 }, { ma: "BBB", kl: 1000, giaVon: 12 }, { ma: "ZZZ", kl: 10, giaVon: 5 }], theoMa);
dat("tong gia tri = 40 trieu (30k*1000 + 10k*1000)", gan(g.tongGiaTri, 40_000_000), g.tongGiaTri);
dat("lai lo AAA +50%, BBB -16,67%; tong von 32 trieu -> +25%", gan(g.hang[0].laiLoPct, 50) && gan(g.hang[1].laiLoPct, -100 / 6) && gan(g.laiLoPct, 25), g.laiLoPct);
dat("ty trong 75% / 25%, ma khong co gia (ZZZ) khong tinh", gan(g.hang[0].tyTrong, 0.75) && g.hang[2].tyTrong === null && g.thieu.join() === "ZZZ");
dat("phan bo nganh sap giam", g.nganh[0].ten === "Thep" && gan(g.nganh[0].tyTrong, 0.75));
dat("diem trong 0..100, xep loai co gia tri", g.diem >= 0 && g.diem <= 100 && typeof g.xepLoai === "string", g.diem);
dat("nhan xet: nhac AAA qua tap trung (75%) va BBB bao ban; nang truoc", g.nhanXet.some((x) => /AAA chiếm 75%/.test(x.nhan)) && g.nhanXet.some((x) => /cảnh báo nặng/.test(x.nhan)) && g.nhanXet[0].muc === 0, JSON.stringify(g.nhanXet));
// da dang tot -> diem cao hon
const nhieu = Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`M${i}`, R({ gia: 20, kijun: 18, nganh: `N${i % 5}` })]));
const g2 = danhGiaDanhMuc(Object.keys(nhieu).map((ma) => ({ ma, kl: 100, giaVon: 19 })), nhieu);
dat("10 ma deu nhau, tren Kijun -> diem cao (>= 90) va xep 'Tốt'", g2.diem >= 90 && g2.xepLoai === "Tốt", g2.diem);
dat("rong -> khong loi, diem null", danhGiaDanhMuc([], {}).diem === null);
// von & margin
dat("giam den nguong: GT 100tr, no 50tr, khong tien mat, nguong 35% -> giam 23,08%", gan(phanTramGiamDenNguong(100e6, 0, 50e6, 35), 100 * (1 - 50 / 0.65 / 100), 1e-6), phanTramGiamDenNguong(100e6, 0, 50e6, 35));
dat("co 20tr tien mat -> giam 43,08% (dem day hon)", gan(phanTramGiamDenNguong(100e6, 20e6, 50e6, 35), 100 * (1 - (50 / 0.65 - 20) / 100), 1e-6));
dat("khong no -> null; no lon hon muc cho phep -> 0", phanTramGiamDenNguong(100e6, 0, 0, 35) === null && phanTramGiamDenNguong(100e6, 0, 80e6, 35) === 0);
{
  const th = { AAA: R({ gia: 50, kijun: 40 }) };
  const v = [{ ma: "AAA", kl: 2000, giaVon: 40 }]; // GT 100tr
  const gm = danhGiaDanhMuc(v, th, { tienMat: 0, no: 50e6, laiSuat: 12 });
  dat("NAV = 50tr, don bay 2,0x, ty le ky quy 50%", gan(gm.taiSan.nav, 50e6) && gan(gm.margin.donBay, 2) && gan(gm.margin.tyLeKyQuy, 50), JSON.stringify(gm.margin));
  dat("lai margin 12%/nam tren 50tr = 0,5 trieu/thang", gan(gm.margin.laiMoiThang, 500000));
  dat("nhan xet margin: giam ~23% cham canh bao, don bay 2,00x, het tien mat", gm.nhanXet.some((x) => /đòn bẩy 2,00x/.test(x.nhan) && /23%/.test(x.nhan)) && gm.nhanXet.some((x) => /hết tiền mặt/.test(x.nhan)), JSON.stringify(gm.nhanXet.map((x) => x.nhan)));
  const gc = danhGiaDanhMuc(v, th, { tienMat: 0, no: 70e6 }); // ky quy 30% < 35 -> da cham
  dat("da cham canh bao -> muc 0", gc.nhanXet.some((x) => x.muc === 0 && /đã chạm/.test(x.nhan)), JSON.stringify(gc.nhanXet.map((x) => x.nhan)));
  const ts = danhGiaDanhMuc(v, th, { tienMat: 100e6, no: 0 });
  dat("tien mat 50% -> nhan xet cho co hoi, khong margin", ts.margin === null && ts.nhanXet.some((x) => /Tiền mặt chiếm 50%/.test(x.nhan)), JSON.stringify(ts.nhanXet.map((x) => x.nhan)));
  dat("tru diem margin: diem co margin mong < diem khong margin", gm.diem < danhGiaDanhMuc(v, th, { tienMat: 0, no: 0 }).diem, gm.diem);
}
// dang song nganh: cam 4 ma cung nganh -> khong bi tru nhieu diem + nhan xet 'co ly do'
{
  const th = Object.fromEntries(["A", "B", "C", "D"].map((m) => [m, R({ gia: 20, kijun: 18, nganh: "Thép" })]));
  const v = ["A", "B", "C", "D"].map((ma) => ({ ma, kl: 1000, giaVon: 19 }));
  const song = danhGiaDanhMuc(v, th, { gocNganh: { "Thép": "Leading" } });
  const khong = danhGiaDanhMuc(v, th, { gocNganh: { "Thép": "Lagging" } });
  dat("song nganh: nhan xet noi co ly do, diem da dang cao hon khi nganh tut hau", song.nhanXet.some((x) => /có lý do/.test(x.nhan)) && song.chiTietDiem.daDang > khong.chiTietDiem.daDang, `${song.chiTietDiem.daDang} vs ${khong.chiTietDiem.daDang}`);
  dat("nganh tut hau: canh bao nang (muc 0) + nhac goc Tut hau", khong.nhanXet.some((x) => x.muc === 0 && /Tụt hậu/.test(x.nhan)), JSON.stringify(khong.nhanXet.map((x) => x.nhan)));
}
console.log(loi === 0 ? "TAT CA DAT" : `${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
