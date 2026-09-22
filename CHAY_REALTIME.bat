@echo off
cd /d "C:\Users\hieu\web"
echo ===== ENGINE TIN HIEU REAL-TIME (DNSE) =====
echo Dong cua so nay de DUNG han. Neu bi loi/mat mang se TU KHOI DONG LAI sau 5 giay.
echo.

if not exist ".env.dnse.local" (
    echo LOI: khong tim thay file .env.dnse.local trong C:\Users\hieu\web
    echo Can co file nay voi 2 dong DNSE_API_KEY va DNSE_API_SECRET.
    pause
    exit /b 1
)

:lap
node --env-file=.env.dnse.local engine\dich-vu\chayEngineRealTime.mjs
echo.
echo [Chuong trinh vua dung - co the do mat mang hoac loi] Tu khoi dong lai sau 5 giay...
timeout /t 5 /nobreak >nul
goto lap
