# 🏥 美容室管理システム

美容室の顧客管理、施術記録、売上管理を一元化する Web アプリケーションです。

## 🚀 クイックスタート

### 必要なもの

- **Docker Desktop** (Windows/macOS) または **Docker Engine** (Linux)
- インターネット接続（初回起動時のみ）

### 起動方法

#### Windows

```cmd
# 1. ダウンロードしたフォルダを開く
# 2. start-docker.bat をダブルクリック
```

#### macOS/Linux

```bash
# 1. ターミナルでダウンロードしたフォルダに移動
cd salon-management-system-docker2-main

# 2. 起動スクリプトを実行
./start-docker.sh
```

### アクセス方法

- **ローカル**: http://localhost:3000
- **ネットワーク**: 起動時に表示される QR コードをスキャン

## 📱 主な機能

### 👥 顧客管理

- 顧客情報の登録・編集
- 顧客検索・フィルタリング
- 顧客履歴の確認

### 💇‍♀️ 施術管理

- 施術記録の作成
- 施術内容の詳細記録
- 施術写真の管理

### 📊 売上管理

- 日別・月別売上レポート
- スタッフ別売上分析
- 支払い方法別集計

### 🔧 マスターデータ管理

- スタッフ管理
- 施術メニュー管理
- 小売商品管理
- 支払い方法管理

### 💾 バックアップ・復元

- ワンクリックバックアップ
- データのエクスポート
- システム復元機能

## 🔧 トラブルシューティング

### 権限エラーが発生した場合

```bash
# Linux/macOS
sudo chown -R 1001:1001 data logs
sudo chmod -R 755 data logs

# Windows
# Docker Desktop の設定でファイル共有を確認
```

### ポートが使用中の場合

```bash
# 別のポートを使用
docker-compose down
# docker-compose.yml の ports を "3001:3000" に変更
docker-compose up -d
```

### データベースエラーの場合

```bash
# データベースを初期化
docker-compose exec salon-management node scripts/safe-init-database.js
```

## 📞 サポート

問題が発生した場合：

1. ログを確認: `docker-compose logs salon-management`
2. システム状態を確認: `docker-compose ps`
3. サポートにお問い合わせください

## 🔄 アップデート

最新版に更新する場合：

```bash
# 最新版を取得
docker-compose pull

# システムを再起動
docker-compose up -d
```

---

**バージョン**: v1.0.0  
**最終更新**: 2025 年 8 月
