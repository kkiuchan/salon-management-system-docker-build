#!/bin/bash

echo "美容室管理システム - Docker版を停止します..."

# Docker Composeが利用可能かチェック
if command -v docker-compose &> /dev/null; then
    echo "Docker Composeを使用して停止します..."
    docker-compose down
elif command -v docker &> /dev/null && docker compose version &> /dev/null; then
    echo "Docker Compose V2を使用して停止します..."
    docker compose down
else
    echo "エラー: Docker Composeが見つかりません"
    exit 1
fi

echo "✅ 停止完了!" 