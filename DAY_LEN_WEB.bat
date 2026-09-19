@echo off
cd /d "%~dp0"
echo ===== DAY DU LIEU LEN WEB =====
where python >nul 2>nul
if %errorlevel%==0 (set PY=python) else (set PY=py)
echo.
echo [1/2] Day tin hieu toan thi truong ^(tin_hieu_hom_nay.csv^)...
%PY% day_du_lieu_len_web.py
echo.
echo [2/2] Day checklist bat day...
%PY% day_checklist_bat_day_len_web.py
echo.
echo ===== XONG - xem ket qua o tren =====
pause
