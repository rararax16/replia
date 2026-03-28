import { UserPlan } from '@prisma/client'
import { prisma } from '../../../utils/prisma'
import { requireAdmin } from '../../../utils/auth'

type PatchBody = {
  plan?: string
  planExpiresAt?: string | null
  planAutoRenew?: boolean
  resetStripeSubscription?: boolean
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'ユーザーIDが必要です' })
  }

  const body = await readBody<PatchBody>(event)

  const data: {
    plan?: UserPlan
    planExpiresAt?: Date | null
    planAutoRenew?: boolean
    stripeSubscriptionId?: null
  } = {}

  if (body.plan !== undefined) {
    if (body.plan !== 'FREE' && body.plan !== 'PRO') {
      throw createError({ statusCode: 400, message: 'プランはFREEまたはPROを指定してください' })
    }
    data.plan = body.plan as UserPlan
  }

  if ('planExpiresAt' in body) {
    data.planExpiresAt = body.planExpiresAt ? new Date(body.planExpiresAt) : null
  }

  if (body.planAutoRenew !== undefined) {
    data.planAutoRenew = body.planAutoRenew
  }

  if (body.resetStripeSubscription) {
    data.stripeSubscriptionId = null
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      email: true,
      plan: true,
      planExpiresAt: true,
      planAutoRenew: true
    }
  })

  return {
    message: 'プランを更新しました',
    user
  }
})
