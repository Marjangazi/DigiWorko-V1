@echo off
:: DiGital InvWOrker - Quick Start Script
:: Double-click this file to start the dev server

setlocal

:: Add Node.js to PATH for this session
for /f "tokens=*" %%i in ('where node 2^>nul') do set NODE_PATH=%%~dpi
if "%NODE_PATH%"=="" (
    set "NODE_PATH=C:\Program Files\nodejs\"
)
set PATH=%NODE_PATH%;%PATH%

echo.
echo  ========================================
echo   DiGital InvWOrker - Dev Server
echo  ========================================
echo.

:: Check if node_modules exists
if not exist "node_modules\" (
    echo  Installing packages...
    npm install
    echo.
)

echo  Starting dev server at http://localhost:5173
echo  Press Ctrl+C to stop.
echo.
npm run dev

pause
