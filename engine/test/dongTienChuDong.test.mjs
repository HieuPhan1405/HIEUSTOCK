// Test tay cho engine/loi/dongTienChuDong.js. Chay: node engine/test/dongTienChuDong.test.mjs
import { BoGopDongTien, chuanHoaChieu, phanTichThoiGian, phaGiaoDich, tongHopThiTruong } from "../loi/dongTienChuDong.js";

let loi = 0;
const ok = (ten, dk, them = "") => {
  if (!dk) {
    loi++;
    console.log("SAI:", ten, them);
  } else console.log("ok:", ten);
};
const gan = (a, b, e = 1e-6) => a != null && b != null && Math.abs(a - b) < e;

ok("chieu: BUY/SELL/1/2/B/S, la -> null", chuanHoaChieu("BUY") === "m" && chuanHoaChieu("SELL") === "b" && chuanHoaChieu(1) === "m" && chuanHoaChieu("2") === "b" && chuanHoaChieu("B") === "m" && chuanHoaChieu("S") === "b" && chuanHoaChieu("X") === null && chuanHoaChieu(null) === null);
{
  const t = phanTichThoiGian("2026-10-23 14:45:05.817");
  ok("thoi gian: ngay, gio, phut, ms", t.ngay === "2026-10-23" && t.gio === "14:45:05" && t.phut === "14:45" && t.ms === ((14 * 60 + 45) * 60 + 5) * 1000 + 817, JSON.stringify(t));
  ok("thoi gian: khong ms / sai dinh dang", phanTichThoiGian("2026-10-23 09:15:00").ms === (9 * 60 + 15) * 60000 && phanTichThoiGian("abc") === null && phanTichThoiGian(undefined) === null);
}
ok("pha: ATO / LT / ATC (ke ca 14:45:05)", phaGiaoDich("09:10:00") === "ATO" && phaGiaoDich("09:15:00") === "LT" && phaGiaoDich("14:29:59") === "LT" && phaGiaoDich("14:30:00") === "ATC" && phaGiaoDich("14:45:05") === "ATC");

const tick = (symbol, time, gia, q, side, boardId = "G1") => ({ symbol, boardId, matchPrice: gia, matchQtty: q, side, time });

// 0) he so khoi luong mac dinh: DNSE bao matchQtty theo don vi 10 co phieu -> nhan 10 (500 -> 5.000 cp; 24 x 5.000 / 1000 = 120 trieu)
{
  const b = new BoGopDongTien();
  b.nhanTick(tick("ZZZ", "2026-10-23 10:00:00.000", 24, 500, "BUY"));
  const v = b.chupAnh({ chiTiet: true }).ma.ZZZ;
  ok("he so KL mac dinh = 10: 500 -> 5.000 cp, 120 trieu, profile theo co phieu that", v.kl === 5000 && gan(v.mua, 120) && v.chiTiet.profile[0][1] === 5000, JSON.stringify(v));
}

// 1) mua / ban chu dong + gop lenh + co lenh
{
  const b = new BoGopDongTien({ vn30: new Set(["VPB"]), heSoKl: 1 });
  // lenh mua chu dong 1: 3 lan khop cach 1ms -> gop 1 lenh ~2.160 trieu (lon: >= 500)
  b.nhanTick(tick("VPB", "2026-10-23 10:00:00.100", 24, 10000, "BUY"));
  b.nhanTick(tick("VPB", "2026-10-23 10:00:00.101", 24, 20000, "BUY"));
  b.nhanTick(tick("VPB", "2026-10-23 10:00:00.102", 24.05, 30000, "BUY"));
  // lenh ban chu dong nho: 24 x 1000 / 1000 = 24 trieu
  b.nhanTick(tick("VPB", "2026-10-23 10:00:05.000", 24, 1000, "SELL"));
  // lenh mua chu dong vua: 24 x 10000/1000 = 240 trieu
  b.nhanTick(tick("VPB", "2026-10-23 10:01:00.000", 24, 10000, "BUY"));
  const a = b.chupAnh();
  const v = a.ma.VPB;
  ok("tong mua chu dong = 2.160 + 24 (phan 3 = 24.05 x 30) ... tinh theo tung lan khop", gan(v.mua, (24 * 10000 + 24 * 20000 + 24.05 * 30000 + 24 * 10000) / 1000, 0.11), v.mua);
  ok("tong ban chu dong = 24 trieu", gan(v.ban, 24));
  ok("gop 3 lan khop cach <= 3ms thanh 1 lenh LON (1 lenh)", v.lon.soLenh === 1 && v.lon.mua > 500 && v.lon.ban === 0, JSON.stringify(v.lon));
  ok("lenh ban 24 trieu la NHO; lenh mua 240 trieu la VUA", v.nho.soLenh === 1 && gan(v.nho.ban, 24) && v.vua.soLenh === 1 && gan(v.vua.mua, 240), JSON.stringify([v.nho, v.vua]));
  ok("rong = mua - ban; kl; gia cuoi", gan(v.rong, v.mua - v.ban, 0.11) && v.kl === 71000 && v.gia === 24);
  ok("thi truong: tong va VN30 gom VPB", a.thiTruong.tong.soMa === 1 && a.thiTruong.vn30.soMa === 1 && gan(a.thiTruong.tong.mua, v.mua, 0.11));
}

