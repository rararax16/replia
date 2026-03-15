<script setup lang="ts">
import { CircleAlert, KeyRound, LoaderCircle, LockKeyhole, ShieldCheck } from 'lucide-vue-next'

definePageMeta({
  middleware: 'auth'
})

useHead({
  title: 'マイページ | Replia'
})

const authState = await ensureAuthState()
const meData = computed(() => authState.value)
const roleLabel = computed(() => meData.value?.user?.role === 'ADMIN' ? 'システム管理者' : '一般ユーザー')

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
    description="ログイン中のアカウント情報の確認と、自分のパスワード変更を行います。"
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
          セキュリティ
        </p>
        <p class="mt-2 text-base font-medium text-foreground">
          新しいパスワードは8文字以上で設定してください
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
  </AppAuthenticatedShell>
</template>
