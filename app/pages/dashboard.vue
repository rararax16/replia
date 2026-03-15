<script setup lang="ts">
import type { EventChannel, ReplyStatus } from '@prisma/client'
import {
  CheckCircle2,
  CircleAlert,
  Clock3,
  ExternalLink,
  Instagram,
  Link2,
  LoaderCircle,
  LogOut,
  MessageSquare,
  RefreshCcw,
  Send,
  ShieldCheck,
  Sparkles,
  Users
} from 'lucide-vue-next'

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

const route = useRoute()
const oauthConnectPath = '/api/ig-accounts/oauth/start'

const notice = ref('')
const errorMessage = ref('')
const savingRule = ref(false)
const sendingTestEvent = ref(false)
const refreshing = ref(false)
const authState = useAuthStateRef()
const meData = computed(() => authState.value)

const isAdmin = computed(() => meData.value?.user?.role === 'ADMIN')

const { data: rulesData, refresh: refreshRules } = useFetch('/api/reply-rules')
const { data: eventsData, refresh: refreshEvents } = useFetch('/api/inbound-events')
const { data: accountsData, refresh: refreshAccounts } = useFetch('/api/ig-accounts')

const rules = computed<ReplyRule[]>(() => rulesData.value?.rules || [])
const events = computed<InboundEvent[]>(() => eventsData.value?.events || [])
const accounts = computed<IgAccount[]>(() => accountsData.value?.accounts || [])
const enabledAccountsCount = computed(() => accounts.value.filter((account) => account.enabled).length)
const activeRulesCount = computed(() => rules.value.filter((rule) => rule.isActive).length)
const processedEventsCount = computed(() => events.value.filter((event) => event.outboundReplies[0]).length)
const latestEventAt = computed(() => events.value[0]?.createdAt || null)

const editingRuleId = ref<string | null>(null)
const ruleForm = reactive({
  channel: 'DM' as EventChannel,
  keyword: '',
  replyText: '',
  priority: 100,
  isActive: true
})

const inboundForm = reactive({
  channel: 'DM' as EventChannel,
  senderId: '',
  senderUsername: '',
  content: ''
})

const metrics = computed(() => {
  return [
    {
      title: '連携アカウント',
      value: `${accounts.value.length}件`,
      subtext: accounts.value.length > 0 ? `${enabledAccountsCount.value}件が有効` : 'まだ連携されていません',
      icon: Instagram,
      iconClass: 'bg-rose-500/10 text-rose-600'
    },
    {
      title: '有効ルール',
      value: `${activeRulesCount.value}件`,
      subtext: `${rules.value.length}件の返信ルールを管理`,
      icon: Sparkles,
      iconClass: 'bg-amber-500/10 text-amber-600'
    },
    {
      title: '処理済みイベント',
      value: `${processedEventsCount.value}件`,
      subtext: latestEventAt.value ? `最新: ${formatDate(latestEventAt.value)}` : 'イベントはまだありません',
      icon: MessageSquare,
      iconClass: 'bg-sky-500/10 text-sky-700'
    }
  ]
})

function resetRuleForm() {
  editingRuleId.value = null
  ruleForm.channel = 'DM'
  ruleForm.keyword = ''
  ruleForm.replyText = ''
  ruleForm.priority = 100
  ruleForm.isActive = true
}

function setNotice(message: string) {
  notice.value = message
  errorMessage.value = ''
}

function setError(message: string) {
  errorMessage.value = message
  notice.value = ''
}

function getSingleQueryParam(value: string | string[] | undefined): string {
  if (typeof value === 'string') {
    return value
  }

  if (Array.isArray(value) && value.length > 0) {
    return value[0] || ''
  }

  return ''
}

onMounted(async () => {
  const connectedCount = getSingleQueryParam(route.query.ig_connected as string | string[] | undefined)
  const oauthError = getSingleQueryParam(route.query.ig_error as string | string[] | undefined)

  if (oauthError) {
    setError(oauthError)
  }
  else if (connectedCount) {
    setNotice(`Instagram連携が完了しました（${connectedCount}件）`)
    await refreshAccounts()
  }

  if (oauthError || connectedCount) {
    await navigateTo('/dashboard', { replace: true })
  }
})

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  clearAuthState()
  await navigateTo('/login')
}