// 2) 2 lenh cung chieu cach xa > 3ms la 2 lenh; lenh khac chieu cat dut
{
  const b = new BoGopDongTien({ heSoKl: 1 });
  b.nhanTick(tick("AAA", "2026-10-23 10:00:00.000", 10, 30000, "BUY")); // 300 trieu (vua)
  b.nhanTick(tick("AAA", "2026-10-23 10:00:00.100", 10, 30000, "BUY")); // lenh moi
  b.nhanTick(tick("AAA", "2026-10-23 10:00:00.101", 10, 1000, "SELL")); // lenh ban nho, cat
  const v = b.chupAnh().ma.AAA;
  ok("2 lenh mua vua cach 100ms + 1 lenh ban nho", v.vua.soLenh === 2 && v.nho.soLenh === 1, JSON.stringify([v.vua, v.nho]));
}

// 3) ATO / ATC khong tinh vao dong tien chu dong; bang T khong phai G1 bi bo
{
  const b = new BoGopDongTien({ heSoKl: 1 });
  b.nhanTick(tick("BBB", "2026-10-23 09:00:10.000", 20, 1000, "BUY"));
  b.nhanTick(tick("BBB", "2026-10-23 14:45:05.817", 20, 5000, "BUY"));
  b.nhanTick(tick("BBB", "2026-10-23 14:31:00.000", 20, 700, "BUY"));
  ok("tick bang thoa thuan (T1) bi bo", b.nhanTick(tick("BBB", "2026-10-23 10:00:00.000", 20, 9999, "BUY", "T1")) === false);
  const v = b.chupAnh({ chiTiet: true }).ma.BBB;
  ok("ATO / ATC chi vao KL ato / atc va profile 'khac', khong vao mua/ban", v.mua === 0 && v.ban === 0 && v.ato === 1000 && v.atc === 5700 && v.kl === 6700, JSON.stringify(v));
  ok("profile: toan bo la khac (k)", v.chiTiet.profile.every((r) => r[1] === 0 && r[2] === 0 && r[3] > 0), JSON.stringify(v.chiTiet.profile));
  ok("chieu la trong phien lien tuc -> dem chieu la, khong tinh mua/ban", (() => { const c = new BoGopDongTien({ heSoKl: 1 }); c.nhanTick(tick("C", "2026-10-23 10:00:00.000", 5, 100, "??")); return c.demChieuLa === 1 && c.chupAnh().ma.C.mua === 0; })());
}

// 3b) ATO ghi o 09:15:01 (du lieu that VPB 23/10): cum dau tien cung gia -> ATO; khop sau 3 giay -> khop lien tuc
{
  const b = new BoGopDongTien({ heSoKl: 1 });
  b.nhanTick(tick("VPB", "2026-10-23 09:15:01.870", 23.85, 10, "BUY"));
  b.nhanTick(tick("VPB", "2026-10-23 09:15:01.871", 23.85, 170, "BUY"));
  b.nhanTick(tick("VPB", "2026-10-23 09:15:05.000", 23.85, 40, "SELL"));
  b.nhanTick(tick("VPB", "2026-10-23 09:15:13.000", 23.9, 90, "BUY"));
  const v = b.chupAnh().ma.VPB;
  ok("cum khop dau 09:15:01 = ATO (180 cp, khong tinh mua/ban chu dong); sau do tinh binh thuong", v.ato === 180 && v.soKhop === 2 && gan(v.mua, (23.9 * 90) / 1000, 0.06) && gan(v.ban, (23.85 * 40) / 1000, 0.06), JSON.stringify(v));
}

