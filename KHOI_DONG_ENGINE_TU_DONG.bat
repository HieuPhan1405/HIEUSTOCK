@echo off
rem DUOC LICH WINDOWS (CloudStock-Engine-9h) GOI LUC 9h SANG THU 2-6: bat engine day len web neu may dang mo va engine CHUA chay.
rem Chay thu (chi kiem tra, khong bat): KHOI_DONG_ENGINE_TU_DONG.bat /kiemtra
powershell -NoProfile -Command "$p = Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | Where-Object { $_.CommandLine -like '*chayEngineRealTime.mjs*' }; if ($p) { exit 1 } else { exit 0 }"
if errorlevel 1 (
    echo Engine dang chay roi - bo qua.
    exit /b 0
)
if /i "%~1"=="/kiemtra" (
    echo Engine CHUA chay - luc 9h lich se bat CHAY_REALTIME_UPLOAD.bat.
    exit /b 0
)
start "CloudStock Engine (day len web)" /min cmd /c "C:\Users\hieu\web\CHAY_REALTIME_UPLOAD.bat"
exit /b 0
