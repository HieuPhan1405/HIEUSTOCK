// Test tay cho lib/chotLoiTungPhan.js (chot loi TP1/TP2/TP3 ghi thanh dong "Lenh da dong" ngay luc cham moc).
// Chay: node engine/test/chotLoiTungPhan.test.mjs
import { phatHienChotLoiTungPhan, tinhDongPhanConLai, dongNapBuTP12, theoDoiKieuMoi, khoaTP, hangTP } from "../../lib/chotLoiTungPhan.js";

let loi = 0;
const ok = (ten, dk, them = "") => {
  if (!dk) {
    loi++;
    console.log("SAI:", ten, them);
  } else console.log("ok:", ten);
};
const gan = (a, b, e = 1e-9) => Math.abs(a - b) <= e;

const NGAY_MUA = "2026-09-01";
const NGAY_BAN = "2026-09-24";
const cuGoc = (tp_da_cham = null, them = {}) => ({ ma: "ABC", tin: "NAM GIU", tp_da_cham, ngay_mua_txt: NGAY_MUA, gia_vao_web: 20, gia_mua: 20, vao_tp1: 22, vao_tp2: 24, vao_tp3: 28, ...them });
const moi = (tp_da_cham, them = {}) => ({ ma: "ABC", tin: "NAM GIU", tp_da_cham, ngay_mua: NGAY_MUA, so_phien_giu: 12, tp1: 22.5, tp2: 24.5, tp3: 28.5, ...them });
// chay = CACH CU (30/30/25, ghi ca dong TP3 25%): hangToiDa = 3. chayMoi = cach 2 TP + giu den BAN (mac dinh): chi ghi TP1/TP2, TP3 chi la moc tham khao.
const chay = (cu, m, daGhi = new Set()) => phatHienChotLoiTungPhan({ dsMoi: [m], banGhiCuTheoMa: { [m.ma]: cu }, ngayBan: NGAY_BAN, daGhi, hangToiDa: 3 });
const chayMoi = (cu, m, daGhi = new Set()) => phatHienChotLoiTungPhan({ dsMoi: [m], banGhiCuTheoMa: { [m.ma]: cu }, ngayBan: NGAY_BAN, daGhi });

ok("hangTP", hangTP(null) === 0 && hangTP("TP1") === 1 && hangTP("TP2") === 2 && hangTP("TP3") === 3);

// 1. Vi the moi cham TP1 -> 1 dong vong 5, 30%, lai tren gia cua phan do
let r = chay(cuGoc(null), moi("TP1"));
ok("TP1: 1 dong vong 5", r.dong.length === 1 && r.dong[0].vong === 5 && r.dong[0].ly_do === "TP1" && r.dong[0].phan_chot_pct === 30, JSON.stringify(r));
ok("TP1: gia ban = vao_tp1 (dong bang), lai = 10%", r.dong[0].gia_ban === 22 && gan(r.dong[0].lai_lo_pct, 10) && r.dong[0].gia_mua === 20 && r.dong[0].ngay_ban === NGAY_BAN && r.dong[0].so_phien === 12);
ok("TP1: khong co TP3 kieu cu", r.tp3KieuCu.length === 0);

// 2. TP1 -> TP2 (dong TP1 da co)
const daCoTP1 = new Set([khoaTP("ABC", NGAY_MUA, 1)]);
r = chay(cuGoc("TP1"), moi("TP2"), daCoTP1);
ok("TP2: 1 dong vong 6, 30%", r.dong.length === 1 && r.dong[0].vong === 6 && r.dong[0].phan_chot_pct === 30 && r.dong[0].gia_ban === 24 && gan(r.dong[0].lai_lo_pct, 20), JSON.stringify(r));

// 3. Nhay tu chua TP len TP3 trong 1 lan upload -> du 3 dong, TP3 = 25% vong 1
r = chay(cuGoc(null), moi("TP3"));
ok("nhay len TP3: 3 dong", r.dong.length === 3 && r.dong.map((d) => d.vong).join() === "5,6,1" && r.dong.map((d) => d.phan_chot_pct).join() === "30,30,25", JSON.stringify(r.dong.map((d) => [d.vong, d.phan_chot_pct])));
ok("nhay len TP3: khong ghi kieu cu", r.tp3KieuCu.length === 0);
// tong dong gop = dong gop cua dong 85% kieu cu: sum(w * (t/g - 1)) tinh tren toan vi the
const tongMoi = r.dong.reduce((s, d) => s + (d.phan_chot_pct / 100) * d.lai_lo_pct, 0);
const tongCu = 30 * (22 / 20 - 1) + 30 * (24 / 20 - 1) + 25 * (28 / 20 - 1);
ok("tong dong gop 3 dong moi = 1 dong gop 85% kieu cu", gan(tongMoi, tongCu), `${tongMoi} vs ${tongCu}`);

