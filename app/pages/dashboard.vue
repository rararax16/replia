<script setup lang="ts">
import type { EventChannel, ReplyStatus } from '@prisma/client'
import { Activity, BellRing, CheckCircle2, CircleAlert, Instagram, Megaphone, MessageSquareText, RefreshCcw, Users } from 'lucide-vue-next'
const { showSuccess: setNotice, showError: setError } = useSnackbar()
import { cn } from '@/lib/utils'
import { instagramSetupSteps } from '@/lib/instagram-setup-guide'
import { formatDate, getChannelLabel, getReplyStatusLabel } from '@/lib/replia-ui'

type BillingInfo = {
  plan: 'FREE' | 'PRO'
  replyLimit: number
  replyUsedThisMonth: number
}

definePageMeta({
  middleware: 'auth'
})

useHead({
  title: 'ダッシュボード | Replia'
})

type ReplyRule = {
  id: string
  channel: EventChannel
  keyword: string
  replyText: string
  priority: number
  isActive: boolean
  createdAt: string
}

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

type IgAccount = {
  id: string
  platformUserId: string
  username: string
  enabled: boolean
  updatedAt: string
}

type NotificationItem = {
  id: string
  title: string
  description: string
  detail: string
  to: string
  cta: string
  icon: any
  tone: 'default' | 'warning' | 'danger'
}

const refreshing = ref(false)
const isGuideDialogOpen = ref(false)
const { hideGuide } = useInstagramSetupGuidePreference()
const { data: rulesData, refresh: refreshRules } = useFetch('/api/reply-rules')
const { data: eventsData, refresh: refreshEvents } = useFetch('/api/inbound-events')
const { data: accountsData, refresh: refreshAccounts } = useFetch('/api/ig-accounts')
const { data: billingData, refresh: refreshBilling } = useFetch('/api/billing')
const { data: announcementsData, refresh: refreshAnnouncements } = useFetch('/api/announcements', { default: () => ({ announcements: [] }) })

type AnnouncementItem = {
  id: string
  title: string
  body: string
  publishAt: string
}
const latestAnnouncements = computed<AnnouncementItem[]>(() => ((announcementsData.value as any)?.announcements ?? []).slice(0, 3))

const rules = computed<ReplyRule[]>(() => rulesData.value?.rules || [])
const events = computed<InboundEvent[]>(() => eventsData.value?.events || [])
const accounts = computed<IgAccount[]>(() => accountsData.value?.accounts || [])
const billing = computed<BillingInfo>(() => billingData.value as BillingInfo ?? { plan: 'FREE', replyLimit: 30, replyUsedThisMonth: 0 })
const dmUsagePercent = computed(() => Math.min(100, Math.round((billing.value.replyUsedThisMonth / billing.value.replyLimit) * 100)))
const enabledAccountsCount = computed(() => accounts.value.filter((account) => account.enabled).length)
const activeRulesCount = computed(() => rules.value.filter((rule) => rule.isActive).length)
const shouldShowInstagramSetupGuide = computed(() => accounts.value.length === 0 && !hideGuide.value)
const instagramSetupPreviewSteps = computed(() => instagramSetupSteps.slice(0, 3))

const quickLinks = [
  {
    title: 'Instagram連携',
    to: '/instagram',
    description: '接続状態を確認'
  },
  {
    title: '返信ルール',
    to: '/reply-rules',
    description: '自動返信を編集'
  },
  {
    title: '受信イベント',
    to: '/events',
    description: 'ログとテスト送信'
  }
]

