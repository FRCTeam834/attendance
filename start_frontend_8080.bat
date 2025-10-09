@echo off
echo Forcing frontend to use port 8080...

REM Kill any process using port 8080
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8080') do (
    echo Killing process %%a on port 8080
    taskkill /f /pid %%a >nul 2>&1
)

REM Wait a moment
timeout /t 2 /nobreak >nul

REM Start frontend on port 8080
echo Starting frontend on port 8080...
npm run dev
