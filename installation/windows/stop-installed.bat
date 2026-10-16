@echo off
setlocal
cd /d "%~dp0"
node "%~dp0stop-installed.mjs" %*
exit /b %errorlevel%
