// Test tay cho engine/loi/hoiSauGiamDai.js + lib/hoiSauGiamDai.js (muc "Hoi sau giam dai" cua Checklist bat day). Chay: node engine/test/hoiSauGiamDai.test.mjs
import { tinhHoiSauGiamDai } from "../loi/hoiSauGiamDai.js";
import { tinhIchimoku } from "../loi/ichimoku.js";
import { atr } from "../loi/taChiBao.js";
import { dungHoiSauGiamDai, nhanNganh } from "../../lib/hoiSauGiamDai.js";

let loi = 0;
const ok = (ten, dk, them = "") => {
  if (!dk) {
    loi++;
    console.log("SAI:", ten, them);
  } else console.log("ok:", ten);
};

// Chuoi gia: 0..99 di ngang 100 (dinh), 100..259 giam deu xuong 50, 260..289 day 47 (nen day thap), 290..319 day 49 (day sau cao hon), 320.. hoi tang 0,5/nen.
function dung(n, { luaChon = null } = {}) {
  const close = [];
  for (let i = 0; i < n; i++) close.push(i < 100 ? 100 : i < 260 ? 100 - (i - 99) * (50 / 160) : i < 290 ? 48 + (i % 2) : i < 320 ? 50 + (i % 2) * 0.5 : 51 + (i - 320) * 0.5);
  const high = close.map((x) => x + 0.5);
  const low = close.map((x, i) => (i >= 260 && i < 290 ? x - 1 : i >= 290 && i < 320 ? x - 0.5 : x - 0.5));
  const open = close.map((x, i) => (i > 0 ? close[i - 1] : x));
  const volume = close.map(() => 1e6);
  if (luaChon) luaChon(close, high, low);
  const ich = tinhIchimoku({ high, low });
  return { open, high, low, close, volume, atr: atr({ high, low, close }, 14), tenkan: ich.tenkan, kijun: ich.kijun };
}

// 1. Du 4 dieu kien o nen 345 -> vi the mo (tin hieu o dau do tu nen 320 tro di), SL = 90% gia vao
{
  let tim = null;
  for (let n = 290; n <= 400; n++) { const r = tinhHoiSauGiamDai(dung(n)); if (r.vaoLenh) { tim = { n, r }; break; } }
  ok("co tin hieu vao trong giai doan hoi", tim != null);
  if (tim) {
    const { n, r } = tim;
    ok("4 dieu kien khi vao deu dat (hoac dang giu sau do)", r.giamDai && r.gtgdOk);
    ok("cach = 0 tai nen tin hieu dau tien", r.vaoLenh.cach === 0, `cach=${r.vaoLenh.cach} n=${n}`);
    ok("SL = giaVao x 0,9", Math.abs(r.vaoLenh.sl - r.vaoLenh.giaVao * 0.9) < 1e-9);
    ok("tin hieu o nen cuoi: gia vao tam tinh la dong cua, chua co nen mo cua sau", r.vaoLenh.tamTinh === true);
    // them 1 nen: gia vao = mo cua nen do (= dong cua nen truoc theo cach dung chuoi), het tam tinh
    const r2 = tinhHoiSauGiamDai(dung(n + 1));
    ok("them 1 nen: van dang cam, cach = 1, het tam tinh", r2.vaoLenh && r2.vaoLenh.cach === 1 && r2.vaoLenh.tamTinh === false);
  }
}

// 2. Gia roi xuong duoi MA50 sau khi vao -> bao CAN BAN o nen do, roi dong vi the o nen ke tiep
{
  const roi = (close, high, low) => { for (let i = 360; i < close.length; i++) { close[i] = 51 + 20 - (i - 360) * 1.2; high[i] = close[i] + 0.5; low[i] = close[i] - 0.5; } };
  let sawBan = false, daDong = false;
  for (let n = 361; n <= 420; n++) {
    const r = tinhHoiSauGiamDai(dung(n, { luaChon: roi }));
    if (r.vaoLenh?.canBan) sawBan = true;
    if (sawBan && !r.vaoLenh) { daDong = true; break; }
  }
  ok("dong cua duoi MA50 -> canBan, nen ke tiep dong vi the", sawBan && daDong, `sawBan=${sawBan} daDong=${daDong}`);
}

