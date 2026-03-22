import { prisma } from '../../../utils/prisma'
import { requireAdmin } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      plan: true,
      planExpiresAt: true,
      planAutoRenew: true,
      createdAt: true
    }
  })

  return {
    message: 'ユーザープラン一覧を取得しました',
    users
  }
})
