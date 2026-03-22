<script setup lang="ts">
import { ExternalLink, MessageSquare, RefreshCcw, Users, Zap } from 'lucide-vue-next'
import { formatDate, getInstagramProfileUrl } from '@/lib/replia-ui'

definePageMeta({
  middleware: 'auth'
})

useHead({
  title: 'コメントユーザー | Replia'
})

type CommentUser = {
  senderId: string
  senderUsername: string | null
  commentCount: number
  lastCommentAt: string
  lastContent: string
}

const refreshing = ref(false)
const { data: billingData } = useFetch('/api/billing')
const isPro = computed(() => (billingData.value as any)?.plan === 'PRO')
const { data, refresh } = useFetch('/api/comment-users', { default: () => ({ commentUsers: [] }) })
const commentUsers = computed<CommentUser[]>(() => (data.value as any)?.commentUsers ?? [])

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
    title="コメントユーザー"
    description="あなたの投稿にコメントしたユーザーの一覧です。ユーザー名をクリックするとInstagramプロフィールを開けます。"
  >
    <template #hero>
      <div class="rounded-[1.5rem] border border-border/70 bg-muted/25 p-5">
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="text-sm font-medium text-muted-foreground">
              コメントユーザー数
            </p>
            <p class="mt-2 text-3xl font-bold tracking-tight text-foreground">
              {{ commentUsers.length }}人
            </p>
          </div>
          <div class="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Users class="size-5" />
          </div>
        </div>
      </div>

      <div class="rounded-[1.5rem] border border-border/70 bg-muted/25 p-5">
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="text-sm font-medium text-muted-foreground">
              総コメント数
            </p>
            <p class="mt-2 text-3xl font-bold tracking-tight text-foreground">
              {{ commentUsers.reduce((sum, u) => sum + u.commentCount, 0) }}件
            </p>
          </div>
          <div class="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <MessageSquare class="size-5" />
          </div>
        </div>
      </div>

      <div class="rounded-[1.5rem] border border-border/70 bg-muted/25 p-5">
        <p class="text-sm font-medium text-muted-foreground">
          使い方
        </p>
        <p class="mt-2 text-sm leading-6 text-muted-foreground">
          ユーザー名をクリックしてInstagramプロフィールを開き、手動でDMを送れます。
        </p>
      </div>
    </template>

    <template #actions>
      <Button variant="outline" :disabled="refreshing" @click="refreshPage">
        <RefreshCcw class="size-4" :class="{ 'animate-spin': refreshing }" />
        更新
      </Button>
    </template>

    <!-- Freeプランゲート -->
    <Card v-if="!isPro" class="border-white/70 bg-white/85 shadow-[0_30px_90px_-48px_rgba(15,23,42,0.35)] backdrop-blur">
      <CardContent class="flex flex-col items-center gap-4 py-12 text-center">
        <div class="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Zap class="size-7" />
        </div>
        <div class="space-y-2">
          <p class="text-xl font-bold text-foreground">
            Proプランの機能です
          </p>
          <p class="text-sm text-muted-foreground">
            コメントユーザー一覧はProプランでご利用いただけます。
          </p>
        </div>
        <a
          href="mailto:support@replia.jp"
          class="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Zap class="size-4" />
          Proプランにアップグレード
        </a>
      </CardContent>
    </Card>

    <Card v-else class="border-white/70 bg-white/85 shadow-[0_30px_90px_-48px_rgba(15,23,42,0.35)] backdrop-blur">
      <CardHeader class="gap-2">
        <CardTitle class="text-2xl">
          コメントユーザー一覧
        </CardTitle>
        <CardDescription class="leading-6">
          最新コメント順に表示しています。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div class="overflow-hidden rounded-[1.5rem] border border-border/70">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ユーザー</TableHead>
                <TableHead class="w-28 text-right">
                  コメント数
                </TableHead>
                <TableHead class="w-44">最終コメント日時</TableHead>
                <TableHead>最新コメント内容</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="user in commentUsers" :key="user.senderId">
                <TableCell>
                  <div class="flex items-center gap-2">
                    <template v-if="user.senderUsername">
                      <a
                        :href="getInstagramProfileUrl(user.senderUsername)"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                      >
                        @{{ user.senderUsername }}
                        <ExternalLink class="size-3" />
                      </a>
                    </template>
                    <template v-else>
                      <span class="font-mono text-sm text-muted-foreground">{{ user.senderId }}</span>
                    </template>
                  </div>
                </TableCell>
                <TableCell class="text-right font-semibold">
                  {{ user.commentCount }}件
                </TableCell>
                <TableCell class="text-sm text-muted-foreground">
                  {{ formatDate(user.lastCommentAt) }}
                </TableCell>
                <TableCell class="max-w-[300px] truncate text-sm text-muted-foreground">
                  {{ user.lastContent }}
                </TableCell>
              </TableRow>
              <TableEmpty v-if="commentUsers.length === 0" :colspan="4">
                まだコメントユーザーはいません
              </TableEmpty>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  </AppAuthenticatedShell>
</template>
