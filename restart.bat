@echo off
REM Stop and restart the HRIS development server.

setlocal
cd /d "%~dp0"

echo ========================================
echo   Restart HRIS Development Server
echo ========================================
echo.

set "HRIS_NO_PAUSE=1"
call "%~dp0stop.bat"
set "STOP_EXIT=%errorlevel%"
set "HRIS_NO_PAUSE="

if not "%STOP_EXIT%"=="0" (
    echo.
    echo [ERROR] Stop failed or HRIS ports are still busy. Startup was cancelled.
    pause
    exit /b %STOP_EXIT%
)

echo.
echo [INFO] Waiting for ports to release...
timeout /t 2 /nobreak >nul

echo.
echo [INFO] Starting HRIS again...
call "%~dp0run.bat"
exit /b %errorlevel%
