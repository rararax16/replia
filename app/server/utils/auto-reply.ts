import { EventChannel, ReplyStatus, UserPlan } from '@prisma/client'
import { prisma } from './prisma'
import { sendInstagramReply } from '../services/instagram.service'
import { PLAN_LIMITS } from './plan-limits'

export type ProcessInboundEventInput = {
  userId: string
  inboundEventId: string
  channel: EventChannel
  senderId: string
  content: string
}

function normalizeText(text: string): string {
  return text.trim().toLowerCase()
}

export async function processInboundEvent(input: ProcessInboundEventInput) {
  const rules = await prisma.replyRule.findMany({
    where: {
      userId: input.userId,
      channel: input.channel,
      isActive: true
    },
    orderBy: [
      { priority: 'desc' },
      { createdAt: 'asc' }
    ]
  })

  const incomingText = normalizeText(input.content)
  const matchedRule = rules.find((rule) => {
    return incomingText.includes(normalizeText(rule.keyword))
  })

  if (!matchedRule) {
    return prisma.outboundReply.create({
      data: {
        userId: input.userId,
        inboundEventId: input.inboundEventId,
        replyText: '',
        status: ReplyStatus.SKIPPED,
        errorMessage: '一致する返信ルールがありませんでした'
      }
    })
  }

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [user, repliesSentThisMonth] = await Promise.all([
    prisma.user.findUnique({ where: { id: input.userId }, select: { plan: true } }),
    prisma.outboundReply.count({
      where: { userId: input.userId, status: ReplyStatus.SENT, createdAt: { gte: startOfMonth } }
    })
  ])

  const plan = user?.plan ?? UserPlan.FREE
  const limit = PLAN_LIMITS[plan].replyLimit

  if (repliesSentThisMonth >= limit) {
    return prisma.outboundReply.create({
      data: {
        userId: input.userId,
        inboundEventId: input.inboundEventId,
        replyText: matchedRule.replyText,
        status: ReplyStatus.SKIPPED,
        errorMessage: `月間自動返信の上限（${limit}件）に達しました。${plan === UserPlan.FREE ? 'Proプランにアップグレードすると3,000件まで送れます。' : ''}`
      }
    })
  }

  const inboundEvent = await prisma.inboundEvent.update({
    where: { id: input.inboundEventId },
    data: { matchedRuleId: matchedRule.id },
    select: {
      externalEventId: true
    }
  })

  const account = await prisma.igAccount.findFirst({
    where: {
      userId: input.userId,
      enabled: true
    },
    orderBy: {
      updatedAt: 'desc'
    }
  })

  if (!account) {
    return prisma.outboundReply.create({
      data: {
        userId: input.userId,
        inboundEventId: input.inboundEventId,
        replyText: matchedRule.replyText,
        status: ReplyStatus.FAILED,
        errorMessage: '有効なInstagram連携アカウントが見つかりません'
      }
    })
  }

  const sendResult = await sendInstagramReply({
    userId: input.userId,
    platformUserId: account.platformUserId,
    recipientId: input.senderId,
    text: matchedRule.replyText,
    channel: input.channel,
    commentId: input.channel === EventChannel.COMMENT ? inboundEvent.externalEventId : undefined
  })

  const replyStatus = sendResult.status === 'SENT'
    ? ReplyStatus.SENT
    : ReplyStatus.FAILED

  return prisma.outboundReply.create({
    data: {
      userId: input.userId,
      inboundEventId: input.inboundEventId,
      replyText: matchedRule.replyText,
      status: replyStatus,
      errorMessage: sendResult.success ? null : (sendResult.message || '返信送信に失敗しました')
    }
  })
}
