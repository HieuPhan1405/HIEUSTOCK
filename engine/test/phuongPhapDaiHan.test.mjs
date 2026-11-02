// Test tay: node engine/test/phuongPhapDaiHan.test.mjs
import { lichGiaiNgan, nhanDinhGia, tyLeGiaTrenHopLy, loaiMaRuiRo, chiaKhungLoiVeTinh, PHUONG_PHAP, DOT_GIAI_NGAN } from "../../lib/phuongPhapDaiHan.js";
import { DAI_HAN } from "../../lib/phuongPhapDaiHanDuLieu.js";
import { CO_RUI_RO } from "../../lib/coRuiRoDaiHan.js";
import { BANG_NAM } from "../../lib/phuongPhapDaiHanKetQua.js";
let loi = 0;
const dat = (ten, dk, them = "") => { if (dk) console.log("ok:", ten); else { console.log("SAI:", ten, them); loi++; } };

// lich giai ngan
const l = lichGiaiNgan({ gia: 100, sma50: 95, sma200: 80, ggTop: 90, locXuHuong: true });
dat("qua xu huong (100 > 90): du 5 dot, dot 1 = gia hien tai", l.quaXuHuong && l.dot.length === 5 && l.dot[0].gia === 100);
dat("dot 2 = SMA50 (95 < 98)", l.dot[1].gia === 95);
dat("dot 3 = giam 10% nhung thap hon dot 2 it nhat 3% (95 x 0,97 = 92,15 > 90)", l.dot[2].gia === 90);
dat("dot 4 = SMA200 (80 < 88)", l.dot[3].gia === 80 || l.dot[3].gia === Math.round(87.3 * 100) / 100, JSON.stringify(l.dot.map((d) => d.gia)));
dat("cac dot giam dan, moi dot thap hon dot truoc >= 3%", l.dot.every((d, i) => i === 0 || d.gia <= l.dot[i - 1].gia * 0.97 + 1e-9), JSON.stringify(l.dot.map((d) => d.gia)));
dat("5 dot x 20% = 100%", l.dot.reduce((s, d) => s + d.ty, 0) === 100 && DOT_GIAI_NGAN.length === 5);
const l2 = lichGiaiNgan({ gia: 100, sma50: 99, sma200: 98, ggTop: 90 });
dat("SMA50 sat gia (99 > 98) -> dot 2 = gia - 3%; SMA200 sat -> dot 4 = gia - 15% (khong dung SMA)", l2.dot[1].gia === 97 && l2.dot[3].gia <= 85, JSON.stringify(l2.dot.map((d) => d.gia)));
const l3 = lichGiaiNgan({ gia: 100, sma50: 95, ggTop: 110, locXuHuong: true });
dat("duoi can bang dai han (100 < 110) + loc xu huong -> chua giai ngan, bao muc can vuot", !l3.quaXuHuong && l3.choGiaVuot === 110 && l3.dot.every((d) => d.gia == null) && /110/.test(l3.dot[0].ghiChu));
const l4 = lichGiaiNgan({ gia: 100, sma50: 95, ggTop: 110, locXuHuong: false });
dat("khong loc xu huong (Co tuc / Graham): van co lich du duoi can bang", l4.quaXuHuong && l4.dot[0].gia === 100);
dat("gia loi -> rong", lichGiaiNgan({ gia: null }).dot.length === 0 && lichGiaiNgan({ gia: 0 }).dot.length === 0);
dat("thieu SMA -> dung giam 3% / 15%", lichGiaiNgan({ gia: 50, locXuHuong: false }).dot[1].gia === 48.5 && lichGiaiNgan({ gia: 50 }).dot[3].gia === 42.5);

// dinh gia
dat("r 0,4 canh bao, 0,6 re, 1,0 hop ly, 1,3 dat, null khong", nhanDinhGia(0.4).khoa === "canh_bao" && nhanDinhGia(0.6).khoa === "re" && nhanDinhGia(1).khoa === "hop_ly" && nhanDinhGia(1.3).khoa === "dat" && nhanDinhGia(null).khoa === "khong");
dat("bien 0,5 -> re, 0,8 -> re, 1,1 -> hop ly", nhanDinhGia(0.5).khoa === "re" && nhanDinhGia(0.8).khoa === "re" && nhanDinhGia(1.1).khoa === "hop_ly");
dat("ty le gia / hop ly", tyLeGiaTrenHopLy(80, 100) === 0.8 && tyLeGiaTrenHopLy(80, null) === null && tyLeGiaTrenHopLy(null, 100) === null);

// rui ro
const lc = loaiMaRuiRo([{ ma: "A" }, { ma: "PNJ" }, { ma: "B" }, { ma: "DGC" }], CO_RUI_RO);
dat("loai PNJ, DGC khoi danh sach, ghi lai ly do", lc.ds.map((m) => m.ma).join() === "A,B" && lc.daLoai.map((x) => x.ma).join() === "PNJ,DGC" && lc.daLoai.every((x) => x.lyDo));

// khung loi / ve tinh
const k = chiaKhungLoiVeTinh({ loi: [{ ma: "A" }, { ma: "B" }, { ma: "C" }, { ma: "D" }, { ma: "E" }], veTinh: [{ ma: "X" }, { ma: "Y" }] });
dat("loi 65% chia 5 ma = 13%, ve tinh 35% chia 2 = 17,5%", k.loi.every((m) => m.ty === 13) && k.veTinh.every((m) => m.ty === 17.5));
dat("khong ma nao -> khong loi", chiaKhungLoiVeTinh({}).loi.length === 0);

// du lieu sinh ra
dat("co du lieu 4 phuong phap, ngay + quy", DAI_HAN.buffett.length > 5 && DAI_HAN.coTuc.length > 5 && DAI_HAN.graham.length > 5 && DAI_HAN.itBienDong.length === 15 && /^\d{4}-\d{2}-\d{2}$/.test(DAI_HAN.giaDen) && /^\d{4}-\d{2}-\d{2}$/.test(DAI_HAN.quyBaoCao));
dat("moi ma co gia, ROE, von hoa", [...DAI_HAN.buffett, ...DAI_HAN.coTuc].every((m) => m.gia > 0 && m.vonHoaTy >= 5000 && m.roe != null));
dat("Buffett: ROE >= 15, P/E <= 20", DAI_HAN.buffett.every((m) => m.roe >= 15 && m.pe <= 20));
dat("Co tuc: ty suat 0 < x <= 15", DAI_HAN.coTuc.every((m) => m.tySuatCoTuc > 0 && m.tySuatCoTuc <= 15));
dat("Graham: P/E <= 15, P/E x P/B <= 22,5", DAI_HAN.graham.every((m) => m.pe <= 15 && m.peXpb <= 22.5));
dat("khung loi ~65%, ve tinh ~35%", Math.abs(DAI_HAN.khung.loi.reduce((s, m) => s + m.ty, 0) - 65) < 1 && Math.abs(DAI_HAN.khung.veTinh.reduce((s, m) => s + m.ty, 0) - 35) < 1);
dat("4 phuong phap co mo ta + dieu kien", Object.values(PHUONG_PHAP).every((p) => p.ten && p.moTa && p.dieuKien.length >= 3));
dat("bang nam: moi dong 5 nam", BANG_NAM.dong.every((d) => d.nam.length === BANG_NAM.nam.length));

console.log(loi ? `\n${loi} test SAI` : "\nTat ca dung");
process.exit(loi ? 1 : 0);
