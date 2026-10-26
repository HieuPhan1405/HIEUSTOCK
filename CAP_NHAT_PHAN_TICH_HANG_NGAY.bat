@echo off
rem DUOC LICH WINDOWS (CloudStock-PhanTich-18h) GOI T2-T6 18:00: cap nhat RRG nganh + bao cao tai chinh + diem Z/F/DuPont len web (~10 phut).
rem Nhat ky: engine\output\log_phan_tich_hang_ngay.txt. Chay tay nhanh (chi gia + RRG): CAP_NHAT_PHAN_TICH_HANG_NGAY.bat /nhanh
cd /d "C:\Users\hieu\web"
if /i "%~1"=="/nhanh" (node engine\dich-vu\capNhatPhanTichHangNgay.mjs --bo-qua-bctc) else (node engine\dich-vu\capNhatPhanTichHangNgay.mjs)
exit /b %errorlevel%
