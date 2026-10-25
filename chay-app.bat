@echo off
chcp 65001 > nul
title Chay App Thi Dua 11A1

echo ========================================================
echo     DỰ ÁN WEB APP THI ĐUA LỚP 11A1 (2026 - 2027)
echo ========================================================
echo.

where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] Đã tìm thấy Node.js. Đang cập nhật bundle mới nhất...
    node build-bundle.cjs
    echo.
    echo [1] Đang mở trình duyệt trực tiếp...
    start "" "%~dp0index.html"
    echo.
    echo Hoặc bạn có thể chạy server cục bộ:
    echo     npx serve .
) else (
    echo [INFO] Đang mở trực tiếp trên trình duyệt...
    start "" "%~dp0index.html"
)

echo.
echo Ứng dụng đã sẵn sàng hoạt động!
timeout /t 3 > nul
