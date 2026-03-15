<script setup lang="ts">
import { Activity, Instagram, LayoutDashboard, LogOut, MessageSquareText, Users } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

const props = defineProps<{
  title: string
  description: string
}>()

const route = useRoute()
const authState = useAuthStateRef()
const meData = computed(() => authState.value)
const isAdmin = computed(() => meData.value?.user?.role === 'ADMIN')

const navItems = computed(() => {
  const items = [
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
    }
  ]

  if (isAdmin.value) {
    items.push({
      label: 'ユーザーマスター',
      to: '/users',
      icon: Users
    })
  }

  return items
})

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  clearAuthState()
  await navigateTo('/login')
}
</script>

<template>
  <main class="px-4 py-6 sm:px-6 sm:py-8">
    <div class="mx-auto flex max-w-7xl flex-col gap-6">
      <section class="overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 shadow-[0_30px_90px_-48px_rgba(15,23,42,0.35)] backdrop-blur">
        <div class="flex flex-col gap-6 p-6 sm:p-8">
          <div class="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div class="space-y-4">
              <AppBrandMark />

              <div class="space-y-3">
                <div class="flex flex-wrap items-center gap-2">
                  <Badge class="rounded-full px-3 py-1">
                    {{ isAdmin ? 'システム管理者' : '一般ユーザー' }}
                  </Badge>
                  <Badge variant="secondary" class="rounded-full px-3 py-1">
                    ログイン中: {{ meData?.user?.email }}
                  </Badge>
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
            </div>

            <div class="flex flex-wrap gap-3">
              <slot name="actions" />
              <Button variant="secondary" @click="logout">
                <LogOut class="size-4" />
                ログアウト
              </Button>
            </div>
          </div>

          <div v-if="$slots.hero" class="grid gap-4 md:grid-cols-3">
            <slot name="hero" />
          </div>

          <nav class="flex flex-wrap gap-2 rounded-[1.5rem] border border-border/70 bg-white/60 p-2">
            <NuxtLink
              v-for="item in navItems"
              :key="item.to"
              :to="item.to"
              :class="cn(
                'inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition-colors',
                route.path === item.to
                  ? 'bg-primary text-primary-foreground shadow'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )"
            >
              <component :is="item.icon" class="size-4" />
              {{ item.label }}
            </NuxtLink>
          </nav>
        </div>
      </section>

      <slot />
    </div>
  </main>
</template>
