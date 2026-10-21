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
  "rsi_h1", "rsi_h1_pk_cach",
  // DIEM MUA PHUC HOI (diem B, engine/loi/diemMuaPhucHoi.js): so phien tu diem B gan nhat (0 = hom nay, null = khong co trong 10 phien) + gia vao / day 20 phien / cat lo / TP1-3 theo cong thuc binh thuong cua he thong.
  "pb_cach", "pb_gia", "pb_giam", "pb_day", "pb_sl", "pb_tp1", "pb_tp2", "pb_tp3",
  // HOI SAU GIAM DAI (engine/loi/hoiSauGiamDai.js): 4 dieu kien checklist (1/0: giam dai, GTGD >= 3 ty, day sau cao hon, tren Tenkan + Kijun) + vi the cam het nhip hoi neu dang mo
  // (hg_cach = so phien tu tin hieu vao, 0 = hom nay; gia vao, SL -10%, MA50 hien tai = moc thoat, dinh - 4 ATR = moc tham khao; hg_ban = 1 khi vua dong cua duoi MA50).
  "hg_giam_dai", "hg_gtgd_ok", "hg_day_cao", "hg_tren_tk_kj", "hg_cach", "hg_gia_vao", "hg_sl", "hg_ma50", "hg_ch4", "hg_ban",
];
// RSI khung 1 GIO (engine/loi/rsiH1.js): do job rieng engine/dich-vu/dayRsiH1.mjs day len (CSV chi co cac cot nay) - engine chinh KHONG gui, route chi ghi cac cot co trong header.
export const COT_CHI_BAO_H1 = ["rsi_h1", "rsi_h1_pk_cach"];
