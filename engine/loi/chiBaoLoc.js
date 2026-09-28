// CHI BAO KY THUAT CHO BO LOC (kieu TradingView screener): RSI, MACD, Stochastic, Bollinger, MA, CCI, Williams %R, MFI, ADX/DI, ATR, hieu suat, khoi luong, may Ichimoku.
// CHI dung de loc/xem tren web - KHONG tham gia tinh tin hieu MUA/BAN (nen khong co AFL tuong ung).
// Tham so mac dinh theo TradingView: RSI 14, MACD 12-26-9, Stochastic 14-1-3, Bollinger 20 x 2, CCI 20, Williams %R 14, MFI 14, ADX/DI 14, ATR 14.
// nen: mang [{ t, o, h, l, c, v }] TANG DAN theo ngay (nen cuoi = phien moi nhat / dang chay). Chi lay ~800 nen cuoi: EMA/Wilder da hoi tu.
import { atr, adxHeThong, rsi, mfi } from "./taChiBao.js";
import { hhv, llv, sma } from "./mang.js";
import { tinhIchimoku } from "./ichimoku.js";
import { COT_CHI_BAO } from "../../lib/cotChiBaoKyThuat.js";

export const SO_NEN_TINH = 800;
const SO_NEN_TIM_CAT = 60;
const SO_NEN_TOI_THIEU = 60;

// EMA kieu TradingView: nen dau = chinh gia tri do, ve sau a*x + (1-a)*EMA truoc.
export function ema(mang, n) {
  const kq = new Array(mang.length).fill(null);
  const he = 2 / (n + 1);
  let cu = null;
  for (let i = 0; i < mang.length; i++) {
    if (mang[i] == null) continue;
    cu = cu == null ? mang[i] : he * mang[i] + (1 - he) * cu;
    kq[i] = cu;
  }
  return kq;
}

// Trung binh n gia tri gan nhat, null neu co gia tri null trong cua so (khac mang.sma: khong coi null la 0).
function smaAnToan(mang, n) {
  const kq = new Array(mang.length).fill(null);
  for (let i = n - 1; i < mang.length; i++) {
    let tong = 0;
    let dayDu = true;
    for (let k = i - n + 1; k <= i; k++) {
      if (mang[k] == null) {
        dayDu = false;
        break;
      }
      tong += mang[k];
    }
    if (dayDu) kq[i] = tong / n;
  }
  return kq;
}

// Lan `a` cat `b` GAN NHAT trong SO_NEN_TIM_CAT nen cuoi, ma hoa HUONG + so nen: cat LEN k nen truoc -> +k (0 = ngay nen cuoi); cat XUONG k nen truoc -> -(k + 1) (-1 = ngay nen cuoi).
// null neu khong co lan cat nao. Giai ma: lib/boLocChiBao.js giaiMaCat().
export function nenTuLanCat(a, b) {
  const n = Math.min(a.length, b.length);
  for (let k = 0; k < SO_NEN_TIM_CAT; k++) {
    const i = n - 1 - k;
    if (i < 1) break;
    if (a[i] == null || b[i] == null || a[i - 1] == null || b[i - 1] == null) break;
    const truoc = a[i - 1] - b[i - 1];
    const nay = a[i] - b[i];
    if (truoc <= 0 && nay > 0) return k;
    if (truoc >= 0 && nay < 0) return -(k + 1);
  }
  return null;
}

const cuoi = (m) => {
  const v = m[m.length - 1];
  return v == null || !Number.isFinite(v) ? null : v;
};
const lam = (v, chuSo = 4) => (v == null || !Number.isFinite(v) ? null : Math.round(v * 10 ** chuSo) / 10 ** chuSo);
const pctCach = (a, b) => (a != null && b != null && b !== 0 ? (a / b - 1) * 100 : null);
const COT_NGUYEN = new Set(["macd_cat_cach", "stoch_cat_cach", "ma20_50_cat_cach", "ma50_200_cat_cach", "gia_so_may", "tenkan_tren_kijun"]);

