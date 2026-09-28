import { soAn, so1So, pct } from "@/components/dungChung";
import { giaiMaCat } from "@/lib/boLocChiBao";

// Cot CHI BAO KY THUAT cho bang Bo loc co phieu (khoa cot = ten truong trong bang chi_bao_ky_thuat, xem lib/cotChiBaoKyThuat.js).
// Chi hien khi nguoi dung bat trong "Cot hien thi" hoac dang loc theo chi bao do (BangBoLoc tu hien cot cua bo loc dang dung).
const MUTED = "#8B8B99";
const XANH = "#22C55E";
const DO = "#EF4444";
const VANG = "#FBBF24";
const NHOM = "Chỉ báo kỹ thuật";

const Trong = <span style={{ color: MUTED }}>—</span>;
const coSo = (v) => typeof v === "number" && Number.isFinite(v);
const mauDau = (v) => (v > 0 ? XANH : v < 0 ? DO : undefined);

// Cot so don gian: dinh dang `dinhDang(v)`, tuy chon mau theo gia tri.
function cotSo(khoa, nhan, dinhDang, mau, tieuDe) {
  return {
    nhan,
    nhom: NHOM,
    canPhai: true,
    lay: (r) => (coSo(r[khoa]) ? r[khoa] : null),
    hien: (r) =>
      coSo(r[khoa]) ? (
        <span style={{ color: mau ? mau(r[khoa]) : undefined }} title={tieuDe}>
          {dinhDang(r[khoa])}
        </span>
      ) : (
        Trong
      ),
  };
}

// Cot "lan cat gan nhat" (macd_cat_cach...): "↑ hôm nay" / "↑ 3 phiên trước" (cắt lên, xanh) / "↓ ..." (cắt xuống, đỏ). Sap xep: cat len gan day nhat len dau.
function cotCat(khoa, nhan, moTa) {
  return {
    nhan,
    nhom: NHOM,
    canPhai: true,
    lay: (r) => {
      const c = giaiMaCat(r[khoa]);
      return c ? c.huong * (1000 - c.cach) : null;
    },
    hien: (r) => {
      const c = giaiMaCat(r[khoa]);
      if (!c) return Trong;
      return (
        <span style={{ color: c.huong > 0 ? XANH : DO }} title={`${moTa}: cắt ${c.huong > 0 ? "lên" : "xuống"} ${c.cach === 0 ? "hôm nay" : `${c.cach} phiên trước`}`}>
          {c.huong > 0 ? "↑" : "↓"} {c.cach === 0 ? "hôm nay" : `${c.cach} phiên`}
        </span>
      );
    },
  };
}

const pct1 = (v) => pct(v, 1);

