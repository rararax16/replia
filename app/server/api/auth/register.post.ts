import { prisma } from '../../utils/prisma'
import { hashPassword } from '../../utils/password'
import { setSessionCookie } from '../../utils/session'
import { sendVerificationEmail } from '../../utils/email'

type RegisterBody = {
  email?: string
  password?: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<RegisterBody>(event)
  const email = body.email?.trim().toLowerCase() || ''
  const password = body.password?.trim() || ''

  if (!email) {
    throw createError({
      statusCode: 400,
      message: 'メールアドレスは必須です'
    })
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError({
      statusCode: 400,
      message: '有効なメールアドレスを入力してください'
    })
  }

  if (!password || password.length < 8) {
    throw createError({
      statusCode: 400,
      message: 'パスワードは8文字以上で入力してください'
    })
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true }
  })

  if (existing) {
    throw createError({
      statusCode: 409,
      message: 'このメールアドレスは既に登録されています'
    })
  }

  const userCount = await prisma.user.count()
  const isFirstUser = userCount === 0

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: hashPassword(password),
      role: isFirstUser ? 'ADMIN' : 'MEMBER',
      emailVerified: isFirstUser
    },
    select: {
      id: true,
      email: true,
      role: true
    }
  })

  if (isFirstUser) {
    setSessionCookie(event, {
      userId: user.id,
      email: user.email
    })

    return {
      message: '初期管理者を登録しました',
      user,
      requiresVerification: false
    }
  }

  const token = crypto.randomUUID()
  await prisma.emailVerification.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    }
  })

  await sendVerificationEmail(email, token)

  return {
    message: '確認メールを送信しました。メールに記載されたリンクをクリックして登録を完了してください。',
    requiresVerification: true
  }
})
