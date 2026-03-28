# CLAUDE.md

このファイルは、Claude Code (claude.ai/code) がこのリポジトリで作業する際のガイダンスを提供します。

## プロジェクト概要

**Replia** — 日本向けのInstagram DM/コメント自動返信SaaS。Nuxt 3（フルスタック）、PostgreSQL（Prisma経由）、Meta Graph API で構築。UI・APIメッセージ・エラー文言はすべて**日本語固定**。

## 開発コマンド

すべてのコマンドは `app/` ディレクトリで実行。

```bash
# ローカル開発
npm install
npm run dev          # http://localhost:3000

# ビルド
npm run build
npm run preview

# Vercelデプロイ用ビルド（Prismaマイグレーションを先に実行）
npm run build:vercel

# データベース（Prisma）
npx prisma migrate dev       # 新規マイグレーション作成・適用（開発用）
npx prisma migrate deploy    # マイグレーション適用（本番・Docker）
npx prisma generate          # スキーマ変更後にPrismaクライアント再生成
```

Docker（Postgres + アプリをまとめて起動）:
```bash
docker compose -f docker-compose.dev.yml up --build
docker compose -f docker-compose.dev.yml down
```

自動テストは存在しない。変更確認は以下で行う:
1. `npm run build` が成功すること
2. アプリが起動し日本語UIが表示されること
3. 変更した機能を手動確認（CRUD・認証・Webhook等）

## アーキテクチャ

Nuxt 3 モノリス: `app/` ディレクトリにVueフロントエンド（pages・components・composables）とNitroサーバーバックエンド（APIルート・サービス・ユーティリティ）が共存。

### モジュール配置ルール

| 種別 | 配置場所 |
|------|----------|
| 画面（ページ） | `app/pages/` |
| 再利用UIコンポーネント | `app/components/` |
| Vue コンポーザブル | `app/composables/` |
| APIエンドポイント | `app/server/api/` |
| ビジネスロジック・サーバー共通処理 | `app/server/utils/` |
| 外部API連携（Instagram・Meta OAuth） | `app/server/services/` |
| Prismaスキーマ・マイグレーション | `app/prisma/` |

### バックエンドのパターン

- **サーバールート**: Nitro規約に従い `app/server/api/<resource>/<action>.<method>.ts`
- **認証**: セッションクッキー方式。HMAC-SHA256署名（`SESSION_SECRET`使用）。保護されたルートでは `requireAuth(event)` または `requireAdmin(event)` を呼ぶ。
- **Instagramアクセストークン**: AES-256-GCMで暗号化して保存（`TOKEN_ENCRYPTION_KEY`使用）。
- **スコープ**: すべてのリソースはUserに属する。DBクエリは必ず `userId` でスコープする。
- **APIレスポンス**: `{ message: string, data: T }` 形式。エラーはh3の `createError()` を使用。

### データモデル（Prisma）

主要モデル: `User`（ロール: ADMIN|MEMBER）→ `IgAccount`、`ReplyRule`、`InboundEvent`、`OutboundReply`

- `ReplyRule`: チャンネル（DM|COMMENT）ごとのキーワードマッチルール。優先度順で評価。
- `InboundEvent`: Meta Webhookからの受信DM/コメント。マッチしたルールと送信者情報を保存。
- `OutboundReply`: 自動返信の実行結果（STUBBED|SENT|FAILED|SKIPPED）。

### Meta/Instagram連携

- Webhookレシーバー: `app/server/api/webhooks/instagram.post.ts` — Metaの署名検証・イベント処理・自動返信トリガー。
- Instagramビジネスアカウント連携のOAuthフロー: `app/server/api/ig-accounts/oauth/`
- Instagramサービス: `app/server/services/instagram.service.ts` — Graph API呼び出しのラッパー。
- 必要なOAuthスコープ: `instagram_business_basic`、`instagram_business_manage_messages`、`instagram_business_manage_comments`

## 必須環境変数

```env
APP_BASE_URL=                   # アプリのURL（OAuthリダイレクトURIに使用）
SESSION_SECRET=                 # セッション署名用の32文字以上のシークレット
TOKEN_ENCRYPTION_KEY=           # Instagramトークン暗号化用の32文字以上のキー
DATABASE_URL=                   # PostgreSQLプーラーURL（PgBouncer / Supabase）
DIRECT_URL=                     # PostgreSQL直接接続URL（Prismaマイグレーション用）
META_APP_ID=
META_APP_SECRET=
META_WEBHOOK_VERIFY_TOKEN=      # Webhookの署名検証用ランダム文字列
META_API_VERSION=v24.0          # 省略可。デフォルトはv24.0
```

## コーディング規約

- TypeScript + ESM を使用
- インデントは2スペース
- Vueコンポーネント: PascalCaseのファイル名
- APIルートファイル: kebab-case（例: `reply-rules.post.ts`）
- **UI文言・APIメッセージ・エラーメッセージはすべて日本語** — i18nライブラリは使用せず、日本語文字列をハードコード
- **UIコンポーネントは `shadcn-nuxt`（shadcn/ui の Vue 移植）を使用** — ボタン・フォーム・カード等の汎用UIは `app/components/ui/` 配下の既存コンポーネントを優先して使う。新規コンポーネントが必要な場合も同ディレクトリのスタイルに合わせる

## コミット規約

Conventional Commits: `feat:`、`fix:`、`chore:`、`docs:` — 1コミット＝1論理変更。
