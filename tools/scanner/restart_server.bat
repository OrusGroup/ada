@echo off
echo [PANIC BUTTON] Killing all Node.js processes...
taskkill /F /IM node.exe > nul 2>&1
taskkill /F /IM chrome.exe > nul 2>&1
taskkill /F /IM chromium.exe > nul 2>&1
echo Processes killed.
echo.
echo Restarting ADA Scanner...
echo.
cd c:\Users\Tran\Desktop\ada\tools\scanner

:: Try to start with PM2 first
call pm2 resurrect > nul 2>&1
if %ERRORLEVEL% EQU 0 goto end
call pm2 start server.js --name "ada-scanner" > nul 2>&1
if %ERRORLEVEL% EQU 0 goto end

:: Fallback to npm start if PM2 fails/not installed
npm start

:end
echo Server started!
pause
