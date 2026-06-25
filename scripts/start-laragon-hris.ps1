param(
    [string]$ProjectRoot = ""
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($ProjectRoot)) {
    $ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
}

$ProjectRoot = (Resolve-Path -LiteralPath $ProjectRoot).Path

function Test-PortListening {
    param([int]$Port)

    $connection = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue
    return $null -ne $connection
}

function Start-HrisProcess {
    param(
        [string]$Name,
        [string[]]$NpmArgs,
        [int]$Port,
        [string]$StdOutPath,
        [string]$StdErrPath
    )

    if (Test-PortListening -Port $Port) {
        Write-Host "$Name is already running on port $Port."
        return
    }

    Start-Process `
        -FilePath "npm.cmd" `
        -ArgumentList $NpmArgs `
        -WorkingDirectory $ProjectRoot `
        -WindowStyle Hidden `
        -RedirectStandardOutput $StdOutPath `
        -RedirectStandardError $StdErrPath

    for ($attempt = 1; $attempt -le 10; $attempt++) {
        Start-Sleep -Seconds 2

        if (Test-PortListening -Port $Port) {
            Write-Host "$Name started on port $Port."
            return
        }
    }

    throw "$Name did not start on port $Port. Check logs: $StdOutPath and $StdErrPath"
}

if (!(Test-Path -LiteralPath $ProjectRoot)) {
    throw "Project root not found: $ProjectRoot"
}

$exportsDir = Join-Path $ProjectRoot "server\exports"
New-Item -ItemType Directory -Force -Path $exportsDir | Out-Null

$apiOut = Join-Path $exportsDir "scheduled-api.log"
$apiErr = Join-Path $exportsDir "scheduled-api.err.log"
$previewOut = Join-Path $exportsDir "scheduled-preview.log"
$previewErr = Join-Path $exportsDir "scheduled-preview.err.log"

Start-HrisProcess `
    -Name "HRIS API" `
    -NpmArgs @("run", "api") `
    -Port 47101 `
    -StdOutPath $apiOut `
    -StdErrPath $apiErr

Start-HrisProcess `
    -Name "HRIS frontend preview" `
    -NpmArgs @("run", "preview") `
    -Port 47100 `
    -StdOutPath $previewOut `
    -StdErrPath $previewErr

Write-Host "HRIS startup complete."
