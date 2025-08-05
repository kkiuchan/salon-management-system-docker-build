#!/bin/sh

echo "美容室管理システムを起動中..."

# ボリュームマウントされたディレクトリの権限チェック
echo "ディレクトリ権限をチェック中..."

# 権限チェック関数
check_and_fix_permissions() {
    local dir="$1"
    
    if [ ! -d "$dir" ]; then
        echo "⚠️  $dir ディレクトリが存在しません"
        return 1
    fi
    
    if [ ! -w "$dir" ]; then
        echo "⚠️  $dir ディレクトリに書き込み権限がありません"
        echo "ホスト側で以下のコマンドを実行してください:"
        echo "sudo chown -R 1001:1001 $(basename $dir)"
        return 1
    fi
    
    echo "✅ $dir の権限は正常です"
    return 0
}

# 各ディレクトリの権限チェック
permission_ok=true

if ! check_and_fix_permissions "/app/data"; then
    permission_ok=false
fi

if ! check_and_fix_permissions "/app/backups"; then
    permission_ok=false
fi

if ! check_and_fix_permissions "/app/logs"; then
    permission_ok=false
fi

if [ "$permission_ok" = false ]; then
    echo ""
    echo "❌ 権限エラーが検出されました"
    echo "解決方法："
    echo "1. コンテナを停止: docker-compose down"
    echo "2. 権限修正: sudo chown -R 1001:1001 data backups logs"
    echo "3. 再起動: docker-compose up -d"
    exit 1
fi

# 必要なサブディレクトリを作成
echo "必要なサブディレクトリを作成中..."
mkdir -p /app/data/uploads
echo "✅ /app/data/uploads ディレクトリを作成しました"

# データベースの初期化
if [ ! -f "/app/data/salon.db" ]; then
    echo "データベースを初期化しています..."
    if node scripts/init-database.js; then
        echo "✅ データベースの初期化が完了しました"
    else
        echo "❌ データベース初期化に失敗しました"
        exit 1
    fi
else
    echo "✅ 既存のデータベースを使用します"
fi

# アプリケーションを起動
echo "アプリケーションを起動しています..."

# Next.js standalone modeで起動
exec node server.js 