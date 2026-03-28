import { EventChannel, UserPlan } from '@prisma/client'
import { requireAuth } from '../utils/auth'
import { prisma } from '../utils/prisma'
import { PLAN_LIMITS } from '../utils/plan-limits'

type ReplyRuleBody = {
  channel?: string
  keyword?: string
  replyText?: string
  priority?: number
  isActive?: boolean
}

function parseChannel(channel: string | undefined): EventChannel {
  if (channel === 'DM' || channel === 'COMMENT') {
    return channel
  }

  throw createError({ statusCode: 400, statusMessage: 'チャネルはDMまたはCOMMENTを指定してください' })
}

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody<ReplyRuleBody>(event)
  const keyword = body.keyword?.trim() || ''
  const replyText = body.replyText?.trim() || ''
  const channel = parseChannel(body.channel?.toUpperCase())
  const priority = Number.isFinite(body.priority) ? Number(body.priority) : 100

  if (!keyword) {
    throw createError({ statusCode: 400, statusMessage: 'キーワードは必須です' })
  }

  if (!replyText) {
    throw createError({ statusCode: 400, statusMessage: '返信内容を入力してください' })
  }

  const [userInfo, ruleCount] = await Promise.all([
    prisma.user.findUnique({ where: { id: user.id }, select: { plan: true } }),
    prisma.replyRule.count({ where: { userId: user.id } })
  ])

  const ruleLimit = PLAN_LIMITS[userInfo?.plan ?? UserPlan.FREE].ruleLimit
  if (ruleLimit !== null && ruleCount >= ruleLimit) {
    throw createError({
      statusCode: 403,
      statusMessage: `Freeプランでは返信ルールを${ruleLimit}件までしか登録できません。Proプランにアップグレードしてください。`
    })
  }

  const rule = await prisma.replyRule.create({
    data: {
      userId: user.id,
      channel,
      keyword,
      replyText,
      priority,
      isActive: body.isActive ?? true
    }
  })

  return {
    message: '返信ルールを追加しました',
    rule
  }
})