// 4. Kieu cu: da o TP1 tu truoc, chua co dong TP1 -> len TP2 khong ghi gi; len TP3 chi bao "tp3KieuCu"
r = chay(cuGoc("TP1"), moi("TP2"), new Set());
ok("kieu cu: TP1->TP2 khong ghi dong", r.dong.length === 0 && r.tp3KieuCu.length === 0);
r = chay(cuGoc("TP2"), moi("TP3"), new Set());
ok("kieu cu: TP2->TP3 -> tp3KieuCu (gop 85%)", r.dong.length === 0 && r.tp3KieuCu.length === 1);
r = chay(cuGoc("TP1"), moi("TP3"), new Set());
ok("kieu cu: TP1->TP3 -> chi tp3KieuCu, khong dong TP2", r.dong.length === 0 && r.tp3KieuCu.length === 1);

// 5. TP1 co dong -> nhay len TP3: du TP2 va TP3 kieu moi
r = chay(cuGoc("TP1"), moi("TP3"), daCoTP1);
ok("kieu moi TP1->TP3: dong TP2 + TP3", r.dong.map((d) => d.vong).join() === "6,1" && r.tp3KieuCu.length === 0, JSON.stringify(r.dong.map((d) => d.vong)));
// TP2 co dong TP1 nhung THIEU dong TP2 -> khong phai kieu moi day du
ok("theoDoiKieuMoi: TP2 thieu dong TP2 -> false", theoDoiKieuMoi(cuGoc("TP2"), daCoTP1) === false);
ok("theoDoiKieuMoi: TP2 du 2 dong -> true", theoDoiKieuMoi(cuGoc("TP2"), new Set([khoaTP("ABC", NGAY_MUA, 1), khoaTP("ABC", NGAY_MUA, 2)])) === true);
ok("theoDoiKieuMoi: chua TP -> true", theoDoiKieuMoi(cuGoc(null), new Set()) === true);
ok("theoDoiKieuMoi: da TP3 nhung thieu dong TP2 -> false", theoDoiKieuMoi(cuGoc("TP3"), daCoTP1) === false);
ok("theoDoiKieuMoi: TP3 chi la moc tham khao, du dong TP1+TP2 -> true", theoDoiKieuMoi(cuGoc("TP3"), new Set([khoaTP("ABC", NGAY_MUA, 1), khoaTP("ABC", NGAY_MUA, 2)])) === true);
ok("theoDoiKieuMoi: lenh cu da ghi dong TP3 -> false (giu kieu cu)", theoDoiKieuMoi(cuGoc("TP3"), new Set([khoaTP("ABC", NGAY_MUA, 1), khoaTP("ABC", NGAY_MUA, 2), khoaTP("ABC", NGAY_MUA, 3)])) === false);

// 6. Khong ghi khi: khong tang muc, khong dang giu, khac ngay mua, VNINDEX, gia TP <= gia mua
ok("khong tang muc -> khong ghi", chay(cuGoc("TP1"), moi("TP1"), daCoTP1).dong.length === 0);
ok("khong dang giu -> khong ghi", chay(cuGoc(null), moi("TP1", { tin: "BAN" })).dong.length === 0);
ok("khac ngay mua -> khong ghi", chay(cuGoc(null), moi("TP1", { ngay_mua: "2026-09-10" })).dong.length === 0);
ok("VNINDEX -> bo qua", chay(cuGoc(null, { ma: "VNINDEX" }), moi("TP1", { ma: "VNINDEX" })).dong.length === 0);
ok("gia TP <= gia mua -> bo qua", chay(cuGoc(null, { vao_tp1: 19 }), moi("TP1")).dong.length === 0);
ok("khong co ban ghi cu -> khong ghi", phatHienChotLoiTungPhan({ dsMoi: [moi("TP1")], banGhiCuTheoMa: {}, ngayBan: NGAY_BAN }).dong.length === 0);
// Uu tien gia TP: vao_tp (dong bang) > tp cu > tp moi
ok("gia TP: uu tien vao_tp1", chay(cuGoc(null, { vao_tp1: 22, tp1: 23 }), moi("TP1", { tp1: 24 })).dong[0].gia_ban === 22);
ok("gia TP: thieu vao_tp1 -> tp cu", chay(cuGoc(null, { vao_tp1: null, tp1: 23 }), moi("TP1", { tp1: 24 })).dong[0].gia_ban === 23);
ok("gia TP: thieu ca 2 -> tp moi", chay(cuGoc(null, { vao_tp1: null, tp1: null }), moi("TP1", { tp1: 24 })).dong[0].gia_ban === 24);

