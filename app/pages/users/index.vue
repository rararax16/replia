<script setup lang="ts">
import { ExternalLink, LoaderCircle, RefreshCcw, UserPlus, Users } from 'lucide-vue-next'

const { showSuccess: setNotice, showError: setError } = useSnackbar()
import { formatDate } from '@/lib/replia-ui'

definePageMeta({
  middleware: 'admin'
})

useHead({
  title: 'ユーザーマスター | Replia'
})

type UserRole = 'ADMIN' | 'MEMBER'
type UserPlan = 'FREE' | 'PRO'

type UserRow = {
  id: string
  email: string
  role: UserRole
  plan: UserPlan
  planAutoRenew: boolean
  planExpiresAt: string | null
  enabled: boolean
  createdAt: string
}

const submitting = ref(false)
const refreshing = ref(false)
const showCreateForm = ref(false)
const { data: usersData, refresh: refreshUsers } = useFetch('/api/users')
const users = computed<UserRow[]>(() => (usersData.value as any)?.users || [])
const adminCount = computed(() => users.value.filter((u) => u.role === 'ADMIN').length)
const memberCount = computed(() => users.value.filter((u) => u.role === 'MEMBER').length)

const form = reactive({
  email: '',
  password: '',
  role: 'MEMBER' as UserRole
})

function resetForm() {
  form.email = ''
  form.password = ''
  form.role = 'MEMBER'
  showCreateForm.value = false
}

async function refreshPage() {
  refreshing.value = true
  try {
    await refreshUsers()
    setNotice('一覧を更新しました')
  }
  catch (error: any) {
    setError(error?.data?.message || error?.data?.statusMessage || '一覧の更新に失敗しました')
  }
  finally {
    refreshing.value = false
  }
}

async function createUser() {
  submitting.value = true
  try {
    await $fetch('/api/users', {
      method: 'POST',
      body: {
        email: form.email,
        password: form.password,
        role: form.role
      }
    })
    setNotice('ユーザーを作成しました')
    resetForm()
    await refreshUsers()
  }
  catch (error: any) {
    setError(error?.data?.message || error?.data?.statusMessage || 'ユーザー作成に失敗しました')
  }
  finally {
    submitting.value = false
  }
}

async function toggleEnabled(user: UserRow) {
  const action = user.enabled ? '無効化' : '有効化'
  if (!confirm(`${user.email} を${action}しますか？`)) return
  try {
    await $fetch(`/api/users/${user.id}`, { method: 'PUT', body: { enabled: !user.enabled } })
    setNotice(`ユーザーを${action}しました`)
    await refreshUsers()
  }
  catch (error: any) {
    setError(error?.data?.message || error?.data?.statusMessage || `ユーザーの${action}に失敗しました`)
  }
}

async function deleteUser(user: UserRow) {
  if (!confirm(`${user.email} を削除しますか？`)) return
  try {
    await $fetch(`/api/users/${user.id}`, { method: 'DELETE' })
    setNotice('ユーザーを削除しました')
    await refreshUsers()
  }
  catch (error: any) {
    setError(error?.data?.message || error?.data?.statusMessage || 'ユーザー削除に失敗しました')
  }
}

function getPlanLabel(plan: UserPlan) {
  return plan === 'PRO' ? 'Pro' : 'Free'
}

function getRoleLabel(role: UserRole) {
  return role === 'ADMIN' ? '管理者' : '一般'
}
</script>

