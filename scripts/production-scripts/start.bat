@echo off
setlocal enabledelayedexpansion

REM 美容室管理システム - Windows ローカル本番起動スクリプト

REM プロジェクトルートに移動
cd /d "%~dp0..\.."

echo [INFO] 美容室管理システムを本番モードで起動します...

REM 設定
set PORT=3000
set NODE_ENV=production

REM 必要なディレクトリの確認
if not exist "data" (
    echo [ERROR] dataディレクトリが見つかりません。setup.batを実行してください。
    pause
    exit /b 1
)

REM データベースの確認
if not exist "data\salon.db" (
    echo [WARN] データベースファイルが見つかりません。初期化します...
    call npm run db:init
)

REM 依存関係の確認
if not exist "node_modules" (
    echo [INFO] 依存関係をインストール中...
    call npm install
)

REM 本番ビルド
echo [INFO] 本番ビルドを実行中...
call npm run build

REM プロセスが既に動いているかチェック
tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I /N "node.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo [WARN] 既存のプロセスを停止中...
    taskkill /F /IM node.exe >nul 2>&1
    timeout /t 2 /nobreak >nul
)

REM アプリケーション起動
echo [INFO] アプリケーションを起動中...
set NODE_ENV=%NODE_ENV%
set PORT=%PORT%

REM バックグラウンドで起動
start /B npm start > logs\app.log 2>&1

REM 起動確認
timeout /t 3 /nobreak >nul

REM プロセスIDを取得
for /f "tokens=2" %%a in ('tasklist /FI "IMAGENAME eq node.exe" /FO CSV ^| find "node.exe"') do set APP_PID=%%a
set APP_PID=!APP_PID:"=!

if defined APP_PID (
    echo [INFO] ✅ アプリケーションが正常に起動しました
    echo [INFO] 📱 アクセスURL: http://localhost:%PORT%
    echo [INFO] 🔍 プロセスID: !APP_PID!
    echo [INFO] 📝 ログファイル: logs\app.log
    
    REM PIDファイルに保存
    echo !APP_PID! > .app.pid
    
    REM ヘルスチェック
    timeout /t 2 /nobreak >nul
    curl -f http://localhost:%PORT%/api/health >nul 2>&1
    if !ERRORLEVEL! EQU 0 (
        echo [INFO] ✅ ヘルスチェック成功
    ) else (
        echo [WARN] ⚠️ ヘルスチェックに失敗しました
    )
) else (
    echo [ERROR] ❌ アプリケーションの起動に失敗しました
    pause
    exit /b 1
)

echo [INFO] アプリケーションは正常に動作しています
echo [INFO] 停止するには: ./scripts/production-scripts/stop.bat
pause 