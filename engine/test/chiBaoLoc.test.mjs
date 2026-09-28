// Test tay cho engine/loi/chiBaoLoc.js (chi bao ky thuat cho bo loc). Chay: node engine/test/chiBaoLoc.test.mjs
import { ema, nenTuLanCat, tinhChiBaoLocChoMa, tinhChiBaoLocToanBo, xayDungCsvChiBao } from "../loi/chiBaoLoc.js";
import { COT_CHI_BAO } from "../../lib/cotChiBaoKyThuat.js";

let loi = 0;
const ok = (ten, dk, them = "") => {
  if (!dk) {
    loi++;
    console.log("SAI:", ten, them);
  } else console.log("ok:", ten);
};
const gan = (a, b, e = 1e-3) => a != null && b != null && Math.abs(a - b) < e;

// Tao chuoi nen tu mang gia dong cua (H = C + 0,5, L = C - 0,5, KL co dinh), ngay tang dan.
function nenTuGia(gia, kl = 1000) {
  return gia.map((c, i) => ({ t: new Date(Date.UTC(2025, 0, 1) + i * 86400e3).toISOString().slice(0, 10), o: c, h: c + 0.5, l: c - 0.5, c, v: typeof kl === "function" ? kl(i) : kl }));
}

// ---- EMA tinh tay: 10, 11, 12 voi n=2 (he so 2/3) ----
{
  const e = ema([10, 11, 12], 2);
  ok("EMA: nen dau = chinh gia tri", e[0] === 10);
  ok("EMA[1] = 2/3*11 + 1/3*10", gan(e[1], 10.66667, 1e-4), e[1]);
  ok("EMA[2] = 2/3*12 + 1/3*EMA[1]", gan(e[2], 11.55556, 1e-4), e[2]);
}

// ---- nenTuLanCat ----
{
  const a = [1, 1, 3, 3, 3];
  const b = [2, 2, 2, 2, 2];
  ok("cat len o nen index 2 -> cach 2 nen so voi nen cuoi (index 4)", nenTuLanCat(a, b) === 2);
  ok("cat len ngay nen cuoi -> 0", nenTuLanCat([1, 3], [2, 2]) === 0);
  ok("cat xuong ngay nen cuoi -> -1, cat xuong 2 nen truoc -> -3", nenTuLanCat([3, 1], [2, 2]) === -1 && nenTuLanCat([3, 1, 1, 1], [2, 2, 2, 2]) === -3);
  ok("khong cat lan nao -> null", nenTuLanCat([3, 3, 3], [2, 2, 2]) === null);
  ok("cham roi tach (truoc = 0) van tinh la cat", nenTuLanCat([2, 3], [2, 2]) === 0);
  ok("gap null thi dung tim", nenTuLanCat([null, 3, 3], [2, 2, 2]) === null);
}

// ---- Chuoi tang deu 300 phien ----
{
  const kq = tinhChiBaoLocChoMa(nenTuGia(Array.from({ length: 300 }, (_, i) => 100 + i)));
  ok("tang deu: RSI = 100", kq.rsi14 === 100, kq.rsi14);
  ok("tang deu: MACD > 0", kq.macd > 0);
  ok("tang deu: gia tren MA20/50/200", kq.cach_ma20_pct > 0 && kq.cach_ma50_pct > 0 && kq.cach_ma200_pct > 0);
  ok("tang deu: MA50 > MA200", kq.ma50_ma200_pct > 0);
  ok("tang deu: Stochastic %K rat cao (gia sat dinh 14 phien)", kq.stoch_k > 90, kq.stoch_k);
  ok("tang deu: Williams %R gan 0", kq.will_r14 > -10, kq.will_r14);
  ok("tang deu: +DI > -DI, ADX cao", kq.di_plus > kq.di_tru && kq.adx14 > 25, `${kq.di_plus} ${kq.di_tru} ${kq.adx14}`);
  ok("tang deu: gia tren may", kq.gia_so_may === 1);
  ok("tang deu: Tenkan tren Kijun", kq.tenkan_tren_kijun === 1);
  ok("tang deu: %B > 0,8 (gan dai tren)", kq.boll_pct_b > 0.8, kq.boll_pct_b);
  ok("tang deu: sat dinh 52 tuan (cach dinh <= 0,2%)", kq.cach_dinh_52t_pct <= 0 && kq.cach_dinh_52t_pct > -0.3, kq.cach_dinh_52t_pct);
  ok("hieu suat 1 tuan = gia / gia 5 phien truoc", gan(kq.doi_1t_pct, (399 / 394 - 1) * 100, 1e-3), kq.doi_1t_pct);
  ok("hieu suat 1 thang = gia / gia 21 phien truoc", gan(kq.doi_1th_pct, (399 / 378 - 1) * 100, 1e-3), kq.doi_1th_pct);
  ok("khong co lan cat MA nao (tang deu tu dau)", kq.ma50_200_cat_cach == null || kq.ma50_200_cat_cach >= 0);
}

