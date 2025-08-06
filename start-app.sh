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
    
    # 3. Node.jsを使った安全なテーブル存在確認
    if ! node -e "
        const Database = require('better-sqlite3');
        try {
            const db = new Database('$db_path', { readonly: true });
            const tables = db.prepare(\"SELECT name FROM sqlite_master WHERE type='table' AND name='customers'\").all();
            db.close();
            if (tables.length === 0) {
                console.log('customers table not found');
                process.exit(1);
            }
            console.log('Database integrity check passed');
        } catch (error) {
            console.error('Database check failed:', error.message);
            process.exit(1);
        }
    " 2>/dev/null; then
        echo "⚠️  データベースの整合性チェックに失敗しました"
        return 1
    fi
    
    return 0  # データベースは正常
}

# データベース初期化処理
if ! check_database_integrity; then
    echo "データベースを初期化しています..."
    
    # 既存ファイルをバックアップ（存在する場合）
    if [ -f "/app/data/salon.db" ]; then
        backup_name="/app/backups/salon.db.backup.$(date +%Y%m%d_%H%M%S)"
        cp "/app/data/salon.db" "$backup_name" 2>/dev/null || true
        echo "既存のデータベースを $backup_name にバックアップしました"
        rm "/app/data/salon.db"
    fi
    
    if node scripts/init-database.js; then
        echo "✅ データベースの初期化が完了しました"
    else
        echo "❌ データベース初期化に失敗しました"
        
        # バックアップからの復旧を試行
        latest_backup=$(ls -t /app/backups/salon.db.backup.* 2>/dev/null | head -1)
        if [ -n "$latest_backup" ] && [ -f "$latest_backup" ]; then
            echo "最新のバックアップ ($latest_backup) からの復旧を試行します..."
            cp "$latest_backup" "/app/data/salon.db"
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

# アプリケーションを起動
echo "アプリケーションを起動しています..."

# Next.js standalone modeで起動
exec node server.js