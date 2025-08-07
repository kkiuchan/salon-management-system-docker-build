# 🚀 デプロイメントガイド

GitHub Actions を使用したビルド済み Docker イメージの自動配布ガイドです。

## 📋 事前準備

### 1. GitHub リポジトリ設定

```bash
# リポジトリ設定
Settings → General → Features
☑️ Packages を有効化

# Container Registry の権限設定
Settings → Actions → General
Workflow permissions: Read and write permissions
```

### 2. リポジトリ名の設定

`docker-compose.yml` の以下の部分を実際のリポジトリ名に変更：

```yaml
# 変更前
image: ghcr.io/your-username/salon-management-system:latest

# 変更後（例）
image: ghcr.io/tanaka-salon/salon-management-system:latest
```

## 🔄 リリースプロセス

### 初回セットアップ

```bash
# 1. GitHub Actions ファイルをコミット
git add .github/
git commit -m "feat: add GitHub Actions CI/CD"
git push origin main

# 2. 初回リリース
git tag v1.0.0
git push origin v1.0.0
```

### 通常のリリース

```bash
# 1. 機能開発・修正
git add .
git commit -m "feat: 新機能追加"
git push origin main

# 2. バージョンタグを作成
git tag v1.1.0
git push origin v1.1.0

# 3. GitHub Actions が自動実行
# → ビルド → テスト → Docker イメージ作成 → 配布
```

## 📦 ビルド確認

### GitHub Actions の確認

1. GitHub リポジトリの **Actions** タブを開く
2. **Build and Release Docker Image** ワークフローを確認
3. 緑色のチェックマークで成功を確認

### パッケージ確認

1. GitHub リポジトリの **Packages** タブを開く
2. `salon-management-system` パッケージを確認
3. バージョン一覧とダウンロード数を確認

## 🏥 顧客への配布

### 配布ファイル

顧客には以下のファイルを提供：

```
salon-management-system-release/
├── docker-compose.yml       # ビルド済みイメージ使用
├── start-docker.sh         # Linux/macOS起動スクリプト
├── start-docker.bat        # Windows起動スクリプト
├── stop-docker.sh          # 停止スクリプト
├── stop-docker.bat         # Windows停止スクリプト
└── README.md              # 使用方法
```

### 顧客の起動方法

```bash
# Linux/macOS
./start-docker.sh

# Windows
start-docker.bat

# 手動起動
docker-compose pull
docker-compose up -d
```

## 🔧 トラブルシューティング

### ビルドエラー

```bash
# Actions タブでエラー詳細を確認
# よくあるエラー：
# 1. Dockerfile.build が見つからない
# 2. パッケージ権限エラー
# 3. マルチプラットフォームビルドエラー
```

### 権限エラー

```bash
# Settings → Actions → General
# Workflow permissions を確認
# "Read and write permissions" を選択
```

### イメージが見つからない

```bash
# パッケージの可視性を確認
# Packages → salon-management-system → Settings
# "Change visibility" → Public
```

## 📊 バージョン管理

### セマンティックバージョニング

```bash
v1.0.0  # メジャー.マイナー.パッチ

# 例：
v1.0.0  # 初回リリース
v1.0.1  # バグフィックス
v1.1.0  # 新機能追加
v2.0.0  # 破壊的変更
```

### タグの例

```bash
# バグ修正
git tag v1.0.1 -m "fix: QRコード表示の修正"

# 新機能
git tag v1.1.0 -m "feat: 新しい売上レポート機能"

# 大幅変更
git tag v2.0.0 -m "feat!: データベース構造の大幅変更"
```

## 🎯 自動化の利点

### 開発者側

- ✅ タグ push するだけで自動配布
- ✅ マルチプラットフォーム対応
- ✅ バージョン管理の自動化
- ✅ テストの自動実行

### 顧客側

- ✅ 30 秒で起動（ビルド不要）
- ✅ 確実な動作（テスト済み）
- ✅ 簡単な更新（docker-compose pull）
- ✅ 安定性の向上

---

**美容室管理システム CI/CD**  
GitHub Actions + GitHub Container Registry
