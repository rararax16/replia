<script setup lang="ts">
import { CheckCircle2, CircleAlert, Instagram, Link2, RefreshCcw } from 'lucide-vue-next'
import { formatDate } from '@/lib/replia-ui'

definePageMeta({
  middleware: 'auth'
})

useHead({
  title: 'Instagram連携 | Replia'
})

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
const refreshing = ref(false)

const { data: accountsData, refresh: refreshAccounts } = useFetch('/api/ig-accounts')
const accounts = computed<IgAccount[]>(() => accountsData.value?.accounts || [])
const enabledAccountsCount = computed(() => accounts.value.filter((account) => account.enabled).length)
const disabledAccountsCount = computed(() => accounts.value.filter((account) => !account.enabled).length)
const latestUpdatedAt = computed(() => accounts.value[0]?.updatedAt || null)

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
    await navigateTo('/instagram', { replace: true })
  }
})

async function refreshPage() {
  refreshing.value = true

  try {
    await refreshAccounts()
    setNotice('Instagram連携一覧を更新しました')
  }
  catch (error: any) {
    setError(error?.data?.statusMessage || 'Instagram連携一覧の更新に失敗しました')
  }
  finally {
    refreshing.value = false
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
</script>

<template>
  <AppAuthenticatedShell
    title="Instagram連携"
    description="Meta の認可画面から Instagram ビジネスアカウントを接続し、稼働状態の切り替えや解除をここで管理します。"
  >
    <template #actions>
      <Button variant="outline" :disabled="refreshing" @click="refreshPage">
        <RefreshCcw class="size-4" :class="{ 'animate-spin': refreshing }" />
        再読み込み
      </Button>
      <Button as="a" :href="oauthConnectPath">
        <Link2 class="size-4" />
        Instagramと連携する
      </Button>
    </template>

    <template #hero>
      <div class="rounded-[1.5rem] border border-border/70 bg-muted/25 p-5">
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="text-sm font-medium text-muted-foreground">
              連携アカウント
            </p>
            <p class="mt-2 text-3xl font-bold tracking-tight text-foreground">
              {{ accounts.length }}件
            </p>
          </div>
          <div class="flex size-11 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600">
            <Instagram class="size-5" />
          </div>
        </div>
      </div>

      <div class="rounded-[1.5rem] border border-border/70 bg-muted/25 p-5">
        <p class="text-sm font-medium text-muted-foreground">
          有効アカウント
        </p>
        <p class="mt-2 text-3xl font-bold tracking-tight text-foreground">
          {{ enabledAccountsCount }}件
        </p>
        <p class="mt-4 text-sm text-muted-foreground">
          停止中 {{ disabledAccountsCount }}件
        </p>
      </div>

      <div class="rounded-[1.5rem] border border-border/70 bg-muted/25 p-5">
        <p class="text-sm font-medium text-muted-foreground">
          最終更新
        </p>
        <p class="mt-2 text-lg font-bold tracking-tight text-foreground">
          {{ latestUpdatedAt ? formatDate(latestUpdatedAt) : '未登録' }}
        </p>
        <p class="mt-4 text-sm text-muted-foreground">
          連携後は自動返信対象として即時利用できます
        </p>
      </div>
    </template>

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

    <Card class="border-white/70 bg-white/85 shadow-[0_30px_90px_-48px_rgba(15,23,42,0.35)] backdrop-blur">
      <CardHeader class="gap-2">
        <CardTitle class="text-2xl">
          連携アカウント一覧
        </CardTitle>
        <CardDescription class="leading-6">
          接続済みアカウントごとに稼働状態の切り替えと連携解除を行えます。
        </CardDescription>
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
  </AppAuthenticatedShell>
</template>
