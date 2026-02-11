@echo off
REM Docker Run Script untuk Bot Telegram Omega Tronik (Windows)

echo ================================
echo Bot Telegram Omega Tronik
echo Docker Management Script
echo ================================
echo.

REM Check if .env exists
if not exist .env (
    echo [WARNING] File .env tidak ditemukan!
    echo Membuat .env dari template...
    copy .env.example .env
    echo.
    echo File .env sudah dibuat.
    echo Silakan edit dengan kredensial Anda!
    echo.
    pause
    exit /b 1
)

REM Create directories
if not exist database mkdir database
if not exist logs mkdir logs
if not exist nginx\ssl mkdir nginx\ssl

:menu
echo.
echo ========== MENU ==========
echo 1. Start Bot (Polling Mode)
echo 2. Start Bot (Webhook Mode)
echo 3. Build ^& Start
echo 4. Stop Bot
echo 5. Restart Bot
echo 6. View Logs
echo 7. Status
echo 8. Clean ^& Rebuild
echo 9. Shell Access
echo 0. Exit
echo ==========================
echo.

set /p choice="Pilihan: "

if "%choice%"=="1" goto start_polling
if "%choice%"=="2" goto start_webhook
if "%choice%"=="3" goto build_start
if "%choice%"=="4" goto stop
if "%choice%"=="5" goto restart
if "%choice%"=="6" goto logs
if "%choice%"=="7" goto status
if "%choice%"=="8" goto clean
if "%choice%"=="9" goto shell
if "%choice%"=="0" goto exit
goto menu

:start_polling
echo.
echo Starting bot in POLLING mode...
docker-compose up -d telegram-bot
echo.
echo Bot started!
echo View logs: docker-compose logs -f telegram-bot
pause
goto menu

:start_webhook
echo.
echo Starting bot in WEBHOOK mode...
docker-compose --profile webhook up -d
echo.
echo Bot and Nginx started!
echo View logs: docker-compose logs -f
pause
goto menu

:build_start
echo.
echo Building Docker image...
docker-compose build --no-cache
echo.
echo Starting containers...
docker-compose up -d telegram-bot
echo.
echo Done!
pause
goto menu

:stop
echo.
echo Stopping containers...
docker-compose down
echo.
echo Containers stopped!
pause
goto menu

:restart
echo.
echo Restarting containers...
docker-compose restart
echo.
echo Containers restarted!
pause
goto menu

:logs
echo.
echo Viewing logs (Ctrl+C to exit)...
docker-compose logs -f telegram-bot
goto menu

:status
echo.
echo Container Status:
docker-compose ps
pause
goto menu

:clean
echo.
echo Cleaning up...
docker-compose down -v
docker system prune -f
echo.
echo Rebuilding...
docker-compose build --no-cache
echo.
echo Clean and rebuild complete!
pause
goto menu

:shell
echo.
echo Opening shell in container...
docker-compose exec telegram-bot sh
goto menu

:exit
echo.
echo Goodbye!
exit /b 0
