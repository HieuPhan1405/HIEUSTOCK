// Danh sach COT so cua bang chi_bao_ky_thuat - dung chung cho engine (xuat CSV), route upload (doc CSV + ghi DB), lib doc DB va trang Bo loc.
// Them chi bao moi = them ten cot vao day (bang tu ALTER ... ADD COLUMN IF NOT EXISTS o lib/db.js).
// Quy uoc: "_pct" = phan tram; "_cat_cach" = lan cat gan nhat (~60 phien cuoi), ma hoa huong + so phien: cat LEN k phien truoc = +k (0 = hom nay), cat XUONG = -(k + 1); null = khong co.
export const COT_CHI_BAO = [
  "rsi14",
  "macd", "macd_signal", "macd_hist", "macd_cat_cach",
  "stoch_k", "stoch_d", "stoch_cat_cach",
  "boll_pct_b", "boll_rong_pct",
  "cach_ma20_pct", "cach_ma50_pct", "cach_ma200_pct",
  "ma20_ma50_pct", "ma20_50_cat_cach", "ma50_ma200_pct", "ma50_200_cat_cach",
  "cci20", "will_r14", "mfi14",
  "adx14", "di_plus", "di_tru",
  "atr_pct",
  "doi_1t_pct", "doi_1th_pct", "doi_3th_pct", "doi_6th_pct",
  "cach_dinh_52t_pct", "cach_day_52t_pct",
  "kl_ty_le",
  "gia_so_may", "tenkan_tren_kijun", "cach_kijun_pct",
];
