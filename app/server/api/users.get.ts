import { requireAdmin } from '../utils/auth'
import { prisma } from '../utils/prisma'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const users = await prisma.user.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    select: {
      id: true,
      email: true,
      role: true,
      plan: true,
      planExpiresAt: true,
      planAutoRenew: true,
      enabled: true,
      createdAt: true,
      updatedAt: true
    }
  })

  return {
    message: 'ユーザー一覧を取得しました',
    users
  }
})
