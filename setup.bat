@echo off
setlocal EnableExtensions EnableDelayedExpansion

REM HRPMIS setup script for a freshly cloned Windows PC.
REM Run this once before using run.bat.

cd /d "%~dp0"

set "SETUP_LOG=%CD%\setup.log"
set "PYTHON_CMD="
set "VENV_PYTHON=%CD%\.venv\Scripts\python.exe"

echo [INFO] Setup started at %DATE% %TIME% > "%SETUP_LOG%"
echo [INFO] Working directory: %CD% >> "%SETUP_LOG%"

echo.
echo ========================================
echo   HRPMIS - First-time Setup
echo ========================================
echo.

echo [INFO] Checking Node.js/npm...
where npm >nul 2>nul
if errorlevel 1 (
    echo [WARN] npm was not found in PATH.
    where winget >nul 2>nul
    if errorlevel 1 (
        echo [ERROR] Install Node.js LTS from https://nodejs.org, then run setup.bat again.
        goto :failed
    )

    echo [INFO] Installing Node.js LTS with winget...
    winget install --id OpenJS.NodeJS.LTS --exact --accept-package-agreements --accept-source-agreements >> "%SETUP_LOG%" 2>&1
    if errorlevel 1 (
        echo [ERROR] Node.js installation failed. Install Node.js LTS manually, then run setup.bat again.
        goto :failed
    )

    for /f "tokens=2,*" %%A in ('reg query "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v Path 2^>nul') do set "MACHINE_PATH=%%B"
    for /f "tokens=2,*" %%A in ('reg query "HKCU\Environment" /v Path 2^>nul') do set "USER_PATH=%%B"
    set "PATH=%MACHINE_PATH%;%USER_PATH%"
)

where npm >nul 2>nul
if errorlevel 1 (
    echo [ERROR] npm is still not available. Close this window, open a new one, and run setup.bat again.
    goto :failed
)
echo [INFO] npm found.
node --version
call npm --version
>> "%SETUP_LOG%" node --version
call npm --version >> "%SETUP_LOG%" 2>&1

echo.
echo [INFO] Checking Python...
where py >nul 2>nul
if not errorlevel 1 (
    set "PYTHON_CMD=py -3"
) else (
    where python >nul 2>nul
    if not errorlevel 1 set "PYTHON_CMD=python"
)

if "%PYTHON_CMD%"=="" (
    echo [WARN] Python was not found in PATH.
    where winget >nul 2>nul
    if errorlevel 1 (
        echo [ERROR] Install Python 3 from https://www.python.org/downloads/, then run setup.bat again.
        goto :failed
    )

    echo [INFO] Installing Python 3.12 with winget...
    winget install --id Python.Python.3.12 --exact --accept-package-agreements --accept-source-agreements >> "%SETUP_LOG%" 2>&1
    if errorlevel 1 (
        echo [ERROR] Python installation failed. Install Python 3 manually, then run setup.bat again.
        goto :failed
    )

    for /f "tokens=2,*" %%A in ('reg query "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v Path 2^>nul') do set "MACHINE_PATH=%%B"
    for /f "tokens=2,*" %%A in ('reg query "HKCU\Environment" /v Path 2^>nul') do set "USER_PATH=%%B"
    set "PATH=%MACHINE_PATH%;%USER_PATH%"

    where py >nul 2>nul
    if not errorlevel 1 (
        set "PYTHON_CMD=py -3"
    ) else (
        where python >nul 2>nul
        if not errorlevel 1 set "PYTHON_CMD=python"
    )
)

if "%PYTHON_CMD%"=="" (
    echo [ERROR] Python is still not available. Close this window, open a new one, and run setup.bat again.
    goto :failed
)
echo [INFO] Python found.
call %PYTHON_CMD% --version
call %PYTHON_CMD% --version >> "%SETUP_LOG%" 2>&1

echo.
echo [INFO] Installing Node.js dependencies...
>> "%SETUP_LOG%" echo [INFO] Installing Node.js dependencies.
if exist "package-lock.json" (
    call npm ci >> "%SETUP_LOG%" 2>&1
    if errorlevel 1 (
        echo [WARN] npm ci failed. Trying npm install instead...
        >> "%SETUP_LOG%" echo [WARN] npm ci failed. Trying npm install instead.
        call npm install >> "%SETUP_LOG%" 2>&1
    )
) else (
    call npm install >> "%SETUP_LOG%" 2>&1
)
if errorlevel 1 (
    echo [ERROR] Failed to install Node.js dependencies. See setup.log for details.
    goto :failed
)

echo.
echo [INFO] Creating local Python virtual environment...
if not exist ".venv\Scripts\python.exe" (
    >> "%SETUP_LOG%" echo [INFO] Creating local Python virtual environment with %PYTHON_CMD%.
    call %PYTHON_CMD% -m venv .venv >> "%SETUP_LOG%" 2>&1
    if errorlevel 1 (
        echo [ERROR] Failed to create Python virtual environment. See setup.log for details.
        goto :failed
    )
) else (
    echo [INFO] Existing .venv found.
)

