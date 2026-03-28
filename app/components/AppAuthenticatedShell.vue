<script setup lang="ts">
import { Activity, BellRing, CircleUserRound, Instagram, LayoutDashboard, LogOut, Megaphone, MessageSquare, MessageSquareText, Users } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

const props = defineProps<{
  title: string
  description: string
}>()

const route = useRoute()
const authState = useAuthStateRef()
const meData = computed(() => authState.value)
const isAdmin = computed(() => meData.value?.user?.role === 'ADMIN')

const generalNavItems = [
  {
    label: 'ダッシュボード',
    to: '/dashboard',
    icon: LayoutDashboard
  },
  {
    label: 'Instagram連携',
    to: '/instagram',
    icon: Instagram
  },
  {
    label: '返信ルール',
    to: '/reply-rules',
    icon: MessageSquareText
  },
  {
    label: '受信イベント',
    to: '/events',
    icon: Activity
  },
  {
    label: 'コメントユーザー',
    to: '/comment-users',
    icon: MessageSquare
  },
  {
    label: 'お知らせ',
    to: '/announcements',
    icon: BellRing
  },
  {
    label: 'マイページ',
    to: '/my-page',
    icon: CircleUserRound
  }
]

const adminNavItems = [
  {
    label: 'ユーザーマスター',
    to: '/users',
    icon: Users
  },
  {
    label: 'お知らせ管理',
    to: '/admin/announcements',
    icon: Megaphone
  }
]

function isNavItemActive(path: string) {
  return route.path === path || route.path.startsWith(`${path}/`)
}

async function logout() {
  if (import.meta.client && !window.confirm('ログアウトしてログイン画面に戻りますか？')) {
    return
  }

  await $fetch('/api/auth/logout', { method: 'POST' })
  clearAuthState()
  clearSessionScopedData()
  await navigateTo('/login')
}
</script>

<template>
  <main class="px-4 py-6 sm:px-6 sm:py-8">
    <div class="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
      <aside class="xl:sticky xl:top-8 xl:self-start">
        <section class="overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 shadow-[0_30px_90px_-48px_rgba(15,23,42,0.35)] backdrop-blur">
          <div class="flex flex-col gap-6 p-5 sm:p-6">
            <div class="space-y-4">
              <AppBrandMark />

              <div class="space-y-3 rounded-[1.5rem] border border-border/70 bg-muted/20 p-4">
                <div class="flex flex-wrap items-center gap-2">
                  <Badge :variant="isAdmin ? 'destructive' : 'default'" class="rounded-full px-3 py-1">
                    {{ isAdmin ? 'システム管理者' : '一般ユーザー' }}
                  </Badge>
                </div>
                <div class="space-y-1">
                  <p class="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    ログイン中
                  </p>
                  <p class="break-all text-sm font-medium text-foreground">
                    {{ meData?.user?.email }}
                  </p>
                </div>
                <Button
                  class="h-8 w-fit px-2 text-muted-foreground"
                  variant="ghost"
                  @click="logout"
                >
                  <LogOut class="size-4" />
                  ログアウト
                </Button>
              </div>
            </div>

            <nav class="flex flex-col gap-2">
              <NuxtLink
                v-for="item in generalNavItems"
                :key="item.to"
                :to="item.to"
                :class="cn(
                  'inline-flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors',
                  isNavItemActive(item.to)
                    ? 'bg-primary text-primary-foreground shadow'
                    : 'border border-transparent text-muted-foreground hover:border-border/70 hover:bg-muted/40 hover:text-foreground'
                )"
              >
                <component :is="item.icon" class="size-4" />
                {{ item.label }}
              </NuxtLink>

              <template v-if="isAdmin">
                <div class="flex items-center gap-2 px-1 pt-2">
                  <Separator class="flex-1" />
                  <span class="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">管理者</span>
                  <Separator class="flex-1" />
                </div>
                <NuxtLink
                  v-for="item in adminNavItems"
                  :key="item.to"
                  :to="item.to"
                  :class="cn(
                    'inline-flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors',
                    isNavItemActive(item.to)
                      ? 'bg-primary text-primary-foreground shadow'
                      : 'border border-transparent text-muted-foreground hover:border-border/70 hover:bg-muted/40 hover:text-foreground'
                  )"
                >
                  <component :is="item.icon" class="size-4" />
                  {{ item.label }}
                </NuxtLink>
              </template>
            </nav>
          </div>
        </section>
      </aside>

      <div class="min-w-0 space-y-6">
        <section class="overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 shadow-[0_30px_90px_-48px_rgba(15,23,42,0.35)] backdrop-blur">
          <div class="flex flex-col gap-6 p-6 sm:p-8">
            <div class="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div class="space-y-4">
                <div class="flex flex-wrap items-center gap-2">
                  <slot name="badges" />
                </div>

                <div class="space-y-2">
                  <h1 class="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                    {{ props.title }}
                  </h1>
                  <p class="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
                    {{ props.description }}
                  </p>
                </div>
              </div>

              <div v-if="$slots.actions" class="flex flex-wrap gap-3 xl:justify-end">
                <slot name="actions" />
              </div>
            </div>

            <div v-if="$slots.hero" class="grid gap-4 md:grid-cols-3">
              <slot name="hero" />
            </div>
          </div>
        </section>

        <slot />
      </div>
    </div>
  </main>
</template>