// Tra ve object { ngay_nen, ...COT_CHI_BAO } cho 1 ma, hoac null neu chua du du lieu.
export function tinhChiBaoLocChoMa(nen) {
  if (!Array.isArray(nen) || nen.length < SO_NEN_TOI_THIEU) return null;
  const b = nen.slice(-SO_NEN_TINH);
  const n = b.length;
  const high = b.map((x) => x.h);
  const low = b.map((x) => x.l);
  const close = b.map((x) => x.c);
  const volume = b.map((x) => x.v ?? 0);
  const gia = close[n - 1];

  // MACD (12, 26, 9)
  const ema12 = ema(close, 12);
  const ema26 = ema(close, 26);
  const macdLine = close.map((_, i) => (ema12[i] != null && ema26[i] != null ? ema12[i] - ema26[i] : null));
  const macdSignal = ema(macdLine, 9);
  const macdHist = macdLine.map((v, i) => (v != null && macdSignal[i] != null ? v - macdSignal[i] : null));

  // Stochastic (14, 1, 3): %K tho, %D = SMA3 cua %K
  const hh14 = hhv(high, 14);
  const ll14 = llv(low, 14);
  const stochK = close.map((c, i) => (hh14[i] != null && hh14[i] > ll14[i] ? ((c - ll14[i]) / (hh14[i] - ll14[i])) * 100 : null));
  const stochD = smaAnToan(stochK, 3);

  // Bollinger (20, 2) - do lech chuan QUAN THE (giong TradingView ta.stdev)
  let bollPctB = null;
  let bollRong = null;
  if (n >= 20) {
    const cuaSo = close.slice(-20);
    const tb = cuaSo.reduce((s, x) => s + x, 0) / 20;
    const sd = Math.sqrt(cuaSo.reduce((s, x) => s + (x - tb) ** 2, 0) / 20);
    const tren = tb + 2 * sd;
    const duoi = tb - 2 * sd;
    if (tren > duoi) bollPctB = (gia - duoi) / (tren - duoi);
    if (tb > 0) bollRong = ((tren - duoi) / tb) * 100;
  }

  // MA 20 / 50 / 200 (don gian)
  const ma20 = sma(close, 20);
  const ma50 = sma(close, 50);
  const ma200 = sma(close, 200);

  // CCI (20) va Williams %R (14) - chi can nen cuoi
  let cci = null;
  if (n >= 20) {
    const tp = b.slice(-20).map((x) => (x.h + x.l + x.c) / 3);
    const tb = tp.reduce((s, x) => s + x, 0) / 20;
    const lechTB = tp.reduce((s, x) => s + Math.abs(x - tb), 0) / 20;
    cci = lechTB > 0 ? (tp[19] - tb) / (0.015 * lechTB) : 0;
  }
  const hh14c = cuoi(hh14);
  const ll14c = cuoi(ll14);
  const willR = hh14c != null && hh14c > ll14c ? ((hh14c - gia) / (hh14c - ll14c)) * -100 : null;

  const { adx, diPlus, diMinus } = adxHeThong({ high, low, close }, 14);
  const atr14 = cuoi(atr({ high, low, close }, 14));
  const doi = (k) => (n - 1 - k >= 0 ? pctCach(gia, close[n - 1 - k]) : null);

  // Dinh / day 52 tuan (252 phien) - can du 252 nen
  const coNam = n >= 252;
  const dinh52 = coNam ? cuoi(hhv(high, 252)) : null;
  const day52 = coNam ? cuoi(llv(low, 252)) : null;

  // Khoi luong hom nay / TB 20 phien TRUOC do (giua phien la KL moi chay duoc 1 phan nen ty le thap hon thuc te)
  let klTyLe = null;
  if (n >= 21) {
    const tb20 = volume.slice(-21, -1).reduce((s, x) => s + x, 0) / 20;
    if (tb20 > 0) klTyLe = volume[n - 1] / tb20;
  }

  // May Ichimoku (9-17-33, dich 26) - vi tri cua gia so voi may, Tenkan/Kijun
  const ich = tinhIchimoku({ high, low });
  const mayTren = cuoi(ich.cloudTop);
  const mayDuoi = cuoi(ich.cloudBot);
  const tenkan = cuoi(ich.tenkan);
  const kijun = cuoi(ich.kijun);

  const kq = {
    ngay_nen: b[n - 1].t,
    rsi14: cuoi(rsi({ close }, 14)),
    macd: cuoi(macdLine),
    macd_signal: cuoi(macdSignal),
    macd_hist: cuoi(macdHist),
    macd_cat_cach: nenTuLanCat(macdLine, macdSignal),
    stoch_k: cuoi(stochK),
    stoch_d: cuoi(stochD),
    stoch_cat_cach: nenTuLanCat(stochK, stochD),
    boll_pct_b: bollPctB,
    boll_rong_pct: bollRong,
    cach_ma20_pct: pctCach(gia, cuoi(ma20)),
    cach_ma50_pct: pctCach(gia, cuoi(ma50)),
    cach_ma200_pct: pctCach(gia, cuoi(ma200)),
    ma20_ma50_pct: pctCach(cuoi(ma20), cuoi(ma50)),
    ma20_50_cat_cach: nenTuLanCat(ma20, ma50),
    ma50_ma200_pct: pctCach(cuoi(ma50), cuoi(ma200)),
    ma50_200_cat_cach: nenTuLanCat(ma50, ma200),
    cci20: cci,
    will_r14: willR,
    mfi14: cuoi(mfi({ high, low, close, volume }, 14)),
    adx14: cuoi(adx),
    di_plus: cuoi(diPlus),
    di_tru: cuoi(diMinus),
    atr_pct: atr14 != null && gia > 0 ? (atr14 / gia) * 100 : null,
    doi_1t_pct: doi(5),
    doi_1th_pct: doi(21),
    doi_3th_pct: doi(63),
    doi_6th_pct: doi(126),
    cach_dinh_52t_pct: pctCach(gia, dinh52),
    cach_day_52t_pct: pctCach(gia, day52),
    kl_ty_le: klTyLe,
    gia_so_may: mayTren != null && mayDuoi != null ? (gia > mayTren ? 1 : gia < mayDuoi ? -1 : 0) : null,
    tenkan_tren_kijun: tenkan != null && kijun != null ? (tenkan > kijun ? 1 : 0) : null,
    cach_kijun_pct: pctCach(gia, kijun),
  };
  for (const k of COT_CHI_BAO) if (!COT_NGUYEN.has(k)) kq[k] = lam(kq[k], k.startsWith("macd") ? 6 : 4);
  return kq;
}

// Moi ma trong nenTheoMa (Map ma -> nen) -> 1 dong. Ma khong du du lieu bi bo qua.
export function tinhChiBaoLocToanBo(nenTheoMa) {
  const ds = [];
  const loi = [];
  for (const [ma, nen] of nenTheoMa) {
    try {
      const kq = tinhChiBaoLocChoMa(nen);
      if (kq) ds.push({ ma, ...kq });
    } catch (e) {
      loi.push({ ma, loi: String(e.message || e) });
    }
  }
  return { ds, loi };
}

const CAC_COT_CSV = ["ma", "ngay_nen", ...COT_CHI_BAO];

// CSV upload len /api/upload-chi-bao: null -> "" (route doc thanh NULL).
export function xayDungCsvChiBao(ds) {
  const dong = [CAC_COT_CSV.join(",")];
  for (const h of ds) dong.push(CAC_COT_CSV.map((c) => (h[c] == null ? "" : String(h[c]))).join(","));
  return dong.join("\n");
}
