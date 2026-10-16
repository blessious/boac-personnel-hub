param(
  [string]$ConfigPath = "",
  [string]$SettingsPath = "",
  [ValidateRange(1, 365)]
  [int]$RetentionDays = 7
)

$ErrorActionPreference = "Stop"
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
if ([string]::IsNullOrWhiteSpace($ConfigPath)) { $ConfigPath = Join-Path $projectRoot "server\.env.local" }
if ([string]::IsNullOrWhiteSpace($SettingsPath)) { $SettingsPath = Join-Path $PSScriptRoot "backup-settings.json" }

function Get-EnvValues([string]$Path) {
  if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
    throw "HRIS configuration was not found: $Path"
  }
  $values = @{}
  foreach ($line in Get-Content -LiteralPath $Path) {
    $trimmed = $line.Trim()
    if (-not $trimmed -or $trimmed.StartsWith("#")) { continue }
    $separator = $trimmed.IndexOf("=")
    if ($separator -lt 1) { continue }
    $key = $trimmed.Substring(0, $separator).Trim()
    $value = $trimmed.Substring($separator + 1).Trim().Trim('"').Trim("'")
    $values[$key] = $value
  }
  return $values
}

function Get-MySqlDump {
  $command = Get-Command mysqldump.exe -ErrorAction SilentlyContinue
  if ($command) { return $command.Source }
  $candidates = @(
    "C:\Program Files\MySQL\MySQL Server *\bin\mysqldump.exe",
    "C:\Program Files\MariaDB *\bin\mysqldump.exe",
    "C:\xampp\mysql\bin\mysqldump.exe"
  )
  foreach ($candidate in $candidates) {
    $match = Get-ChildItem -Path $candidate -File -ErrorAction SilentlyContinue | Sort-Object FullName -Descending | Select-Object -First 1
    if ($match) { return $match.FullName }
  }
  throw "mysqldump.exe was not found. Install MySQL client tools or add its bin folder to PATH."
}

function Write-Log([string]$Path, [string]$Message) {
  $line = "[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $Message
  Add-Content -LiteralPath $Path -Value $line -Encoding UTF8
  Write-Host $line
}

$temporaryDefaults = $null
$temporaryOutput = $null
try {
  if (-not (Test-Path -LiteralPath $SettingsPath -PathType Leaf)) {
    throw "Backup folder is not configured. Run backup-control.bat, then choose option 1."
  }
  $backupSettings = Get-Content -LiteralPath $SettingsPath -Raw | ConvertFrom-Json
  $backupDirectory = [string]$backupSettings.backupDirectory
  if ([string]::IsNullOrWhiteSpace($backupDirectory) -or -not (Test-Path -LiteralPath $backupDirectory -PathType Container)) {
    throw "Configured backup folder does not exist. Run backup-control.bat and choose it again."
  }
  $backupDirectory = (Resolve-Path -LiteralPath $backupDirectory).Path
  $logPath = Join-Path $backupDirectory "hris-backup.log"
  $config = Get-EnvValues $ConfigPath
  foreach ($key in @("HRIS_DB_HOST", "HRIS_DB_PORT", "HRIS_DB_USER", "HRIS_DB_NAME")) {
    if ([string]::IsNullOrWhiteSpace([string]$config[$key])) { throw "$key is missing in server/.env.local" }
  }
  $dump = Get-MySqlDump
  $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
  $destination = Join-Path $backupDirectory ("hris-backup-{0}.sql" -f $stamp)
  $temporaryDefaults = [System.IO.Path]::GetTempFileName()
  $temporaryOutput = Join-Path $backupDirectory (".hris-backup-{0}.tmp" -f [guid]::NewGuid().ToString("N"))
  $password = [string]$config["HRIS_DB_PASSWORD"]
  $escapedPassword = $password.Replace("\", "\\").Replace('"', '\"')
  @(
    "[client]",
    "host=$($config['HRIS_DB_HOST'])",
    "port=$($config['HRIS_DB_PORT'])",
    "user=$($config['HRIS_DB_USER'])",
    "password=`"$escapedPassword`""
  ) | Set-Content -LiteralPath $temporaryDefaults -Encoding ASCII

  Write-Log $logPath "Starting backup of database $($config['HRIS_DB_NAME'])."
  & $dump "--defaults-extra-file=$temporaryDefaults" "--single-transaction" "--routines" "--events" "--triggers" "--databases" $config["HRIS_DB_NAME"] "--result-file=$temporaryOutput"
  if ($LASTEXITCODE -ne 0) { throw "mysqldump failed with exit code $LASTEXITCODE" }
  if (-not (Test-Path -LiteralPath $temporaryOutput) -or (Get-Item -LiteralPath $temporaryOutput).Length -lt 100) {
    throw "mysqldump did not create a usable backup file"
  }
  Move-Item -LiteralPath $temporaryOutput -Destination $destination -ErrorAction Stop
  $temporaryOutput = $null
  $cutoff = (Get-Date).AddDays(-$RetentionDays)
  $expired = @(Get-ChildItem -LiteralPath $backupDirectory -Filter "hris-backup-*.sql" -File |
    Where-Object { $_.LastWriteTime -lt $cutoff })
  foreach ($file in $expired) { Remove-Item -LiteralPath $file.FullName -Force }
  Write-Log $logPath "Backup completed: $destination ($((Get-Item -LiteralPath $destination).Length) bytes). Removed $($expired.Count) backup(s) older than $RetentionDays days."
  exit 0
} catch {
  if ($backupDirectory) {
    try { Write-Log (Join-Path $backupDirectory "hris-backup.log") "Backup failed: $($_.Exception.Message)" } catch { }
  }
  Write-Error "HRIS backup failed: $($_.Exception.Message)"
  exit 1
} finally {
  if ($temporaryDefaults) { Remove-Item -LiteralPath $temporaryDefaults -Force -ErrorAction SilentlyContinue }
  if ($temporaryOutput) { Remove-Item -LiteralPath $temporaryOutput -Force -ErrorAction SilentlyContinue }
}
