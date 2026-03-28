<script setup lang="ts">
import { CheckCircle, CircleAlert, LoaderCircle, MailCheck, RefreshCcw } from 'lucide-vue-next'

definePageMeta({
  middleware: 'guest'
})

useHead({
  title: 'メール認証 | Replia'
})

const route = useRoute()
const token = computed(() => (route.query.token as string) || '')

const verifying = ref(false)
const verified = ref(false)
const errorMessage = ref('')

const resendEmail = ref('')
const resending = ref(false)
const resendMessage = ref('')

async function verify() {
  if (!token.value) {
    errorMessage.value = '認証トークンが見つかりません。メール内のリンクをもう一度クリックしてください。'
    return
  }

  verifying.value = true
  errorMessage.value = ''

  try {
    await $fetch('/api/auth/verify-email', {
      method: 'POST',
      body: { token: token.value }
    })

    verified.value = true
    clearSessionScopedData()
    await ensureAuthState(true)

    setTimeout(() => {
      navigateTo('/dashboard')
    }, 2000)
  }
  catch (error: any) {
    errorMessage.value = error?.data?.message || error?.data?.statusMessage || 'メール認証に失敗しました'
  }
  finally {
    verifying.value = false
  }
}

async function resendVerification() {
  if (!resendEmail.value) return

  resending.value = true
  resendMessage.value = ''

  try {
    const res = await $fetch('/api/auth/resend-verification', {
      method: 'POST',
      body: { email: resendEmail.value }
    }) as { message: string }
    resendMessage.value = res.message
  }
  catch (error: any) {
    resendMessage.value = error?.data?.message || error?.data?.statusMessage || '送信に失敗しました'
  }
  finally {
    resending.value = false
  }
}

onMounted(() => {
  if (token.value) {
    verify()
  }
})
</script>

<template>
  <main class="px-4 py-8 sm:px-6 sm:py-10">
    <div class="mx-auto max-w-md">
      <Card class="border-white/70 bg-white/90 shadow-[0_30px_90px_-48px_rgba(15,23,42,0.35)] backdrop-blur">
        <CardHeader class="space-y-4 p-6 sm:p-8">
          <div class="flex justify-center">
            <AppBrandMark compact />
          </div>

          <template v-if="verifying">
            <div class="flex items-center justify-center">
              <div class="flex size-16 items-center justify-center rounded-full bg-muted/50">
                <LoaderCircle class="size-8 animate-spin text-primary" />
              </div>
            </div>
            <div class="space-y-2 text-center">
              <CardTitle class="text-2xl">
                認証中...
              </CardTitle>
              <CardDescription class="leading-6">
                メールアドレスを確認しています。しばらくお待ちください。
              </CardDescription>
            </div>
          </template>

          <template v-else-if="verified">
            <div class="flex items-center justify-center">
              <div class="flex size-16 items-center justify-center rounded-full bg-green-50 text-green-600">
                <CheckCircle class="size-8" />
              </div>
            </div>
            <div class="space-y-2 text-center">
              <CardTitle class="text-2xl">
                認証が完了しました
              </CardTitle>
              <CardDescription class="leading-6">
                ダッシュボードに自動的に移動します...
              </CardDescription>
            </div>
          </template>

          <template v-else-if="errorMessage">
            <div class="flex items-center justify-center">
              <div class="flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <CircleAlert class="size-8" />
              </div>
            </div>
            <div class="space-y-2 text-center">
              <CardTitle class="text-2xl">
                認証に失敗しました
              </CardTitle>
              <CardDescription class="leading-6">
                {{ errorMessage }}
              </CardDescription>
            </div>
          </template>

          <template v-else>
            <div class="flex items-center justify-center">
              <div class="flex size-16 items-center justify-center rounded-full bg-muted/50 text-muted-foreground">
                <MailCheck class="size-8" />
              </div>
            </div>
            <div class="space-y-2 text-center">
              <CardTitle class="text-2xl">
                メール認証
              </CardTitle>
              <CardDescription class="leading-6">
                認証トークンが見つかりません。メール内のリンクをクリックしてください。
              </CardDescription>
            </div>
          </template>
        </CardHeader>

        <CardContent v-if="errorMessage || (!verifying && !verified && !token)" class="space-y-5 px-6 pb-6 sm:px-8 sm:pb-8">
          <div class="space-y-3 rounded-2xl border border-border/70 bg-muted/20 p-4">
            <p class="text-sm font-medium text-foreground">
              認証メールを再送信
            </p>
            <div class="space-y-2">
              <Input
                v-model="resendEmail"
                type="email"
                placeholder="登録したメールアドレス"
              />
              <Button class="w-full" :disabled="resending || !resendEmail" @click="resendVerification">
                <LoaderCircle v-if="resending" class="size-4 animate-spin" />
                <RefreshCcw v-else class="size-4" />
                {{ resending ? '送信中...' : '認証メールを再送信' }}
              </Button>
            </div>
            <p v-if="resendMessage" class="text-sm text-muted-foreground">
              {{ resendMessage }}
            </p>
          </div>

          <p class="text-center text-sm text-muted-foreground">
            <NuxtLink class="font-medium text-primary hover:text-primary/80" to="/login">
              ログインページに戻る
            </NuxtLink>
          </p>
        </CardContent>
      </Card>
    </div>
  </main>
</template>
