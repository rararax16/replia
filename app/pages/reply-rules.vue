<script setup lang="ts">
import type { EventChannel } from '@prisma/client'
import { CheckCircle2, CircleAlert, MessageSquareText, RefreshCcw, Sparkles, Zap } from 'lucide-vue-next'
import { getChannelLabel } from '@/lib/replia-ui'

definePageMeta({
  middleware: 'auth'
})

useHead({
  title: '返信ルール | Replia'
})

type ReplyRule = {
  id: string
  channel: EventChannel
  keyword: string
  replyText: string
  priority: number
  isActive: boolean
  createdAt: string
}

const notice = ref('')
const errorMessage = ref('')
const savingRule = ref(false)
const refreshing = ref(false)
const editingRuleId = ref<string | null>(null)

const FREE_RULE_LIMIT = 2

const { data: rulesData, refresh: refreshRules } = useFetch('/api/reply-rules')
const { data: billingData } = useFetch('/api/billing')
const rules = computed<ReplyRule[]>(() => rulesData.value?.rules || [])
const activeRulesCount = computed(() => rules.value.filter((rule) => rule.isActive).length)
const dmRulesCount = computed(() => rules.value.filter((rule) => rule.channel === 'DM').length)
const commentRulesCount = computed(() => rules.value.filter((rule) => rule.channel === 'COMMENT').length)
const currentPlan = computed(() => (billingData.value as any)?.plan ?? 'FREE')
const isAtRuleLimit = computed(() => currentPlan.value === 'FREE' && rules.value.length >= FREE_RULE_LIMIT)

const ruleForm = reactive({
  channel: 'DM' as EventChannel,
  keyword: '',
  replyText: '',
  priority: 100,
  isActive: true
})

function setNotice(message: string) {
  notice.value = message
  errorMessage.value = ''
}

function setError(message: string) {
  errorMessage.value = message
  notice.value = ''
}

function resetRuleForm() {
  editingRuleId.value = null
  ruleForm.channel = 'DM'
  ruleForm.keyword = ''
  ruleForm.replyText = ''
  ruleForm.priority = 100
  ruleForm.isActive = true
}

async function refreshPage() {
  refreshing.value = true

  try {
    await refreshRules()
    setNotice('返信ルール一覧を更新しました')
  }
  catch (error: any) {
    setError(error?.data?.statusMessage || '返信ルール一覧の更新に失敗しました')
  }
  finally {
    refreshing.value = false
  }
}

async function saveRule() {
  savingRule.value = true

  try {
    if (editingRuleId.value) {
      await $fetch(`/api/reply-rules/${editingRuleId.value}`, {
        method: 'PUT',
        body: ruleForm
      })
      setNotice('返信ルールを更新しました')
    }
    else {
      await $fetch('/api/reply-rules', {
        method: 'POST',
        body: ruleForm
      })
      setNotice('返信ルールを追加しました')
    }

    resetRuleForm()
    await refreshRules()
  }
  catch (error: any) {
    setError(error?.data?.statusMessage || '返信ルールの保存に失敗しました')
  }
  finally {
    savingRule.value = false
  }
}

function editRule(rule: ReplyRule) {
  editingRuleId.value = rule.id
  ruleForm.channel = rule.channel
  ruleForm.keyword = rule.keyword
  ruleForm.replyText = rule.replyText
  ruleForm.priority = rule.priority
  ruleForm.isActive = rule.isActive
}

async function toggleRule(rule: ReplyRule) {
  try {
    await $fetch(`/api/reply-rules/${rule.id}`, {
      method: 'PUT',
      body: {
        isActive: !rule.isActive
      }
    })
    setNotice('ルールの有効状態を更新しました')
    await refreshRules()
  }
  catch (error: any) {
    setError(error?.data?.statusMessage || '有効状態の更新に失敗しました')
  }
}

async function deleteRule(ruleId: string) {
  if (!confirm('このルールを削除しますか？')) {
    return
  }

  try {
    await $fetch(`/api/reply-rules/${ruleId}`, {
      method: 'DELETE'
    })
    setNotice('返信ルールを削除しました')
    await refreshRules()
  }
  catch (error: any) {
    setError(error?.data?.statusMessage || '返信ルールの削除に失敗しました')
  }
}

function updateRulePriority(value: string | number) {
  const nextValue = Number(value)
  ruleForm.priority = Number.isFinite(nextValue) ? nextValue : 0
}
</script>

