import { requireAdmin } from '../../utils/auth'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id') || ''

  if (!id) {
    throw createError({ statusCode: 400, message: 'ユーザーIDが不正です' })
  }

  const user = await prisma.user.findUnique({
    where: { id },
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

  if (!user) {
    throw createError({ statusCode: 404, message: 'ユーザーが見つかりません' })
  }

  return { user }
})
