#!/bin/sh
set -eu

# 共同編集前提で新規作成物に group 書き込み権限を付与
umask 002

echo "🏥 美容室管理システムを起動中..."

# ボリュームマウントされたディレクトリの権限チェックと自動修正
echo "📁 ディレクトリ権限をチェック・修正中..."

# 実行ユーザーのUID/GIDを取得
RUID="$(id -u)"
RGID="$(id -g)"

# 権限チェック・修正関数（所有権=実行ユーザー、dir=775 / file=664）
check_and_fix_permissions() {
    dir="$1"

    if [ ! -d "$dir" ]; then
        mkdir -p "$dir" 2>/dev/null || true
        echo "✅ $dir ディレクトリを作成しました"
    fi

    # 所有権とパーミッションを統一
    chown -R "$RUID:$RGID" "$dir" 2>/dev/null || true
    find "$dir" -type d -exec chmod 775 {} + 2>/dev/null || true
    find "$dir" -type f -exec chmod 664 {} + 2>/dev/null || true

    # 書き込みテスト
    test_file="$dir/.permission_test"
    if touch "$test_file" 2>/dev/null; then
        rm -f "$test_file" 2>/dev/null || true
        echo "✅ $dir 権限OK"
        return 0
    else
        echo "❌ $dir への書き込み不可"
        return 1
    fi
}

# 各ディレクトリの権限チェック・修正
permission_ok=true

if ! check_and_fix_permissions "/app/data"; then
    permission_ok=false
fi

if ! check_and_fix_permissions "/app/logs"; then
    permission_ok=false
fi

if ! check_and_fix_permissions "/app/data/backups"; then
    permission_ok=false
fi

# アップロードも事前に整備
if ! check_and_fix_permissions "/app/data/uploads"; then
    permission_ok=false
fi

if [ "$permission_ok" = false ]; then
    echo ""
    echo "❌ 権限エラーが検出されました"
    echo "解決方法："
    echo "1. コンテナを停止: docker-compose down"
    echo "2. ホスト側で権限修正: sudo chown -R $(id -u):$(id -g) data logs"
    echo "3. 再起動: docker-compose up -d"
    echo ""
    echo "または、一時的な解決策として："
    echo "sudo chmod -R 777 data logs"
    exit 1
fi

# 必要なサブディレクトリを作成
echo "必要なサブディレクトリを作成中..."
mkdir -p /app/data/uploads /app/data/backups
echo "✅ /app/data/uploads ディレクトリを作成しました"
echo "✅ /app/data/backups ディレクトリを作成しました"

# コンテナ内でディレクトリの権限を確実に設定
echo "🔧 コンテナ内ディレクトリの権限を設定中..."

# データベースファイルの権限を設定
if [ -f "/app/data/salon.db" ]; then
    chmod 664 /app/data/salon.db 2>/dev/null || true
    echo "✅ データベースファイルの権限を設定しました"
fi

# バックアップディレクトリの権限を確実に設定
echo "🔧 バックアップディレクトリの権限を設定中..."
chmod 775 /app/data/backups 2>/dev/null || true
echo "✅ バックアップディレクトリの権限を設定しました"

# アップロードディレクトリの権限を設定
if [ -d "/app/data/uploads" ]; then
    chmod 775 /app/data/uploads 2>/dev/null || true
    echo "✅ アップロードディレクトリの権限を設定しました"
fi

# Next.js キャッシュの権限調整（画像最適化が EACCES で失敗するのを防ぐ）
if [ -d "/app/.next" ]; then
    mkdir -p /app/.next/cache 2>/dev/null || true
    chmod -R 775 /app/.next/cache 2>/dev/null || true
fi

# 改善されたデータベース初期化判定
check_database_integrity() {
    local db_path="/app/data/salon.db"
    
    # 1. ファイル存在確認
    if [ ! -f "$db_path" ]; then
        echo "データベースファイルが存在しません"
        return 1  # 初期化が必要
    fi
    
    # 2. ファイルサイズ確認（空ファイルチェック）
    if [ ! -s "$db_path" ]; then
        echo "⚠️  データベースファイルが空です"
        return 1
    fi
    
    # 3. 簡易的なサイズチェック（60KB以上なら初期化済みとみなす）
    local file_size=$(stat -c%s "$db_path" 2>/dev/null || stat -f%z "$db_path" 2>/dev/null || echo "0")
    if [ "$file_size" -lt 60000 ]; then
        echo "⚠️  データベースファイルのサイズが小さすぎます (${file_size} bytes)"
        return 1
    fi
    
    return 0  # データベースは正常
}

# データベース初期化処理
# データベースファイルの存在確認（サイズチェックのみ）
if [ -f "/app/data/salon.db" ] && [ -s "/app/data/salon.db" ]; then
    file_size=$(stat -f%z "/app/data/salon.db" 2>/dev/null || stat -c%s "/app/data/salon.db" 2>/dev/null || echo "0")
    if [ "$file_size" -gt 50000 ]; then
        echo "✅ データベースファイルが既に存在します (${file_size} bytes)"
        db_needs_init=false
    else
        echo "⚠️  データベースファイルが小さすぎます。再初期化します..."
        db_needs_init=true
    fi
else
    echo "📊 データベースファイルが存在しません。初期化します..."
    db_needs_init=true
fi

if [ "$db_needs_init" = "true" ]; then
    echo "データベースを初期化しています..."
    
    # 既存ファイルをバックアップ（存在する場合）
    if [ -f "/app/data/salon.db" ]; then
        backup_name="/app/data/backups/salon.db.backup.$(date +%Y%m%d_%H%M%S)"
        mkdir -p /app/data/backups
        cp "/app/data/salon.db" "$backup_name" 2>/dev/null || true
        echo "既存のデータベースを $backup_name にバックアップしました"
        rm "/app/data/salon.db"
    fi
    
    if node scripts/safe-init-database.js; then
        echo "✅ データベースの初期化が完了しました"
        # データベースファイルの権限を設定
        chmod 664 /app/data/salon.db 2>/dev/null || true
    else
        echo "❌ データベース初期化に失敗しました"
        
        # バックアップからの復旧を試行
        latest_backup=$(ls -t /app/data/backups/salon.db.backup.* 2>/dev/null | head -1)
        if [ -n "$latest_backup" ] && [ -f "$latest_backup" ]; then
            echo "最新のバックアップ ($latest_backup) からの復旧を試行します..."
            cp "$latest_backup" "/app/data/salon.db"
            chmod 664 /app/data/salon.db 2>/dev/null || true
            if check_database_integrity; then
                echo "✅ バックアップからの復旧に成功しました"
            else
                echo "❌ バックアップからの復旧に失敗しました"
                exit 1
            fi
        else
            echo "❌ 利用可能なバックアップがありません"
            exit 1
        fi
    fi
else
    echo "✅ 既存のデータベースを使用します"
fi

# ネットワーク情報を表示
echo ""
echo "🌐 ネットワーク情報:"
if [ -n "$HOST_IP" ] && [ "$HOST_IP" != "auto" ]; then
    echo "   ホストIP: $HOST_IP (start-docker.sh で検出)"
    echo "   QRコード用URL: http://$HOST_IP:3000"
else
    echo "   ホストIP: 未設定 (アプリ内で自動検出)"
    echo "   設定方法: http://localhost:3000/settings/network"
fi

# アプリケーションを起動
echo ""
echo "🚀 アプリケーションを起動しています..."

# Next.js standalone modeで起動
exec node server.js