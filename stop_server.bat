@echo off
REM Stop only the HRIS API server on port 47102. Leave the frontend on 47101 running.

setlocal
cd /d "%~dp0"

echo ========================================
echo   Stop HRIS API Server Only
echo ========================================
echo.

where powershell >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] PowerShell is not available.
    pause
    exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ErrorActionPreference = 'Stop';" ^
  "$port = 47102;" ^
  "$connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue;" ^
  "if (-not $connections) { Write-Host '[INFO] No HRIS API server is listening on port 47102.'; exit 0 }" ^
  "$processIds = $connections | Select-Object -ExpandProperty OwningProcess -Unique;" ^
  "foreach ($processId in $processIds) {" ^
  "  $process = Get-Process -Id $processId -ErrorAction SilentlyContinue;" ^
  "  if (-not $process) { continue }" ^
  "  Write-Host ('[INFO] Stopping API process PID {0} ({1}) on port 47102...' -f $processId, $process.ProcessName);" ^
  "  Stop-Process -Id $processId -Force;" ^
  "}" ^
  "Start-Sleep -Seconds 1;" ^
  "$remaining = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue;" ^
  "if ($remaining) { Write-Host '[ERROR] Port 47102 is still busy.'; exit 1 }" ^
  "Write-Host '[INFO] HRIS API server stopped. Frontend port 47101 was not touched.'"

set "STOP_EXIT=%errorlevel%"

echo.
if not "%STOP_EXIT%"=="0" (
    echo [WARN] API stop completed with warnings. Check the messages above.
) else (
    echo [INFO] Done.
)

if not "%HRIS_NO_PAUSE%"=="1" pause
exit /b %STOP_EXIT%
