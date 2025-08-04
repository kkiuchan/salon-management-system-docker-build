#!/bin/sh

echo "美容室管理システムを起動中..."

# データベースの初期化
if [ ! -f "/app/data/salon.db" ]; then
    echo "データベースを初期化しています..."
    cd /app
    node scripts/init-database.js
    echo "データベースの初期化が完了しました"
else
    echo "既存のデータベースを使用します"
fi

# アプリケーションを起動
echo "アプリケーションを起動しています..."
exec node server.js 