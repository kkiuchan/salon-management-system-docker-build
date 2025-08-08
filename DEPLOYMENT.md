# 美容室管理システム - デプロイメントガイド

## 🚀 クイックスタート

### 1. プリビルドイメージを使用（推奨）

```bash
# 1. リポジトリをクローン
git clone https://github.com/kkiuchan/salon-management-system-docker2-main.git
cd salon-management-system-docker2-main

# 2. 起動スクリプトを実行
./start-docker.sh  # Linux/macOS
# または
start-docker.bat   # Windows
```

### 2. 手動セットアップ

```bash
# 1. 必要なディレクトリを作成
mkdir -p data logs data/uploads

# 2. 権限を設定（Linux/macOS）
sudo chown -R 1001:1001 data logs
sudo chmod -R 755 data logs

# 3. Docker Composeで起動
docker-compose up -d
```

## 🔧 GitHub Actions CI/CD

### 自動ビルドとリリース

このプロジェクトは GitHub Actions を使用して自動的に Docker イメージをビルド・リリースします。

#### ワークフロー

1. **テストワークフロー** (`test.yml`)

   - プルリクエスト時に自動実行
   - コード品質チェック
   - Docker ビルドテスト
   - セキュリティスキャン

2. **ビルド＆リリースワークフロー** (`build-and-release.yml`)

   - タグプッシュ時に自動実行
   - マルチプラットフォーム対応（Intel & Apple Silicon）
   - GitHub Container Registry にプッシュ
   - セキュリティスキャン

3. **デプロイメントワークフロー** (`deploy.yml`)
   - リリース作成時に自動実行
   - 本番環境へのデプロイメント

#### リリース手順

```bash
# 1. 変更をコミット
git add .
git commit -m "feat: 新機能追加"

# 2. タグを作成してプッシュ
git tag v1.0.0
git push origin v1.0.0

# 3. GitHub Actionsが自動実行される
# 4. GitHub Container Registryにイメージがプッシュされる
```

#### 手動実行

GitHub の Actions タブから手動でワークフローを実行できます：

1. **ビルド＆リリース**: 手動で Docker イメージをビルド
2. **デプロイメント**: 手動でデプロイメントを実行

## 📦 イメージ配布

### GitHub Container Registry

- **イメージ名**: `ghcr.io/kkiuchan/salon-management-system-docker2-main`
- **タグ**: `latest`, `v1.0.0`, `v1.1.0` など

### 顧客への配布

顧客は以下の手順で最新版を取得できます：

```bash
# 最新版を取得
docker-compose pull

# コンテナを再起動
docker-compose up -d
```

## 🔍 トラブルシューティング

### 権限エラー

```bash
# 権限を修正
sudo chown -R 1001:1001 data logs
sudo chmod -R 755 data logs

# コンテナを再起動
docker-compose restart
```

### データベースエラー

```bash
# データベースを初期化
docker-compose exec salon-management node scripts/safe-init-database.js
```

### バックアップエラー

バックアップ機能は`/tmp`ディレクトリを使用して権限問題を回避しています。

## 📊 監視とログ

### ログ確認

```bash
# リアルタイムログ
docker-compose logs -f salon-management

# 特定のログ
docker-compose logs salon-management | grep "ERROR"
```

### ヘルスチェック

```bash
# ヘルスチェック
curl http://localhost:3000/api/health
```

## 🔐 セキュリティ

### セキュリティスキャン

- **Trivy**: コンテナイメージの脆弱性スキャン
- **npm audit**: 依存関係の脆弱性チェック
- **GitHub Security**: セキュリティ結果の自動アップロード

### ベストプラクティス

1. 定期的なセキュリティアップデート
2. 最小権限の原則
3. 非 root ユーザーでの実行
4. セキュリティスキャンの自動化

## 📈 パフォーマンス

### 最適化

- **マルチステージビルド**: イメージサイズの最適化
- **キャッシュ活用**: ビルド時間の短縮
- **マルチプラットフォーム**: Intel & Apple Silicon 対応

### 監視

- **ヘルスチェック**: 自動的な障害検出
- **ログ監視**: 問題の早期発見
- **メトリクス**: パフォーマンス監視
