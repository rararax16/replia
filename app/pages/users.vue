<script setup lang="ts">
import { ArrowLeft, CircleAlert, LoaderCircle, RefreshCcw, ShieldCheck, UserPlus, Users } from 'lucide-vue-next'

definePageMeta({
  middleware: 'admin'
})

useHead({
  title: 'ユーザーマスター | Replia'
})

type UserRole = 'ADMIN' | 'MEMBER'

type UserRow = {
  id: string
  email: string
  role: UserRole
  createdAt: string
  updatedAt: string
}

const notice = ref('')
const errorMessage = ref('')
const submitting = ref(false)
const editingUserId = ref<string | null>(null)
const { data: usersData, refresh: refreshUsers } = useFetch('/api/users')
const users = computed<UserRow[]>(() => usersData.value?.users || [])
const adminCount = computed(() => users.value.filter((user) => user.role === 'ADMIN').length)
const memberCount = computed(() => users.value.filter((user) => user.role === 'MEMBER').length)

const form = reactive<{
  email: string
  password: string
  role: UserRole
}>({
  email: '',
  password: '',
  role: 'MEMBER'
})

function setNotice(message: string) {
  notice.value = message
  errorMessage.value = ''
}

function setError(message: string) {
  errorMessage.value = message
  notice.value = ''
}

function resetForm() {
  editingUserId.value = null
  form.email = ''
  form.password = ''
  form.role = 'MEMBER'
}

function editUser(user: UserRow) {
  editingUserId.value = user.id
  form.email = user.email
  form.password = ''
  form.role = user.role
}

async function saveUser() {
  submitting.value = true

  try {
    if (editingUserId.value) {
      const body: {
        email?: string
        password?: string
        role?: UserRole
      } = {
        email: form.email,
        role: form.role
      }

      if (form.password) {
        body.password = form.password
      }

      await $fetch(`/api/users/${editingUserId.value}`, {
        method: 'PUT',
        body
      })
      setNotice('ユーザー情報を更新しました')
    }
    else {
      await $fetch('/api/users', {
        method: 'POST',
        body: {
          email: form.email,
          password: form.password,
          role: form.role
        }
      })
      setNotice('ユーザーを作成しました')
    }

    resetForm()
    await refreshUsers()
  }
  catch (error: any) {
    setError(error?.data?.message || error?.data?.statusMessage || 'ユーザー操作に失敗しました')
  }
  finally {
    submitting.value = false
  }
}

async function deleteUser(user: UserRow) {
  if (!confirm(`${user.email} を削除しますか？`)) {
    return
  }

  try {
    await $fetch(`/api/users/${user.id}`, {
      method: 'DELETE'
    })
    setNotice('ユーザーを削除しました')
    await refreshUsers()
  }
  catch (error: any) {
    setError(error?.data?.message || error?.data?.statusMessage || 'ユーザー削除に失敗しました')
  }
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('ja-JP')
}

