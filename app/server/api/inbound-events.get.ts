import { requireAuth } from '../utils/auth'
import { prisma } from '../utils/prisma'

function getEventSenderUsername(inboundEvent: unknown): string | null {
  if (!inboundEvent || typeof inboundEvent !== 'object') {
    return null
  }

  const senderUsername = (inboundEvent as { senderUsername?: unknown }).senderUsername
  return typeof senderUsername === 'string' && senderUsername.trim() ? senderUsername : null
}

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const accounts = await prisma.igAccount.findMany({
    where: {
      userId: user.id
    },
    select: {
      platformUserId: true
    }
  })
  const ownSenderIds = accounts
    .map((account) => account.platformUserId)
    .filter((platformUserId): platformUserId is string => Boolean(platformUserId))

  const events = await prisma.inboundEvent.findMany({
    where: {
      userId: user.id,
      ...(ownSenderIds.length > 0
        ? {
            senderId: {
              notIn: ownSenderIds
            }
          }
        : {})
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 100,
    include: {
      outboundReplies: {
        orderBy: {
          createdAt: 'desc'
        },
        take: 1
      }
    }
  })

  const eventsWithSenderType = events.map((inboundEvent) => {
    return {
      ...inboundEvent,
      senderUsername: getEventSenderUsername(inboundEvent),
      isSelfEvent: false
    }
  })

  return {
    message: '受信イベントを取得しました',
    events: eventsWithSenderType
  }
})
