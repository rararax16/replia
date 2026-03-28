<script setup lang="ts">
import { CircleAlert, Instagram, LoaderCircle, MessageSquare, ShieldCheck } from 'lucide-vue-next'

definePageMeta({
  middleware: 'guest'
})

useHead({
  title: 'ログイン | Replia'
})

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

const highlights = [
  {
    title: 'Meta 認可で連携',
    description: 'アクセストークンを直接扱わずに Instagram ビジネスアカウントを接続できます。',
    icon: Instagram
  },
  {
    title: '返信ルール管理',
    description: 'DM とコメント別にキーワード返信を整理し、優先度まで一元管理します。',
    icon: MessageSquare
  },
  {
    title: '管理者運用',
    description: 'ユーザー権限とイベント履歴を同じ管理画面から確認できます。',
    icon: ShieldCheck
  }
]

async function submit() {
  loading.value = true
  errorMessage.value = ''

  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: {
        email: email.value,
        password: password.value
      }
    })

    clearSessionScopedData()
    await ensureAuthState(true)
    await navigateTo('/dashboard')
  }
  catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || '処理に失敗しました'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="px-4 py-8 sm:px-6 sm:py-10">
    <div class="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <Card class="overflow-hidden border-white/70 bg-white/80 shadow-[0_30px_90px_-48px_rgba(15,23,42,0.35)] backdrop-blur">
        <CardContent class="flex h-full flex-col gap-10 p-6 sm:p-8">
          <div class="space-y-8">
            <AppBrandMark />

            <div class="space-y-4">
              <Badge variant="secondary" class="rounded-full px-3 py-1">
                Instagram自動返信 管理画面
              </Badge>
              <div class="space-y-3">
                <h1 class="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  返信ルールと運用ログを、
                  ひとつの管理画面へ。
                </h1>
                <p class="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                  Replia は Instagram の DM / コメント自動返信を日本語 UI でまとめて管理するための画面です。
                  ルール作成、アカウント連携、受信イベント確認を一貫した操作感に揃えています。
                </p>
              </div>
            </div>

            <div class="grid gap-3 sm:grid-cols-3">
              <div
                v-for="item in highlights"
                :key="item.title"
                class="rounded-2xl border border-border/70 bg-muted/35 p-4"
              >
                <div class="mb-3 flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <component :is="item.icon" class="size-5" />
                </div>
                <p class="font-semibold text-foreground">
                  {{ item.title }}
                </p>
                <p class="mt-2 text-sm leading-6 text-muted-foreground">
                  {{ item.description }}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card class="border-white/70 bg-white/90 shadow-[0_30px_90px_-48px_rgba(15,23,42,0.35)] backdrop-blur">
        <CardHeader class="space-y-4 p-6 sm:p-8">
          <div class="space-y-2">
            <CardTitle class="text-2xl">
              ログイン
            </CardTitle>
            <CardDescription class="leading-6">
              登録済みメールアドレスとパスワードで管理画面に入ります。
            </CardDescription>
          </div>

          <Alert>
            <ShieldCheck class="size-4" />
            <AlertTitle>はじめての方へ</AlertTitle>
            <AlertDescription>
              無料でアカウントを作成し、Instagram ビジネスアカウントを連携してご利用ください。
            </AlertDescription>
          </Alert>
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

            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <Label for="password">パスワード</Label>
                <NuxtLink class="text-xs font-medium text-primary hover:text-primary/80" to="/forgot-password">
                  パスワードをお忘れの方
                </NuxtLink>
              </div>
              <AppPasswordInput
                id="password"
                v-model="password"
                autocomplete="current-password"
                placeholder="8文字以上"
                required
              />
            </div>

            <Alert v-if="errorMessage" variant="destructive">
              <CircleAlert class="size-4" />
              <AlertTitle>ログインに失敗しました</AlertTitle>
              <AlertDescription>{{ errorMessage }}</AlertDescription>
            </Alert>

            <Button class="w-full" type="submit" :disabled="loading">
              <LoaderCircle v-if="loading" class="size-4 animate-spin" />
              {{ loading ? '送信中...' : 'ログイン' }}
            </Button>
          </form>

          <p class="text-center text-sm text-muted-foreground">
            アカウントをお持ちでない方は
            <NuxtLink class="font-medium text-primary hover:text-primary/80" to="/register">
              新規登録
            </NuxtLink>
          </p>
        </CardContent>

        <CardFooter class="flex flex-wrap items-center gap-3 border-t bg-muted/25 px-6 py-5 text-sm text-muted-foreground sm:px-8">
          <NuxtLink class="font-medium text-primary hover:text-primary/80" to="/privacy">
            プライバシーポリシー
          </NuxtLink>
          <span class="text-border">/</span>
          <NuxtLink class="font-medium text-primary hover:text-primary/80" to="/terms">
            利用規約
          </NuxtLink>
        </CardFooter>
      </Card>
    </div>
  </main>
</template>
