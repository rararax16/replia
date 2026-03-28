<script setup lang="ts">
import { ArrowLeft, LoaderCircle } from 'lucide-vue-next'

const { showSuccess: setNotice, showError: setError } = useSnackbar()

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

const submitting = ref(false)

const { data, error } = await useFetch(`/api/users/${id}`)

const userData = computed(() => (data.value as any)?.user)

if (error.value || !userData.value) {
  throw createError({ statusCode: 404, message: 'ユーザーが見つかりません' })
}

const form = reactive({
  email: userData.value.email as string,
  role: userData.value.role as UserRole,
  enabled: Boolean(userData.value.enabled),
  password: '',
  plan: userData.value.plan as UserPlan,
  planExpiresAt: userData.value.planExpiresAt
    ? (userData.value.planExpiresAt as string).slice(0, 10)
    : '',
  planAutoRenew: Boolean(userData.value.planAutoRenew)
})

watch(data, (newData) => {
  const u = (newData as any)?.user
  if (!u) return
  form.enabled = Boolean(u.enabled)
  form.planAutoRenew = Boolean(u.planAutoRenew)
})

async function save() {
  submitting.value = true
  try {
    const userBody: Record<string, any> = {
      email: form.email,
      role: form.role,
      enabled: form.enabled
    }
    if (form.password) {
      userBody.password = form.password
    }

    await Promise.all([
      $fetch(`/api/users/${id}`, { method: 'PUT', body: userBody }),
      $fetch(`/api/admin/plans/${id}`, {
        method: 'PATCH',
        body: {
          plan: form.plan,
          planExpiresAt: form.planExpiresAt || null,
          planAutoRenew: form.planAutoRenew
        }
      })
    ])

    form.password = ''
    setNotice('ユーザー情報を保存しました')
  }
  catch (e: any) {
    setError(e?.data?.message || e?.data?.statusMessage || '保存に失敗しました')
  }
  finally {
    submitting.value = false
  }
}

async function resetStripeSubscription() {
  if (!confirm('Stripeサブスクリプション情報をリセットしますか？（テスト用）')) return
  try {
    await $fetch(`/api/admin/plans/${id}`, {
      method: 'PATCH',
      body: { plan: 'FREE', planAutoRenew: false, planExpiresAt: null, resetStripeSubscription: true }
    })
    form.plan = 'FREE'
    form.planAutoRenew = false
    form.planExpiresAt = ''
    setNotice('Stripeサブスクリプション情報をリセットしました')
  }
  catch (e: any) {
    setError(e?.data?.message || e?.data?.statusMessage || 'リセットに失敗しました')
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

    <form class="grid gap-6 xl:grid-cols-2" @submit.prevent="save">
      <!-- ユーザー情報 -->
      <Card class="border-white/70 bg-white/85 shadow-[0_30px_90px_-48px_rgba(15,23,42,0.35)] backdrop-blur">
        <CardHeader class="gap-2">
          <CardTitle class="text-2xl">
            ユーザー情報
          </CardTitle>
          <CardDescription>メールアドレス・ロール・パスワードを変更できます。</CardDescription>
        </CardHeader>
        <CardContent class="space-y-5">
          <div class="space-y-2">
            <Label for="email">メールアドレス</Label>
            <Input id="email" v-model="form.email" type="email" required />
          </div>
          <div class="space-y-2">
            <Label for="role">ロール</Label>
            <Select v-model="form.role">
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
            <Switch v-model:checked="form.enabled" />
            <Label>アカウント有効</Label>
          </div>
          <div class="space-y-2">
            <Label for="password">パスワード</Label>
            <AppPasswordInput
              id="password"
              v-model="form.password"
              autocomplete="new-password"
              toggle-label="パスワード"
              placeholder="変更しない場合は空欄"
            />
          </div>
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
        <CardContent class="space-y-5">
          <div class="rounded-[1.5rem] border border-border/70 bg-muted/20 p-4 space-y-3">
            <p class="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              現在のステータス
            </p>
            <div class="flex flex-wrap gap-2 items-center">
              <Badge :variant="form.plan === 'PRO' ? 'default' : 'secondary'">
                {{ form.plan === 'PRO' ? 'Proプラン' : 'Freeプラン' }}
              </Badge>
              <template v-if="form.plan === 'PRO'">
                <Badge v-if="form.planAutoRenew" variant="default" class="bg-green-600">
                  自動更新 ON
                </Badge>
                <Badge v-else variant="outline">
                  自動更新 OFF
                </Badge>
              </template>
            </div>
            <p v-if="form.plan === 'PRO' && form.planAutoRenew" class="text-sm text-muted-foreground">
              Stripeサブスクリプションにより自動で更新されます
            </p>
            <p v-else-if="form.plan === 'PRO' && form.planExpiresAt" class="text-sm text-muted-foreground">
              有効期限: <span class="font-medium text-foreground">{{ form.planExpiresAt }}</span> まで
            </p>
            <p v-else-if="form.plan === 'PRO'" class="text-sm text-muted-foreground">
              有効期限の設定なし
            </p>
          </div>

          <div class="space-y-2">
            <Label for="plan">プラン</Label>
            <Select v-model="form.plan">
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
            <Input id="expires" v-model="form.planExpiresAt" type="date" />
          </div>
          <div class="flex items-center gap-3">
            <Switch v-model:checked="form.planAutoRenew" />
            <Label>自動更新</Label>
          </div>
        </CardContent>
      </Card>

      <div class="xl:col-span-2 flex items-center justify-between">
        <Button type="button" variant="ghost" class="text-xs text-muted-foreground" @click="resetStripeSubscription">
          Stripeリセット（テスト用）
        </Button>
        <Button type="submit" :disabled="submitting">
          <LoaderCircle v-if="submitting" class="size-4 animate-spin" />
          保存する
        </Button>
      </div>
    </form>
  </AppAuthenticatedShell>
</template>
