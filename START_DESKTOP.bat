@echo off
title Nexus AI Desktop
:: Check if node is running server.js on port 3456
netstat -ano | findstr 3456 >nul
if %errorlevel% neq 0 (
    start /min "" node "%~dp0server.js"
    timeout /t 2 /nobreak >nul
)

:: Open in Chrome or Edge standalone app mode (frameless, looks like native desktop app)
where msedge >nul 2>nul
if %errorlevel% equ 0 (
    start msedge --app=http://localhost:3456 --window-size=1200,850
    exit /b 0
)

where chrome >nul 2>nul
if %errorlevel% equ 0 (
    start chrome --app=http://localhost:3456 --window-size=1200,850
    exit /b 0
)

:: Fallback to default browser
start http://localhost:3456
exit /b 0
