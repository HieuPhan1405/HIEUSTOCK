// Ty le chot loi tung phan (% vi the) theo CACH MOI (2026-09-26, theo backtest engine/dich-vu/backtestHaiMocChayDenBan.mjs): chot 30% o TP1, 30% o TP2, 40% CON LAI GIU DEN KHI
// he thong bao BAN (diem so tut / Stop-loss / bao ve hoa von sau TP2). TP3 chi con la moc THAM KHAO (khong chot, khong dong lenh). Dung chung cho goi y hien thi
// (components/dungChung.js), cach ghi lenh da dong (lib/lenhDaDong.js, lib/chotLoiTungPhan.js) va cac trang huong dan.
export const TY_LE_CHOT = { tp1: 30, tp2: 30, giu: 40 };
export const CHUOI_TY_LE_CHOT = "30% ở TP1, 30% ở TP2, 40% giữ đến tín hiệu BÁN";

// CACH "3 MOC KET THUC O TP3" (2026-09-25): TP1 30% + TP2 30% + TP3 40% = dong lenh, ve TRUNG LAP - chi con dung khi BAT cong tac KetThucTaiTP3 trong AFL 7/9 (mac dinh Tat).
export const TY_LE_CHOT_KET_THUC = { tp1: 30, tp2: 30, tp3: 40, giu: 0 };
export const CHUOI_TY_LE_CHOT_KET_THUC = "30/30/40";

// CACH CU (truoc 2026-09-25): 30/30/25 + 15% giu chay, thoat theo tin hieu BAN - CHI de doc dung cac lenh cu da ghi trong lenh_da_dong (dong TP3 25% / gop 85% + dong
// phan con lai 15%). Lenh moi khong con dung.
export const TY_LE_CHOT_CU = { tp1: 30, tp2: 30, tp3: 25, giu: 15 };