// 3. Thieu lich su -> rong; gia di ngang -> khong co tin hieu, giamDai = false
{
  const ngan = tinhHoiSauGiamDai(dung(200));
  ok("it nen -> khong ket luan", ngan.vaoLenh === null && ngan.giamDai === null);
  const phang = (close, high, low) => { for (let i = 0; i < close.length; i++) { close[i] = 100; high[i] = 100.5; low[i] = 99.5; } };
  const r = tinhHoiSauGiamDai(dung(400, { luaChon: phang }));
  ok("gia di ngang: khong giam dai, khong co vi the", r.giamDai === false && r.vaoLenh === null);
}

// 4. lib: dungHoiSauGiamDai + nhanNganh
{
  const hang = [
    { ma: "AAA", hg_giam_dai: 1, hg_gtgd_ok: 1, hg_day_cao: 1, hg_tren_tk_kj: 1, hg_cach: 2, hg_gia_vao: 10, hg_sl: 9, hg_ma50: 9.5, hg_ch4: 9.8, hg_ban: 0, cach_dinh_52t_pct: -40 },
    { ma: "BBB", hg_giam_dai: 1, hg_gtgd_ok: 1, hg_day_cao: 1, hg_tren_tk_kj: 0, hg_cach: null, cach_dinh_52t_pct: -50 },
    { ma: "CCC", hg_giam_dai: 1, hg_gtgd_ok: 1, hg_day_cao: 0, hg_tren_tk_kj: 0, hg_cach: null }, // chi 2/4 dat sau 2 dieu kien dau -> bi loai
    { ma: "DDD", hg_giam_dai: 1, hg_gtgd_ok: 0, hg_day_cao: 1, hg_tren_tk_kj: 1, hg_cach: null }, // thanh khoan thap
    { ma: "EEE", hg_giam_dai: 1, hg_gtgd_ok: 1, hg_day_cao: 1, hg_tren_tk_kj: 1, hg_cach: 0, hg_gia_vao: 20, hg_sl: 18, hg_ma50: 21, hg_ch4: null, hg_ban: 1 }, // dang giu nhung gia duoi MA50
    { ma: "FFF", hg_giam_dai: 1, hg_gtgd_ok: 1, hg_day_cao: 1, hg_tren_tk_kj: 1, hg_cach: 1, hg_gia_vao: 10, hg_sl: 9, hg_ma50: 9, hg_ban: 0 }, // khong co trong tin_hieu
  ];
  const tatCa = [
    { ma: "AAA", gia: 11, doi: 1, nganh: "Chứng khoán", tin: "TRUNG LAP" },
    { ma: "BBB", gia: 5, doi: 0, nganh: "Ngân hàng", tin: "TRUNG LAP" },
    { ma: "CCC", gia: 5, doi: 0, nganh: "Thép", tin: "TRUNG LAP" },
    { ma: "DDD", gia: 5, doi: 0, nganh: "Thép", tin: "TRUNG LAP" },
    { ma: "EEE", gia: 17.5, doi: -2, nganh: "Bất động sản", tin: "MUA" },
  ];
  const r = dungHoiSauGiamDai({ hang, tatCa });
  ok("dang cam: AAA va EEE (sap theo so phien tu tin hieu)", r.dangCam.map((x) => x.ma).join(",") === "EEE,AAA", r.dangCam.map((x) => x.ma).join(","));
  ok("lai/lo tinh theo gia vao", Math.abs(r.dangCam[1].laiPct - 10) < 1e-9);
  ok("EEE: gia duoi MA50 va thung SL -> canBan, thungSL", r.dangCam[0].canBan === true && r.dangCam[0].thungSL === true);
  ok("gan: chi BBB (3/4)", r.gan.length === 1 && r.gan[0].ma === "BBB" && r.gan[0].soDat === 3);
  ok("so ma giam dai dem du", r.soGiamDai === 5, String(r.soGiamDai));
  ok("nhan nganh: chung khoan -> uu, ngan hang -> yeu, BDS -> yeu, nganh khac -> trung", nhanNganh("Chứng khoán").loai === "uu" && nhanNganh("Ngân hàng").loai === "yeu" && nhanNganh("Bất động sản").loai === "yeu" && nhanNganh("Dầu khí").loai === "trung" && nhanNganh("Thép - Khoáng sản").loai === "uu");
  ok("khong du lieu -> rong", dungHoiSauGiamDai({}).dangCam.length === 0);
}

if (loi) {
  console.log(`\n${loi} LOI`);
  process.exit(1);
}
console.log("\nTAT CA DAT");