function getRoleLabel(role: UserRole) {
  return role === 'ADMIN' ? '管理者' : '一般'
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
                    システム管理者専用
                  </Badge>
                  <Badge variant="secondary" class="rounded-full px-3 py-1">
                    全ユーザーの作成・更新・削除
                  </Badge>
                </div>
                <div class="space-y-2">
                  <h1 class="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                    ユーザーマスター
                  </h1>
                  <p class="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
                    ロール管理とアカウント発行を shadcn ベースの管理 UI に統一し、一覧と編集フォームを分かりやすく整理しました。
                  </p>
                </div>
              </div>
            </div>

            <Button as-child variant="outline">
              <NuxtLink to="/dashboard">
                <ArrowLeft class="size-4" />
                ダッシュボードへ戻る
              </NuxtLink>
            </Button>
          </div>

          <div class="grid gap-4 md:grid-cols-3">
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
              <div class="flex items-center justify-between gap-4">
                <div>
                  <p class="text-sm font-medium text-muted-foreground">
                    管理者
                  </p>
                  <p class="mt-2 text-3xl font-bold tracking-tight text-foreground">
                    {{ adminCount }}件
                  </p>
                </div>
                <div class="flex size-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
                  <ShieldCheck class="size-5" />
                </div>
              </div>
            </div>

            <div class="rounded-[1.5rem] border border-border/70 bg-muted/25 p-5">
              <div class="flex items-center justify-between gap-4">
                <div>
                  <p class="text-sm font-medium text-muted-foreground">
                    一般ユーザー
                  </p>
                  <p class="mt-2 text-3xl font-bold tracking-tight text-foreground">
                    {{ memberCount }}件
                  </p>
                </div>
                <div class="flex size-11 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-700">
                  <UserPlus class="size-5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Alert v-if="notice">
        <ShieldCheck class="size-4" />
        <AlertTitle>操作が完了しました</AlertTitle>
        <AlertDescription>{{ notice }}</AlertDescription>
      </Alert>

      <Alert v-if="errorMessage" variant="destructive">
        <CircleAlert class="size-4" />
        <AlertTitle>処理に失敗しました</AlertTitle>
        <AlertDescription>{{ errorMessage }}</AlertDescription>
      </Alert>

      <div class="grid gap-6 xl:grid-cols-[420px_1fr]">
        <Card class="border-white/70 bg-white/85 shadow-[0_30px_90px_-48px_rgba(15,23,42,0.35)] backdrop-blur">
          <CardHeader class="gap-3">
            <div class="flex items-center gap-2">
              <CardTitle class="text-2xl">
                {{ editingUserId ? 'ユーザー編集' : 'ユーザー作成' }}
              </CardTitle>
              <Badge v-if="editingUserId" variant="secondary">
                編集中
              </Badge>
            </div>
            <CardDescription class="leading-6">
              ログイン情報とロールを設定します。既存ユーザー編集時、パスワード変更が不要なら空欄のままで構いません。
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form class="space-y-5" @submit.prevent="saveUser">
              <div class="space-y-2">
                <Label for="user-email">メールアドレス</Label>
                <Input
                  id="user-email"
                  v-model="form.email"
                  type="email"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div class="space-y-2">
                <Label for="user-role">ロール</Label>
                <Select v-model="form.role">
                  <SelectTrigger id="user-role">
                    <SelectValue placeholder="ロールを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MEMBER">
                      一般
                    </SelectItem>
                    <SelectItem value="ADMIN">
                      管理者
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div class="space-y-2">
                <Label for="user-password">パスワード</Label>
                <Input
                  id="user-password"
                  v-model="form.password"
                  type="password"
                  :placeholder="editingUserId ? '変更しない場合は空欄' : '8文字以上'"
                  :required="!editingUserId"
                />
              </div>

              <div class="flex flex-wrap gap-3">
                <Button type="submit" :disabled="submitting">
                  <LoaderCircle v-if="submitting" class="size-4 animate-spin" />
                  {{ submitting ? '保存中...' : editingUserId ? '更新する' : '作成する' }}
                </Button>
                <Button
                  v-if="editingUserId"
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
          <CardHeader class="gap-4">
            <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div class="space-y-2">
                <CardTitle class="text-2xl">
                  ユーザー一覧
                </CardTitle>
                <CardDescription class="leading-6">
                  登録済みユーザーを作成日時順に表示しています。
                </CardDescription>
              </div>
              <Button size="sm" variant="outline" @click="refreshUsers">
                <RefreshCcw class="size-4" />
                再読み込み
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <div class="overflow-hidden rounded-[1.5rem] border border-border/70">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>メールアドレス</TableHead>
                    <TableHead class="w-32">ロール</TableHead>
                    <TableHead class="w-44">作成日時</TableHead>
                    <TableHead class="w-44">更新日時</TableHead>
                    <TableHead class="w-[220px]">操作</TableHead>
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
                    <TableCell class="text-sm text-muted-foreground">
                      {{ formatDate(user.createdAt) }}
                    </TableCell>
                    <TableCell class="text-sm text-muted-foreground">
                      {{ formatDate(user.updatedAt) }}
                    </TableCell>
                    <TableCell>
                      <div class="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" @click="editUser(user)">
                          編集
                        </Button>
                        <Button size="sm" variant="destructive" @click="deleteUser(user)">
                          削除
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableEmpty v-if="users.length === 0" :colspan="5">
                    ユーザーはまだ登録されていません
                  </TableEmpty>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </main>
</template>
