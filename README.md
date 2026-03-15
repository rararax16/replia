# Replia — Instagram DM/コメント自動返信

**Replia** は日本向けの Instagram DM / コメント自動返信サービスです。  
Nuxt 3（Nitro）を `Vercel`、DB を `Supabase PostgreSQL` に載せる前提で構成しています。

## 技術スタック

- Frontend / Backend: Nuxt 3
- DB: Supabase PostgreSQL
- ORM: Prisma
- デプロイ先: Vercel
- Instagram 連携: Meta Graph API (`v24.0`)

## 事前準備

`app/.env.example` を参考に `app/.env` を作成してください。最低限必要なのは以下です。

- `APP_BASE_URL`
- `SESSION_SECRET`
- `TOKEN_ENCRYPTION_KEY`
- `DATABASE_URL`
- `DIRECT_URL`
- `META_APP_ID`
- `META_APP_SECRET`
- `META_WEBHOOK_VERIFY_TOKEN`

`DATABASE_URL` は Supabase の pooler 接続文字列、`DIRECT_URL` は migration 用の direct 接続文字列を設定します。

## ローカル開発

### Nuxt 単体

```bash
cd app
npm install
npm run dev
```

### Docker Compose

```bash
docker compose -f docker-compose.dev.yml up --build -d
docker compose -f docker-compose.dev.yml exec app sh
```

Compose では PostgreSQL コンテナを起動し、アプリ側には `postgresql://app_user:app_pass@postgres:5432/app_db?schema=public` を渡します。

UI ライブラリや Nuxt module など依存を追加したあと、すでに `app` コンテナを起動済みならコンテナ内の `node_modules` が古いままです。次のいずれかを実行してください。

```bash
docker compose -f docker-compose.dev.yml exec app npm install
docker compose -f docker-compose.dev.yml exec app npm run dev
```

または `app` コンテナだけ再作成します。

```bash
docker compose -f docker-compose.dev.yml up --build -d app
```

## Prisma

通常ビルド:

```bash
cd app
npm run build
```

Vercel 相当ビルド:

```bash
cd app
npm run build:vercel
```

`build:vercel` は `prisma migrate deploy` を先に実行してから Nitro の Vercel preset でビルドします。

## Vercel デプロイ

Vercel プロジェクトでは次を設定してください。

1. Root Directory: `app`
2. Install Command: `npm install`
3. Build Command: `npm run build:vercel`

`app/vercel.json` にも `buildCommand` を定義しています。

### Vercel に設定する環境変数

- `APP_BASE_URL`
- `SESSION_SECRET`
- `TOKEN_ENCRYPTION_KEY`
- `DATABASE_URL`
- `DIRECT_URL`
- `META_APP_ID`
- `META_APP_SECRET`
- `META_WEBHOOK_VERIFY_TOKEN`
- `META_API_VERSION`
- `META_OAUTH_SCOPES`

## Supabase 側の設定

1. 新しい Supabase Project を作成する
2. `Settings > Database` から接続文字列を取得する
3. pooler 用を `DATABASE_URL`、direct 接続を `DIRECT_URL` に設定する

Prisma schema は PostgreSQL 前提です。

## MetaApp設定箇所
- アプリ設定 > ベーシック > アプリドメイン > ドメインを追加 > {ドメイン}
- 認証トークン > META_WEBHOOK_VERIFY_TOKEN
- Instagram > 2. Webhooksを設定する > 
  - コールバックURL > {ドメイン}/api/webhooks/instagram
  - 認証トークン > META_WEBHOOK_VERIFY_TOKEN
- Instagram > InstagramビジネスログインによるAPI設定 > 3. Instagramビジネスログインを設定する> ビジネスログイン設定 > {ドメイン}api/ig-accounts/oauth/callback
- APP_BASE_URL > {ドメイン}

## 補足

- 初回管理者は migration 時に投入されます。既存DBにユーザーが存在しない場合も、追加した seed migration を適用すれば再作成されます。
- `app/.env` は Git 管理しないでください。
- Vercel の Preview URL は OAuth / Webhook 用の正式 URL には使わず、本番ドメインを `APP_BASE_URL` に設定してください。