<template>
  <AppAuthenticatedShell
    title="返信ルール管理"
    description="キーワード、優先度、チャネルごとに自動返信ルールを整理し、登録済みルールの更新や無効化もここで行います。"
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
              総ルール数
            </p>
            <p class="mt-2 text-3xl font-bold tracking-tight text-foreground">
              {{ rules.length }}件
            </p>
          </div>
          <div class="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <MessageSquareText class="size-5" />
          </div>
        </div>
      </div>

      <div class="rounded-[1.5rem] border border-border/70 bg-muted/25 p-5">
        <p class="text-sm font-medium text-muted-foreground">
          有効ルール
        </p>
        <p class="mt-2 text-3xl font-bold tracking-tight text-foreground">
          {{ activeRulesCount }}件
        </p>
        <p class="mt-4 text-sm text-muted-foreground">
          停止中 {{ rules.length - activeRulesCount }}件
        </p>
      </div>

      <div class="rounded-[1.5rem] border border-border/70 bg-muted/25 p-5">
        <p class="text-sm font-medium text-muted-foreground">
          チャネル内訳
        </p>
        <p class="mt-2 text-lg font-bold tracking-tight text-foreground">
          DM {{ dmRulesCount }}件 / コメント {{ commentRulesCount }}件
        </p>
        <p class="mt-4 text-sm text-muted-foreground">
          優先度の高い順にマッチ判定されます
        </p>
      </div>
    </template>

    <Alert v-if="notice">
      <CheckCircle2 class="size-4" />
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
              {{ editingRuleId ? 'ルール編集' : 'ルール追加' }}
            </CardTitle>
            <Badge v-if="editingRuleId" variant="secondary">
              編集中
            </Badge>
          </div>
          <CardDescription class="leading-6">
            登録したキーワードに一致した場合、優先度順で自動返信します。
          </CardDescription>
          <div v-if="isAtRuleLimit && !editingRuleId" class="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-2">
            <p class="text-sm font-medium text-amber-800">
              Freeプランのルール上限（{{ FREE_RULE_LIMIT }}件）に達しています
            </p>
            <a
              href="mailto:support@replia.jp"
              class="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Zap class="size-3" />
              Proプランにアップグレード
            </a>
          </div>
        </CardHeader>
        <CardContent>
          <form class="space-y-5" @submit.prevent="saveRule">
            <div class="grid gap-4 sm:grid-cols-[180px_140px]">
              <div class="space-y-2">
                <Label for="rule-channel">チャネル</Label>
                <Select v-model="ruleForm.channel">
                  <SelectTrigger id="rule-channel">
                    <SelectValue placeholder="チャネルを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DM">
                      DM
                    </SelectItem>
                    <SelectItem value="COMMENT">
                      コメント
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div class="space-y-2">
                <Label for="rule-priority">優先度</Label>
                <Input
                  id="rule-priority"
                  type="number"
                  :model-value="String(ruleForm.priority)"
                  @update:model-value="updateRulePriority"
                />
              </div>
            </div>

            <div class="space-y-2">
              <Label for="rule-keyword">キーワード</Label>
              <Input
                id="rule-keyword"
                v-model="ruleForm.keyword"
                type="text"
                placeholder="資料"
                required
              />
            </div>

            <div class="space-y-2">
              <Label for="rule-reply">返信内容</Label>
              <Textarea
                id="rule-reply"
                v-model="ruleForm.replyText"
                rows="4"
                placeholder="お問い合わせありがとうございます。"
                required
              />
            </div>

            <div class="flex flex-col gap-4 rounded-[1.5rem] border border-border/70 bg-muted/25 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div class="space-y-1">
                <p class="font-medium text-foreground">
                  このルールを有効にする
                </p>
                <p class="text-sm text-muted-foreground">
                  無効にすると条件を残したまま返信対象から外れます。
                </p>
              </div>
              <Switch v-model:checked="ruleForm.isActive" aria-label="ルールの有効化切替" />
            </div>

            <div class="flex flex-wrap gap-3">
              <Button type="submit" :disabled="savingRule || (isAtRuleLimit && !editingRuleId)">
                <Sparkles class="size-4" />
                {{ savingRule ? '保存中...' : editingRuleId ? 'ルール更新' : 'ルール追加' }}
              </Button>
              <Button
                v-if="editingRuleId"
                type="button"
                variant="outline"
                @click="resetRuleForm"
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
            登録済みルール
          </CardTitle>
          <CardDescription class="leading-6">
            優先度の高い順に、状態と返信内容までまとめて確認できます。
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="flex flex-wrap gap-3 rounded-[1.5rem] border border-border/70 bg-muted/20 p-4">
            <Badge variant="outline">
              優先度順で判定
            </Badge>
            <Badge variant="outline">
              有効 {{ activeRulesCount }}件
            </Badge>
            <Badge variant="outline">
              停止中 {{ rules.length - activeRulesCount }}件
            </Badge>
          </div>

          <div v-if="rules.length === 0" class="rounded-[1.5rem] border border-dashed border-border/70 bg-muted/10 p-8 text-center text-sm text-muted-foreground">
            返信ルールはまだありません
          </div>

          <div v-else class="grid gap-4">
            <section
              v-for="rule in rules"
              :key="rule.id"
              class="rounded-[1.5rem] border border-border/70 bg-muted/10 p-4 shadow-sm sm:p-5"
            >
              <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div class="min-w-0 flex-1 space-y-4">
                  <div class="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">
                      {{ getChannelLabel(rule.channel) }}
                    </Badge>
                    <Badge :variant="rule.isActive ? 'default' : 'secondary'">
                      {{ rule.isActive ? '有効' : '無効' }}
                    </Badge>
                    <Badge variant="secondary">
                      優先度 {{ rule.priority }}
                    </Badge>
                  </div>

                  <div class="space-y-2">
                    <p class="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      キーワード
                    </p>
                    <p class="break-words text-lg font-semibold leading-7 text-foreground">
                      {{ rule.keyword }}
                    </p>
                  </div>

                  <div class="rounded-[1.25rem] border border-border/70 bg-background/80 p-4">
                    <p class="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      返信内容
                    </p>
                    <p class="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-muted-foreground">
                      {{ rule.replyText }}
                    </p>
                  </div>
                </div>

                <div class="flex flex-wrap gap-2 xl:w-[220px] xl:justify-end">
                  <Button size="sm" variant="outline" @click="editRule(rule)">
                    編集
                  </Button>
                  <Button size="sm" variant="secondary" @click="toggleRule(rule)">
                    {{ rule.isActive ? '無効化' : '有効化' }}
                  </Button>
                  <Button size="sm" variant="destructive" @click="deleteRule(rule.id)">
                    削除
                  </Button>
                </div>
              </div>
            </section>
          </div>
        </CardContent>
      </Card>
    </div>
  </AppAuthenticatedShell>
</template>
