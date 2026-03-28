<script setup lang="ts">
useHead({
  title: '利用規約 | Replia'
})

const updatedAt = '2026年3月2日'

const sections = [
  {
    title: '1. 適用',
    paragraphs: [
      '本規約は、本サービスの利用に関する一切の関係に適用されます。'
    ]
  },
  {
    title: '2. 提供内容',
    paragraphs: [
      '本サービスは、Instagram連携、DM/コメント受信ログ管理、自動返信ルール設定等の機能を提供します。',
      'なお、機能は予告なく変更・追加・停止される場合があります。'
    ]
  },
  {
    title: '3. アカウント管理',
    paragraphs: [
      '利用者は、自身の登録情報およびログイン情報を適切に管理する責任を負います。',
      '不正利用の疑いがある場合は、速やかに運営者へ連絡してください。'
    ]
  },
  {
    title: '4. 禁止事項',
    paragraphs: [
      '法令または公序良俗に反する行為、不正アクセス、システムへの過度な負荷、第三者の権利侵害、その他運営者が不適切と判断する行為を禁止します。'
    ]
  },
  {
    title: '5. 免責事項',
    paragraphs: [
      '本サービスは現状有姿で提供され、特定目的適合性・完全性・継続性を保証しません。',
      '運営者は、本サービス利用により生じた損害について、法令上許される範囲で責任を負いません。'
    ]
  },
  {
    title: '6. 利用停止・変更',
    paragraphs: [
      '運営者は、保守・障害対応・法令対応等のため、事前通知なく本サービスの一部または全部を停止または変更できるものとします。'
    ]
  },
  {
    title: '7. データ削除について',
    paragraphs: [
      '利用者データの削除を希望する場合は、運営者への連絡により対応します。',
      '本人確認および法令上の保存義務等を確認したうえで、合理的な期間内に削除手続きを行います。'
    ]
  },
  {
    title: '8. 規約の改定',
    paragraphs: [
      '本規約は、必要に応じて改定されることがあります。改定後の内容は本ページに掲載した時点で効力を生じます。'
    ]
  },
  {
    title: '9. 準拠法・管轄',
    paragraphs: [
      '本規約の準拠法は日本法とし、本サービスに関する紛争は運営者所在地を管轄する裁判所を第一審の専属的合意管轄とします。'
    ]
  },
  {
    title: '10. お問い合わせ',
    paragraphs: [
      'データ削除依頼を含むお問い合わせは、サービス提供者までご連絡ください。'
    ]
  }
]
</script>

<template>
  <AppLegalLayout
    title="利用規約"
    lead="本利用規約（以下「本規約」）は、Replia（以下「本サービス」）の利用条件を定めるものです。本サービスを利用する場合、本規約に同意したものとみなします。"
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
      <Button variant="outline" @click="$router.back()">
        戻る
      </Button>
      <Button as-child variant="ghost">
        <NuxtLink to="/privacy">
          プライバシーポリシーを見る
        </NuxtLink>
      </Button>
    </template>
  </AppLegalLayout>
</template>
