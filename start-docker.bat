@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul

echo 🏥 美容室管理システム - 起動中...

REM Docker デーモン接続チェック
docker info >nul 2>&1
if not %errorlevel%==0 (
    echo ❌ Docker デーモンに接続できません。Docker Desktop を起動してください。
    pause
    exit /b 1
)

REM 必要なディレクトリ作成
echo 📁 必要なディレクトリを作成中...
if not exist "data" mkdir data
if not exist "logs" mkdir logs
if not exist "data\uploads" mkdir data\uploads
if not exist "data\backups" mkdir data\backups

REM Windows環境での権限設定
echo 🔧 Windows環境での権限設定...
echo ℹ️  Windows環境では、Docker Desktopのファイル共有設定で権限が自動調整されます
echo ℹ️  問題が発生した場合は、Docker Desktop の Settings → Resources → File sharing を確認してください

REM ホストIPアドレス自動検出（QRコード用）
echo 🔍 ネットワーク設定を検出中...
set "HOST_IP="
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"IPv4" ^| findstr /v "127.0.0.1"') do (
    for /f "tokens=1" %%b in ("%%a") do (
        set "HOST_IP=%%b"
        set "HOST_IP=!HOST_IP:~1!"
        goto :found_ip
    )
)

:found_ip
if defined HOST_IP (
    echo ✅ 検出されたホストIP: %HOST_IP%
) else (
    echo ⚠️  IP自動検出に失敗。アプリ内で設定可能です。
    set HOST_IP=auto
)

REM 最新イメージのダウンロードと起動
echo 📥 最新版をダウンロード中...

docker-compose --version >nul 2>&1
if %errorlevel% equ 0 (
    docker-compose pull
    echo 🚀 起動中...
    docker-compose up -d
) else (
    docker compose version >nul 2>&1
    if %errorlevel% equ 0 (
        docker compose pull
        echo 🚀 起動中...
        docker compose up -d
    ) else (
        echo ❌ Docker Composeが見つかりません
        echo Dockerをインストールしてください: https://docs.docker.com/get-docker/
        pause
        exit /b 1
    )
)

echo.
echo ✅ 起動完了!
echo 📱 ローカルアクセス: http://localhost:3000
if not "%HOST_IP%"=="auto" (
    echo 📱 ネットワークアクセス: http://%HOST_IP%:3000
)
echo 📝 ログ確認: docker-compose logs -f salon-management
echo ⏹️  停止方法: stop-docker.bat
pause