const notifications = computed<NotificationItem[]>(() => {
  const items: NotificationItem[] = []

  if (accounts.value.length === 0) {
    if (!shouldShowInstagramSetupGuide.value) {
      items.push({
        id: 'account-empty',
        title: 'Instagramアカウントが未連携です',
        description: '自動返信を開始するには、まず Instagram ビジネスアカウントの接続が必要です。',
        detail: '連携設定が必要',
        to: '/instagram',
        cta: '連携画面へ',
        icon: Instagram,
        tone: 'warning'
      })
    }
  }
  else if (enabledAccountsCount.value === 0) {
    items.push({
      id: 'account-disabled',
      title: '連携アカウントがすべて停止中です',
      description: '自動返信対象のアカウントが無効化されています。Instagram連携画面で有効化してください。',
      detail: `${accounts.value.length}件が停止中`,
      to: '/instagram',
      cta: '状態を確認',
      icon: Instagram,
      tone: 'warning'
    })
  }

  if (rules.value.length === 0) {
    items.push({
      id: 'rule-empty',
      title: '返信ルールが未設定です',
      description: '受信イベントに対して返信するには、キーワードルールを登録してください。',
      detail: 'ルール追加が必要',
      to: '/reply-rules',
      cta: 'ルールを追加',
      icon: MessageSquareText,
      tone: 'warning'
    })
  }
  else if (activeRulesCount.value === 0) {
    items.push({
      id: 'rule-disabled',
      title: '有効な返信ルールがありません',
      description: '登録済みルールはありますが、すべて無効化されています。',
      detail: `${rules.value.length}件登録済み / 0件有効`,
      to: '/reply-rules',
      cta: 'ルールを確認',
      icon: MessageSquareText,
      tone: 'warning'
    })
  }

  for (const event of events.value.slice(0, 6)) {
    const latestReply = event.outboundReplies[0]
    const senderLabel = event.senderUsername ? `@${event.senderUsername}` : event.senderId
    const detail = `${getChannelLabel(event.channel)} / ${formatDate(event.createdAt)}`

    if (!latestReply) {
      items.push({
        id: `event-pending-${event.id}`,
        title: `${senderLabel} から未処理イベントがあります`,
        description: event.content,
        detail,
        to: '/events',
        cta: 'イベントを見る',
        icon: BellRing,
        tone: 'warning'
      })
      continue
    }

    if (latestReply.status === 'FAILED') {
      items.push({
        id: `event-failed-${event.id}`,
        title: `${senderLabel} への返信に失敗しました`,
        description: latestReply.errorMessage || event.content,
        detail,
        to: '/events',
        cta: '詳細を確認',
        icon: CircleAlert,
        tone: 'danger'
      })
      continue
    }

    items.push({
      id: `event-${event.id}`,
      title: `${senderLabel} のイベントを受信しました`,
      description: `${getReplyStatusLabel(latestReply.status)}: ${event.content}`,
      detail,
      to: '/events',
      cta: 'ログを見る',
      icon: latestReply.status === 'SENT' ? CheckCircle2 : Activity,
      tone: 'default'
    })
  }

  return items.slice(0, 8)
})

async function refreshAll() {
  refreshing.value = true

  try {
    await Promise.all([
      refreshAccounts(),
      refreshRules(),
      refreshEvents(),
      refreshBilling(),
      refreshAnnouncements()
    ])
    setNotice('最近の通知を更新しました')
  }
  catch (error: any) {
    setError(error?.data?.statusMessage || '最近の通知の更新に失敗しました')
  }
  finally {
    refreshing.value = false
  }
}

function getNotificationToneClass(tone: NotificationItem['tone']) {
  switch (tone) {
    case 'danger':
      return 'border-destructive/20 bg-destructive/5'
    case 'warning':
      return 'border-amber-500/20 bg-amber-500/5'
    default:
      return 'border-border/70 bg-muted/25'
  }
}

function getNotificationIconClass(tone: NotificationItem['tone']) {
  switch (tone) {
    case 'danger':
      return 'bg-destructive/10 text-destructive'
    case 'warning':
      return 'bg-amber-500/10 text-amber-600'
    default:
      return 'bg-primary/10 text-primary'
  }
}
</script>