echo.
echo [INFO] Installing Python dependencies...
>> "%SETUP_LOG%" echo [INFO] Installing Python dependencies.
call "%VENV_PYTHON%" -m pip install --upgrade pip >> "%SETUP_LOG%" 2>&1
if errorlevel 1 (
    echo [WARN] pip update failed with the default SSL settings. Retrying with trusted PyPI hosts...
    >> "%SETUP_LOG%" echo [WARN] pip update failed with default SSL settings. Retrying with trusted PyPI hosts.
    call "%VENV_PYTHON%" -m pip install --upgrade pip --trusted-host pypi.org --trusted-host files.pythonhosted.org >> "%SETUP_LOG%" 2>&1
    if errorlevel 1 (
        echo [ERROR] Failed to update pip. See setup.log for details.
        goto :failed
    )
)

call "%VENV_PYTHON%" -m pip install openpyxl reportlab pypdf pyzk python-docx >> "%SETUP_LOG%" 2>&1
if errorlevel 1 (
    echo [WARN] Python dependency install failed with the default SSL settings. Retrying with trusted PyPI hosts...
    >> "%SETUP_LOG%" echo [WARN] Python dependency install failed with default SSL settings. Retrying with trusted PyPI hosts.
    call "%VENV_PYTHON%" -m pip install openpyxl reportlab pypdf pyzk python-docx --trusted-host pypi.org --trusted-host files.pythonhosted.org >> "%SETUP_LOG%" 2>&1
    if errorlevel 1 (
        echo [ERROR] Failed to install Python dependencies. See setup.log for details.
        goto :failed
    )
)

echo.
echo [INFO] Preparing local folders...
if not exist "server\backups" mkdir "server\backups"
if not exist "server\exports" mkdir "server\exports"
if not exist "server\exports\previews" mkdir "server\exports\previews"

echo.
echo [INFO] Preparing local server environment...
if not exist "server\.env.local" (
    >"server\.env.local" echo # Local HRPMIS settings generated by setup.bat
    >>"server\.env.local" echo HRIS_DB_HOST=localhost
    >>"server\.env.local" echo HRIS_DB_USER=root
    >>"server\.env.local" echo HRIS_DB_PASSWORD=
    >>"server\.env.local" echo HRIS_DB_NAME=hris_db
    >>"server\.env.local" echo HRIS_API_PORT=47101
    >>"server\.env.local" echo HRIS_ADMS_PORT=6000
    >>"server\.env.local" echo HRIS_PYTHON_EXE=%VENV_PYTHON%
    echo [INFO] Created server\.env.local with default local settings.
) else (
    echo [INFO] server\.env.local already exists. Keeping existing settings.
)

echo.
echo [INFO] Checking MySQL availability...
where mysql >nul 2>nul
if errorlevel 1 (
    echo [WARN] MySQL command-line client was not found in PATH.
    echo [WARN] Install MySQL Server or XAMPP/MariaDB, then create/import the hris_db database.
    echo [WARN] If your database password is not blank, update server\.env.local.
) else (
    echo [INFO] MySQL client found.
    echo.
    set /p IMPORT_DB="Import latest database\hris_db.sql into local MySQL now? (Y/N): "
    if /i "!IMPORT_DB!"=="Y" (
        set "DB_USER=root"
        set "DB_NAME=hris_db"
        set /p DB_USER="MySQL user [root]: "
        if "!DB_USER!"=="" set "DB_USER=root"
        set /p DB_NAME="Database name [hris_db]: "
        if "!DB_NAME!"=="" set "DB_NAME=hris_db"

        echo.
        echo [INFO] Enter your MySQL password when prompted. Press Enter if it is blank.
        mysql -u "!DB_USER!" -p -e "CREATE DATABASE IF NOT EXISTS `!DB_NAME!` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
        if errorlevel 1 (
            echo [WARN] Could not create database. Check MySQL credentials and server status.
        ) else (
            if exist "latest database\hris_db.sql" (
                mysql -u "!DB_USER!" -p "!DB_NAME!" < "latest database\hris_db.sql"
                if errorlevel 1 (
                    echo [WARN] Database import failed.
                ) else (
                    echo [INFO] Database import completed.
                )
            ) else (
                echo [WARN] latest database\hris_db.sql was not found.
            )
        )
    )
)

echo.
echo [INFO] Checking LibreOffice availability...
if exist "C:\Program Files\LibreOffice\program\soffice.com" (
    echo [INFO] LibreOffice found.
) else (
    echo [WARN] LibreOffice was not found at C:\Program Files\LibreOffice\program\soffice.com
    echo [WARN] Install LibreOffice if you need PDF previews/exports from spreadsheet templates.
    echo [WARN] If installed somewhere else, set HRIS_LIBREOFFICE_EXE in server\.env.local.
)

echo.
echo ========================================
echo   Setup complete
echo ========================================
echo [INFO] Setup completed successfully. Details saved to setup.log.
echo You can now run run.bat.
echo.
pause
exit /b 0

:failed
echo.
echo [ERROR] Setup failed. Review the message above, then run setup.bat again.
echo [ERROR] Details saved to setup.log.
pause
exit /b 1
