#!/bin/bash

# 美容室管理システム - ローカル本番起動スクリプト

set -e

# 色付きログ関数
log_info() {
    echo -e "\033[32m[INFO]\033[0m $1"
}

log_warn() {
    echo -e "\033[33m[WARN]\033[0m $1"
}

log_error() {
    echo -e "\033[31m[ERROR]\033[0m $1"
}

log_info "美容室管理システムを本番モードで起動します..."

# 設定
PORT=3000
NODE_ENV="production"

# 必要なディレクトリの確認
if [ ! -d "data" ]; then
    log_error "dataディレクトリが見つかりません。setup.shを実行してください。"
    exit 1
fi

# データベースの確認
if [ ! -f "data/salon.db" ]; then
    log_warn "データベースファイルが見つかりません。初期化します..."
    npm run db:init
fi

# 依存関係の確認
if [ ! -d "node_modules" ]; then
    log_info "依存関係をインストール中..."
    npm install
fi

# 本番ビルド
log_info "本番ビルドを実行中..."
npm run build

# プロセスが既に動いているかチェック
if pgrep -f "node.*start" > /dev/null; then
    log_warn "既存のプロセスを停止中..."
    pkill -f "node.*start" || true
    sleep 2
fi

# アプリケーション起動
log_info "アプリケーションを起動中..."
export NODE_ENV=$NODE_ENV
export PORT=$PORT

# バックグラウンドで起動
nohup npm start > logs/app.log 2>&1 &
APP_PID=$!

# 起動確認
sleep 3
if kill -0 $APP_PID 2>/dev/null; then
    log_info "✅ アプリケーションが正常に起動しました"
    log_info "📱 アクセスURL: http://localhost:$PORT"
    log_info "🔍 プロセスID: $APP_PID"
    log_info "📝 ログファイル: logs/app.log"
    
    # PIDファイルに保存
    echo $APP_PID > .app.pid
    
    # ヘルスチェック
    sleep 2
    if curl -f http://localhost:$PORT/api/health > /dev/null 2>&1; then
        log_info "✅ ヘルスチェック成功"
    else
        log_warn "⚠️ ヘルスチェックに失敗しました"
    fi
else
    log_error "❌ アプリケーションの起動に失敗しました"
    exit 1
fi

log_info "アプリケーションは正常に動作しています"
log_info "停止するには: ./scripts/production-scripts/stop.sh" 