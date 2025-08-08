#!/bin/bash

echo "🏥 美容室管理システム - ローカルビルド版起動中..."

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
mkdir -p data logs data/uploads

# 権限設定（nextjsユーザー用：UID 1001）
echo "🔧 ディレクトリ権限を設定中..."

# sudoの可用性チェック
if command -v sudo >/dev/null 2>&1; then
    if sudo chown -R 1001:1001 data logs 2>/dev/null; then
        echo "✅ 権限設定完了（sudo使用）"
    else
        echo "⚠️  sudo権限設定に失敗。手動設定が必要な場合があります："
        echo "  sudo chown -R 1001:1001 data logs"
        echo "続行します..."
    fi
else
    # sudoがない環境（一部のDockerコンテナ環境など）
    if chown -R 1001:1001 data logs 2>/dev/null; then
        echo "✅ 権限設定完了"
    else
        echo "⚠️  権限設定をスキップ（Docker環境で自動処理されます）"
    fi
fi

# 最低限の権限を確保
chmod 755 data logs 2>/dev/null || true

# バックアップディレクトリの権限を明示的に設定
if [ -d "data/backups" ]; then
    chmod 775 data/backups 2>/dev/null || true
    echo "✅ バックアップディレクトリの権限を設定しました"
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

# ---- ④ ローカルビルドと起動 ----
echo "🔨 Dockerイメージをローカルビルド中..."

if command -v docker-compose >/dev/null 2>&1; then
    docker-compose -f docker-compose.build.yml build
    echo "🚀 起動中..."
    docker-compose -f docker-compose.build.yml up -d
elif docker compose version >/dev/null 2>&1; then
    docker compose -f docker-compose.build.yml build
    echo "🚀 起動中..."
    docker compose -f docker-compose.build.yml up -d
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
echo "📝 ログ確認: docker-compose -f docker-compose.build.yml logs -f salon-management"
echo "⏹️  停止方法: ./stop-docker-build.sh"
