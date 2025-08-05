#!/bin/bash

echo "美容室管理システム - Docker版を起動します..."

# ---- ① Docker権限チェック ----
if ! docker info &>/dev/null; then
    echo "[ERROR] Dockerデーモンに接続できません。"
    echo "おそらく現在のユーザーが docker グループに追加されていないためです。"
    echo ""
    echo "次のコマンドを実行し、ログアウト＆再ログインしてください："
    echo "  sudo usermod -aG docker $USER"
    echo ""
    echo "あるいは、このスクリプトを sudo 付きで再実行してください："
    echo "  sudo ./start-docker.sh"
    exit 1
fi

# ---- ② ifconfig なければ net-tools をインストール（Ubuntu）----
if ! command -v ifconfig &> /dev/null; then
    echo "[INFO] ifconfig が見つかりません。net-tools をインストールします..."
    if [ -f /etc/debian_version ]; then
        sudo apt update && sudo apt install -y net-tools
    else
        echo "[WARN] 自動インストールに非対応の環境です。手動で ifconfig をインストールしてください。"
    fi
fi

# ---- ③ 必要なディレクトリ作成と権限修正 ----
echo "必要なディレクトリを作成・権限設定中..."
mkdir -p data backups logs data/uploads

# 権限問題を解決（nextjsユーザーのUID:1001に設定）
echo "ディレクトリ権限を修正中..."
if chown -R 1001:1001 data backups logs 2>/dev/null; then
    echo "✅ 権限設定が完了しました（通常権限で実行）"
else
    echo "通常の権限変更に失敗。sudoを使用します..."
    if sudo chown -R 1001:1001 data backups logs; then
        echo "✅ 権限設定が完了しました（sudo権限で実行）"
    else
        echo "❌ 権限設定に失敗しました。手動で実行してください："
        echo "  sudo chown -R 1001:1001 data backups logs"
        exit 1
    fi
fi

# ホストマシンのIPアドレスを自動検出
echo "ホストIPアドレスを検出中..."
HOST_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')

if [ -z "$HOST_IP" ]; then
    # macOSの場合の代替方法
    HOST_IP=$(ifconfig en0 | grep "inet " | awk '{print $2}' 2>/dev/null)
fi

if [ -z "$HOST_IP" ]; then
    # Wi-Fiインターフェースを試行
    HOST_IP=$(ifconfig en1 | grep "inet " | awk '{print $2}' 2>/dev/null)
fi

if [ -n "$HOST_IP" ]; then
    echo "検出されたホストIP: $HOST_IP"
    export HOST_IP
else
    echo "ホストIPの自動検出に失敗しました。自動検出を使用します。"
    export HOST_IP="auto"
fi

# Docker Composeが利用可能かチェック
if command -v docker-compose &> /dev/null; then
    echo "Docker Composeを使用して起動します..."
    docker-compose up -d
elif command -v docker &> /dev/null && docker compose version &> /dev/null; then
    echo "Docker Compose V2を使用して起動します..."
    docker compose up -d
else
    echo "エラー: Docker Composeが見つかりません"
    echo "Dockerをインストールしてください: https://docs.docker.com/get-docker/"
    exit 1
fi

echo ""
echo "✅ 起動完了!"
echo "📱 ローカルアクセス: http://localhost:3000"
if [ "$HOST_IP" != "auto" ]; then
    echo "🌐 ネットワークアクセス: http://$HOST_IP:3000"
fi
echo "📝 ログ確認: docker-compose logs -f salon-management"
echo "⏹️  停止方法: ./stop-docker.sh" 