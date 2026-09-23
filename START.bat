@echo off
title Claude AI Replica
color 0A

echo.
echo  ======================================
echo    Claude AI Replica - Local Server
echo  ======================================
echo.

:: Check if key already saved
if exist "%~dp0.apikey" (
  set /p GEMINI_API_KEY=<"%~dp0.apikey"
  echo  [OK] API key loaded from saved file.
) else (
  echo  Enter your Gemini API Key (free at https://aistudio.google.com/app/apikey)
  echo.
  set /p GEMINI_API_KEY= Key: 
  echo %GEMINI_API_KEY%>"%~dp0.apikey"
  echo  [OK] Key saved for next time.
)

echo.
echo  Starting server...
echo.

:: Start server
set GEMINI_API_KEY=%GEMINI_API_KEY%
start "" http://localhost:3456
node "%~dp0server.js"

pause
