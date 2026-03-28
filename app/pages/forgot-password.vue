<script setup lang="ts">
import { CircleAlert, KeyRound, LoaderCircle, MailCheck } from 'lucide-vue-next'

definePageMeta({
  middleware: 'guest'
})

useHead({
  title: 'パスワードをお忘れの方 | Replia'
})

const email = ref('')
const loading = ref(false)
const errorMessage = ref('')
const sent = ref(false)

async function submit() {
  loading.value = true
  errorMessage.value = ''

  try {
    await $fetch('/api/auth/forgot-password', {
      method: 'POST',
      body: { email: email.value }
    })
    sent.value = true
  }
  catch (error: any) {
    errorMessage.value = error?.data?.message || error?.data?.statusMessage || '送信に失敗しました'
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
        <template v-if="sent">
          <CardHeader class="space-y-4 p-6 sm:p-8">
            <div class="flex justify-center">
              <AppBrandMark compact />
            </div>
            <div class="flex items-center justify-center">
              <div class="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MailCheck class="size-8" />
              </div>
            </div>
            <div class="space-y-2 text-center">
              <CardTitle class="text-2xl">
                リセットメールを送信しました
              </CardTitle>
              <CardDescription class="leading-6">
                <strong>{{ email }}</strong> 宛にパスワードリセット用のメールを送信しました。<br>
                メールに記載されたリンクから新しいパスワードを設定してください。
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent class="space-y-4 px-6 pb-6 sm:px-8 sm:pb-8">
            <Alert>
              <MailCheck class="size-4" />
              <AlertTitle>メールが届かない場合</AlertTitle>
              <AlertDescription>
                迷惑メールフォルダをご確認ください。リンクの有効期限は24時間です。
              </AlertDescription>
            </Alert>
            <p class="text-center text-sm text-muted-foreground">
              <NuxtLink class="font-medium text-primary hover:text-primary/80" to="/login">
                ログインページに戻る
              </NuxtLink>
            </p>
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
                パスワードをリセット
              </CardTitle>
              <CardDescription class="leading-6">
                登録したメールアドレスを入力してください。パスワードリセット用のリンクをお送りします。
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent class="space-y-5 px-6 pb-6 sm:px-8 sm:pb-8">
            <form class="space-y-5" @submit.prevent="submit">
              <div class="space-y-2">
                <Label for="email">メールアドレス</Label>
                <Input
                  id="email"
                  v-model="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <Alert v-if="errorMessage" variant="destructive">
                <CircleAlert class="size-4" />
                <AlertTitle>送信に失敗しました</AlertTitle>
                <AlertDescription>{{ errorMessage }}</AlertDescription>
              </Alert>

              <Button class="w-full" type="submit" :disabled="loading">
                <LoaderCircle v-if="loading" class="size-4 animate-spin" />
                {{ loading ? '送信中...' : 'リセットメールを送信' }}
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
