import { requireAdmin } from '../../../utils/auth'
import { prisma } from '../../../utils/prisma'

type AnnouncementBody = {
  title?: string
  body?: string
  publishAt?: string
  isVisible?: boolean
}

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

  const body = await readBody<AnnouncementBody>(event)
  const data: Record<string, any> = {}

  if (body.title !== undefined) {
    const title = body.title.trim()
    if (!title) throw createError({ statusCode: 400, statusMessage: 'タイトルは必須です' })
    data.title = title
  }

  if (body.body !== undefined) {
    const content = body.body.trim()
    if (!content) throw createError({ statusCode: 400, statusMessage: '本文は必須です' })
    data.body = content
  }

  if (body.publishAt !== undefined) {
    const publishAt = new Date(body.publishAt)
    if (isNaN(publishAt.getTime())) {
      throw createError({ statusCode: 400, statusMessage: '公開日時の形式が不正です' })
    }
    data.publishAt = publishAt
  }

  if (body.isVisible !== undefined) {
    data.isVisible = body.isVisible
  }

  const announcement = await prisma.announcement.update({
    where: { id },
    data
  })

  return {
    message: 'お知らせを更新しました',
    announcement
  }
})
