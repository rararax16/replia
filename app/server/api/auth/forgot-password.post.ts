import { prisma } from '../../utils/prisma'
import { sendPasswordResetEmail } from '../../utils/email'

type ForgotPasswordBody = {
  email?: string
}

const SUCCESS_MESSAGE = '登録済みのメールアドレスであれば、パスワードリセット用のメールを送信しました。'

export default defineEventHandler(async (event) => {
  const body = await readBody<ForgotPasswordBody>(event)
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

  // セキュリティ: ユーザーの存在有無を漏らさない
  if (!user || !user.enabled || !user.emailVerified) {
    return { message: SUCCESS_MESSAGE }
  }

  // 1分以内の再送信を防止
  const recentReset = await prisma.passwordReset.findFirst({
    where: {
      userId: user.id,
      createdAt: { gt: new Date(Date.now() - 60 * 1000) }
    },
    select: { id: true }
  })

  if (recentReset) {
    throw createError({
      statusCode: 429,
      message: 'リセットメールは1分ごとに送信できます。しばらくお待ちください。'
    })
  }

  await prisma.passwordReset.deleteMany({
    where: { userId: user.id }
  })

  const token = crypto.randomUUID()
  await prisma.passwordReset.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    }
  })

  await sendPasswordResetEmail(user.email, token)

  return { message: SUCCESS_MESSAGE }
})
