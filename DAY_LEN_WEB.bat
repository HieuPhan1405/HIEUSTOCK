@echo off
cd /d "C:\Users\hieu\web"
set CS_KHONG_DOI=1
echo ===== DAY DU LIEU LEN WEB =====
where python >nul 2>nul
if %errorlevel%==0 (python day_tat_ca_len_web.py) else (py day_tat_ca_len_web.py)
echo.
pause
