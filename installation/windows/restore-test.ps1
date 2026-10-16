param(
  [Parameter(Mandatory = $true)]
  [string]$BackupPath,
  [string]$ConfigPath = "",
  [string]$SettingsPath = ""
)

$ErrorActionPreference = "Stop"
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
if ([string]::IsNullOrWhiteSpace($ConfigPath)) { $ConfigPath = Join-Path $projectRoot "server\.env.local" }
if ([string]::IsNullOrWhiteSpace($SettingsPath)) { $SettingsPath = Join-Path $PSScriptRoot "backup-settings.json" }

function Get-EnvValues([string]$Path) {
  if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { throw "HRIS configuration was not found: $Path" }
  $values = @{}
  foreach ($line in Get-Content -LiteralPath $Path) {
    $trimmed = $line.Trim()
    if (-not $trimmed -or $trimmed.StartsWith("#")) { continue }
    $separator = $trimmed.IndexOf("=")
    if ($separator -lt 1) { continue }
    $values[$trimmed.Substring(0, $separator).Trim()] = $trimmed.Substring($separator + 1).Trim().Trim('"').Trim("'")
  }
  return $values
}

function Get-MySqlClient {
  $command = Get-Command mysql.exe -ErrorAction SilentlyContinue
  if ($command) { return $command.Source }
  $candidates = @(
    "C:\Program Files\MySQL\MySQL Server *\bin\mysql.exe",
    "C:\Program Files\MariaDB *\bin\mysql.exe",
    "C:\xampp\mysql\bin\mysql.exe"
  )
  foreach ($candidate in $candidates) {
    $match = Get-ChildItem -Path $candidate -File -ErrorAction SilentlyContinue | Sort-Object FullName -Descending | Select-Object -First 1
    if ($match) { return $match.FullName }
  }
  throw "mysql.exe was not found. Install MySQL client tools or add its bin folder to PATH."
}

function Write-Log([string]$Path, [string]$Message) {
  $line = "[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $Message
  Add-Content -LiteralPath $Path -Value $line -Encoding UTF8
  Write-Host $line
}

