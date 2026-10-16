$ErrorActionPreference = "Stop"
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
Set-Location -LiteralPath $projectRoot

function Invoke-Checked([string]$Command, [string[]]$Arguments) {
  & $Command @Arguments
  if ($LASTEXITCODE -ne 0) { throw "$Command failed with exit code $LASTEXITCODE" }
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw "Node.js is missing. Install the current Node.js LTS release, then retry." }
if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) { throw "npm is missing. Repair Node.js installation, then retry." }
$nodeVersion = [version]((& node --version).Trim().TrimStart('v'))
if (($nodeVersion.Major -eq 20 -and $nodeVersion -lt [version]'20.19.0') -or ($nodeVersion.Major -eq 21) -or ($nodeVersion.Major -eq 22 -and $nodeVersion -lt [version]'22.12.0') -or $nodeVersion.Major -lt 20) {
  throw "This Vite build requires Node.js 20.19+ or 22.12+."
}
$python = if (Get-Command py -ErrorAction SilentlyContinue) { "py" } elseif (Get-Command python -ErrorAction SilentlyContinue) { "python" } else { throw "Python 3 is missing. Install Python, then retry." }
$pythonArgs = if ($python -eq "py") { @("-3") } else { @() }
$mysqlServices = @(Get-Service -Name "MySQL*", "MariaDB*" -ErrorAction SilentlyContinue)
if ($mysqlServices.Count -eq 0) { Write-Warning "No MySQL/MariaDB Windows service was found. Confirm local MySQL before running diagnostics." }
$libreOfficeFound = (Test-Path -LiteralPath "C:\Program Files\LibreOffice\program\soffice.com") -or [bool](Get-Command soffice.com -ErrorAction SilentlyContinue)
if (-not $libreOfficeFound) { Write-Warning "LibreOffice was not found at its usual path or on PATH. Exports will fail until it is installed and configured." }

Write-Host "Installing locked Node dependencies..."
Invoke-Checked "npm.cmd" @("ci")

$venvPython = Join-Path $projectRoot ".venv\Scripts\python.exe"
if (-not (Test-Path -LiteralPath $venvPython)) {
  Write-Host "Creating Python virtual environment..."
  Invoke-Checked $python ($pythonArgs + @("-m", "venv", ".venv"))
}
Write-Host "Installing Python export dependencies..."
Invoke-Checked $venvPython @("-m", "pip", "install", "-r", (Join-Path $PSScriptRoot "requirements-hospital.txt"))
Invoke-Checked $venvPython @("-m", "pip", "check")

Write-Host "Building frontend..."
Invoke-Checked "npm.cmd" @("run", "build")

$localEnv = Join-Path $projectRoot "server\.env.local"
if (-not (Test-Path -LiteralPath $localEnv)) {
  Copy-Item -LiteralPath (Join-Path $PSScriptRoot ".env.hospital.example") -Destination $localEnv
  Write-Host "Created server/.env.local. Fill in all CHANGE_ME values before startup."
} else {
  Write-Host "Keeping existing server/.env.local unchanged. Review it for hospital settings."
}
Write-Host "Setup completed. Import SQL manually, configure server/.env.local, then run installation\\windows\\diagnose.bat."
