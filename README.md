# 🏥 美容室管理システム

顧客管理、施術記録、売上分析、QR コードでのモバイルアクセスに対応した美容室向け管理システムです。

## 🚀 クイックスタート

### 方法1: 設定ファイルのみダウンロード（推奨）

```bash
# 作業ディレクトリを作成
mkdir salon-management && cd salon-management

# 必要ファイルをダウンロード
curl -O https://raw.githubusercontent.com/your-username/salon-management-system/main/docker-compose.yml
curl -O https://raw.githubusercontent.com/your-username/salon-management-system/main/start-docker.sh

# 起動（Linux/macOS）
chmod +x start-docker.sh && ./start-docker.sh
```

### 方法2: リポジトリクローン

```bash
git clone https://github.com/your-username/salon-management-system.git
cd salon-management-system

# Linux/macOS
./start-docker.sh

# Windows
start-docker.bat
```

### 方法3: 手動起動

```bash
# プリビルドイメージを使用（高速）
docker compose pull && docker compose up -d
```

## 📱 アクセス方法

起動後、以下でアクセスできます：

- **ローカル**: http://localhost:3000
- **ネットワーク**: http://[あなたの IP]:3000
- **設定画面**: http://localhost:3000/settings/network

## 🛠️ IP アドレス設定

QR コード機能を使用するには、ネットワーク IP アドレスの設定が必要です：

### 自動設定（推奨）

起動スクリプト（`start-docker.sh`）が自動で IP アドレスを検出します。

### 手動設定

```bash
# 環境変数で指定
export HOST_IP=192.168.1.100
docker-compose up -d

# または .env ファイルで設定
echo "HOST_IP=192.168.1.100" > .env
docker-compose up -d
```

### アプリ内設定

起動後、設定画面（http://localhost:3000/settings/network）で IP アドレスを設定できます。

## ⏹️ 停止方法

```bash
# Linux/macOS
./stop-docker.sh

# Windows
stop-docker.bat

# 手動停止
docker-compose down
```

## 📋 主な機能

- 👥 **顧客管理**: 詳細な顧客情報の登録・管理
- 💇 **施術記録**: 施術内容、使用薬剤、写真の記録
- 📊 **売上分析**: 日別・スタッフ別・支払い方法別の売上集計
- 📱 **QR コード**: スマホ・タブレットでの簡単アクセス
- 💾 **バックアップ**: 自動バックアップ・復元機能
- 🖨️ **データエクスポート**: CSV 形式でのデータ出力

## 🔧 トラブルシューティング

### Docker 権限エラー

```bash
sudo usermod -aG docker $USER
# ログアウト＆再ログイン後に再実行
```

### 権限エラー

```bash
sudo chown -R 1001:1001 data backups logs
docker-compose restart
```

### IP アドレスが検出されない

アプリ内の設定画面（http://localhost:3000/settings/network）で手動設定してください。

## 📞 サポート

問題が発生した場合は、以下の情報をご提供ください：

- OS 情報（Ubuntu, macOS, Windows）
- エラーメッセージ
- `docker-compose logs salon-management` の出力

---

**美容室管理システム v2.0**  
Docker 配布版 - ビルド済みイメージ対応
