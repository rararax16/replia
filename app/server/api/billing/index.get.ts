import { ReplyStatus, UserPlan } from '@prisma/client'
import { prisma } from '../../utils/prisma'
import { requireAuth } from '../../utils/auth'

const REPLY_LIMIT: Record<UserPlan, number> = {
  FREE: 20,
  PRO: 3000
}

export default defineEventHandler(async (event) => {
  const authUser = await requireAuth(event)

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [user, repliesSentThisMonth] = await Promise.all([
    prisma.user.findUnique({ where: { id: authUser.id }, select: { plan: true } }),
    prisma.outboundReply.count({
      where: { userId: authUser.id, status: ReplyStatus.SENT, createdAt: { gte: startOfMonth } }
    })
  ])

  const plan = user?.plan ?? UserPlan.FREE
  const replyLimit = REPLY_LIMIT[plan]

  return {
    plan,
    replyLimit,
    replyUsedThisMonth: repliesSentThisMonth
  }
})