<template>
  <AppAuthenticatedShell
    title="最近の通知"
    description="この画面は、運用上すぐ確認すべき内容だけに絞っています。設定や詳細操作は各機能ページへ移動して対応してください。"
  >
    <template #actions>
      <Button variant="outline" :disabled="refreshing" @click="refreshAll">
        <RefreshCcw class="size-4" :class="{ 'animate-spin': refreshing }" />
        更新
      </Button>
    </template>

    <Card
      v-if="shouldShowInstagramSetupGuide"
      class="border-white/70 bg-white/85 shadow-[0_30px_90px_-48px_rgba(15,23,42,0.35)] backdrop-blur"
    >
      <CardHeader class="gap-2">
        <CardTitle class="text-2xl">
          先に Instagram をビジネスアカウントへ切り替えてください
        </CardTitle>
        <CardDescription class="leading-6">
          まだ連携アカウントがありません。まずは Instagram 側でビジネスアカウントへ変更し、その後に Meta 認証で接続してください。
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-5">
        <div class="grid gap-4 lg:grid-cols-3">
          <article
            v-for="(step, index) in instagramSetupPreviewSteps"
            :key="step.id"
            class="rounded-[1.5rem] border border-border/70 bg-muted/20 p-5"
          >
            <div class="flex items-start gap-3">
              <div class="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-primary-foreground">
                {{ index + 1 }}
              </div>
              <div class="space-y-2">
                <h2 class="font-semibold text-foreground">
                  {{ step.title }}
                </h2>
                <p class="text-sm leading-6 text-muted-foreground">
                  {{ step.description }}
                </p>
              </div>
            </div>
          </article>
        </div>

        <div class="flex flex-col gap-4 rounded-[1.5rem] border border-border/70 bg-muted/20 p-5 lg:flex-row lg:items-center lg:justify-between">
          <label class="flex items-start gap-3 text-sm leading-6 text-foreground">
            <input
              v-model="hideGuide"
              type="checkbox"
              class="mt-1 size-4 rounded border-input text-primary focus:ring-2 focus:ring-ring"
            >
            <span>今後表示しない</span>
          </label>

          <div class="flex flex-wrap gap-3">
            <Button variant="outline" @click="isGuideDialogOpen = true">
              手順を詳しく見る
            </Button>
            <Button as-child>
              <NuxtLink to="/instagram">
                Instagram連携へ進む
              </NuxtLink>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card v-if="latestAnnouncements.length > 0" class="border-white/70 bg-white/85 shadow-[0_30px_90px_-48px_rgba(15,23,42,0.35)] backdrop-blur">
      <CardHeader class="gap-2">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Megaphone class="size-5" />
            </div>
            <CardTitle class="text-2xl">
              お知らせ
            </CardTitle>
          </div>
          <Button as-child size="sm" variant="outline">
            <NuxtLink to="/announcements">
              すべて見る
            </NuxtLink>
          </Button>
        </div>
      </CardHeader>
      <CardContent class="space-y-3">
        <article
          v-for="item in latestAnnouncements"
          :key="item.id"
          class="rounded-[1.5rem] border border-border/70 bg-muted/10 p-4"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h3 class="font-semibold text-foreground">
              {{ item.title }}
            </h3>
            <p class="text-xs text-muted-foreground">
              {{ formatDate(item.publishAt) }}
            </p>
          </div>
          <p class="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
            {{ item.body }}
          </p>
        </article>
      </CardContent>
    </Card>

    <div class="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <Card class="border-white/70 bg-white/85 shadow-[0_30px_90px_-48px_rgba(15,23,42,0.35)] backdrop-blur">
        <CardHeader class="gap-2">
          <CardTitle class="text-2xl">
            最近の通知
          </CardTitle>
          <CardDescription class="leading-6">
            直近イベントと設定不足の警告をまとめて表示しています。
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <article
            v-for="item in notifications"
            :key="item.id"
            :class="cn(
              'rounded-[1.5rem] border p-5',
              getNotificationToneClass(item.tone)
            )"
          >
            <div class="flex items-start gap-4">
              <div :class="cn('flex size-11 shrink-0 items-center justify-center rounded-2xl', getNotificationIconClass(item.tone))">
                <component :is="item.icon" class="size-5" />
              </div>

              <div class="min-w-0 flex-1 space-y-3">
                <div class="space-y-1.5">
                  <div class="flex flex-wrap items-center gap-2">
                    <p class="font-semibold text-foreground">
                      {{ item.title }}
                    </p>
                    <Badge v-if="item.tone === 'danger'" variant="destructive">
                      要確認
                    </Badge>
                    <Badge v-else-if="item.tone === 'warning'" variant="secondary">
                      注意
                    </Badge>
                  </div>
                  <p class="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                    {{ item.description }}
                  </p>
                </div>

                <div class="flex flex-wrap items-center justify-between gap-3">
                  <p class="text-xs text-muted-foreground">
                    {{ item.detail }}
                  </p>
                  <Button as-child size="sm" variant="outline">
                    <NuxtLink :to="item.to">
                      {{ item.cta }}
                    </NuxtLink>
                  </Button>
                </div>
              </div>
            </div>
          </article>

          <div
            v-if="notifications.length === 0"
            class="rounded-[1.5rem] border border-dashed border-border/80 bg-muted/20 px-6 py-10 text-center text-sm leading-6 text-muted-foreground"
          >
            現在、表示すべき通知はありません。
          </div>
        </CardContent>
      </Card>

      <div class="space-y-6">
        <Card class="border-white/70 bg-white/85 shadow-[0_30px_90px_-48px_rgba(15,23,42,0.35)] backdrop-blur">
          <CardHeader class="gap-2">
            <div class="flex items-center justify-between">
              <CardTitle class="text-2xl">
                今月のDM送信
              </CardTitle>
              <Badge :variant="billing.plan === 'PRO' ? 'default' : 'secondary'">
                {{ billing.plan === 'PRO' ? 'Pro' : 'Free' }}
              </Badge>
            </div>
            <CardDescription class="leading-6">
              {{ billing.replyUsedThisMonth }} / {{ billing.replyLimit }} 件
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                class="h-full rounded-full transition-all"
                :class="dmUsagePercent >= 100 ? 'bg-destructive' : dmUsagePercent >= 80 ? 'bg-amber-500' : 'bg-primary'"
                :style="{ width: `${dmUsagePercent}%` }"
              />
            </div>
            <div v-if="dmUsagePercent >= 100 && billing.plan === 'FREE'" class="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              月間DM上限に達しました。Proプランにアップグレードすると3,000件まで送れます。
            </div>
            <div v-else-if="dmUsagePercent >= 80 && billing.plan === 'FREE'" class="rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-700">
              DM上限の{{ dmUsagePercent }}%に達しています。
            </div>
            <NuxtLink
              to="/billing"
              class="inline-flex items-center text-sm font-medium text-primary hover:underline"
            >
              プラン詳細を見る
            </NuxtLink>
          </CardContent>
        </Card>

        <Card class="border-white/70 bg-white/85 shadow-[0_30px_90px_-48px_rgba(15,23,42,0.35)] backdrop-blur">
          <CardHeader class="gap-2">
            <CardTitle class="text-2xl">
              ショートカット
            </CardTitle>
            <CardDescription class="leading-6">
              通知から対応する機能画面へすぐ移動できます。
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-3">
          <NuxtLink
            v-for="item in quickLinks"
            :key="item.to"
            :to="item.to"
            class="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 transition-colors hover:bg-white"
          >
            <div>
              <p class="font-medium text-foreground">
                {{ item.title }}
              </p>
              <p class="text-sm text-muted-foreground">
                {{ item.description }}
              </p>
            </div>
            <span class="text-sm font-medium text-primary">
              開く
            </span>
          </NuxtLink>
        </CardContent>
      </Card>
      </div>
    </div>

    <InstagramSetupGuideDialog
      v-model:open="isGuideDialogOpen"
      :show-hide-preference="true"
    />
  </AppAuthenticatedShell>
</template>
