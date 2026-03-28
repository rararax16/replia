import { EventChannel, UserPlan } from '@prisma/client'
import { requireAuth } from '../../utils/auth'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const userInfo = await prisma.user.findUnique({ where: { id: user.id }, select: { plan: true } })
  if (userInfo?.plan !== UserPlan.PRO) {
    throw createError({
      statusCode: 403,
      statusMessage: 'コメントユーザー一覧はProプランの機能です。Proプランにアップグレードしてください。'
    })
  }

  const comments = await prisma.inboundEvent.findMany({
    where: {
      userId: user.id,
      channel: EventChannel.COMMENT
    },
    orderBy: { createdAt: 'desc' },
    select: {
      senderId: true,
      senderUsername: true,
      content: true,
      createdAt: true
    }
  })

  // senderId 単位に集約
  const map = new Map<string, {
    senderId: string
    senderUsername: string | null
    commentCount: number
    lastCommentAt: Date
    lastContent: string
  }>()

  for (const c of comments) {
    const existing = map.get(c.senderId)
    if (existing) {
      existing.commentCount += 1
    }
    else {
      map.set(c.senderId, {
        senderId: c.senderId,
        senderUsername: c.senderUsername,
        commentCount: 1,
        lastCommentAt: c.createdAt,
        lastContent: c.content
      })
    }
  }

  const commentUsers = Array.from(map.values()).sort(
    (a, b) => b.lastCommentAt.getTime() - a.lastCommentAt.getTime()
  )

  return {
    message: 'コメントユーザー一覧を取得しました',
    commentUsers
  }
})
