@echo off
setlocal enabledelayedexpansion

REM 美容室管理システム - Windows ローカルセットアップスクリプト

REM プロジェクトルートに移動
cd /d "%~dp0..\.."

echo [INFO] 美容室管理システムのセットアップを開始します...

REM Node.jsのバージョン確認
echo [INFO] Node.jsのバージョンを確認中...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.jsがインストールされていません
    echo [INFO] Node.js 18以上をインストールしてください: https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=1,2 delims=." %%a in ('node --version') do set NODE_VERSION=%%a
set NODE_VERSION=%NODE_VERSION:~1%
if %NODE_VERSION% LSS 18 (
    echo [ERROR] Node.js 18以上が必要です。現在のバージョン: 
    node --version
    pause
    exit /b 1
)

echo [INFO] Node.js バージョン: 
node --version
echo [INFO] ✅

REM 必要なディレクトリの作成
echo [INFO] ディレクトリ構造を作成中...
mkdir "data" 2>nul
mkdir "data\uploads" 2>nul
mkdir "backups" 2>nul
mkdir "logs" 2>nul
echo [INFO] ディレクトリ構造の作成が完了しました

REM 依存関係のインストール
echo [INFO] 依存関係をインストール中...
call npm install

REM データベースの初期化
echo [INFO] データベースを初期化中...
if not exist "data\salon.db" (
    call npm run db:init
    echo [INFO] データベースが初期化されました
) else (
    echo [INFO] 既存のデータベースが見つかりました
)

REM 本番ビルドのテスト
echo [INFO] 本番ビルドをテスト中...
call npm run build

echo [INFO] ✅ セットアップが完了しました！
echo.
echo [INFO] 次のコマンドでアプリケーションを起動できます：
echo [INFO]   ./scripts/production-scripts/start.sh  # 本番モードで起動
echo [INFO]   npm run dev         # 開発モードで起動
echo.
echo [INFO] アクセスURL: http://localhost:3000
pause 