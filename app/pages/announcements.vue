<script setup lang="ts">
import { BellRing, RefreshCcw } from 'lucide-vue-next'
import { formatDate } from '@/lib/replia-ui'

definePageMeta({
  middleware: 'auth'
})

useHead({
  title: 'お知らせ | Replia'
})

type Announcement = {
  id: string
  title: string
  body: string
  publishAt: string
  createdAt: string
}

const refreshing = ref(false)
const { data, refresh } = useFetch('/api/announcements', { default: () => ({ announcements: [] }) })
const announcements = computed<Announcement[]>(() => (data.value as any)?.announcements ?? [])

async function refreshPage() {
  refreshing.value = true
  try {
    await refresh()
  }
  finally {
    refreshing.value = false
  }
}
</script>

<template>
  <AppAuthenticatedShell
    title="お知らせ"
    description="運営からのお知らせを確認できます。"
  >
    <template #hero>
      <div class="rounded-[1.5rem] border border-border/70 bg-muted/25 p-5">
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="text-sm font-medium text-muted-foreground">
              お知らせ件数
            </p>
            <p class="mt-2 text-3xl font-bold tracking-tight text-foreground">
              {{ announcements.length }}件
            </p>
          </div>
          <div class="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <BellRing class="size-5" />
          </div>
        </div>
      </div>
    </template>

    <template #actions>
      <Button variant="outline" :disabled="refreshing" @click="refreshPage">
        <RefreshCcw class="size-4" :class="{ 'animate-spin': refreshing }" />
        更新
      </Button>
    </template>

    <Card class="border-white/70 bg-white/85 shadow-[0_30px_90px_-48px_rgba(15,23,42,0.35)] backdrop-blur">
      <CardHeader class="gap-2">
        <CardTitle class="text-2xl">
          お知らせ一覧
        </CardTitle>
        <CardDescription class="leading-6">
          新しい順に表示しています。
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div v-if="announcements.length === 0" class="rounded-[1.5rem] border border-dashed border-border/70 bg-muted/10 p-8 text-center text-sm text-muted-foreground">
          現在お知らせはありません
        </div>

        <article
          v-for="item in announcements"
          :key="item.id"
          class="rounded-[1.5rem] border border-border/70 bg-muted/10 p-5 space-y-3"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h2 class="text-lg font-semibold text-foreground">
              {{ item.title }}
            </h2>
            <p class="text-xs text-muted-foreground">
              {{ formatDate(item.publishAt) }}
            </p>
          </div>
          <p class="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
            {{ item.body }}
          </p>
        </article>
      </CardContent>
    </Card>

    <div class="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
      <NuxtLink class="font-medium text-primary hover:text-primary/80" to="/privacy">
        プライバシーポリシー
      </NuxtLink>
      <span class="text-border">/</span>
      <NuxtLink class="font-medium text-primary hover:text-primary/80" to="/terms">
        利用規約
      </NuxtLink>
    </div>
  </AppAuthenticatedShell>
</template>
