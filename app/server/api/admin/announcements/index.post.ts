import { requireAdmin } from '../../../utils/auth'
import { prisma } from '../../../utils/prisma'

type AnnouncementBody = {
  title?: string
  body?: string
  publishAt?: string
  isVisible?: boolean
}

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const body = await readBody<AnnouncementBody>(event)

  const title = body.title?.trim() || ''
  const content = body.body?.trim() || ''

  if (!title) {
    throw createError({ statusCode: 400, statusMessage: 'タイトルは必須です' })
  }

  if (!content) {
    throw createError({ statusCode: 400, statusMessage: '本文は必須です' })
  }

  if (!body.publishAt) {
    throw createError({ statusCode: 400, statusMessage: '公開日時は必須です' })
  }

  const publishAt = new Date(body.publishAt)
  if (isNaN(publishAt.getTime())) {
    throw createError({ statusCode: 400, statusMessage: '公開日時の形式が不正です' })
  }

  const announcement = await prisma.announcement.create({
    data: {
      title,
      body: content,
      publishAt,
      isVisible: body.isVisible ?? true,
      createdById: admin.id
    }
  })

  return {
    message: 'お知らせを作成しました',
    announcement
  }
})