// ---- Chuoi giam deu: nguoc lai ----
{
  const kq = tinhChiBaoLocChoMa(nenTuGia(Array.from({ length: 300 }, (_, i) => 500 - i)));
  ok("giam deu: RSI = 0", kq.rsi14 === 0, kq.rsi14);
  ok("giam deu: MACD < 0", kq.macd < 0);
  ok("giam deu: gia duoi MA20/50/200", kq.cach_ma20_pct < 0 && kq.cach_ma50_pct < 0 && kq.cach_ma200_pct < 0);
  ok("giam deu: gia duoi may", kq.gia_so_may === -1);
  ok("giam deu: +DI < -DI", kq.di_plus < kq.di_tru);
  ok("giam deu: Williams %R gan -100", kq.will_r14 < -90, kq.will_r14);
}

// ---- Chuoi di ngang co dinh: cac chi bao trung tinh ----
{
  const kq = tinhChiBaoLocChoMa(nenTuGia(new Array(300).fill(50)));
  ok("gia khong doi: %B = 0,5 khi dai co bien do (H/L +-0,5 khong dua vao dai Bollinger tinh tren gia dong cua -> khong xac dinh)", kq.boll_pct_b == null, kq.boll_pct_b);
  ok("gia khong doi: MACD = 0", gan(kq.macd, 0, 1e-9));
  ok("gia khong doi: hieu suat = 0", kq.doi_1th_pct === 0 && kq.doi_6th_pct === 0);
  ok("gia khong doi: khong co lan cat nao", kq.macd_cat_cach == null);
  ok("gia khong doi: CCI = 0 (do lech = 0)", kq.cci20 === 0, kq.cci20);
}

// ---- Golden cross: giam roi tang manh -> MA50 cat len MA200 (o nen thu ~98 tinh tu cuoi chuoi day du) ----
{
  const gia = [];
  for (let i = 0; i < 260; i++) gia.push(200 - i * 0.5); // giam
  for (let i = 0; i < 140; i++) gia.push(gia[259] + i * 2.5); // tang manh
  const nen = nenTuGia(gia);
  const cacK = [];
  for (let k = 0; k <= 140; k++) {
    const kq = tinhChiBaoLocChoMa(nen.slice(0, nen.length - k));
    if (kq.ma50_200_cat_cach === 0 && kq.ma50_ma200_pct > 0) cacK.push(k);
  }
  ok("Golden Cross: dung 1 phien MA50 vua cat len MA200", cacK.length === 1, JSON.stringify(cacK));
  const kCat = cacK[0];
  const sau10 = tinhChiBaoLocChoMa(nen.slice(0, nen.length - (kCat - 10)));
  ok("10 phien sau khi cat: cach = 10, MA50 van tren MA200", sau10.ma50_200_cat_cach === 10 && sau10.ma50_ma200_pct > 0, `${sau10.ma50_200_cat_cach}`);
  const truoc = tinhChiBaoLocChoMa(nen.slice(0, nen.length - (kCat + 1)));
  ok("phien truoc khi cat: MA50 con duoi MA200", truoc.ma50_ma200_pct < 0, `${truoc.ma50_ma200_pct}`);
  const cuoiCung = tinhChiBaoLocChoMa(nen);
  ok("cat cach cuoi chuoi > 60 phien: khong tim thay (null)", cuoiCung.ma50_200_cat_cach == null, `${cuoiCung.ma50_200_cat_cach}`);
}

// ---- Khoi luong dot bien + thieu du lieu ----
{
  const nen = nenTuGia(Array.from({ length: 100 }, (_, i) => 50 + Math.sin(i / 5)), (i) => (i === 99 ? 3000 : 1000));
  const kq = tinhChiBaoLocChoMa(nen);
  ok("KL hom nay 3000 / TB20 truoc do 1000 = 3", gan(kq.kl_ty_le, 3), kq.kl_ty_le);
  ok("chua du 252 nen: dinh/day 52 tuan = null", kq.cach_dinh_52t_pct == null && kq.cach_day_52t_pct == null);
  ok("chua du 200 nen: MA200 = null", kq.cach_ma200_pct == null && kq.ma50_ma200_pct == null);
  ok("qua it nen (< 60) -> null", tinhChiBaoLocChoMa(nenTuGia([1, 2, 3])) === null);
}

// ---- CSV ----
{
  const nen = nenTuGia(Array.from({ length: 100 }, (_, i) => 50 + Math.sin(i / 5)));
  const { ds, loi: loiTinh } = tinhChiBaoLocToanBo(new Map([["AAA", nen], ["BBB", nenTuGia([1, 2])]]));
  ok("toan bo: bo ma thieu du lieu, khong bao loi", ds.length === 1 && ds[0].ma === "AAA" && loiTinh.length === 0);
  const csv = xayDungCsvChiBao(ds).split("\n");
  const header = csv[0].split(",");
  ok("CSV: header = ma, ngay_nen + moi cot chi bao", header.length === 2 + COT_CHI_BAO.length && header[0] === "ma" && header[1] === "ngay_nen");
  ok("CSV: moi dong co dung so cot", csv[1].split(",").length === header.length);
  ok("CSV: gia tri null xuat rong (MA200 chua du du lieu)", csv[1].split(",")[header.indexOf("cach_ma200_pct")] === "");
}

console.log(loi === 0 ? "\nTAT CA DAT" : `\n${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
