// Ty le chot loi tung phan (% vi the) theo CACH MOI (2026-09-25, theo backtest engine/dich-vu/backtestBaMocKetThuc.mjs): TP1 chot 30%, TP2 chot 30%, TP3 chot 40% -
// cham TP3 la DONG LENH (khong con phan giu chay). Sau TP2, neu dong cua < Kijun truoc khi toi TP3 thi ban not phan con lai (xem engine/loi/mayTrangThai.js va AFL 7/9).
// Dung chung cho goi y hien thi (components/dungChung.js), cach ghi lenh da dong (lib/lenhDaDong.js, lib/chotLoiTungPhan.js) va cac trang huong dan.
export const TY_LE_CHOT = { tp1: 30, tp2: 30, tp3: 40, giu: 0 };
export const CHUOI_TY_LE_CHOT = "30/30/40";

// CACH CU (truoc 2026-09-25): 30/30/25 + 15% giu chay, thoat theo tin hieu BAN - CHI de doc dung cac lenh cu da ghi trong lenh_da_dong (dong TP3 25% / gop 85% + dong
// phan con lai 15%) va cac lenh dang giu phan chay luc chuyen doi. Lenh moi khong con dung.
export const TY_LE_CHOT_CU = { tp1: 30, tp2: 30, tp3: 25, giu: 15 };
