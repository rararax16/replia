<script setup lang="ts">
import { BadgeInfo, BriefcaseBusiness, CheckCircle2, ExternalLink, Link2, Smartphone, X } from 'lucide-vue-next'
import { instagramSetupNotes, instagramSetupOfficialLinks, instagramSetupSteps } from '@/lib/instagram-setup-guide'

const props = withDefaults(defineProps<{
  showHidePreference?: boolean
  oauthConnectPath?: string
}>(), {
  showHidePreference: false,
  oauthConnectPath: '/api/ig-accounts/oauth/start'
})

const open = defineModel<boolean>('open', {
  default: false
})

const { hideGuide } = useInstagramSetupGuidePreference()
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    open.value = false
  }
}

watch(open, (isOpen) => {
  if (!import.meta.client) {
    return
  }

  document.body.style.overflow = isOpen ? 'hidden' : ''
}, { immediate: true })

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  if (import.meta.client) {
    document.body.style.overflow = ''
    window.removeEventListener('keydown', handleKeydown)
  }
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[120] overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Instagram連携手順"
    >
      <div
        class="fixed inset-0 bg-slate-950/55 backdrop-blur-sm"
        @click="open = false"
      />

      <div class="relative mx-auto flex min-h-screen w-full max-w-6xl items-center p-4 sm:p-6">
        <div class="relative w-full overflow-hidden rounded-[2rem] border border-white/70 bg-white/95 shadow-[0_40px_120px_-50px_rgba(15,23,42,0.45)] backdrop-blur">
          <div class="flex items-start justify-between gap-4 border-b border-border/70 px-5 py-5 sm:px-7">
            <div class="space-y-2">
              <div class="flex flex-wrap items-center gap-2">
                <Badge>Instagram連携手順</Badge>
                <Badge variant="secondary">
                  ビジネスアカウント必須
                </Badge>
              </div>
              <div class="space-y-1">
                <h2 class="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  先に Instagram をビジネスアカウントへ切り替えてください
                </h2>
                <p class="max-w-3xl text-sm leading-6 text-muted-foreground">
                  Meta 側の認証を通す前に、Instagram アプリでビジネスアカウント化しておくと詰まりにくくなります。
                </p>
              </div>
            </div>

            <Button variant="ghost" size="icon" @click="open = false">
              <X class="size-4" />
              <span class="sr-only">閉じる</span>
            </Button>
          </div>

          <div class="max-h-[calc(100vh-8rem)] overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
            <div class="grid gap-4 md:grid-cols-3">
              <div class="rounded-[1.5rem] border border-border/70 bg-muted/25 p-5">
                <div class="flex items-center gap-3">
                  <div class="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Smartphone class="size-5" />
                  </div>
                  <div>
                    <p class="text-sm font-medium text-muted-foreground">
                      操作場所
                    </p>
                    <p class="mt-1 text-lg font-bold tracking-tight text-foreground">
                      Instagramアプリ推奨
                    </p>
                  </div>
                </div>
              </div>

              <div class="rounded-[1.5rem] border border-border/70 bg-muted/25 p-5">
                <div class="flex items-center gap-3">
                  <div class="flex size-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
                    <BriefcaseBusiness class="size-5" />
                  </div>
                  <div>
                    <p class="text-sm font-medium text-muted-foreground">
                      必須条件
                    </p>
                    <p class="mt-1 text-lg font-bold tracking-tight text-foreground">
                      ビジネスアカウント
                    </p>
                  </div>
                </div>
              </div>

              <div class="rounded-[1.5rem] border border-border/70 bg-muted/25 p-5">
                <div class="flex items-center gap-3">
                  <div class="flex size-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
                    <BadgeInfo class="size-5" />
                  </div>
                  <div>
                    <p class="text-sm font-medium text-muted-foreground">
                      補足
                    </p>
                    <p class="mt-1 text-lg font-bold tracking-tight text-foreground">
                      Facebookページ接続推奨
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <Card class="border-border/70 bg-white">
                <CardHeader class="gap-2">
                  <CardTitle class="text-2xl">
                    切り替え手順
                  </CardTitle>
                  <CardDescription class="leading-6">
                    Instagram アプリのメニュー名はバージョンで少し変わることがあります。近い名称の項目を選んで進めてください。
                  </CardDescription>
                </CardHeader>
                <CardContent class="space-y-4">
                  <article
                    v-for="(step, index) in instagramSetupSteps"
                    :key="step.id"
                    class="rounded-[1.5rem] border border-border/70 bg-muted/20 p-5"
                  >
                    <div class="flex items-start gap-4">
                      <div class="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                        {{ index + 1 }}
                      </div>
                      <div class="min-w-0 flex-1 space-y-3">
                        <div class="space-y-1.5">
                          <h3 class="text-lg font-semibold text-foreground">
                            {{ step.title }}
                          </h3>
                          <p class="text-sm leading-6 text-muted-foreground">
                            {{ step.description }}
                          </p>
                        </div>

                        <ul class="space-y-2 text-sm leading-6 text-foreground">
                          <li
                            v-for="detail in step.details"
                            :key="detail"
                            class="flex items-start gap-2"
                          >
                            <CheckCircle2 class="mt-1 size-4 shrink-0 text-emerald-600" />
                            <span>{{ detail }}</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </article>
                </CardContent>
              </Card>

              <div class="space-y-6">
                <Card class="border-border/70 bg-white">
                  <CardHeader class="gap-2">
                    <CardTitle class="text-2xl">
                      事前チェック
                    </CardTitle>
                    <CardDescription class="leading-6">
                      連携前にここだけ確認しておくと、Meta 認証で止まりにくくなります。
                    </CardDescription>
                  </CardHeader>
                  <CardContent class="space-y-3">
                    <div
                      v-for="note in instagramSetupNotes"
                      :key="note"
                      class="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 text-sm leading-6 text-foreground"
                    >
                      {{ note }}
                    </div>
                  </CardContent>
                </Card>

                <Card class="border-border/70 bg-white">
                  <CardHeader class="gap-2">
                    <CardTitle class="text-2xl">
                      参考リンク
                    </CardTitle>
                    <CardDescription class="leading-6">
                      詳細は Instagram / Meta の公式ヘルプでも確認できます。
                    </CardDescription>
                  </CardHeader>
                  <CardContent class="space-y-3">
                    <a
                      v-for="link in instagramSetupOfficialLinks"
                      :key="link.href"
                      :href="link.href"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-white"
                    >
                      <span>{{ link.label }}</span>
                      <ExternalLink class="size-4 text-muted-foreground" />
                    </a>
                  </CardContent>
                </Card>

                <Card
                  v-if="props.showHidePreference"
                  class="border-border/70 bg-white"
                >
                  <CardHeader class="gap-2">
                    <CardTitle class="text-2xl">
                      表示設定
                    </CardTitle>
                    <CardDescription class="leading-6">
                      ダッシュボードの初回案内を今後表示しない場合は、ここで切り替えてください。
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <label class="flex items-start gap-3 rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 text-sm leading-6 text-foreground">
                      <input
                        v-model="hideGuide"
                        type="checkbox"
                        class="mt-1 size-4 rounded border-input text-primary focus:ring-2 focus:ring-ring"
                      >
                      <span>ダッシュボードでこの手順案内を今後表示しない</span>
                    </label>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 px-5 py-4 sm:px-7">
            <p class="text-sm text-muted-foreground">
              準備ができたら、そのまま Meta 認証に進めます。
            </p>
            <div class="flex flex-wrap gap-3">
              <Button variant="outline" @click="open = false">
                閉じる
              </Button>
              <Button as-child>
                <a :href="props.oauthConnectPath">
                  <Link2 class="size-4" />
                  Instagramと連携する
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
