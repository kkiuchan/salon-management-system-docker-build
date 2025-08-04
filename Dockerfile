# 美容室管理システム - Docker配布用
FROM node:18-alpine AS base

# 必要なツールとライブラリをインストール
RUN apk add --no-cache \
    libc6-compat \
    sqlite \
    curl

# 依存関係のインストール
FROM base AS deps
WORKDIR /app

# package.jsonをコピー
COPY package.json package-lock.json* ./

# 依存関係をインストール（開発依存関係も含む）
RUN npm ci

# アプリケーションのビルド
FROM base AS builder
WORKDIR /app

# 依存関係をコピー
COPY --from=deps /app/node_modules ./node_modules

# ソースコードをコピー
COPY . .

# Next.jsアプリケーションをビルド
RUN npm run build

# 本番実行環境
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 非rootユーザーを作成
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# 必要なディレクトリを作成
RUN mkdir -p /app/data/uploads /app/backups /app/logs

# 本番用ファイルをコピー
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# データベース初期化スクリプトをコピー
COPY --from=builder /app/scripts ./scripts

# 起動スクリプトをコピー
COPY start-app.sh ./start-app.sh
RUN chmod +x ./start-app.sh

# データディレクトリの権限を設定
RUN chown -R nextjs:nodejs /app/data /app/backups /app/logs

# 非rootユーザーに切り替え
USER nextjs

# ポートを公開
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 起動スクリプトでアプリケーションを起動
CMD ["./start-app.sh"] 