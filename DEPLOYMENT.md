# 🚀 サロン管理システム デプロイメントガイド

プリビルドされたDockerイメージを使用した簡単デプロイメント手順です。

## 📋 システム要件

- **Docker & Docker Compose**
- **Linux/macOS/Windows**（Docker Desktop）
- **インターネット接続**（初回イメージダウンロード用）

## 🚀 クイックスタート（推奨）

### 方法1: 設定ファイルのみダウンロード

最新版を使用する場合の推奨方法です：

```bash
# 作業ディレクトリを作成
mkdir salon-management-system
cd salon-management-system

# 必要なファイルをダウンロード
curl -O https://raw.githubusercontent.com/your-username/salon-management-system/main/docker-compose.yml
curl -O https://raw.githubusercontent.com/your-username/salon-management-system/main/start-docker.sh
curl -O https://raw.githubusercontent.com/your-username/salon-management-system/main/start-docker.bat

# 権限設定（Linux/macOS）
chmod +x start-docker.sh

# システム起動
./start-docker.sh  # Linux/macOS
# または
start-docker.bat   # Windows
```

### 方法2: リポジトリクローン

```bash
# リポジトリをクローン
git clone https://github.com/your-username/salon-management-system.git
cd salon-management-system

# システム起動
./start-docker.sh  # Linux/macOS
# または
start-docker.bat   # Windows
```

## 🔧 手動起動（上級者向け）

```bash
# 必要なディレクトリを作成
mkdir -p data logs

# 権限設定（Linux/macOS）
sudo chown -R 1001:1001 data logs

# Docker Compose でシステム起動
docker compose pull  # 最新イメージを取得
docker compose up -d  # バックグラウンドで起動
```

## 🌐 アクセス方法

システム起動後、以下のURLでアクセス可能です：

- **ローカル**: http://localhost:3000
- **ネットワーク**: http://[ホストIP]:3000

### QRコード表示用のIPアドレス設定

システムは自動的にホストIPアドレスを検出しますが、手動で設定することも可能です：

```bash
# 環境変数でIPアドレスを指定
HOST_IP=192.168.1.100 docker compose up -d
```

## 📁 ディレクトリ構造

```
salon-management-system/
├── docker-compose.yml     # Docker設定ファイル
├── start-docker.sh        # Linux/macOS用起動スクリプト
├── start-docker.bat       # Windows用起動スクリプト
├── data/                  # データベース・画像・バックアップ
│   ├── salon.db          # SQLiteデータベース
│   ├── uploads/          # 施術画像
│   └── backups/          # システムバックアップ
└── logs/                  # システムログ
```

## 🔒 セキュリティ考慮事項

### ファイアウォール設定

```bash
# ポート3000を開放（必要に応じて）
sudo ufw allow 3000/tcp  # Ubuntu
```

### データバックアップ

システム内蔵のバックアップ機能を使用：

- **自動バックアップ**: システム設定で定期バックアップを有効化
- **手動バックアップ**: 管理画面からワンクリックバックアップ

## 🛠️ トラブルシューティング

### 一般的な問題

#### 1. 権限エラー（最も重要）

**症状**: `permission denied`, `EACCES` エラー

**Linux/macOS の解決方法**:
```bash
# 自動修正スクリプトを実行（推奨）
./fix-permissions.sh

# または手動で修正
sudo chown -R 1001:1001 data logs
chmod 755 data logs

# 権限確認
ls -la data logs
```

**Windows の解決方法**:
```bash
# Docker Desktop の設定確認
# Settings → Resources → File sharing
# プロジェクトディレクトリが共有されていることを確認

# WSL2 使用時
wsl --set-default-version 2
# プロジェクトをWSL2内に配置することを推奨
```

**権限エラーの根本原因**:
- Docker コンテナ内の `nextjs` ユーザーは UID 1001
- ホスト側のディレクトリも UID 1001 の所有である必要がある

#### 2. ポート競合

```bash
# 使用中のポートを確認
netstat -an | grep 3000

# 別のポートを使用
sed -i 's/3000:3000/3001:3000/' docker-compose.yml
```

#### 3. イメージダウンロード失敗

```bash
# 手動でイメージを取得
docker pull ghcr.io/your-username/salon-management-system:latest

# プライベートリポジトリの場合はログイン
docker login ghcr.io
```

### ログ確認

```bash
# システムログを確認
docker compose logs -f salon-management

# 特定の時間のログ
docker compose logs --since="2024-01-01T10:00:00" salon-management
```

## 🔄 アップデート手順

```bash
# システム停止
docker compose down

# 最新イメージを取得
docker compose pull

# システム再起動
docker compose up -d

# 動作確認
curl -f http://localhost:3000/api/health
```

## 📞 サポート

問題が発生した場合：

1. **ログを確認**: `docker compose logs salon-management`
2. **システム状態を確認**: `docker compose ps`
3. **GitHubのIssues**: https://github.com/your-username/salon-management-system/issues

---

## 🏗️ 開発者向け情報

### ローカル開発

```bash
# 開発用イメージをビルド
docker build -f Dockerfile.build -t salon-test:latest .

# docker-compose.yml を編集
# image: ghcr.io/... → image: salon-test:latest

# 開発環境で起動
docker compose up -d
```

### GitHub Actions による自動ビルド

タグをプッシュすると自動的に新しいイメージがビルドされます：

```bash
git tag v1.0.1
git push origin v1.0.1
```

ビルド状況は GitHub の Actions タブで確認可能です。