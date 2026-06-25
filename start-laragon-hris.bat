@echo off
setlocal

cd /d "%~dp0"

if not exist "server\exports" mkdir "server\exports"

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-laragon-hris.ps1" -ProjectRoot "%~dp0" 1>> "%~dp0server\exports\start-laragon-hris.log" 2>> "%~dp0server\exports\start-laragon-hris.err.log"

if errorlevel 1 (
    echo.
    echo [ERROR] HRIS startup failed.
    echo Check this file:
    echo %~dp0server\exports\start-laragon-hris.err.log
    echo.
    type "%~dp0server\exports\start-laragon-hris.err.log"
    echo.
    pause
    exit /b 1
)

echo.
echo [INFO] HRIS startup command completed.
echo [INFO] Open http://localhost:47100/login on this PC.
echo [INFO] From another PC, use http://SERVER-PC-IP:47100/login
echo.
pause
exit /b 0
