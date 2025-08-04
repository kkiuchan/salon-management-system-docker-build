@echo off
chcp 65001 >nul

echo 美容室管理システム - Docker版を停止します...

REM Docker Composeが利用可能かチェック
docker-compose --version >nul 2>&1
if %errorlevel% equ 0 (
    echo Docker Composeを使用して停止します...
    docker-compose down
) else (
    docker compose version >nul 2>&1
    if %errorlevel% equ 0 (
        echo Docker Compose V2を使用して停止します...
        docker compose down
    ) else (
        echo エラー: Docker Composeが見つかりません
        pause
        exit /b 1
    )
)

echo ✅ 停止完了!
pause 