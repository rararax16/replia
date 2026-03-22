<script setup lang="ts">
import { ArrowLeft, CircleAlert, LoaderCircle, ShieldCheck } from 'lucide-vue-next'

definePageMeta({
  middleware: 'admin'
})

type UserRole = 'ADMIN' | 'MEMBER'
type UserPlan = 'FREE' | 'PRO'

const route = useRoute()
const id = route.params.id as string

useHead({
  title: 'ユーザー編集 | Replia'
})

const notice = ref('')
const errorMessage = ref('')
const submitting = ref(false)

const { data, error } = await useFetch(`/api/users/${id}`)
const userData = computed(() => (data.value as any)?.user)

if (error.value || !userData.value) {
  throw createError({ statusCode: 404, message: 'ユーザーが見つかりません' })
}

const userForm = reactive({
  email: userData.value.email as string,
  role: userData.value.role as UserRole,
  enabled: userData.value.enabled as boolean,
  password: ''
})

const planForm = reactive({
  plan: userData.value.plan as UserPlan,
  planExpiresAt: userData.value.planExpiresAt
    ? (userData.value.planExpiresAt as string).slice(0, 10)
    : '',
  planAutoRenew: userData.value.planAutoRenew as boolean
})

function setNotice(message: string) {
  notice.value = message
  errorMessage.value = ''
}

function setError(message: string) {
  errorMessage.value = message
  notice.value = ''
}

async function saveUserInfo() {
  submitting.value = true
  try {
    const body: Record<string, any> = {
      email: userForm.email,
      role: userForm.role,
      enabled: userForm.enabled
    }
    if (userForm.password) {
      body.password = userForm.password
    }
    await $fetch(`/api/users/${id}`, { method: 'PUT', body })
    userForm.password = ''
    setNotice('ユーザー情報を更新しました')
  }
  catch (e: any) {
    setError(e?.data?.message || e?.data?.statusMessage || 'ユーザー情報の更新に失敗しました')
  }
  finally {
    submitting.value = false
  }
}

async function saveUserPlan() {
  submitting.value = true
  try {
    await $fetch(`/api/admin/plans/${id}`, {
      method: 'PATCH',
      body: {
        plan: planForm.plan,
        planExpiresAt: planForm.planExpiresAt || null,
        planAutoRenew: planForm.planAutoRenew
      }
    })
    setNotice('プランを更新しました')
  }
  catch (e: any) {
    setError(e?.data?.message || e?.data?.statusMessage || 'プランの更新に失敗しました')
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <AppAuthenticatedShell
    :title="userData.email"
    description="ユーザー情報とプランを編集します。"
  >
    <template #badges>
      <Badge variant="secondary" class="rounded-full px-3 py-1">
        管理者専用
      </Badge>
    </template>

    <template #actions>
      <Button variant="outline" as-child>
        <NuxtLink to="/users">
          <ArrowLeft class="size-4" />
          一覧に戻る
        </NuxtLink>
      </Button>
    </template>

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

    <div class="grid gap-6 xl:grid-cols-2">
      <!-- ユーザー情報 -->
      <Card class="border-white/70 bg-white/85 shadow-[0_30px_90px_-48px_rgba(15,23,42,0.35)] backdrop-blur">
        <CardHeader class="gap-2">
          <CardTitle class="text-2xl">
            ユーザー情報
          </CardTitle>
          <CardDescription>メールアドレス・ロール・パスワードを変更できます。</CardDescription>
        </CardHeader>
        <CardContent>
          <form class="space-y-5" @submit.prevent="saveUserInfo">
            <div class="space-y-2">
              <Label for="email">メールアドレス</Label>
              <Input id="email" v-model="userForm.email" type="email" required />
            </div>
            <div class="space-y-2">
              <Label for="role">ロール</Label>
              <Select v-model="userForm.role">
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MEMBER">一般</SelectItem>
                  <SelectItem value="ADMIN">管理者</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="flex items-center gap-3">
              <Switch v-model:checked="userForm.enabled" />
              <Label>アカウント有効</Label>
            </div>
            <div class="space-y-2">
              <Label for="password">パスワード</Label>
              <AppPasswordInput
                id="password"
                v-model="userForm.password"
                autocomplete="new-password"
                toggle-label="パスワード"
                placeholder="変更しない場合は空欄"
              />
            </div>
            <Button type="submit" :disabled="submitting">
              <LoaderCircle v-if="submitting" class="size-4 animate-spin" />
              保存する
            </Button>
          </form>
        </CardContent>
      </Card>

      <!-- プラン管理 -->
      <Card class="border-white/70 bg-white/85 shadow-[0_30px_90px_-48px_rgba(15,23,42,0.35)] backdrop-blur">
        <CardHeader class="gap-2">
          <CardTitle class="text-2xl">
            プラン管理
          </CardTitle>
          <CardDescription>プラン・有効期限・自動更新を変更できます。</CardDescription>
        </CardHeader>
        <CardContent>
          <form class="space-y-5" @submit.prevent="saveUserPlan">
            <div class="space-y-2">
              <Label for="plan">プラン</Label>
              <Select v-model="planForm.plan">
                <SelectTrigger id="plan">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FREE">Free</SelectItem>
                  <SelectItem value="PRO">Pro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="space-y-2">
              <Label for="expires">有効期限</Label>
              <Input id="expires" v-model="planForm.planExpiresAt" type="date" />
            </div>
            <div class="flex items-center gap-3">
              <Switch v-model:checked="planForm.planAutoRenew" />
              <Label>自動更新</Label>
            </div>
            <Button type="submit" :disabled="submitting">
              <LoaderCircle v-if="submitting" class="size-4 animate-spin" />
              保存する
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  </AppAuthenticatedShell>
</template>
