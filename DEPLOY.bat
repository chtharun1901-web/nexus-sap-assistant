@echo off
title Deploy Nexus AI to Firebase Hosting
echo ==========================================
echo   Deploying Nexus AI to Firebase Hosting
echo ==========================================
echo.
echo 1. Checking Firebase login...
call npx -y firebase-tools@latest login --no-localhost
if %errorlevel% neq 0 (
    echo Login failed or cancelled.
    pause
    exit /b %errorlevel%
)
echo.
echo 2. Deploying to Firebase Hosting...
call npx -y firebase-tools@latest deploy --only hosting
if %errorlevel% equ 0 (
    echo.
    echo ==========================================
    echo   DEPLOY SUCCESSFUL!
    echo   Your Nexus AI is live on the internet!
    echo ==========================================
) else (
    echo.
    echo Deploy encountered an issue. See above for details.
)
pause
