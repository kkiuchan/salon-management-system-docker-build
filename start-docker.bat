@echo off
chcp 65001 >nul

echo 美容室管理システム - Docker版を起動します...

REM ホストマシンのIPアドレスを自動検出
echo ホストIPアドレスを検出中...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"IPv4"') do (
    for /f "tokens=1" %%b in ("%%a") do (
        set HOST_IP=%%b
        goto :found_ip
    )
)

:found_ip
if defined HOST_IP (
    echo 検出されたホストIP: %HOST_IP%
) else (
    echo ホストIPの自動検出に失敗しました。自動検出を使用します。
    set HOST_IP=auto
)

REM Docker Composeが利用可能かチェック
docker-compose --version >nul 2>&1
if %errorlevel% equ 0 (
    echo Docker Composeを使用して起動します...
    docker-compose up -d
) else (
    docker compose version >nul 2>&1
    if %errorlevel% equ 0 (
        echo Docker Compose V2を使用して起動します...
        docker compose up -d
    ) else (
        echo エラー: Docker Composeが見つかりません
        echo Dockerをインストールしてください: https://docs.docker.com/get-docker/
        pause
        exit /b 1
    )
)

echo.
echo ✅ 起動完了!
echo 📱 ローカルアクセス: http://localhost:3000
if not "%HOST_IP%"=="auto" (
    echo 🌐 ネットワークアクセス: http://%HOST_IP%:3000
)
echo 📝 ログ確認: docker-compose logs -f salon-management
echo ⏹️  停止方法: stop-docker.bat
pause 