<template>
  <AppAuthenticatedShell
    title="ユーザーマスター"
    description="管理者ユーザーのみが利用できる画面です。"
  >
    <template #badges>
      <Badge variant="secondary" class="rounded-full px-3 py-1">
        管理者専用
      </Badge>
    </template>

    <template #actions>
      <Button variant="outline" :disabled="refreshing" @click="refreshPage">
        <RefreshCcw class="size-4" :class="{ 'animate-spin': refreshing }" />
        再読み込み
      </Button>
      <Button @click="showCreateForm = !showCreateForm">
        <UserPlus class="size-4" />
        ユーザー追加
      </Button>
    </template>

    <template #hero>
      <div class="rounded-[1.5rem] border border-border/70 bg-muted/25 p-5">
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="text-sm font-medium text-muted-foreground">
              総ユーザー数
            </p>
            <p class="mt-2 text-3xl font-bold tracking-tight text-foreground">
              {{ users.length }}件
            </p>
          </div>
          <div class="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Users class="size-5" />
          </div>
        </div>
      </div>

      <div class="rounded-[1.5rem] border border-border/70 bg-muted/25 p-5">
        <p class="text-sm font-medium text-muted-foreground">
          管理者
        </p>
        <p class="mt-2 text-3xl font-bold tracking-tight text-foreground">
          {{ adminCount }}件
        </p>
      </div>

      <div class="rounded-[1.5rem] border border-border/70 bg-muted/25 p-5">
        <p class="text-sm font-medium text-muted-foreground">
          一般ユーザー
        </p>
        <p class="mt-2 text-3xl font-bold tracking-tight text-foreground">
          {{ memberCount }}件
        </p>
      </div>
    </template>

    <!-- ユーザー追加フォーム -->
    <Card v-if="showCreateForm" class="border-white/70 bg-white/85 shadow-[0_30px_90px_-48px_rgba(15,23,42,0.35)] backdrop-blur">
      <CardHeader class="gap-2">
        <CardTitle class="text-2xl">
          ユーザー追加
        </CardTitle>
        <CardDescription>新しいユーザーのログイン情報とロールを設定します。</CardDescription>
      </CardHeader>
      <CardContent>
        <form class="grid gap-5 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end" @submit.prevent="createUser">
          <div class="space-y-2">
            <Label for="new-email">メールアドレス</Label>
            <Input id="new-email" v-model="form.email" type="email" placeholder="you@example.com" required />
          </div>
          <div class="space-y-2">
            <Label for="new-role">ロール</Label>
            <Select v-model="form.role">
              <SelectTrigger id="new-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEMBER">一般</SelectItem>
                <SelectItem value="ADMIN">管理者</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-2">
            <Label for="new-password">パスワード</Label>
            <AppPasswordInput
              id="new-password"
              v-model="form.password"
              autocomplete="new-password"
              toggle-label="新規パスワード"
              placeholder="8文字以上"
              required
            />
          </div>
          <div class="flex gap-2">
            <Button type="submit" :disabled="submitting">
              <LoaderCircle v-if="submitting" class="size-4 animate-spin" />
              作成する
            </Button>
            <Button type="button" variant="outline" @click="resetForm">
              キャンセル
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>

    <!-- ユーザー一覧テーブル -->
    <Card class="border-white/70 bg-white/85 shadow-[0_30px_90px_-48px_rgba(15,23,42,0.35)] backdrop-blur">
      <CardHeader class="gap-2">
        <CardTitle class="text-2xl">
          ユーザー一覧
        </CardTitle>
        <CardDescription>登録済みユーザーの一覧です。</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="overflow-hidden rounded-[1.5rem] border border-border/70">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>メールアドレス</TableHead>
                <TableHead class="w-28">ロール</TableHead>
                <TableHead class="w-24">プラン</TableHead>
                <TableHead class="w-24">状態</TableHead>
                <TableHead class="w-40">更新・期限</TableHead>
                <TableHead class="w-44">作成日時</TableHead>
                <TableHead class="w-40">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="user in users" :key="user.id">
                <TableCell class="font-medium">
                  {{ user.email }}
                </TableCell>
                <TableCell>
                  <Badge :variant="user.role === 'ADMIN' ? 'default' : 'secondary'">
                    {{ getRoleLabel(user.role) }}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge :variant="user.plan === 'PRO' ? 'default' : 'secondary'">
                    {{ getPlanLabel(user.plan) }}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge :variant="user.enabled ? 'default' : 'outline'">
                    {{ user.enabled ? '有効' : '無効' }}
                  </Badge>
                </TableCell>
                <TableCell class="text-sm">
                  <template v-if="user.plan === 'FREE'">
                    <span class="text-muted-foreground">—</span>
                  </template>
                  <template v-else-if="user.planAutoRenew">
                    <Badge variant="default" class="text-xs">
                      自動更新
                    </Badge>
                  </template>
                  <template v-else-if="user.planExpiresAt">
                    <span class="text-muted-foreground">{{ formatDate(user.planExpiresAt) }} まで</span>
                  </template>
                  <template v-else>
                    <span class="text-muted-foreground">—</span>
                  </template>
                </TableCell>
                <TableCell class="text-sm text-muted-foreground">
                  {{ formatDate(user.createdAt) }}
                </TableCell>
                <TableCell>
                  <div class="flex gap-2">
                    <Button size="sm" variant="outline" as-child>
                      <NuxtLink :to="`/users/${user.id}`">編集</NuxtLink>
                    </Button>
                    <Button v-if="user.plan === 'PRO'" size="sm" variant="outline" as-child>
                      <a
                        :href="`https://dashboard.stripe.com/customers?email=${encodeURIComponent(user.email)}`"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink class="size-3.5" />
                        Stripe
                      </a>
                    </Button>
                    <Button size="sm" :variant="user.enabled ? 'outline' : 'default'" @click="toggleEnabled(user)">
                      {{ user.enabled ? '無効化' : '有効化' }}
                    </Button>
                    <Button size="sm" variant="destructive" @click="deleteUser(user)">
                      削除
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
              <TableEmpty v-if="users.length === 0" :colspan="7">
                ユーザーはまだ登録されていません
              </TableEmpty>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  </AppAuthenticatedShell>
</template>
