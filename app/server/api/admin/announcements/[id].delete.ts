import { requireAdmin } from '../../../utils/auth'
import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'IDが指定されていません' })
  }

  const existing = await prisma.announcement.findUnique({ where: { id } })
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'お知らせが見つかりません' })
  }

  await prisma.announcement.delete({ where: { id } })

  return { message: 'お知らせを削除しました' }
})
