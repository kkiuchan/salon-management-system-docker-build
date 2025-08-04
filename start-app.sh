#!/bin/sh

echo "美容室管理システムを起動中..."

# 必要なディレクトリ構造を作成
echo "ディレクトリ構造を確認・作成中..."
mkdir -p /app/data/uploads
mkdir -p /app/backups
mkdir -p /app/logs

# データベースの初期化
if [ ! -f "/app/data/salon.db" ]; then
    echo "データベースを初期化しています..."
    node scripts/init-database.js
    echo "データベースの初期化が完了しました"
else
    echo "既存のデータベースを使用します"
fi

# アプリケーションを起動
echo "アプリケーションを起動しています..."
echo "ディレクトリ構造:"
ls -la /app/

# Next.js standalone modeで起動
exec node server.js 