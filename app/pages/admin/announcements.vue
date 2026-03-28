<script setup lang="ts">
import { BellRing, Eye, EyeOff, LoaderCircle, Pencil, Plus, RefreshCcw, Trash2 } from 'lucide-vue-next'
import { formatDate } from '@/lib/replia-ui'

const { showSuccess: setNotice, showError: setError } = useSnackbar()

definePageMeta({
  middleware: 'admin'
})

useHead({
  title: 'お知らせ管理 | Replia'
})

type Announcement = {
  id: string
  title: string
  body: string
  publishAt: string
  isVisible: boolean
  createdAt: string
  updatedAt: string
}

const refreshing = ref(false)
const saving = ref(false)
const editingId = ref<string | null>(null)

const { data, refresh } = useFetch('/api/admin/announcements', { default: () => ({ announcements: [] }) })
const announcements = computed<Announcement[]>(() => (data.value as any)?.announcements ?? [])
const visibleCount = computed(() => announcements.value.filter(a => a.isVisible).length)

const now = new Date()
const defaultPublishAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

const form = reactive({
  title: '',
  body: '',
  publishAt: defaultPublishAt,
  isVisible: true
})

function resetForm() {
  editingId.value = null
  form.title = ''
  form.body = ''
  const n = new Date()
  form.publishAt = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}T${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`
  form.isVisible = true
}

function editAnnouncement(item: Announcement) {
  editingId.value = item.id
  form.title = item.title
  form.body = item.body
  const d = new Date(item.publishAt)
  form.publishAt = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  form.isVisible = item.isVisible
}

async function refreshPage() {
  refreshing.value = true
  try {
    await refresh()
    setNotice('お知らせ一覧を更新しました')
  }
  catch (error: any) {
    setError(error?.data?.statusMessage || 'お知らせ一覧の更新に失敗しました')
  }
  finally {
    refreshing.value = false
  }
}

async function saveAnnouncement() {
  saving.value = true
  try {
    if (editingId.value) {
      await $fetch(`/api/admin/announcements/${editingId.value}`, {
        method: 'PATCH',
        body: {
          title: form.title,
          body: form.body,
          publishAt: new Date(form.publishAt).toISOString(),
          isVisible: form.isVisible
        }
      })
      setNotice('お知らせを更新しました')
    }
    else {
      await $fetch('/api/admin/announcements', {
        method: 'POST',
        body: {
          title: form.title,
          body: form.body,
          publishAt: new Date(form.publishAt).toISOString(),
          isVisible: form.isVisible
        }
      })
      setNotice('お知らせを作成しました')
    }
    resetForm()
    await refresh()
  }
  catch (error: any) {
    setError(error?.data?.statusMessage || 'お知らせの保存に失敗しました')
  }
  finally {
    saving.value = false
  }
}

async function toggleVisibility(item: Announcement) {
  try {
    await $fetch(`/api/admin/announcements/${item.id}`, {
      method: 'PATCH',
      body: { isVisible: !item.isVisible }
    })
    setNotice(item.isVisible ? 'お知らせを非表示にしました' : 'お知らせを表示にしました')
    await refresh()
  }
  catch (error: any) {
    setError(error?.data?.statusMessage || '表示状態の更新に失敗しました')
  }
}

async function deleteAnnouncement(id: string) {
  if (!confirm('このお知らせを削除しますか？')) return

  try {
    await $fetch(`/api/admin/announcements/${id}`, { method: 'DELETE' })
    setNotice('お知らせを削除しました')
    await refresh()
  }
  catch (error: any) {
    setError(error?.data?.statusMessage || 'お知らせの削除に失敗しました')
  }
}

function isPublished(item: Announcement) {
  return item.isVisible && new Date(item.publishAt) <= new Date()
}

function getStatusLabel(item: Announcement) {
  if (!item.isVisible) return '非表示'
  if (new Date(item.publishAt) > new Date()) return '予約中'
  return '公開中'
}

function getStatusVariant(item: Announcement): 'default' | 'secondary' | 'outline' {
  if (!item.isVisible) return 'secondary'
  if (new Date(item.publishAt) > new Date()) return 'outline'
  return 'default'
}
</script>

<template>
  <AppAuthenticatedShell
    title="お知らせ管理"
    description="全ユーザーに表示するお知らせの作成・編集・公開管理を行います。"
  >
    <template #actions>
      <Button variant="outline" :disabled="refreshing" @click="refreshPage">
        <RefreshCcw class="size-4" :class="{ 'animate-spin': refreshing }" />
        再読み込み
      </Button>
    </template>

    <template #hero>
      <div class="rounded-[1.5rem] border border-border/70 bg-muted/25 p-5">
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="text-sm font-medium text-muted-foreground">
              総お知らせ数
            </p>
            <p class="mt-2 text-3xl font-bold tracking-tight text-foreground">
              {{ announcements.length }}件
            </p>
          </div>
          <div class="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <BellRing class="size-5" />
          </div>
        </div>
      </div>

      <div class="rounded-[1.5rem] border border-border/70 bg-muted/25 p-5">
        <p class="text-sm font-medium text-muted-foreground">
          公開中
        </p>
        <p class="mt-2 text-3xl font-bold tracking-tight text-foreground">
          {{ visibleCount }}件
        </p>
        <p class="mt-4 text-sm text-muted-foreground">
          非表示 {{ announcements.length - visibleCount }}件
        </p>
      </div>

      <div class="rounded-[1.5rem] border border-border/70 bg-muted/25 p-5">
        <p class="text-sm font-medium text-muted-foreground">
          使い方
        </p>
        <p class="mt-2 text-sm leading-6 text-muted-foreground">
          公開日時を未来にすると予約投稿になります。非表示にすると一時的に隠せます。
        </p>
      </div>
    </template>

    <div class="grid gap-6 xl:grid-cols-[420px_1fr]">
      <Card class="border-white/70 bg-white/85 shadow-[0_30px_90px_-48px_rgba(15,23,42,0.35)] backdrop-blur">
        <CardHeader class="gap-3">
          <div class="flex items-center gap-2">
            <CardTitle class="text-2xl">
              {{ editingId ? 'お知らせ編集' : 'お知らせ作成' }}
            </CardTitle>
            <Badge v-if="editingId" variant="secondary">
              編集中
            </Badge>
          </div>
          <CardDescription class="leading-6">
            タイトル・本文・公開日時を入力してください。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form class="space-y-5" @submit.prevent="saveAnnouncement">
            <div class="space-y-2">
              <Label for="ann-title">タイトル</Label>
              <Input
                id="ann-title"
                v-model="form.title"
                type="text"
                placeholder="お知らせのタイトル"
                required
              />
            </div>

            <div class="space-y-2">
              <Label for="ann-body">本文</Label>
              <Textarea
                id="ann-body"
                v-model="form.body"
                rows="5"
                placeholder="お知らせの内容を入力してください"
                required
              />
            </div>

            <div class="space-y-2">
              <Label for="ann-publish-at">公開日時</Label>
              <Input
                id="ann-publish-at"
                v-model="form.publishAt"
                type="datetime-local"
                required
              />
            </div>

            <div class="flex flex-col gap-4 rounded-[1.5rem] border border-border/70 bg-muted/25 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div class="space-y-1">
                <p class="font-medium text-foreground">
                  表示する
                </p>
                <p class="text-sm text-muted-foreground">
                  非表示にすると公開日時を過ぎてもユーザーに表示されません。
                </p>
              </div>
              <Switch v-model:checked="form.isVisible" aria-label="お知らせの表示切替" />
            </div>

            <div class="flex flex-wrap gap-3">
              <Button type="submit" :disabled="saving">
                <LoaderCircle v-if="saving" class="size-4 animate-spin" />
                <Plus v-else class="size-4" />
                {{ saving ? '保存中...' : editingId ? 'お知らせ更新' : 'お知らせ作成' }}
              </Button>
              <Button
                v-if="editingId"
                type="button"
                variant="outline"
                @click="resetForm"
              >
                編集をキャンセル
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card class="border-white/70 bg-white/85 shadow-[0_30px_90px_-48px_rgba(15,23,42,0.35)] backdrop-blur">
        <CardHeader class="gap-2">
          <CardTitle class="text-2xl">
            お知らせ一覧
          </CardTitle>
          <CardDescription class="leading-6">
            公開日時の新しい順に表示しています。
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div v-if="announcements.length === 0" class="rounded-[1.5rem] border border-dashed border-border/70 bg-muted/10 p-8 text-center text-sm text-muted-foreground">
            お知らせはまだありません
          </div>

          <section
            v-for="item in announcements"
            :key="item.id"
            class="rounded-[1.5rem] border border-border/70 bg-muted/10 p-4 shadow-sm sm:p-5"
          >
            <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div class="min-w-0 flex-1 space-y-3">
                <div class="flex flex-wrap items-center gap-2">
                  <Badge :variant="getStatusVariant(item)">
                    {{ getStatusLabel(item) }}
                  </Badge>
                  <span class="text-xs text-muted-foreground">
                    公開: {{ formatDate(item.publishAt) }}
                  </span>
                </div>

                <h3 class="text-lg font-semibold text-foreground">
                  {{ item.title }}
                </h3>

                <div class="rounded-[1.25rem] border border-border/70 bg-background/80 p-4">
                  <p class="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                    {{ item.body }}
                  </p>
                </div>
              </div>

              <div class="flex flex-wrap gap-2 xl:w-[220px] xl:justify-end">
                <Button size="sm" variant="outline" @click="editAnnouncement(item)">
                  <Pencil class="size-3" />
                  編集
                </Button>
                <Button size="sm" variant="secondary" @click="toggleVisibility(item)">
                  <EyeOff v-if="item.isVisible" class="size-3" />
                  <Eye v-else class="size-3" />
                  {{ item.isVisible ? '非表示' : '表示' }}
                </Button>
                <Button size="sm" variant="destructive" @click="deleteAnnouncement(item.id)">
                  <Trash2 class="size-3" />
                  削除
                </Button>
              </div>
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  </AppAuthenticatedShell>
</template>