async function saveRule() {
  savingRule.value = true

  try {
    if (editingRuleId.value) {
      await $fetch(`/api/reply-rules/${editingRuleId.value}`, {
        method: 'PUT',
        body: ruleForm
      })
      setNotice('返信ルールを更新しました')
    }
    else {
      await $fetch('/api/reply-rules', {
        method: 'POST',
        body: ruleForm
      })
      setNotice('返信ルールを追加しました')
    }

    resetRuleForm()
    await refreshRules()
  }
  catch (error: any) {
    setError(error?.data?.statusMessage || '返信ルールの保存に失敗しました')
  }
  finally {
    savingRule.value = false
  }
}

function editRule(rule: ReplyRule) {
  editingRuleId.value = rule.id
  ruleForm.channel = rule.channel
  ruleForm.keyword = rule.keyword
  ruleForm.replyText = rule.replyText
  ruleForm.priority = rule.priority
  ruleForm.isActive = rule.isActive
}

async function toggleRule(rule: ReplyRule) {
  try {
    await $fetch(`/api/reply-rules/${rule.id}`, {
      method: 'PUT',
      body: {
        isActive: !rule.isActive
      }
    })
    setNotice('ルールの有効状態を更新しました')
    await refreshRules()
  }
  catch (error: any) {
    setError(error?.data?.statusMessage || '有効状態の更新に失敗しました')
  }
}

async function deleteRule(ruleId: string) {
  if (!confirm('このルールを削除しますか？')) {
    return
  }

  try {
    await $fetch(`/api/reply-rules/${ruleId}`, {
      method: 'DELETE'
    })
    setNotice('返信ルールを削除しました')
    await refreshRules()
  }
  catch (error: any) {
    setError(error?.data?.statusMessage || '返信ルールの削除に失敗しました')
  }
}

async function toggleAccount(account: IgAccount) {
  try {
    await $fetch(`/api/ig-accounts/${account.id}`, {
      method: 'PATCH',
      body: {
        enabled: !account.enabled
      }
    })

    setNotice('Instagram連携アカウントの状態を更新しました')
    await refreshAccounts()
  }
  catch (error: any) {
    setError(error?.data?.statusMessage || 'Instagram連携アカウントの更新に失敗しました')
  }
}

