import { ReplyStatus, UserPlan } from '@prisma/client'
import { prisma } from '../../utils/prisma'
import { requireAuth } from '../../utils/auth'
import { PLAN_LIMITS } from '../../utils/plan-limits'

export default defineEventHandler(async (event) => {
  const authUser = await requireAuth(event)

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [user, repliesSentThisMonth] = await Promise.all([
    prisma.user.findUnique({ where: { id: authUser.id }, select: { plan: true, planExpiresAt: true, planAutoRenew: true, stripeCustomerId: true, stripeSubscriptionId: true } }),
    prisma.outboundReply.count({
      where: { userId: authUser.id, status: ReplyStatus.SENT, createdAt: { gte: startOfMonth } }
    })
  ])

  const plan = user?.plan ?? UserPlan.FREE
  const replyLimit = PLAN_LIMITS[plan].replyLimit

  return {
    plan,
    replyLimit,
    replyUsedThisMonth: repliesSentThisMonth,
    planAutoRenew: user?.planAutoRenew ?? false,
    planExpiresAt: user?.planExpiresAt ?? null,
    stripeCustomerId: user?.stripeCustomerId ?? null,
    stripeSubscriptionId: user?.stripeSubscriptionId ?? null
  }
})