// 4) chuoi theo phut + volume profile + gop muc gia
{
  const b = new BoGopDongTien({ heSoKl: 1 });
  b.nhanTick(tick("DDD", "2026-10-23 09:20:10.000", 10, 1000, "BUY"));
  b.nhanTick(tick("DDD", "2026-10-23 09:20:50.000", 10.05, 2000, "SELL"));
  b.nhanTick(tick("DDD", "2026-10-23 09:21:05.000", 10.05, 3000, "BUY"));
  const ct = b.chupAnh({ chiTiet: true }).ma.DDD.chiTiet;
  ok("chuoi phut: 09:20 va 09:21; 09:20 co mua 10 tr, ban 20,1 tr", ct.phut.length === 2 && ct.phut[0][0] === "09:20" && gan(ct.phut[0][1], 10) && gan(ct.phut[0][2], 20.1) && ct.phut[1][0] === "09:21");
  ok("profile 2 muc gia: 10 (mua 1000) va 10,05 (ban 2000, mua 3000)", ct.profile.length === 2 && ct.profile[0][0] === 10 && ct.profile[0][1] === 1000 && ct.profile[1][0] === 10.05 && ct.profile[1][1] === 3000 && ct.profile[1][2] === 2000, JSON.stringify(ct.profile));
  const c = new BoGopDongTien({ heSoKl: 1 });
  for (let i = 0; i < 200; i++) c.nhanTick(tick("EEE", `2026-10-23 10:00:${String(i % 60).padStart(2, "0")}.000`, 10 + i * 0.05, 100, "BUY"));
  const p = c.chupAnh({ chiTiet: true }).ma.EEE.chiTiet.profile;
  ok("hon 60 muc gia -> gop ve <= 60, giu tong KL", p.length <= 60 && p.reduce((s, r) => s + r[1] + r[2] + r[3], 0) === 200 * 100, p.length);
}

// 5) khoi ngoai (VND -> trieu), chi so, sang ngay moi
{
  const b = new BoGopDongTien({ heSoKl: 1 });
  b.nhanNuocNgoai({ symbol: "VPB", boardId: "G1", totalBuyTradedAmount: 27031660000, totalSellTradedAmount: 24054767500, totalBuyVolume: 1130500, totalSellVolume: 1006995, foreignerBuyPossibleQuantity: 2380177080, transactTime: "2026-10-22 14:59:27.135" });
  const nn = b.chupAnh().ma.VPB.nn;
  ok("khoi ngoai: 27.031,7 tr mua, 24.054,8 tr ban, rong 2.976,9 tr", gan(nn.mua, 27031.7, 0.06) && gan(nn.ban, 24054.8, 0.06) && gan(nn.rong, 2976.9, 0.11) && nn.klMua === 1130500, JSON.stringify(nn));
  b.nhanChiSo({ indexName: "VNINDEX", valueIndexes: 1760.63, changedValue: 5.2, changedRatio: 0.3, fluctuationUpIssueCount: 147, fluctuationDownIssueCount: 164, fluctuationSteadinessIssueCount: 57, fluctuationUpperLimitIssueCount: 2, fluctuationLowerLimitIssueCount: 3, totalVolumeTraded: 649816909, grossTradeAmount: 14902.97 });
  const ci = b.chupAnh().thiTruong.chiSo.VNINDEX;
  ok("chi so: do rong tang/giam/dung/tran/san", ci.tang === 147 && ci.giam === 164 && ci.dung === 57 && ci.tran === 2 && ci.san === 3 && ci.gt === 1760.63, JSON.stringify(ci));
  b.nhanTick(tick("VPB", "2026-10-23 10:00:00.000", 24, 1000, "BUY"));
  ok("tick ngay moi -> dat lai toan bo (mat du lieu ngay cu)", b.ngay === "2026-10-23" && b.chupAnh().ma.VPB.nn === null && b.chupAnh().thiTruong.chiSo.VNINDEX === undefined);
  ok("tick cu hon ngay hien tai bi bo", b.nhanTick(tick("VPB", "2026-10-22 10:00:00.000", 24, 1000, "BUY")) === false);
}

if (loi) {
  console.log(`\n${loi} loi`);
  process.exit(1);
}
console.log("\nTat ca dat");
