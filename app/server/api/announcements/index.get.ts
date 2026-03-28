import { requireAuth } from '../../utils/auth'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const now = new Date()

  const announcements = await prisma.announcement.findMany({
    where: {
      isVisible: true,
      publishAt: { lte: now }
    },
    orderBy: { publishAt: 'desc' },
    select: {
      id: true,
      title: true,
      body: true,
      publishAt: true,
      createdAt: true
    }
  })

  return { announcements }
})