// 7. Dong lenh that su: chi ghi phan con lai neu co dong TP tuong ung
const day2 = new Set([khoaTP("ABC", NGAY_MUA, 1), khoaTP("ABC", NGAY_MUA, 2)]);
let p = tinhDongPhanConLai({ cu: cuGoc("TP1"), giaMua: 20, giaBan: 19, daGhi: daCoTP1 });
ok("dong lenh sau TP1 (co dong TP1): con 70%, lai/lo don gian", p && p.phan_chot_pct === 70 && gan(p.lai_lo_pct, -5), JSON.stringify(p));
p = tinhDongPhanConLai({ cu: cuGoc("TP2"), giaMua: 20, giaBan: 23, daGhi: day2 });
ok("dong lenh sau TP2 (du 2 dong): con 40%", p && p.phan_chot_pct === 40 && gan(p.lai_lo_pct, 15), JSON.stringify(p));
ok("dong lenh sau TP2 nhung thieu dong TP2 -> kieu cu (null)", tinhDongPhanConLai({ cu: cuGoc("TP2"), giaMua: 20, giaBan: 23, daGhi: daCoTP1 }) === null);
ok("dong lenh sau TP1 khong co dong -> kieu cu (null)", tinhDongPhanConLai({ cu: cuGoc("TP1"), giaMua: 20, giaBan: 23, daGhi: new Set() }) === null);
ok("dong lenh chua cham TP -> null (tinh nhu cu)", tinhDongPhanConLai({ cu: cuGoc(null), giaMua: 20, giaBan: 23, daGhi: day2 }) === null);
ok("dong lenh sau TP3 cua lenh CU (da ghi dong TP3) -> null (vong 3 xu ly rieng)", tinhDongPhanConLai({ cu: cuGoc("TP3"), giaMua: 20, giaBan: 23, daGhi: new Set([...day2, khoaTP("ABC", NGAY_MUA, 3)]) }) === null);
p = tinhDongPhanConLai({ cu: cuGoc("TP3"), giaMua: 20, giaBan: 23, daGhi: day2 });
ok("dong lenh sau TP3 (TP3 chi la moc tham khao, chua co dong TP3) -> phan con lai 40%", p && p.phan_chot_pct === 40 && gan(p.lai_lo_pct, 15), JSON.stringify(p));

// Tong 30+30+25 + phan con lai 15 = 100
ok("30+30+25+15 = 100", 30 + 30 + 25 + 15 === 100);

// 8. Nap bu
const nen = [{ t: "2026-09-01", h: 20 }, { t: "2026-09-02", h: 22.2 }, { t: "2026-09-03", h: 21 }, { t: "2026-09-04", h: 24.3 }];
const chamGia = (n, ngayMua, gia) => {
  let so = 0;
  for (const b of n) {
    if (b.t <= ngayMua) continue;
    so++;
    if (b.h >= gia) return { ngay: b.t, soPhien: so };
  }
  return null;
};
const uv = (tp_da_cham) => ({ ma: "ABC", tin: "NAM GIU", gia_mua: 20, gia_vao_web: 20, tp1: 22.5, tp2: 24.5, vao_tp1: 22, vao_tp2: 24, tp_da_cham, so_phien_giu: 9, ngay_mua_txt: NGAY_MUA });
let nb = dongNapBuTP12(uv("TP2"), nen, chamGia, NGAY_BAN);
ok("nap bu TP2: 2 dong vong 5,6 dung ngay cham", nb.length === 2 && nb[0].vong === 5 && nb[0].ngay_ban === "2026-09-02" && nb[1].vong === 6 && nb[1].ngay_ban === "2026-09-04" && nb[0].so_phien === 1 && nb[1].so_phien === 3, JSON.stringify(nb));
nb = dongNapBuTP12(uv("TP1"), nen, chamGia, NGAY_BAN);
ok("nap bu TP1: 1 dong", nb.length === 1 && nb[0].vong === 5);
nb = dongNapBuTP12(uv("TP2"), nen, chamGia, NGAY_BAN, daCoTP1);
ok("nap bu: bo qua dong da co", nb.length === 1 && nb[0].vong === 6);
nb = dongNapBuTP12(uv("TP1"), null, chamGia, NGAY_BAN);
ok("nap bu: khong co lich su gia -> ngay mac dinh", nb.length === 1 && nb[0].ngay_ban === NGAY_BAN && nb[0].ngayTuLichSuGia === false && nb[0].so_phien === 9);
ok("nap bu: khong co TP -> rong", dongNapBuTP12(uv(null), nen, chamGia, NGAY_BAN).length === 0);