export const COT_CHI_BAO_HIEN = {
  rsi14: cotSo("rsi14", "RSI (14)", so1So, (v) => (v < 30 ? XANH : v > 70 ? DO : undefined), "Dưới 30: quá bán (xanh) · trên 70: quá mua (đỏ)"),
  macd: cotSo("macd", "MACD", (v) => soAn(v, 3), mauDau, "Đường MACD (12, 26)"),
  macd_hist: cotSo("macd_hist", "MACD Hist", (v) => soAn(v, 3), mauDau, "MACD trừ Signal (9): dương = MACD trên Signal"),
  macd_cat_cach: cotCat("macd_cat_cach", "MACD cắt Signal", "MACD và Signal"),
  stoch_k: cotSo("stoch_k", "Stoch %K", so1So, (v) => (v < 20 ? XANH : v > 80 ? DO : undefined), "Stochastic (14, 1, 3) - dưới 20 quá bán · trên 80 quá mua"),
  stoch_d: cotSo("stoch_d", "Stoch %D", so1So),
  stoch_cat_cach: cotCat("stoch_cat_cach", "Stoch %K cắt %D", "%K và %D"),
  adx14: cotSo("adx14", "ADX (14)", so1So, (v) => (v > 25 ? XANH : undefined), "Trên 25: xu hướng mạnh"),
  di_plus: cotSo("di_plus", "+DI", so1So),
  di_tru: cotSo("di_tru", "-DI", so1So),
  cach_ma20_pct: cotSo("cach_ma20_pct", "Giá vs MA20", pct1, mauDau, "% giá cách MA20"),
  cach_ma50_pct: cotSo("cach_ma50_pct", "Giá vs MA50", pct1, mauDau, "% giá cách MA50"),
  cach_ma200_pct: cotSo("cach_ma200_pct", "Giá vs MA200", pct1, mauDau, "% giá cách MA200"),
  ma20_50_cat_cach: cotCat("ma20_50_cat_cach", "MA20 cắt MA50", "MA20 và MA50"),
  ma50_200_cat_cach: cotCat("ma50_200_cat_cach", "MA50 cắt MA200", "MA50 và MA200 (Golden / Death Cross)"),
  gia_so_may: {
    nhan: "Giá vs mây",
    nhom: NHOM,
    canPhai: false,
    lay: (r) => (coSo(r.gia_so_may) ? r.gia_so_may : null),
    hien: (r) => {
      if (!coSo(r.gia_so_may)) return Trong;
      const [chu, mau] = r.gia_so_may > 0 ? ["Trên mây", XANH] : r.gia_so_may < 0 ? ["Dưới mây", DO] : ["Trong mây", VANG];
      return <span style={{ color: mau }}>{chu}</span>;
    },
  },
  cach_kijun_pct: cotSo("cach_kijun_pct", "Giá vs Kijun", pct1, mauDau, "% giá cách Kijun"),
  boll_pct_b: cotSo("boll_pct_b", "Bollinger %B", (v) => soAn(v, 2), (v) => (v <= 0.05 ? XANH : v >= 0.95 ? DO : undefined), "0 = dải dưới · 0,5 = đường giữa · 1 = dải trên"),
  boll_rong_pct: cotSo("boll_rong_pct", "Độ rộng Bollinger", (v) => `${soAn(v, 1)}%`, null, "(dải trên - dải dưới) / đường giữa"),
  cci20: cotSo("cci20", "CCI (20)", so1So, (v) => (v < -100 ? XANH : v > 100 ? DO : undefined), "Dưới -100 quá bán · trên 100 quá mua"),
  will_r14: cotSo("will_r14", "Williams %R", so1So, (v) => (v < -80 ? XANH : v > -20 ? DO : undefined), "Dưới -80 quá bán · trên -20 quá mua"),
  mfi14: cotSo("mfi14", "MFI (14)", so1So, (v) => (v < 20 ? XANH : v > 80 ? DO : undefined), "Dưới 20 quá bán · trên 80 quá mua"),
  atr_pct: cotSo("atr_pct", "ATR / giá", (v) => `${soAn(v, 2)}%`, null, "Biên độ dao động trung bình mỗi phiên (ATR 14) so với giá"),
  kl_ty_le: cotSo("kl_ty_le", "KL / TB20", (v) => `${soAn(v, 2)}×`, (v) => (v >= 2 ? XANH : undefined), "Khối lượng hôm nay so với trung bình 20 phiên trước (giữa phiên mới chạy được một phần)"),
  doi_1t_pct: cotSo("doi_1t_pct", "% 1 tuần", pct1, mauDau),
  doi_1th_pct: cotSo("doi_1th_pct", "% 1 tháng", pct1, mauDau),
  doi_3th_pct: cotSo("doi_3th_pct", "% 3 tháng", pct1, mauDau),
  doi_6th_pct: cotSo("doi_6th_pct", "% 6 tháng", pct1, mauDau),
  cach_dinh_52t_pct: cotSo("cach_dinh_52t_pct", "Cách đỉnh 52T", pct1, null, "% giá thấp hơn đỉnh 52 tuần"),
  cach_day_52t_pct: cotSo("cach_day_52t_pct", "Cách đáy 52T", pct1, null, "% giá cao hơn đáy 52 tuần"),
};

// Thu tu cot tren bang.
export const THU_TU_COT_CHI_BAO = Object.keys(COT_CHI_BAO_HIEN);
