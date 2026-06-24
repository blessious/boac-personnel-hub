param(
  [switch]$Force
)

$ErrorActionPreference = "Stop"

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$ports = @(47100, 47101)
$seen = @{}
$targets = New-Object System.Collections.Generic.List[object]

function Get-CommandLine($processId) {
  try {
    $process = Get-CimInstance Win32_Process -Filter "ProcessId = $processId"
    if ($process) {
      return [string]$process.CommandLine
    }
  } catch {
    return ""
  }
  return ""
}

function Is-ProjectProcess($commandLine) {
  if ([string]::IsNullOrWhiteSpace($commandLine)) {
    return $false
  }

  $normalizedRoot = $projectRoot.ToLowerInvariant()
  $normalizedCommand = $commandLine.ToLowerInvariant()

  return (
    $normalizedCommand.Contains($normalizedRoot) -or
    $normalizedCommand.Contains("server/dev.mjs") -or
    $normalizedCommand.Contains("server\dev.mjs") -or
    $normalizedCommand.Contains("server/index.mjs") -or
    $normalizedCommand.Contains("server\index.mjs") -or
    ($normalizedCommand.Contains("vite") -and $normalizedCommand.Contains("47100"))
  )
}

foreach ($port in $ports) {
  $connections = @(Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue)

  foreach ($connection in $connections) {
    $processId = [int]$connection.OwningProcess
    if ($processId -le 0 -or $seen.ContainsKey($processId)) {
      continue
    }

    $seen[$processId] = $true
    $commandLine = Get-CommandLine $processId
    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue

    $targets.Add([pscustomobject]@{
      ProcessId = $processId
      Port = $port
      Name = if ($process) { $process.ProcessName } else { "unknown" }
      CommandLine = $commandLine
      IsProjectProcess = Is-ProjectProcess $commandLine
    })
  }
}

if ($targets.Count -eq 0) {
  Write-Host "[INFO] No HRIS dev listeners found on ports 47100 or 47101."
  exit 0
}

Write-Host "[INFO] Found listener processes on HRIS ports:"
foreach ($target in $targets) {
  Write-Host ("  PID {0} | port {1} | {2}" -f $target.ProcessId, $target.Port, $target.Name)
  if ($target.CommandLine) {
    Write-Host ("    {0}" -f $target.CommandLine)
  }
}

foreach ($target in $targets) {
  $shouldStop = $target.IsProjectProcess

  if (-not $shouldStop -and -not $Force) {
    Write-Host ""
    Write-Host ("[WARN] PID {0} is using HRIS port {1}, but it was not clearly identified as this project." -f $target.ProcessId, $target.Port)
    $answer = Read-Host "Stop this process? Type YES to confirm"
    $shouldStop = $answer -eq "YES"
  }

  if (-not $shouldStop) {
    Write-Host ("[SKIP] PID {0} left running." -f $target.ProcessId)
    continue
  }

  try {
    Stop-Process -Id $target.ProcessId -Force -ErrorAction Stop
    Write-Host ("[OK] Stopped PID {0} on port {1}." -f $target.ProcessId, $target.Port)
  } catch {
    Write-Host ("[ERROR] Failed to stop PID {0}: {1}" -f $target.ProcessId, $_.Exception.Message)
  }
}

Start-Sleep -Milliseconds 500

$remaining = @()
foreach ($port in $ports) {
  $connections = @(Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue)
  foreach ($connection in $connections) {
    $remaining += [pscustomobject]@{
      Port = $port
      ProcessId = $connection.OwningProcess
    }
  }
}

if ($remaining.Count -eq 0) {
  Write-Host "[OK] HRIS dev ports are now free."
  exit 0
}

Write-Host "[WARN] Some HRIS ports are still in use:"
foreach ($item in $remaining) {
  Write-Host ("  Port {0} is still held by PID {1}." -f $item.Port, $item.ProcessId)
}
exit 1
