<script setup lang="ts">
import { CheckCircle2, CircleAlert, KeyRound, LoaderCircle, LockKeyhole, ShieldCheck, Zap } from 'lucide-vue-next'

definePageMeta({
  middleware: 'auth'
})

useHead({
  title: 'マイページ | Replia'
})

const authState = await ensureAuthState()
const meData = computed(() => authState.value)
const roleLabel = computed(() => meData.value?.user?.role === 'ADMIN' ? 'システム管理者' : '一般ユーザー')

type BillingInfo = {
  plan: 'FREE' | 'PRO'
  replyLimit: number
  replyUsedThisMonth: number
}

const { data: billingData } = useFetch('/api/billing')
const billing = computed<BillingInfo>(() => billingData.value as BillingInfo ?? { plan: 'FREE', replyLimit: 30, replyUsedThisMonth: 0 })
const dmUsagePercent = computed(() => Math.min(100, Math.round((billing.value.replyUsedThisMonth / billing.value.replyLimit) * 100)))

const freeFeatures = [
  'Instagramアカウント 1件',
  'キーワード返信ルール 2件まで設定可',
  '月20件まで自動返信（DM・コメント合計）',
  'コメント → DM自動送信'
]

const proFeatures = [
  'Instagramアカウント 1件',
  'キーワード返信 無制限',
  '月3,000件まで自動返信（DM・コメント合計）',
  'コメント → DM自動送信',
  'コメントユーザー一覧',
  'タグ管理（簡易CRM）',
  '優先サポート'
]

const notice = ref('')
const errorMessage = ref('')
const submitting = ref(false)

const form = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

function setNotice(message: string) {
  notice.value = message
  errorMessage.value = ''
}

function setError(message: string) {
  errorMessage.value = message
  notice.value = ''
}

function resetForm() {
  form.currentPassword = ''
  form.newPassword = ''
  form.confirmPassword = ''
}

