#!/bin/bash

# 美容室管理システム - ローカルセットアップスクリプト

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

log_info "美容室管理システムのセットアップを開始します..."

# Node.jsのバージョン確認
log_info "Node.jsのバージョンを確認中..."
if ! command -v node &> /dev/null; then
    log_error "Node.jsがインストールされていません"
    log_info "Node.js 18以上をインストールしてください: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    log_error "Node.js 18以上が必要です。現在のバージョン: $(node --version)"
    exit 1
fi

log_info "Node.js バージョン: $(node --version) ✅"

# 必要なディレクトリの作成
log_info "ディレクトリ構造を作成中..."
mkdir -p data/uploads
mkdir -p backups
mkdir -p logs

# 依存関係のインストール
log_info "依存関係をインストール中..."
npm install

# データベースの初期化
log_info "データベースを初期化中..."
if [ ! -f "data/salon.db" ]; then
    npm run db:init
    log_info "データベースが初期化されました"
else
    log_info "既存のデータベースが見つかりました"
fi

# 本番ビルドのテスト
log_info "本番ビルドをテスト中..."
npm run build

log_info "✅ セットアップが完了しました！"
log_info ""
log_info "次のコマンドでアプリケーションを起動できます："
log_info "  ./scripts/production-scripts/start.sh  # 本番モードで起動"
log_info "  npm run dev         # 開発モードで起動"
log_info ""
log_info "アクセスURL: http://localhost:3000" 