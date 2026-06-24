@echo off
REM Safely stop the HRIS development server without broadly killing Node.js.

setlocal
cd /d "%~dp0"

echo ========================================
echo   Stop HRIS Development Server
echo ========================================
echo.

where powershell >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] PowerShell is not available.
    pause
    exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\stop-project.ps1"
set "STOP_EXIT=%errorlevel%"

echo.
if not "%STOP_EXIT%"=="0" (
    echo [WARN] Stop completed with warnings. Check the messages above.
) else (
    echo [INFO] Stop completed.
)

pause
exit /b %STOP_EXIT%
