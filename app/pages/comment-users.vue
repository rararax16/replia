<script setup lang="ts">
import { ExternalLink, MessageSquare, RefreshCcw, Users } from 'lucide-vue-next'
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
const { data, refresh, status } = useFetch('/api/comment-users', { default: () => ({ commentUsers: [] }) })
const commentUsers = computed<CommentUser[]>(() => (data.value as any)?.commentUsers ?? [])
const isLoading = computed(() => status.value === 'pending')

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
            <template v-if="isLoading">
              <Skeleton class="mt-2 h-9 w-20" />
            </template>
            <p v-else class="mt-2 text-3xl font-bold tracking-tight text-foreground">
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
            <template v-if="isLoading">
              <Skeleton class="mt-2 h-9 w-20" />
            </template>
            <p v-else class="mt-2 text-3xl font-bold tracking-tight text-foreground">
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

    <Card class="border-white/70 bg-white/85 shadow-[0_30px_90px_-48px_rgba(15,23,42,0.35)] backdrop-blur">
      <CardHeader class="gap-2">
        <CardTitle class="text-2xl">
          コメントユーザー一覧
        </CardTitle>
        <CardDescription class="leading-6">
          最新コメント順に表示しています。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <template v-if="isLoading">
          <div class="space-y-3">
            <Skeleton v-for="i in 4" :key="`skeleton-comment-user-${i}`" class="h-12 w-full rounded-lg" />
          </div>
        </template>
        <template v-else>
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
        </template>
      </CardContent>
    </Card>
  </AppAuthenticatedShell>
</template>
