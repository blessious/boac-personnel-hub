$ErrorActionPreference = "Stop"
$settingsPath = Join-Path $PSScriptRoot "backup-settings.json"

if (-not (Test-Path -LiteralPath $settingsPath -PathType Leaf)) {
  throw "Backup folder is not configured. Open backup-control.bat and choose a folder first."
}
$settings = Get-Content -LiteralPath $settingsPath -Raw | ConvertFrom-Json
$backupDirectory = [string]$settings.backupDirectory
if ([string]::IsNullOrWhiteSpace($backupDirectory) -or -not (Test-Path -LiteralPath $backupDirectory -PathType Container)) {
  throw "Configured backup folder does not exist. Open backup-control.bat and choose it again."
}

Add-Type -AssemblyName System.Windows.Forms
$dialog = New-Object System.Windows.Forms.OpenFileDialog
$dialog.Title = "Choose an HRIS SQL backup to test"
$dialog.InitialDirectory = (Resolve-Path -LiteralPath $backupDirectory).Path
$dialog.Filter = "HRIS SQL backups (hris-backup-*.sql)|hris-backup-*.sql|SQL files (*.sql)|*.sql"
$dialog.Multiselect = $false
if ($dialog.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) {
  Write-Host "Restore test cancelled."
  exit 0
}

& powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "restore-test.ps1") -BackupPath $dialog.FileName
exit $LASTEXITCODE
