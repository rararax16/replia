<script setup lang="ts">
useHead({
  title: 'プライバシーポリシー | Replia'
})

const updatedAt = '2026年3月2日'

const sections = [
  {
    title: '1. 取得する情報',
    paragraphs: [
      '本サービスは、アカウント登録情報（メールアドレス等）、Instagram連携時に必要な識別情報、受信したDM/コメント本文、送受信イベントの履歴を取得します。'
    ]
  },
  {
    title: '2. 利用目的',
    paragraphs: [
      '取得した情報は、ログイン認証、Instagramアカウント連携、自動返信機能の提供、不正利用防止、運用上の問い合わせ対応のために利用します。'
    ]
  },
  {
    title: '3. 第三者提供',
    paragraphs: [
      '法令に基づく場合を除き、利用者の同意なく個人情報を第三者へ提供しません。'
    ]
  },
  {
    title: '4. 外部サービスとの連携',
    paragraphs: [
      '本サービスはMetaが提供するInstagram関連APIを利用します。連携時のデータ取り扱いは、Metaの利用規約およびプライバシーポリシーにも従います。'
    ]
  },
  {
    title: '5. 安全管理',
    paragraphs: [
      '本サービスは、アクセス制御、暗号化保存、ログ管理等の合理的な安全管理措置を講じます。',
      'ただし、インターネット通信の性質上、完全な安全性を保証するものではありません。'
    ]
  },
  {
    title: '6. 開示・訂正・削除',
    paragraphs: [
      '利用者本人からの請求があった場合、法令の定めに従い、保有情報の開示・訂正・削除に対応します。'
    ]
  },
  {
    title: '7. 改定',
    paragraphs: [
      '本ポリシーは、必要に応じて改定する場合があります。重要な変更がある場合は、本ページ上で告知します。'
    ]
  },
  {
    title: '8. お問い合わせ',
    paragraphs: [
      '本ポリシーに関するお問い合わせは、サービス提供者までご連絡ください。'
    ]
  }
]
</script>

<template>
  <AppLegalLayout
    title="プライバシーポリシー"
    lead="本ポリシーは、Replia（以下「本サービス」）における、利用者情報の取り扱いについて定めるものです。"
    :updated-at="updatedAt"
  >
    <section
      v-for="section in sections"
      :key="section.title"
      class="rounded-[1.5rem] border border-border/70 bg-muted/25 p-5 sm:p-6"
    >
      <h2 class="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
        {{ section.title }}
      </h2>
      <div class="mt-3 space-y-3 text-sm leading-7 text-muted-foreground sm:text-[15px]">
        <p v-for="paragraph in section.paragraphs" :key="paragraph">
          {{ paragraph }}
        </p>
      </div>
    </section>

    <template #actions>
      <Button as-child variant="outline">
        <NuxtLink to="/login">
          ログイン画面へ戻る
        </NuxtLink>
      </Button>
      <Button as-child variant="ghost">
        <NuxtLink to="/terms">
          利用規約を見る
        </NuxtLink>
      </Button>
    </template>
  </AppLegalLayout>
</template>
