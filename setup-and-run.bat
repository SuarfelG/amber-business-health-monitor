@echo off
setlocal enabledelayedexpansion

echo.
echo 🚀 Starting Amber Setup...
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)

echo 📦 Step 1: Starting PostgreSQL database...
docker-compose up -d postgres

echo ⏳ Waiting for database to be ready...
timeout /t 5 /nobreak

echo.
echo 🔄 Step 2: Running database migrations...
cd Apps\server
call npx prisma migrate deploy

if errorlevel 1 (
    echo ❌ Migrations failed!
    pause
    exit /b 1
)

echo.
echo 🏗️  Step 3: Building server...
call npm run build

if errorlevel 1 (
    echo ❌ Build failed!
    pause
    exit /b 1
)

echo.
echo ✅ Setup complete! Starting server...
echo.
call npm start

pause
