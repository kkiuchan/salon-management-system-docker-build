#!/bin/bash

echo "🏥 美容室管理システム - 起動中..."

# ---- ① Docker権限チェック ----
if ! docker info &>/dev/null; then
    echo "❌ Dockerデーモンに接続できません。"
    echo "解決方法："
    echo "  sudo usermod -aG docker $USER"
    echo "  # ログアウト＆再ログイン後に再実行"
    exit 1
fi

# ---- ② 必要なディレクトリ作成と権限修正 ----
echo "📁 必要なディレクトリを作成・権限設定中..."
mkdir -p data logs data/uploads data/backups

# 権限問題の自動検出と修正
echo "🔧 権限問題を自動検出・修正中..."

# 現在のユーザー情報を取得
CURRENT_USER=$(whoami)
CURRENT_UID=$(id -u)
CURRENT_GID=$(id -g)

# Docker Compose用の環境変数を設定
export DOCKER_UID=$CURRENT_UID
export DOCKER_GID=$CURRENT_GID

# 権限チェック関数
check_permissions() {
    local dir="$1"
    local test_file="$dir/.permission_test"
    
    # 書き込みテスト
    if touch "$test_file" 2>/dev/null; then
        rm -f "$test_file" 2>/dev/null
        return 0  # 成功
    else
        return 1  # 失敗
    fi
}

# 権限修正関数
fix_permissions() {
    local dir="$1"
    local method="$2"
    
    case $method in
        "host")
            # ホストユーザー権限で設定
            if command -v sudo >/dev/null 2>&1; then
                sudo chown -R $CURRENT_UID:$CURRENT_GID "$dir" 2>/dev/null
                sudo chmod -R 755 "$dir" 2>/dev/null
            else
                chown -R $CURRENT_UID:$CURRENT_GID "$dir" 2>/dev/null || true
                chmod -R 755 "$dir" 2>/dev/null || true
            fi
            ;;
        "container")
            # コンテナユーザー権限で設定
            if command -v sudo >/dev/null 2>&1; then
                sudo chown -R 1001:1001 "$dir" 2>/dev/null
                sudo chmod -R 755 "$dir" 2>/dev/null
            else
                echo "⚠️  sudoが必要です。手動で権限を設定してください"
                return 1
            fi
            ;;
        "permissive")
            # 777権限で設定（一時的な解決）
            if command -v sudo >/dev/null 2>&1; then
                sudo chmod -R 777 "$dir" 2>/dev/null
            else
                chmod -R 777 "$dir" 2>/dev/null || true
            fi
            ;;
    esac
}

# 権限問題の自動検出と修正
permission_issues=false

for dir in data logs; do
    if [ -d "$dir" ]; then
        if ! check_permissions "$dir"; then
            echo "⚠️  $dir に権限問題を検出"
            permission_issues=true
            
            # 自動修正を試行（ホストユーザー権限優先）
            echo "🔧 $dir の権限を自動修正中..."
            if fix_permissions "$dir" "host"; then
                echo "✅ $dir の権限修正完了"
            else
                echo "❌ $dir の権限修正に失敗"
            fi
        fi
    fi
done

# バックアップディレクトリの特別処理
if [ -d "data/backups" ]; then
    if ! check_permissions "data/backups"; then
        echo "⚠️  data/backups に権限問題を検出"
        permission_issues=true
        fix_permissions "data/backups" "host"
    fi
    # バックアップディレクトリは775権限を設定
    chmod 775 data/backups 2>/dev/null || true
fi

if [ "$permission_issues" = true ]; then
    echo ""
    echo "📝 権限問題が検出されました。"
    echo "コンテナ内で自動修正を試行しますが、問題が続く場合は以下を実行してください："
    echo "  sudo chown -R $CURRENT_UID:$CURRENT_GID data logs"
    echo "  sudo chmod -R 755 data logs"
    echo ""
fi

# ---- ③ ホストIPアドレス自動検出（QRコード用） ----
echo "🔍 ネットワーク設定を検出中..."

detect_host_ip() {
    local ip=""
    # 方法1: ip コマンド（Linux標準）
    if command -v ip >/dev/null 2>&1; then
        ip=$(ip route get 1.1.1.1 2>/dev/null | awk '{print $7; exit}')
    fi
    
    # 方法2: ifconfig（フォールバック）
    if [ -z "$ip" ] && command -v ifconfig >/dev/null 2>&1; then
        ip=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
    fi
    
    # 方法3: macOS対応
    if [ -z "$ip" ]; then
        ip=$(ifconfig en0 2>/dev/null | grep "inet " | awk '{print $2}')
    fi
    
    echo "$ip"
}

HOST_IP=$(detect_host_ip)

if [ -n "$HOST_IP" ]; then
    echo "✅ 検出されたホストIP: $HOST_IP"
    export HOST_IP
else
    echo "⚠️  IP自動検出に失敗。アプリ内で設定可能です。"
    export HOST_IP="auto"
fi

# ---- ④ 最新イメージのダウンロードと起動 ----
echo "📥 最新版をダウンロード中..."

if command -v docker-compose >/dev/null 2>&1; then
    if docker-compose pull; then
        echo "✅ 最新版のダウンロードが完了しました"
    else
        echo "⚠️  最新版のダウンロードに失敗しました。既存のイメージを使用します"
    fi
    echo "🚀 起動中..."
    docker-compose up -d
elif docker compose version >/dev/null 2>&1; then
    if docker compose pull; then
        echo "✅ 最新版のダウンロードが完了しました"
    else
        echo "⚠️  最新版のダウンロードに失敗しました。既存のイメージを使用します"
    fi
    echo "🚀 起動中..."
    docker compose up -d
else
    echo "❌ Docker Composeが見つかりません"
    echo "Dockerをインストールしてください: https://docs.docker.com/get-docker/"
    exit 1
fi

echo ""
echo "✅ 起動完了!"
echo "📱 ローカルアクセス: http://localhost:3000"
if [ "$HOST_IP" != "auto" ]; then
    echo "📱 ネットワークアクセス: http://$HOST_IP:3000"
fi
echo "📝 ログ確認: docker-compose logs -f salon-management"
echo "⏹️  停止方法: ./stop-docker.sh" 