function Test-PathInside([string]$Child, [string]$Parent) {
  $childPath = (Resolve-Path -LiteralPath $Child).Path.TrimEnd('\')
  $parentPath = (Resolve-Path -LiteralPath $Parent).Path.TrimEnd('\')
  return $childPath.StartsWith($parentPath + '\', [System.StringComparison]::OrdinalIgnoreCase)
}

$temporaryDefaults = $null
$rewrittenDump = $null
$testDatabase = $null
$backupDirectory = $null
try {
  if (-not (Test-Path -LiteralPath $SettingsPath -PathType Leaf)) {
    throw "Backup folder is not configured. Open backup-control.bat and choose a folder first."
  }
  $backupSettings = Get-Content -LiteralPath $SettingsPath -Raw | ConvertFrom-Json
  $backupDirectory = [string]$backupSettings.backupDirectory
  if ([string]::IsNullOrWhiteSpace($backupDirectory) -or -not (Test-Path -LiteralPath $backupDirectory -PathType Container)) {
    throw "Configured backup folder does not exist. Open backup-control.bat and choose it again."
  }
  if (-not (Test-Path -LiteralPath $BackupPath -PathType Leaf)) { throw "Backup file was not found." }
  if ([System.IO.Path]::GetExtension($BackupPath) -ne ".sql") { throw "Choose an SQL backup file." }
  if (-not (Test-PathInside $BackupPath $backupDirectory)) { throw "Choose a backup from the configured backup folder only." }
  $backupPath = (Resolve-Path -LiteralPath $BackupPath).Path
  $logPath = Join-Path (Resolve-Path -LiteralPath $backupDirectory).Path "hris-restore-test.log"
  $config = Get-EnvValues $ConfigPath
  foreach ($key in @("HRIS_DB_HOST", "HRIS_DB_PORT", "HRIS_DB_USER", "HRIS_DB_NAME")) {
    if ([string]::IsNullOrWhiteSpace([string]$config[$key])) { throw "$key is missing in server/.env.local" }
  }
  $mysql = Get-MySqlClient
  $testDatabase = "hris_restore_test_" + [guid]::NewGuid().ToString("N").Substring(0, 24)
  $temporaryDefaults = [System.IO.Path]::GetTempFileName()
  $password = [string]$config["HRIS_DB_PASSWORD"]
  $escapedPassword = $password.Replace("\", "\\").Replace('"', '\"')
  @(
    "[client]",
    "host=$($config['HRIS_DB_HOST'])",
    "port=$($config['HRIS_DB_PORT'])",
    "user=$($config['HRIS_DB_USER'])",
    "password=`"$escapedPassword`""
  ) | Set-Content -LiteralPath $temporaryDefaults -Encoding ASCII

  $dumpText = Get-Content -LiteralPath $backupPath -Raw
  $createPattern = '(?m)^CREATE DATABASE .*?;$'
  $usePattern = '(?m)^USE `[^`]+`;$'
  if ([regex]::Matches($dumpText, $createPattern).Count -ne 1 -or [regex]::Matches($dumpText, $usePattern).Count -ne 1) {
    throw "Backup does not have the expected MySQL CREATE DATABASE and USE statements."
  }
  if ($dumpText -match '(?im)^\s*DROP\s+DATABASE') {
    throw "Backup contains a DROP DATABASE statement and cannot be used for a restore test."
  }
  $testDatabaseQuoted = '`' + $testDatabase + '`'
  $liveDatabasePattern = [regex]::Escape('`' + [string]$config['HRIS_DB_NAME'] + '`')
  $dumpText = [regex]::Replace($dumpText, $createPattern, "CREATE DATABASE $testDatabaseQuoted CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;", 1)
  $dumpText = [regex]::Replace($dumpText, $usePattern, "USE $testDatabaseQuoted;", 1)
  if ($dumpText -match ('(?im)^USE ' + $liveDatabasePattern + ';') -or $dumpText -match ('(?im)^CREATE DATABASE .*' + $liveDatabasePattern)) {
    throw "Safety check failed: the rewritten restore still references the live database."
  }
  $rewrittenDump = [System.IO.Path]::GetTempFileName()
  Set-Content -LiteralPath $rewrittenDump -Value $dumpText -Encoding UTF8

  Write-Log $logPath "Starting restore test from $(Split-Path -Leaf $backupPath) into temporary database $testDatabase."
  Get-Content -LiteralPath $rewrittenDump -Raw | & $mysql "--defaults-extra-file=$temporaryDefaults"
  if ($LASTEXITCODE -ne 0) { throw "MySQL restore failed with exit code $LASTEXITCODE" }
  $tables = @(& $mysql "--defaults-extra-file=$temporaryDefaults" "--batch" "--skip-column-names" "--execute=SELECT table_name FROM information_schema.tables WHERE table_schema='$testDatabase' AND table_name IN ('users','employees') ORDER BY table_name;")
  if ($LASTEXITCODE -ne 0 -or $tables.Count -ne 2 -or -not ($tables -contains "users") -or -not ($tables -contains "employees")) {
    throw "Restore completed but required users and employees tables were not found."
  }
  Write-Log $logPath "Restore test passed. Required tables were found in $testDatabase."
  exit 0
} catch {
  if ($backupDirectory) {
    try { Write-Log (Join-Path $backupDirectory "hris-restore-test.log") "Restore test failed: $($_.Exception.Message)" } catch { }
  }
  Write-Error "HRIS restore test failed: $($_.Exception.Message)"
  exit 1
} finally {
  if ($testDatabase -and $testDatabase -match '^hris_restore_test_[a-f0-9]{24}$' -and $temporaryDefaults) {
    try {
      & (Get-MySqlClient) "--defaults-extra-file=$temporaryDefaults" "--execute=DROP DATABASE IF EXISTS ``$testDatabase``;" 2>$null
    } catch { }
  }
  if ($temporaryDefaults) { Remove-Item -LiteralPath $temporaryDefaults -Force -ErrorAction SilentlyContinue }
  if ($rewrittenDump) { Remove-Item -LiteralPath $rewrittenDump -Force -ErrorAction SilentlyContinue }
}