async function disconnectAccount(account: IgAccount) {
  if (!confirm(`@${account.username} の連携を解除しますか？`)) {
    return
  }

  try {
    await $fetch(`/api/ig-accounts/${account.id}`, {
      method: 'DELETE'
    })

    setNotice('Instagram連携を解除しました')
    await refreshAccounts()
  }
  catch (error: any) {
    setError(error?.data?.statusMessage || 'Instagram連携の解除に失敗しました')
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

async function refreshAll() {
  refreshing.value = true

  try {
    await Promise.all([
      refreshAccounts(),
      refreshRules(),
      refreshEvents()
    ])
    setNotice('表示内容を更新しました')
  }
  catch (error: any) {
    setError(error?.data?.statusMessage || '表示内容の更新に失敗しました')
  }
  finally {
    refreshing.value = false
  }
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('ja-JP')
}

function getInstagramProfileUrl(senderUsername: string) {
  return `https://www.instagram.com/${encodeURIComponent(senderUsername.trim())}/`
}

function getChannelLabel(channel: EventChannel) {
  return channel === 'COMMENT' ? 'コメント' : 'DM'
}

function getReplyStatusLabel(status?: ReplyStatus) {
  switch (status) {
    case 'SENT':
      return '送信済み'
    case 'FAILED':
      return '失敗'
    case 'SKIPPED':
      return 'スキップ'
    case 'STUBBED':
      return 'テスト返信'
    default:
      return '未処理'
  }
}

function getReplyStatusVariant(status?: ReplyStatus) {
  switch (status) {
    case 'SENT':
      return 'default'
    case 'FAILED':
      return 'destructive'
    case 'SKIPPED':
      return 'secondary'
    default:
      return 'outline'
  }
}

function updateRulePriority(value: string | number) {
  const nextValue = Number(value)
  ruleForm.priority = Number.isFinite(nextValue) ? nextValue : 0
}
</script>

<template>
  <main class="px-4 py-6 sm:px-6 sm:py-8">
    <div class="mx-auto flex max-w-7xl flex-col gap-6">
      <section class="overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 shadow-[0_30px_90px_-48px_rgba(15,23,42,0.35)] backdrop-blur">
        <div class="flex flex-col gap-6 p-6 sm:p-8">
          <div class="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div class="space-y-4">
              <AppBrandMark />
              <div class="space-y-3">
                <div class="flex flex-wrap items-center gap-2">
                  <Badge class="rounded-full px-3 py-1">
                    {{ isAdmin ? 'システム管理者' : '一般ユーザー' }}
                  </Badge>
                  <Badge variant="secondary" class="rounded-full px-3 py-1">
                    ログイン中: {{ meData?.user?.email }}
                  </Badge>
                </div>
                <div class="space-y-2">
                  <h1 class="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                    Instagram 自動返信の運用状況を一画面で管理
                  </h1>
                  <p class="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
                    連携アカウント、返信ルール、受信イベントの流れを shadcn ベースの UI に統一し、
                    更新操作や確認導線を整理しました。
                  </p>
                </div>
              </div>
            </div>

            <div class="flex flex-wrap gap-3">
              <Button variant="outline" :disabled="refreshing" @click="refreshAll">
                <RefreshCcw class="size-4" :class="{ 'animate-spin': refreshing }" />
                再読み込み
              </Button>
              <Button v-if="isAdmin" as-child variant="outline">
                <NuxtLink to="/users">
                  <Users class="size-4" />
                  ユーザーマスター
                </NuxtLink>
              </Button>
              <Button variant="secondary" @click="logout">
                <LogOut class="size-4" />
                ログアウト
              </Button>
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-3">
            <div
              v-for="metric in metrics"
              :key="metric.title"
              class="rounded-[1.5rem] border border-border/70 bg-muted/25 p-5"
            >
              <div class="flex items-start justify-between gap-4">
                <div class="space-y-2">
                  <p class="text-sm font-medium text-muted-foreground">
                    {{ metric.title }}
                  </p>
                  <p class="text-3xl font-bold tracking-tight text-foreground">
                    {{ metric.value }}
                  </p>
                </div>
                <div :class="['flex size-11 items-center justify-center rounded-2xl', metric.iconClass]">
                  <component :is="metric.icon" class="size-5" />
                </div>
              </div>
              <p class="mt-4 text-sm leading-6 text-muted-foreground">
                {{ metric.subtext }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <Alert v-if="notice">
        <CheckCircle2 class="size-4" />
        <AlertTitle>操作が完了しました</AlertTitle>
        <AlertDescription>{{ notice }}</AlertDescription>
      </Alert>

      <Alert v-if="errorMessage" variant="destructive">
        <CircleAlert class="size-4" />
        <AlertTitle>処理に失敗しました</AlertTitle>
        <AlertDescription>{{ errorMessage }}</AlertDescription>
      </Alert>

      <div class="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div class="space-y-6">
          <Card class="border-white/70 bg-white/85 shadow-[0_30px_90px_-48px_rgba(15,23,42,0.35)] backdrop-blur">
            <CardHeader class="gap-4">
              <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div class="space-y-2">
                  <CardTitle class="flex items-center gap-2 text-2xl">
                    <Instagram class="size-5 text-primary" />
                    Instagram連携
                  </CardTitle>
                  <CardDescription class="leading-6">
                    Meta の認可画面で連携したいアカウントを許可してください。アクセストークンの手入力は不要です。
                  </CardDescription>
                </div>
                <Button as="a" :href="oauthConnectPath">
                  <Link2 class="size-4" />
                  Instagramと連携する
                </Button>
              </div>
            </CardHeader>
            <CardContent class="space-y-4">
              <div v-if="accounts.length" class="grid gap-4 md:grid-cols-2">
                <div
                  v-for="account in accounts"
                  :key="account.id"
                  class="rounded-[1.5rem] border border-border/70 bg-muted/30 p-5"
                >
                  <div class="flex items-start justify-between gap-4">
                    <div class="space-y-2">
                      <div class="flex flex-wrap items-center gap-2">
                        <p class="text-lg font-semibold text-foreground">
                          @{{ account.username }}
                        </p>
                        <Badge :variant="account.enabled ? 'default' : 'secondary'">
                          {{ account.enabled ? '有効' : '停止中' }}
                        </Badge>
                      </div>
                      <p class="text-sm text-muted-foreground">
                        InstagramユーザーID: {{ account.platformUserId }}
                      </p>
                      <p class="text-xs text-muted-foreground">
                        更新日時: {{ formatDate(account.updatedAt) }}
                      </p>
                    </div>
                    <div class="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Instagram class="size-5" />
                    </div>
                  </div>

                  <div class="mt-5 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" @click="toggleAccount(account)">
                      {{ account.enabled ? '無効化' : '有効化' }}
                    </Button>
                    <Button size="sm" variant="destructive" @click="disconnectAccount(account)">
                      連携解除
                    </Button>
                  </div>
                </div>
              </div>

              <div
                v-else
                class="rounded-[1.5rem] border border-dashed border-border/80 bg-muted/20 px-6 py-10 text-center text-sm leading-6 text-muted-foreground"
              >
                連携アカウントはまだありません。まずは Meta 認証からアカウントを接続してください。
              </div>
            </CardContent>
          </Card>

          <Card class="border-white/70 bg-white/85 shadow-[0_30px_90px_-48px_rgba(15,23,42,0.35)] backdrop-blur">
            <CardHeader class="gap-4">
              <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div class="space-y-2">
                  <div class="flex items-center gap-2">
                    <CardTitle class="text-2xl">
                      返信ルール管理
                    </CardTitle>
                    <Badge v-if="editingRuleId" variant="secondary">
                      編集中
                    </Badge>
                  </div>
                  <CardDescription class="leading-6">
                    キーワード、優先度、チャネルを整理して、自動返信の条件を明確に保ちます。
                  </CardDescription>
                </div>
                <Badge variant="outline" class="w-fit">
                  有効ルール {{ activeRulesCount }}件
                </Badge>
              </div>
            </CardHeader>

            <CardContent class="space-y-6">
              <form class="space-y-5" @submit.prevent="saveRule">
                <div class="grid gap-4 sm:grid-cols-[180px_140px]">
                  <div class="space-y-2">
                    <Label for="rule-channel">チャネル</Label>
                    <Select v-model="ruleForm.channel">
                      <SelectTrigger id="rule-channel">
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
                    <Label for="rule-priority">優先度</Label>
                    <Input
                      id="rule-priority"
                      type="number"
                      :model-value="String(ruleForm.priority)"
                      @update:model-value="updateRulePriority"
                    />
                  </div>
                </div>

                <div class="space-y-2">
                  <Label for="rule-keyword">キーワード</Label>
                  <Input
                    id="rule-keyword"
                    v-model="ruleForm.keyword"
                    type="text"
                    placeholder="資料"
                    required
                  />
                </div>

                <div class="space-y-2">
                  <Label for="rule-reply">返信内容</Label>
                  <Textarea
                    id="rule-reply"
                    v-model="ruleForm.replyText"
                    rows="4"
                    placeholder="お問い合わせありがとうございます。"
                    required
                  />
                </div>

                <div class="flex flex-col gap-4 rounded-[1.5rem] border border-border/70 bg-muted/25 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div class="space-y-1">
                    <p class="font-medium text-foreground">
                      このルールを有効にする
                    </p>
                    <p class="text-sm text-muted-foreground">
                      無効にするとマッチ条件に残したまま返信対象から外れます。
                    </p>
                  </div>
                  <Switch v-model:checked="ruleForm.isActive" aria-label="ルールの有効化切替" />
                </div>

                <div class="flex flex-wrap gap-3">
                  <Button type="submit" :disabled="savingRule">
                    <LoaderCircle v-if="savingRule" class="size-4 animate-spin" />
                    {{ savingRule ? '保存中...' : editingRuleId ? 'ルール更新' : 'ルール追加' }}
                  </Button>
                  <Button
                    v-if="editingRuleId"
                    type="button"
                    variant="outline"
                    @click="resetRuleForm"
                  >
                    編集をキャンセル
                  </Button>
                </div>
              </form>

              <Separator />

              <div class="space-y-4">
                <div class="flex items-center justify-between gap-3">
                  <div>
                    <p class="font-semibold text-foreground">
                      登録済みルール
                    </p>
                    <p class="text-sm text-muted-foreground">
                      優先度の高い順に表示しています。
                    </p>
                  </div>
                  <Button size="sm" variant="outline" @click="refreshRules">
                    <RefreshCcw class="size-4" />
                    更新
                  </Button>
                </div>

                <div class="overflow-hidden rounded-[1.5rem] border border-border/70">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>チャネル</TableHead>
                        <TableHead>キーワード</TableHead>
                        <TableHead>返信内容</TableHead>
                        <TableHead class="w-24">優先度</TableHead>
                        <TableHead class="w-28">状態</TableHead>
                        <TableHead class="w-[220px]">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow v-for="rule in rules" :key="rule.id">
                        <TableCell class="align-top">
                          <Badge variant="outline">
                            {{ getChannelLabel(rule.channel) }}
                          </Badge>
                        </TableCell>
                        <TableCell class="align-top font-medium">
                          {{ rule.keyword }}
                        </TableCell>
                        <TableCell class="max-w-xl whitespace-pre-wrap align-top text-sm leading-6 text-muted-foreground">
                          {{ rule.replyText }}
                        </TableCell>
                        <TableCell class="align-top">
                          {{ rule.priority }}
                        </TableCell>
                        <TableCell class="align-top">
                          <Badge :variant="rule.isActive ? 'default' : 'secondary'">
                            {{ rule.isActive ? '有効' : '無効' }}
                          </Badge>
                        </TableCell>
                        <TableCell class="align-top">
                          <div class="flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" @click="editRule(rule)">
                              編集
                            </Button>
                            <Button size="sm" variant="secondary" @click="toggleRule(rule)">
                              {{ rule.isActive ? '無効化' : '有効化' }}
                            </Button>
                            <Button size="sm" variant="destructive" @click="deleteRule(rule.id)">
                              削除
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      <TableEmpty v-if="rules.length === 0" :colspan="6">
                        返信ルールはまだありません
                      </TableEmpty>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div class="space-y-6">
          <Card class="border-white/70 bg-white/85 shadow-[0_30px_90px_-48px_rgba(15,23,42,0.35)] backdrop-blur">
            <CardHeader class="gap-3">
              <CardTitle class="flex items-center gap-2 text-2xl">
                <Send class="size-5 text-primary" />
                受信イベントテスト
              </CardTitle>
              <CardDescription class="leading-6">
                DM / コメントの受信を模擬して、自動返信処理とログ登録をまとめて確認できます。
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
                  <LoaderCircle v-if="sendingTestEvent" class="size-4 animate-spin" />
                  {{ sendingTestEvent ? '送信中...' : 'テストイベントを送信' }}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card class="border-white/70 bg-white/85 shadow-[0_30px_90px_-48px_rgba(15,23,42,0.35)] backdrop-blur">
            <CardHeader class="gap-4">
              <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div class="space-y-2">
                  <CardTitle class="flex items-center gap-2 text-2xl">
                    <ShieldCheck class="size-5 text-primary" />
                    受信イベントログ
                  </CardTitle>
                  <CardDescription class="leading-6">
                    最新100件の受信イベントと直近返信結果を確認できます。
                  </CardDescription>
                </div>
                <Button size="sm" variant="outline" @click="refreshEvents">
                  <RefreshCcw class="size-4" />
                  更新
                </Button>
              </div>
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
      </div>
    </div>
  </main>
</template>
