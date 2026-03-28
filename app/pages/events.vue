<script setup lang="ts">
import type { EventChannel, ReplyStatus } from '@prisma/client'
import { Clock3, ExternalLink, RefreshCcw, Send } from 'lucide-vue-next'

const { showSuccess: setNotice, showError: setError } = useSnackbar()
import { formatDate, getChannelLabel, getInstagramProfileUrl, getReplyStatusLabel, getReplyStatusVariant } from '@/lib/replia-ui'

definePageMeta({
  middleware: 'auth'
})

useHead({
  title: '受信イベント | Replia'
})

type InboundEvent = {
  id: string
  channel: EventChannel
  senderId: string
  senderUsername: string | null
  isSelfEvent: boolean
  content: string
  createdAt: string
  outboundReplies: Array<{
    id: string
    status: ReplyStatus
    replyText: string
    errorMessage: string | null
  }>
}

const sendingTestEvent = ref(false)
const refreshing = ref(false)

const { data: eventsData, refresh: refreshEvents } = useFetch('/api/inbound-events')
const events = computed<InboundEvent[]>(() => eventsData.value?.events || [])
const processedEventsCount = computed(() => events.value.filter((event) => event.outboundReplies[0]).length)
const failedEventsCount = computed(() => events.value.filter((event) => event.outboundReplies[0]?.status === 'FAILED').length)
const latestEventAt = computed(() => events.value[0]?.createdAt || null)

const inboundForm = reactive({
  channel: 'DM' as EventChannel,
  senderId: '',
  senderUsername: '',
  content: ''
})

async function refreshPage() {
  refreshing.value = true

  try {
    await refreshEvents()
    setNotice('受信イベント一覧を更新しました')
  }
  catch (error: any) {
    setError(error?.data?.statusMessage || '受信イベント一覧の更新に失敗しました')
  }
  finally {
    refreshing.value = false
  }
}

async function simulateInboundEvent() {
  sendingTestEvent.value = true

  try {
    await $fetch('/api/inbound-events', {
      method: 'POST',
      body: inboundForm
    })
    setNotice('受信イベントを保存し、自動返信処理を実行しました')
    inboundForm.senderId = ''
    inboundForm.senderUsername = ''
    inboundForm.content = ''
    await refreshEvents()
  }
  catch (error: any) {
    setError(error?.data?.statusMessage || '受信イベント処理に失敗しました')
  }
  finally {
    sendingTestEvent.value = false
  }
}
</script>