async function updatePassword() {
  if (form.newPassword !== form.confirmPassword) {
    setError('新しいパスワード（確認用）が一致しません')
    return
  }

  submitting.value = true

  try {
    const response = await $fetch<{ message: string }>('/api/auth/password', {
      method: 'PUT',
      body: {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword
      }
    })

    setNotice(response.message || 'パスワードを変更しました')
    resetForm()
  }
  catch (error: any) {
    setError(error?.data?.message || error?.data?.statusMessage || 'パスワード変更に失敗しました')
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <AppAuthenticatedShell
    title="マイページ"
    description="アカウント情報の確認・パスワード変更・プランの確認を行います。"
  >
    <template #badges>
      <Badge variant="secondary" class="rounded-full px-3 py-1">
        {{ roleLabel }}
      </Badge>
    </template>

    <template #hero>
      <div class="rounded-[1.5rem] border border-border/70 bg-muted/25 p-5">
        <p class="text-sm font-medium text-muted-foreground">
          ログイン中のメールアドレス
        </p>
        <p class="mt-2 break-all text-xl font-bold tracking-tight text-foreground">
          {{ meData?.user?.email }}
        </p>
      </div>

      <div class="rounded-[1.5rem] border border-border/70 bg-muted/25 p-5">
        <p class="text-sm font-medium text-muted-foreground">
          アカウント権限
        </p>
        <p class="mt-2 text-2xl font-bold tracking-tight text-foreground">
          {{ roleLabel }}
        </p>
      </div>

      <div class="rounded-[1.5rem] border border-border/70 bg-muted/25 p-5">
        <p class="text-sm font-medium text-muted-foreground">
          ご利用中のプラン
        </p>
        <p class="mt-2 text-2xl font-bold tracking-tight text-foreground">
          {{ billing.plan === 'PRO' ? 'Proプラン' : 'Freeプラン' }}
        </p>
      </div>
    </template>

    <Alert v-if="notice">
      <ShieldCheck class="size-4" />
      <AlertTitle>変更が完了しました</AlertTitle>
      <AlertDescription>{{ notice }}</AlertDescription>
    </Alert>

    <Alert v-if="errorMessage" variant="destructive">
      <CircleAlert class="size-4" />
      <AlertTitle>処理に失敗しました</AlertTitle>
      <AlertDescription>{{ errorMessage }}</AlertDescription>
    </Alert>

    <div class="grid gap-6 xl:grid-cols-[340px_1fr]">
      <Card class="border-white/70 bg-white/85 shadow-[0_30px_90px_-48px_rgba(15,23,42,0.35)] backdrop-blur">
        <CardHeader class="gap-3">
          <div class="flex items-center gap-2">
            <div class="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <LockKeyhole class="size-5" />
            </div>
            <div>
              <CardTitle class="text-2xl">
                アカウント情報
              </CardTitle>
              <CardDescription class="mt-1 leading-6">
                現在ログイン中の本人情報です。
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent class="space-y-5">
          <div class="space-y-2 rounded-[1.5rem] border border-border/70 bg-muted/20 p-4">
            <p class="text-sm font-medium text-muted-foreground">
              メールアドレス
            </p>
            <p class="break-all text-sm font-semibold text-foreground">
              {{ meData?.user?.email }}
            </p>
          </div>

          <div class="space-y-2 rounded-[1.5rem] border border-border/70 bg-muted/20 p-4">
            <p class="text-sm font-medium text-muted-foreground">
              ロール
            </p>
            <Badge class="rounded-full px-3 py-1">
              {{ roleLabel }}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card class="border-white/70 bg-white/85 shadow-[0_30px_90px_-48px_rgba(15,23,42,0.35)] backdrop-blur">
        <CardHeader class="gap-3">
          <div class="flex items-center gap-2">
            <div class="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <KeyRound class="size-5" />
            </div>
            <div>
              <CardTitle class="text-2xl">
                パスワード変更
              </CardTitle>
              <CardDescription class="mt-1 leading-6">
                現在のパスワードを確認したうえで、新しいパスワードへ更新します。
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form class="space-y-5" @submit.prevent="updatePassword">
            <div class="space-y-2">
              <Label for="current-password">現在のパスワード</Label>
              <AppPasswordInput
                id="current-password"
                v-model="form.currentPassword"
                autocomplete="current-password"
                placeholder="現在のパスワードを入力"
                required
                toggle-label="現在のパスワード"
              />
            </div>

            <div class="space-y-2">
              <Label for="new-password">新しいパスワード</Label>
              <AppPasswordInput
                id="new-password"
                v-model="form.newPassword"
                autocomplete="new-password"
                placeholder="8文字以上で入力"
                required
                toggle-label="新しいパスワード"
              />
            </div>

            <div class="space-y-2">
              <Label for="confirm-password">新しいパスワード（確認用）</Label>
              <AppPasswordInput
                id="confirm-password"
                v-model="form.confirmPassword"
                autocomplete="new-password"
                placeholder="確認用でもう一度入力"
                required
                toggle-label="確認用パスワード"
              />
            </div>

            <div class="flex flex-wrap gap-3">
              <Button type="submit" :disabled="submitting">
                <LoaderCircle v-if="submitting" class="size-4 animate-spin" />
                {{ submitting ? '変更中...' : 'パスワードを変更する' }}
              </Button>
              <Button type="button" variant="outline" @click="resetForm">
                入力をクリア
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>

    <!-- DM送信状況 -->
    <Card class="border-white/70 bg-white/85 shadow-[0_30px_90px_-48px_rgba(15,23,42,0.35)] backdrop-blur">
      <CardHeader class="gap-2">
        <CardTitle class="text-2xl">
          今月の自動返信状況
        </CardTitle>
        <CardDescription class="leading-6">
          毎月1日にリセットされます。
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="flex items-end justify-between">
          <p class="text-4xl font-bold text-foreground">
            {{ billing.replyUsedThisMonth }}
            <span class="text-lg font-normal text-muted-foreground">/ {{ billing.replyLimit }} 件</span>
          </p>
          <Badge :variant="billing.plan === 'PRO' ? 'default' : 'secondary'" class="text-sm">
            {{ billing.plan === 'PRO' ? 'Proプラン' : 'Freeプラン' }}
          </Badge>
        </div>
        <div class="h-3 w-full overflow-hidden rounded-full bg-muted">
          <div
            class="h-full rounded-full transition-all"
            :class="dmUsagePercent >= 100 ? 'bg-destructive' : dmUsagePercent >= 80 ? 'bg-amber-500' : 'bg-primary'"
            :style="{ width: `${dmUsagePercent}%` }"
          />
        </div>
        <p v-if="dmUsagePercent >= 100 && billing.plan === 'FREE'" class="text-sm font-medium text-destructive">
          月間自動返信の上限に達しました。Proプランにアップグレードすると3,000件まで送れます。
        </p>
        <p v-else-if="dmUsagePercent >= 80 && billing.plan === 'FREE'" class="text-sm text-amber-700">
          自動返信上限の{{ dmUsagePercent }}%に達しています。
        </p>
      </CardContent>
    </Card>

    <!-- プラン比較 -->
    <div class="grid gap-6 md:grid-cols-2">
      <Card
        class="border-white/70 bg-white/85 shadow-[0_30px_90px_-48px_rgba(15,23,42,0.35)] backdrop-blur"
        :class="billing.plan === 'FREE' ? 'ring-2 ring-primary' : ''"
      >
        <CardHeader class="gap-2">
          <div class="flex items-center justify-between">
            <CardTitle class="text-xl">
              Freeプラン
            </CardTitle>
            <Badge v-if="billing.plan === 'FREE'" variant="default">
              ご利用中
            </Badge>
          </div>
          <p class="text-3xl font-bold text-foreground">
            ¥0
            <span class="text-base font-normal text-muted-foreground">/ 月</span>
          </p>
        </CardHeader>
        <CardContent>
          <ul class="space-y-2">
            <li
              v-for="feature in freeFeatures"
              :key="feature"
              class="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <CheckCircle2 class="size-4 shrink-0 text-muted-foreground/60" />
              {{ feature }}
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card
        class="border-white/70 bg-white/85 shadow-[0_30px_90px_-48px_rgba(15,23,42,0.35)] backdrop-blur"
        :class="billing.plan === 'PRO' ? 'ring-2 ring-primary' : ''"
      >
        <CardHeader class="gap-2">
          <div class="flex items-center justify-between">
            <CardTitle class="text-xl">
              Proプラン
            </CardTitle>
            <Badge v-if="billing.plan === 'PRO'" variant="default">
              ご利用中
            </Badge>
          </div>
          <p class="text-3xl font-bold text-foreground">
            ¥2,980
            <span class="text-base font-normal text-muted-foreground">/ 月</span>
          </p>
        </CardHeader>
        <CardContent class="space-y-4">
          <ul class="space-y-2">
            <li
              v-for="feature in proFeatures"
              :key="feature"
              class="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <CheckCircle2 class="size-4 shrink-0 text-primary" />
              {{ feature }}
            </li>
          </ul>
          <div v-if="billing.plan === 'FREE'" class="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-3">
            <p class="text-sm font-medium text-foreground">
              Proプランへのアップグレードをご希望の方は、以下のメールアドレスまでご連絡ください。
            </p>
            <a
              href="mailto:support@replia.jp"
              class="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Zap class="size-4" />
              アップグレードを申し込む
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  </AppAuthenticatedShell>
</template>
