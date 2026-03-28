import { prisma } from '../../utils/prisma'
import { setSessionCookie } from '../../utils/session'

type VerifyBody = {
  token?: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<VerifyBody>(event)
  const token = body.token?.trim() || ''

  if (!token) {
    throw createError({
      statusCode: 400,
      message: '認証トークンが必要です'
    })
  }

  const verification = await prisma.emailVerification.findUnique({
    where: { token },
    select: {
      id: true,
      userId: true,
      expiresAt: true,
      user: {
        select: {
          id: true,
          email: true,
          role: true,
          emailVerified: true,
          enabled: true
        }
      }
    }
  })

  if (!verification) {
    throw createError({
      statusCode: 400,
      message: '無効な認証リンクです。再度認証メールを送信してください。'
    })
  }

  if (verification.expiresAt < new Date()) {
    await prisma.emailVerification.delete({ where: { id: verification.id } })
    throw createError({
      statusCode: 400,
      message: '認証リンクの有効期限が切れています。再度認証メールを送信してください。'
    })
  }

  if (!verification.user.enabled) {
    throw createError({
      statusCode: 403,
      message: 'このアカウントは無効化されています。管理者にお問い合わせください。'
    })
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: verification.userId },
      data: { emailVerified: true }
    }),
    prisma.emailVerification.deleteMany({
      where: { userId: verification.userId }
    })
  ])

  setSessionCookie(event, {
    userId: verification.user.id,
    email: verification.user.email
  })

  return {
    message: 'メールアドレスの認証が完了しました',
    user: {
      id: verification.user.id,
      email: verification.user.email,
      role: verification.user.role
    }
  }
})
