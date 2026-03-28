# Repository Guidelines

## プロジェクト構成
`app/` が Nuxt 3 アプリ本体です。画面は `app/pages/`、共通 UI は `app/components/`、再利用ロジックは `app/composables/`、API は `app/server/api/`、外部連携は `app/server/services/`、サーバー共通処理は `app/server/utils/` に配置します。DB 定義とマイグレーションは `app/prisma/`、ローカル PostgreSQL は `db/` と `docker-compose.dev.yml` を使います。`app/.nuxt/`、`app/.output/`、`app/node_modules/` は生成物です。

## 開発・ビルド・確認コマンド
- `cd app && npm install`: 依存関係をインストールします。
- `cd app && npm run dev`: 開発サーバーを起動します。
- `cd app && npm run build`: 本番ビルドと整合性確認を行います。
- `cd app && npm run preview`: ビルド結果をローカル確認します。
- `cd app && npm run build:vercel`: `prisma migrate deploy` 実行後に Vercel 向けビルドを行います。
- `cd app && npx prisma migrate dev`: 開発用マイグレーションを作成・適用します。
- `cd app && npx prisma migrate deploy`: 既存マイグレーションを適用します。
- `docker compose -f docker-compose.dev.yml up --build -d`: リポジトリ直下でアプリと DB をまとめて起動します。

## コーディング規約
TypeScript、Vue SFC、ESM を使用し、インデントは 2 スペースです。コンポーネントは PascalCase、composable は `useXxx.ts`、API ファイルは `reply-rules.post.ts` や `[id].put.ts` のように kebab-case と HTTP メソッドで命名します。専用の lint / format スクリプトはないため、既存実装に合わせてください。UI 文言、API メッセージ、エラーは日本語で統一します。

## テスト方針
自動テストは未整備です。PR 前に `npm run build` を実行し、`npm run dev` で変更箇所を手動確認してください。特に認証、CRUD、Prisma 関連、Instagram OAuth / Webhook に触れた変更は必ず確認します。今後テストを追加する場合は `app/tests/` または対象機能の近くに `*.test.ts` / `*.spec.ts` を配置します。

## コミットと PR
コミットメッセージは、最近の履歴に合わせて「ログイン画面の文言と案内表示を整理」のような短い日本語要約を基本にします。`feat:` / `fix:` を付けても構いませんが必須ではありません。1 コミット 1 論理変更を守ってください。PR には目的、影響範囲、必要な環境変数やマイグレーション、確認手順、UI 変更のスクリーンショットを含めます。

## 設定と機密情報
`app/.env.example` を元に `app/.env` を作成し、秘密情報はコミットしないでください。`SESSION_SECRET`、`TOKEN_ENCRYPTION_KEY`、DB 接続情報、Meta の認証情報はローカルまたはデプロイ環境でのみ管理します。`DATABASE_URL` は通常接続、`DIRECT_URL` は Prisma マイグレーション用として扱います。
