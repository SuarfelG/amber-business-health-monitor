@echo off
setlocal enabledelayedexpansion

echo.
echo ========================================
echo  COMPLETE RESET AND REBUILD
echo ========================================
echo.

REM Kill all node processes
echo Killing any running Node processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

REM Clean server
echo.
echo Cleaning server...
cd /d "C:\Users\samrawit\OneDrive\Documents\Business-and-health-monitor\Apps\server"
rmdir /s /q dist >nul 2>&1
rmdir /s /q node_modules >nul 2>&1

REM Clean web
echo Cleaning web...
cd /d "C:\Users\samrawit\OneDrive\Documents\Business-and-health-monitor\Apps\web"
rmdir /s /q dist >nul 2>&1
rmdir /s /q node_modules >nul 2>&1

REM Install dependencies
echo.
echo Installing server dependencies...
cd /d "C:\Users\samrawit\OneDrive\Documents\Business-and-health-monitor\Apps\server"
call npm install >nul 2>&1

echo Installing web dependencies...
cd /d "C:\Users\samrawit\OneDrive\Documents\Business-and-health-monitor\Apps\web"
call npm install >nul 2>&1

REM Build
echo.
echo Building server...
cd /d "C:\Users\samrawit\OneDrive\Documents\Business-and-health-monitor\Apps\server"
call npm run build

echo.
echo Building web...
cd /d "C:\Users\samrawit\OneDrive\Documents\Business-and-health-monitor\Apps\web"
call npm run build

echo.
echo ========================================
echo  RESET COMPLETE
echo ========================================
echo.
echo Now run:
echo   1. In Terminal 1: docker-compose up
echo   2. In Terminal 2: cd Apps\server ^&^& npm start
echo   3. In Terminal 3: cd Apps\web ^&^& npm run dev
echo.
pause
