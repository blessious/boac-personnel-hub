$ErrorActionPreference = "Stop"

$settingsPath = Join-Path $PSScriptRoot "backup-settings.json"

function Get-BackupFolder {
  if (-not (Test-Path -LiteralPath $settingsPath)) { return $null }
  try {
    $settings = Get-Content -LiteralPath $settingsPath -Raw | ConvertFrom-Json
    $folder = [string]$settings.backupDirectory
    if ([string]::IsNullOrWhiteSpace($folder) -or -not (Test-Path -LiteralPath $folder -PathType Container)) {
      return $null
    }
    return (Resolve-Path -LiteralPath $folder).Path
  } catch {
    return $null
  }
}

function Select-BackupFolder {
  Add-Type -AssemblyName System.Windows.Forms
  $dialog = New-Object System.Windows.Forms.FolderBrowserDialog
  $dialog.Description = "Choose the folder where HRIS SQL backups will be saved"
  $current = Get-BackupFolder
  if ($current) { $dialog.SelectedPath = $current }
  if ($dialog.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) {
    Write-Host "Backup folder was not changed."
    return
  }
  $selected = (Resolve-Path -LiteralPath $dialog.SelectedPath).Path
  @{ backupDirectory = $selected } | ConvertTo-Json | Set-Content -LiteralPath $settingsPath -Encoding UTF8
  Write-Host "Backup folder saved: $selected"
}

while ($true) {
  $folder = Get-BackupFolder
  Write-Host ""
  Write-Host "HRIS Database Backup Control"
  Write-Host "Backup folder: $(if ($folder) { $folder } else { 'Not selected' })"
  Write-Host ""
  Write-Host "1. Choose or change backup folder"
  Write-Host "2. Create backup now"
  Write-Host "3. Open backup folder"
  Write-Host "4. Exit"
  $choice = Read-Host "Choose 1-4"
  switch ($choice) {
    "1" { Select-BackupFolder }
    "2" {
      & powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "backup-now.ps1")
      if ($LASTEXITCODE -ne 0) { Write-Host "Backup failed. Read the message above." -ForegroundColor Red }
    }
    "3" {
      if ($folder) { Start-Process explorer.exe -ArgumentList $folder }
      else { Write-Host "Choose a backup folder first." -ForegroundColor Yellow }
    }
    "4" { exit 0 }
    default { Write-Host "Please choose 1, 2, 3, or 4." -ForegroundColor Yellow }
  }
}
