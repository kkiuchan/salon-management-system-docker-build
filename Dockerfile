# 美容室管理システム - ローカル開発・テスト用Dockerfile
# 本番配布用にはDockerfile.buildを使用してください

# 注意: このDockerfileは現在ビルド済みイメージ配布方式に移行中です
# ローカル開発やテスト用途でのみ使用してください
# 本番環境では ghcr.io/your-org/salon-management:latest を使用してください

FROM node:22-alpine AS base

# 必要なツールとライブラリをインストール
RUN apk add --no-cache \
    libc6-compat \
    sqlite \
    curl \
    python3 \
    make \
    g++

# アプリケーションのビルド
FROM base AS builder
WORKDIR /app

# package.jsonをコピー
COPY package.json package-lock.json* ./

# 依存関係をインストール
RUN npm ci --prefer-offline --no-audit

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

# Next.js standalone出力をコピー
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# データベース初期化スクリプトをコピー
COPY --from=builder /app/scripts ./scripts

# 起動スクリプトをコピー
COPY start-app.sh ./start-app.sh
RUN chmod +x ./start-app.sh

# 非rootユーザーに切り替え
USER nextjs

# ポートを公開
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV HOST=0.0.0.0

# 起動スクリプトでアプリケーションを起動
CMD ["./start-app.sh"] 