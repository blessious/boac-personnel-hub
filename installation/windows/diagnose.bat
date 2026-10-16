@echo off
setlocal
cd /d "%~dp0"
node "%~dp0diagnose-hospital.mjs" %*
exit /b %errorlevel%
