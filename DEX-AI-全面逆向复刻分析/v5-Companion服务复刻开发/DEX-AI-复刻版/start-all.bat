@echo off
chcp 65001 >nul
title DEX AI ??? - ????

echo ========================================
echo   DEX AI ??? - ?????
echo ========================================
echo.

:: ????????
set "ROOT=%~dp0"
cd /d "%ROOT%"

:: ??Node.js
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [??] ??? Node.js?????
    pause
    exit /b 1
)

echo [1/3] ?? Companion ?? (:7443)...
start "dex-companion" /B /MIN node "%ROOT%\dex-companion\src\index.js"
if %ERRORLEVEL% EQU 0 ( echo   ? Companion ??? ) else ( echo   ? Companion ???? )
timeout /t 2 /nobreak >nul

echo [2/3] ?????? (:7445)...
start "dex-control" /B /MIN node "%ROOT%\dex-control\src\index.js"
if %ERRORLEVEL% EQU 0 ( echo   ? ??????? ) else ( echo   ? ???????? )
timeout /t 2 /nobreak >nul

echo [3/3] ?? Web ???? (:7446)...
start "dex-web" /B /MIN node "%ROOT%\dex-web\src\index.js"
if %ERRORLEVEL% EQU 0 ( echo   ? Web????? ) else ( echo   ? Web?????? )
timeout /t 2 /nobreak >nul

echo.
echo ========================================
echo   ????????
echo.
echo   Web????: http://127.0.0.1:7446
echo   Companion:    https://127.0.0.1:7443
echo   ????:    http://127.0.0.1:7445
echo ========================================
echo.
pause
