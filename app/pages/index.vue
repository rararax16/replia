<script setup lang="ts">
import { LoaderCircle } from 'lucide-vue-next'

definePageMeta({
  middleware: 'root-redirect'
})
</script>

<template>
  <main class="flex min-h-screen items-center justify-center px-4">
    <Card class="w-full max-w-md border-white/70 bg-white/80 shadow-[0_30px_90px_-48px_rgba(15,23,42,0.35)] backdrop-blur">
      <CardContent class="flex flex-col items-center gap-5 p-8 text-center">
        <AppBrandMark />
        <div class="space-y-2">
          <p class="text-lg font-semibold text-foreground">
            初期画面を確認しています
          </p>
          <p class="text-sm leading-6 text-muted-foreground">
            認証状態に応じて適切な画面へ移動します。
          </p>
        </div>
        <div class="flex items-center gap-2 text-sm text-muted-foreground">
          <LoaderCircle class="size-4 animate-spin" />
          読み込み中...
        </div>
      </CardContent>
    </Card>
  </main>
</template>
