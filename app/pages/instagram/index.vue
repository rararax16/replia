<script setup lang="ts">
import { Info, Instagram, Link2, RefreshCcw } from 'lucide-vue-next'

const { showSuccess: setNotice, showError: setError } = useSnackbar()
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
const refreshing = ref(false)
const isGuideDialogOpen = ref(false)

const { data: accountsData, refresh: refreshAccounts, status: accountsStatus } = useFetch('/api/ig-accounts')
const accounts = computed<IgAccount[]>(() => accountsData.value?.accounts || [])
const enabledAccountsCount = computed(() => accounts.value.filter((account) => account.enabled).length)
const disabledAccountsCount = computed(() => accounts.value.filter((account) => !account.enabled).length)
const latestUpdatedAt = computed(() => accounts.value[0]?.updatedAt || null)
const isLoading = computed(() => accountsStatus.value === 'pending')

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
  const shouldOpenGuide = getSingleQueryParam(route.query.guide as string | string[] | undefined) === '1'

  if (oauthError) {
    setError(oauthError)
  }
  else if (connectedCount) {
    setNotice(`Instagram連携が完了しました（${connectedCount}件）`)
    await refreshAccounts()
  }

  if (shouldOpenGuide) {
    isGuideDialogOpen.value = true
  }

  if (oauthError || connectedCount || shouldOpenGuide) {
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
      <Button variant="outline" size="icon" title="Instagram連携手順" @click="isGuideDialogOpen = true">
        <span aria-label="Instagram連携手順を見る">
          <Info class="size-4" />
        </span>
      </Button>
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
            <template v-if="isLoading">
              <Skeleton class="mt-2 h-9 w-20" />
            </template>
            <p v-else class="mt-2 text-3xl font-bold tracking-tight text-foreground">
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
        <template v-if="isLoading">
          <Skeleton class="mt-2 h-9 w-20" />
          <Skeleton class="mt-4 h-4 w-20" />
        </template>
        <template v-else>
          <p class="mt-2 text-3xl font-bold tracking-tight text-foreground">
            {{ enabledAccountsCount }}件
          </p>
          <p class="mt-4 text-sm text-muted-foreground">
            停止中 {{ disabledAccountsCount }}件
          </p>
        </template>
      </div>

      <div class="rounded-[1.5rem] border border-border/70 bg-muted/25 p-5">
        <p class="text-sm font-medium text-muted-foreground">
          最終更新
        </p>
        <template v-if="isLoading">
          <Skeleton class="mt-2 h-7 w-32" />
          <Skeleton class="mt-4 h-4 w-48" />
        </template>
        <template v-else>
          <p class="mt-2 text-lg font-bold tracking-tight text-foreground">
            {{ latestUpdatedAt ? formatDate(latestUpdatedAt) : '未登録' }}
          </p>
          <p class="mt-4 text-sm text-muted-foreground">
            連携後は自動返信対象として即時利用できます
          </p>
        </template>
      </div>
    </template>

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
        <template v-if="isLoading">
          <div class="grid gap-4 md:grid-cols-2">
            <div
              v-for="i in 2"
              :key="`skeleton-account-${i}`"
              class="rounded-[1.5rem] border border-border/70 bg-muted/30 p-5 space-y-4"
            >
              <div class="flex items-start justify-between gap-4">
                <div class="space-y-2 flex-1">
                  <div class="flex items-center gap-2">
                    <Skeleton class="h-6 w-32" />
                    <Skeleton class="h-5 w-12 rounded-full" />
                  </div>
                  <Skeleton class="h-4 w-48" />
                  <Skeleton class="h-3 w-36" />
                </div>
                <Skeleton class="size-11 rounded-2xl" />
              </div>
              <div class="flex gap-2">
                <Skeleton class="h-8 w-16 rounded-md" />
                <Skeleton class="h-8 w-20 rounded-md" />
              </div>
            </div>
          </div>
        </template>
        <template v-else>
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
          <p>
            連携アカウントはまだありません。まずは Instagram アカウントをビジネスアカウントへ切り替えてから、Meta 認証で接続してください。
          </p>
          <div class="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Button size="sm" variant="outline" @click="isGuideDialogOpen = true">
              連携手順を見る
            </Button>
            <Button as="a" size="sm" :href="oauthConnectPath">
              Instagramと連携する
            </Button>
          </div>
        </div>
        </template>
      </CardContent>
    </Card>

    <InstagramSetupGuideDialog
      v-model:open="isGuideDialogOpen"
      :show-hide-preference="true"
      :oauth-connect-path="oauthConnectPath"
    />
  </AppAuthenticatedShell>
</template>
