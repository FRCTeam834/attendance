@echo off
echo Starting Robotics Attendance System...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python from https://python.org
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo Testing database connection...
python test_database.py
if errorlevel 1 (
    echo.
    echo ERROR: Database connection test failed
    echo Please check your Neon database configuration
    pause
    exit /b 1
)

echo.
echo Starting backend server...
start "Backend Server" cmd /k "python backend.py"

echo Waiting for backend to start...
timeout /t 3 /nobreak >nul

echo Starting frontend development server...
start "Frontend Server" cmd /k "npm run dev"

echo.
echo Both servers are starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:8080
echo.
echo Press any key to stop both servers...
pause >nul

echo Stopping servers...
taskkill /f /im python.exe >nul 2>&1
taskkill /f /im node.exe >nul 2>&1
echo Servers stopped.
