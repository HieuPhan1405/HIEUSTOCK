@echo off
rem ENGINE TIN HIEU REAL-TIME + DAY LEN WEB (--upload). Khac CHAY_REALTIME.bat o cho co --upload (CHAY_REALTIME.bat chi tinh, KHONG day len web).
rem Can .env.dnse.local co DNSE_API_KEY, DNSE_API_SECRET, CS_UPLOAD_API_KEY va CS_XAC_NHAN_UPLOAD=DONG_Y.
rem Engine TU DUNG luc 15h30 ngay lam viec (ma thoat 3, bat khong khoi dong lai). Muon chay den khi dong cua so: them --khong-tu-dung vao dong node; doi gio dung: --dung-luc=16:00
cd /d "C:\Users\hieu\web"
title CloudStock Engine (day len web)
echo ===== ENGINE TIN HIEU REAL-TIME (DNSE) - DAY LEN WEB =====
echo Engine TU DUNG luc 15h30 ngay lam viec. Dong cua so nay de dung truoc.
echo Neu bi loi/mat mang se TU KHOI DONG LAI sau 5 giay.
echo.

if not exist ".env.dnse.local" (
    echo LOI: khong tim thay file .env.dnse.local trong C:\Users\hieu\web
    echo Can co file nay voi DNSE_API_KEY, DNSE_API_SECRET, CS_UPLOAD_API_KEY, CS_XAC_NHAN_UPLOAD.
    pause
    exit /b 1
)

:lap
node --env-file=.env.dnse.local engine\dich-vu\chayEngineRealTime.mjs --upload
if %errorlevel%==3 (
    echo.
    echo [Engine da tu dung luc 15h30 - hen gap lai sang mai]
    timeout /t 10 >nul
    exit /b 0
)
echo.
echo [Chuong trinh vua dung - co the do mat mang hoac loi] Tu khoi dong lai sau 5 giay...
timeout /t 5 /nobreak >nul
goto lap