// 9. LENH KET THUC O TP3 (cach moi 30/30/40, ketThucTP3 = true): TP3 ghi 40%, 3 dong cong lai = 100% vi the
{
  const chayKT = (cu, m, daGhi = new Set()) => phatHienChotLoiTungPhan({ dsMoi: [m], banGhiCuTheoMa: { [m.ma]: cu }, ngayBan: NGAY_BAN, daGhi, ketThucTP3: true });
  const r = chayKT(cuGoc(null), moi("TP3"));
  ok("ket thuc TP3: 3 dong TP1/TP2/TP3 voi 30/30/40", r.dong.length === 3 && r.dong.map((d) => d.phan_chot_pct).join() === "30,30,40" && r.dong.map((d) => d.vong).join() === "5,6,1", JSON.stringify(r.dong.map((d) => [d.vong, d.phan_chot_pct])));
  ok("ket thuc TP3: tong trong so = 100%", r.dong.reduce((s, d) => s + d.phan_chot_pct, 0) === 100);
  const tongKT = r.dong.reduce((s, d) => s + (d.phan_chot_pct / 100) * d.lai_lo_pct, 0);
  ok("ket thuc TP3: lai gop = 0,3x10 + 0,3x20 + 0,4x40 = 25%", gan(tongKT, 0.3 * 10 + 0.3 * 20 + 0.4 * 40, 1e-9), String(tongKT));
  // da co dong TP1, TP2 (kieu moi) -> chi con dong TP3 40%
  const r2 = chayKT(cuGoc("TP2"), moi("TP3"), new Set([khoaTP("ABC", NGAY_MUA, 1), khoaTP("ABC", NGAY_MUA, 2)]));
  ok("ket thuc TP3 sau khi da co TP1+TP2: chi dong TP3 40%", r2.dong.length === 1 && r2.dong[0].vong === 1 && r2.dong[0].phan_chot_pct === 40 && r2.dong[0].gia_ban === 28, JSON.stringify(r2.dong));
  // vi the kieu cu (da o TP1, chua co dong TP1): khong ghi dong tung phan, bao tp3KieuCu de lenhDaDong.js gop 1 dong
  const r3 = chayKT(cuGoc("TP1"), moi("TP3"), new Set());
  ok("ket thuc TP3 vi the kieu cu: khong ghi dong tung phan, bao tp3KieuCu", r3.dong.length === 0 && r3.tp3KieuCu.length === 1);
  // MAC DINH (cach 2 TP + giu den BAN): nhay len TP3 chi ghi TP1 + TP2 (30/30), TP3 khong ghi dong nao; da co TP1+TP2 thi khong ghi them
  const rm = chayMoi(cuGoc(null), moi("TP3"));
  ok("mac dinh: nhay len TP3 chi ghi TP1/TP2 30/30, khong co dong TP3", rm.dong.length === 2 && rm.dong.map((d) => d.vong).join() === "5,6" && rm.dong.map((d) => d.phan_chot_pct).join() === "30,30" && rm.tp3KieuCu.length === 0, JSON.stringify(rm.dong.map((d) => [d.vong, d.phan_chot_pct])));
  ok("mac dinh: da co TP1+TP2, len TP3 -> khong ghi gi", chayMoi(cuGoc("TP2"), moi("TP3"), new Set([khoaTP("ABC", NGAY_MUA, 1), khoaTP("ABC", NGAY_MUA, 2)])).dong.length === 0);
  ok("cach cu (hangToiDa 3): TP3 van 25%", chay(cuGoc(null), moi("TP3")).dong.find((d) => d.vong === 1).phan_chot_pct === 25);
}

console.log(loi === 0 ? "\nTAT CA DAT" : `\n${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
