import { prisma } from '../../utils/prisma'
import { sendVerificationEmail } from '../../utils/email'

type ResendBody = {
  email?: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<ResendBody>(event)
  const email = body.email?.trim().toLowerCase() || ''

  if (!email) {
    throw createError({
      statusCode: 400,
      message: 'メールアドレスは必須です'
    })
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      emailVerified: true,
      enabled: true
    }
  })

  if (!user || user.emailVerified || !user.enabled) {
    // セキュリティ: ユーザーの存在有無を漏らさない
    return {
      message: '登録済みで未認証のメールアドレスであれば、確認メールを送信しました。'
    }
  }

  // 直近の送信から1分以内の再送信を防止
  const recentVerification = await prisma.emailVerification.findFirst({
    where: {
      userId: user.id,
      createdAt: { gt: new Date(Date.now() - 60 * 1000) }
    },
    select: { id: true }
  })

  if (recentVerification) {
    throw createError({
      statusCode: 429,
      message: '認証メールは1分ごとに送信できます。しばらくお待ちください。'
    })
  }

  await prisma.emailVerification.deleteMany({
    where: { userId: user.id }
  })

  const token = crypto.randomUUID()
  await prisma.emailVerification.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    }
  })

  await sendVerificationEmail(user.email, token)

  return {
    message: '登録済みで未認証のメールアドレスであれば、確認メールを送信しました。'
  }
})
