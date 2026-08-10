@echo off
REM Start only the HRIS API server on port 47102. Do not start or stop the frontend.

setlocal
cd /d "%~dp0"

echo ========================================
echo   Start HRIS API Server Only
echo ========================================
echo.

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed or not in PATH.
    if not "%HRIS_NO_PAUSE%"=="1" pause
    exit /b 1
)

where powershell >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] PowerShell is not available.
    if not "%HRIS_NO_PAUSE%"=="1" pause
    exit /b 1
)

if not exist "server\exports" mkdir "server\exports"

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ErrorActionPreference = 'Stop';" ^
  "$projectRoot = (Resolve-Path -LiteralPath '%CD%').Path;" ^
  "$port = 47102;" ^
  "$frontendPort = 47101;" ^
  "$apiOut = Join-Path $projectRoot 'server\exports\api-only.log';" ^
  "$apiErr = Join-Path $projectRoot 'server\exports\api-only.err.log';" ^
  "$existing = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue;" ^
  "if ($existing) { Write-Host '[INFO] HRIS API server is already listening on port 47102.'; exit 0 }" ^
  "Write-Host '[INFO] Starting HRIS API server on port 47102...';" ^
  "Start-Process -FilePath 'npm.cmd' -ArgumentList @('run','api') -WorkingDirectory $projectRoot -WindowStyle Hidden -RedirectStandardOutput $apiOut -RedirectStandardError $apiErr;" ^
  "for ($attempt = 1; $attempt -le 15; $attempt++) {" ^
  "  Start-Sleep -Seconds 2;" ^
  "  $api = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue;" ^
  "  if ($api) {" ^
  "    $frontend = Get-NetTCPConnection -LocalPort $frontendPort -State Listen -ErrorAction SilentlyContinue;" ^
  "    Write-Host '[INFO] HRIS API server started. Frontend port 47101 was not touched.';" ^
  "    if ($frontend) { Write-Host '[INFO] Frontend is still listening on port 47101.' } else { Write-Host '[INFO] Frontend is not currently listening on port 47101.' }" ^
  "    exit 0;" ^
  "  }" ^
  "}" ^
  "Write-Host ('[ERROR] HRIS API server did not start on port 47102. Check logs: {0} and {1}' -f $apiOut, $apiErr);" ^
  "exit 1"

set "START_EXIT=%errorlevel%"

echo.
if not "%START_EXIT%"=="0" (
    echo [WARN] API startup completed with warnings. Check the messages above.
) else (
    echo [INFO] Done.
)

if not "%HRIS_NO_PAUSE%"=="1" pause
exit /b %START_EXIT%
