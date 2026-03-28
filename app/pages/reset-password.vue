<script setup lang="ts">
import { CheckCircle, CircleAlert, KeyRound, LoaderCircle } from 'lucide-vue-next'

definePageMeta({
  middleware: 'guest'
})

useHead({
  title: 'パスワードリセット | Replia'
})

const route = useRoute()
const token = computed(() => (route.query.token as string) || '')

const password = ref('')
const passwordConfirm = ref('')
const loading = ref(false)
const errorMessage = ref('')
const resetComplete = ref(false)

async function submit() {
  errorMessage.value = ''

  if (password.value !== passwordConfirm.value) {
    errorMessage.value = 'パスワードが一致しません'
    return
  }

  if (!token.value) {
    errorMessage.value = 'リセットトークンが見つかりません。メール内のリンクをもう一度クリックしてください。'
    return
  }

  loading.value = true

  try {
    await $fetch('/api/auth/reset-password', {
      method: 'POST',
      body: {
        token: token.value,
        password: password.value
      }
    })
    resetComplete.value = true
  }
  catch (error: any) {
    errorMessage.value = error?.data?.message || error?.data?.statusMessage || 'パスワードのリセットに失敗しました'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="px-4 py-8 sm:px-6 sm:py-10">
    <div class="mx-auto max-w-md">
      <Card class="border-white/70 bg-white/90 shadow-[0_30px_90px_-48px_rgba(15,23,42,0.35)] backdrop-blur">
        <template v-if="resetComplete">
          <CardHeader class="space-y-4 p-6 sm:p-8">
            <div class="flex justify-center">
              <AppBrandMark compact />
            </div>
            <div class="flex items-center justify-center">
              <div class="flex size-16 items-center justify-center rounded-full bg-green-50 text-green-600">
                <CheckCircle class="size-8" />
              </div>
            </div>
            <div class="space-y-2 text-center">
              <CardTitle class="text-2xl">
                パスワードを変更しました
              </CardTitle>
              <CardDescription class="leading-6">
                新しいパスワードでログインしてください。
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent class="px-6 pb-6 sm:px-8 sm:pb-8">
            <Button class="w-full" as-child>
              <NuxtLink to="/login">
                ログインページへ
              </NuxtLink>
            </Button>
          </CardContent>
        </template>

        <template v-else>
          <CardHeader class="space-y-4 p-6 sm:p-8">
            <div class="flex justify-center">
              <AppBrandMark compact />
            </div>
            <div class="flex items-center justify-center">
              <div class="flex size-16 items-center justify-center rounded-full bg-muted/50 text-muted-foreground">
                <KeyRound class="size-8" />
              </div>
            </div>
            <div class="space-y-2 text-center">
              <CardTitle class="text-2xl">
                新しいパスワードを設定
              </CardTitle>
              <CardDescription class="leading-6">
                新しいパスワードを入力してください。
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent class="space-y-5 px-6 pb-6 sm:px-8 sm:pb-8">
            <form class="space-y-5" @submit.prevent="submit">
              <div class="space-y-2">
                <Label for="password">新しいパスワード</Label>
                <AppPasswordInput
                  id="password"
                  v-model="password"
                  autocomplete="new-password"
                  placeholder="8文字以上"
                  required
                />
              </div>

              <div class="space-y-2">
                <Label for="password-confirm">パスワード（確認）</Label>
                <AppPasswordInput
                  id="password-confirm"
                  v-model="passwordConfirm"
                  autocomplete="new-password"
                  placeholder="もう一度入力してください"
                  required
                />
              </div>

              <Alert v-if="errorMessage" variant="destructive">
                <CircleAlert class="size-4" />
                <AlertTitle>エラー</AlertTitle>
                <AlertDescription>{{ errorMessage }}</AlertDescription>
              </Alert>

              <Button class="w-full" type="submit" :disabled="loading">
                <LoaderCircle v-if="loading" class="size-4 animate-spin" />
                {{ loading ? '変更中...' : 'パスワードを変更' }}
              </Button>
            </form>

            <p class="text-center text-sm text-muted-foreground">
              <NuxtLink class="font-medium text-primary hover:text-primary/80" to="/login">
                ログインページに戻る
              </NuxtLink>
            </p>
          </CardContent>
        </template>
      </Card>
    </div>
  </main>
</template>
