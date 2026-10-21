// Danh sach COT so cua bang chi_bao_ky_thuat - dung chung cho engine (xuat CSV), route upload (doc CSV + ghi DB), lib doc DB va trang Bo loc.
// Them chi bao moi = them ten cot vao day (bang tu ALTER ... ADD COLUMN IF NOT EXISTS o lib/db.js).
// "rsi_pk_cach" / "rsi_pk_tuan_cach" = RSI phan ky gan nhat (khung ngay / tuan, xem lib/phanKyRSI.js), ma hoa nhu _cat_cach: phan ky TANG xac nhan k nen truoc = +k, phan ky GIAM = -(k + 1), don vi la phien (ngay) hoac tuan.
// Quy uoc: "_pct" = phan tram; "_cat_cach" = lan cat gan nhat (~60 phien cuoi), ma hoa huong + so phien: cat LEN k phien truoc = +k (0 = hom nay), cat XUONG = -(k + 1); null = khong co.
import { COT_MAU_HINH_NGAY, COT_MAU_HINH_TUAN } from "./mauHinh.js";
// "mh_<khoa>" / "mh_<khoa>_tuan" = MAU HINH GIA (lib/mauHinh.js, khung ngay / tuan): so nen (phien / tuan) tu nen pha vo gan nhat den nen cuoi (0 = hom nay / tuan nay), null = khong co trong 10 phien / 6 tuan gan nhat.
export const COT_CHI_BAO = [
  "rsi14", "rsi_pk_cach", "rsi_pk_tuan_cach",
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
  ...COT_MAU_HINH_NGAY, ...COT_MAU_HINH_TUAN,
];
