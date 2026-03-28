import { requireAdmin } from '../../../utils/auth'
import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const announcements = await prisma.announcement.findMany({
    orderBy: { publishAt: 'desc' },
    select: {
      id: true,
      title: true,
      body: true,
      publishAt: true,
      isVisible: true,
      createdAt: true,
      updatedAt: true
    }
  })

  return { announcements }
})