<template>
  <AppAuthenticatedShell
    title="受信イベント"
    description="DM とコメントの受信テスト、直近ログ、返信結果の確認をこの画面にまとめています。検証作業も本番運用確認もここで行えます。"
  >
    <template #actions>
      <Button variant="outline" :disabled="refreshing" @click="refreshPage">
        <RefreshCcw class="size-4" :class="{ 'animate-spin': refreshing }" />
        再読み込み
      </Button>
    </template>

    <template #hero>
      <div class="rounded-[1.5rem] border border-border/70 bg-muted/25 p-5">
        <p class="text-sm font-medium text-muted-foreground">
          総イベント数
        </p>
        <p class="mt-2 text-3xl font-bold tracking-tight text-foreground">
          {{ events.length }}件
        </p>
      </div>

      <div class="rounded-[1.5rem] border border-border/70 bg-muted/25 p-5">
        <p class="text-sm font-medium text-muted-foreground">
          返信処理済み
        </p>
        <p class="mt-2 text-3xl font-bold tracking-tight text-foreground">
          {{ processedEventsCount }}件
        </p>
        <p class="mt-4 text-sm text-muted-foreground">
          失敗 {{ failedEventsCount }}件
        </p>
      </div>

      <div class="rounded-[1.5rem] border border-border/70 bg-muted/25 p-5">
        <p class="text-sm font-medium text-muted-foreground">
          最新受信
        </p>
        <p class="mt-2 text-lg font-bold tracking-tight text-foreground">
          {{ latestEventAt ? formatDate(latestEventAt) : '未受信' }}
        </p>
        <p class="mt-4 text-sm text-muted-foreground">
          テスト送信で即時確認できます
        </p>
      </div>
    </template>

    <div class="grid gap-6 xl:grid-cols-[420px_1fr]">
      <Card class="border-white/70 bg-white/85 shadow-[0_30px_90px_-48px_rgba(15,23,42,0.35)] backdrop-blur">
        <CardHeader class="gap-3">
          <CardTitle class="flex items-center gap-2 text-2xl">
            <Send class="size-5 text-primary" />
            テストイベント送信
          </CardTitle>
          <CardDescription class="leading-6">
            受信を模擬して、自動返信処理とログ登録を確認します。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form class="space-y-5" @submit.prevent="simulateInboundEvent">
            <div class="grid gap-4 sm:grid-cols-[180px_1fr]">
              <div class="space-y-2">
                <Label for="inbound-channel">チャネル</Label>
                <Select v-model="inboundForm.channel">
                  <SelectTrigger id="inbound-channel">
                    <SelectValue placeholder="チャネルを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DM">
                      DM
                    </SelectItem>
                    <SelectItem value="COMMENT">
                      コメント
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div class="space-y-2">
                <Label for="inbound-sender-id">送信者ID</Label>
                <Input
                  id="inbound-sender-id"
                  v-model="inboundForm.senderId"
                  type="text"
                  placeholder="user_001"
                  required
                />
              </div>
            </div>

            <div class="space-y-2">
              <Label for="inbound-sender-username">送信者ユーザー名（任意）</Label>
              <Input
                id="inbound-sender-username"
                v-model="inboundForm.senderUsername"
                type="text"
                placeholder="instagram_user"
              />
            </div>

            <div class="space-y-2">
              <Label for="inbound-content">受信本文</Label>
              <Textarea
                id="inbound-content"
                v-model="inboundForm.content"
                rows="4"
                placeholder="資料をください"
                required
              />
            </div>

            <Button class="w-full" type="submit" :disabled="sendingTestEvent">
              <Send class="size-4" />
              {{ sendingTestEvent ? '送信中...' : 'テストイベントを送信' }}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card class="border-white/70 bg-white/85 shadow-[0_30px_90px_-48px_rgba(15,23,42,0.35)] backdrop-blur">
        <CardHeader class="gap-2">
          <CardTitle class="text-2xl">
            受信イベントログ
          </CardTitle>
          <CardDescription class="leading-6">
            最新100件の受信イベントと直近返信結果を表示します。
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <article
            v-for="event in events"
            :key="event.id"
            class="rounded-[1.5rem] border border-border/70 bg-muted/25 p-5"
          >
            <div class="flex flex-wrap items-center gap-2">
              <Badge variant="outline">
                {{ getChannelLabel(event.channel) }}
              </Badge>
              <Badge :variant="getReplyStatusVariant(event.outboundReplies[0]?.status)">
                {{ getReplyStatusLabel(event.outboundReplies[0]?.status) }}
              </Badge>
              <span class="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Clock3 class="size-3.5" />
                {{ formatDate(event.createdAt) }}
              </span>
              <Badge v-if="event.isSelfEvent" variant="secondary">
                自分のアカウント
              </Badge>
            </div>

            <div class="mt-4 space-y-3">
              <div class="flex flex-wrap items-center gap-2 text-sm">
                <span class="font-semibold text-foreground">
                  {{ event.senderUsername ? `@${event.senderUsername}` : 'ユーザー名未取得' }}
                </span>
                <span class="text-muted-foreground">
                  ID: {{ event.senderId }}
                </span>
                <a
                  v-if="event.senderUsername"
                  :href="getInstagramProfileUrl(event.senderUsername)"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-1 font-medium text-primary hover:text-primary/80"
                >
                  プロフィール
                  <ExternalLink class="size-3.5" />
                </a>
              </div>

              <div class="rounded-2xl bg-white/85 px-4 py-3 shadow-sm">
                <p class="whitespace-pre-wrap text-sm leading-6 text-foreground">
                  {{ event.content }}
                </p>
              </div>

              <div
                v-if="event.outboundReplies[0]?.replyText"
                class="rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm leading-6 text-muted-foreground"
              >
                <p class="font-medium text-foreground">
                  返信内容
                </p>
                <p class="mt-1 whitespace-pre-wrap">
                  {{ event.outboundReplies[0].replyText }}
                </p>
              </div>

              <div
                v-if="event.outboundReplies[0]?.errorMessage"
                class="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm leading-6 text-destructive"
              >
                <p class="font-medium">
                  エラー詳細
                </p>
                <p class="mt-1 whitespace-pre-wrap">
                  {{ event.outboundReplies[0].errorMessage }}
                </p>
              </div>
            </div>
          </article>

          <div
            v-if="events.length === 0"
            class="rounded-[1.5rem] border border-dashed border-border/80 bg-muted/20 px-6 py-10 text-center text-sm leading-6 text-muted-foreground"
          >
            イベントはまだありません。テストイベント送信または Instagram 連携後の受信を待ってください。
          </div>
        </CardContent>
      </Card>
    </div>
  </AppAuthenticatedShell>
</template>
