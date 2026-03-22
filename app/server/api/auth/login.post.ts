import { prisma } from '../../utils/prisma'
import { verifyPassword } from '../../utils/password'
import { setSessionCookie } from '../../utils/session'

type LoginBody = {
  email?: string
  password?: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<LoginBody>(event)
  const email = body.email?.trim().toLowerCase() || ''
  const password = body.password?.trim() || ''

  if (!email || !password) {
    throw createError({ statusCode: 400, statusMessage: 'メールアドレスとパスワードを入力してください' })
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      role: true,
      passwordHash: true,
      enabled: true
    }
  })

  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw createError({ statusCode: 401, statusMessage: 'メールアドレスまたはパスワードが正しくありません' })
  }

  if (!user.enabled) {
    throw createError({ statusCode: 403, statusMessage: 'このアカウントは無効化されています。管理者にお問い合わせください。' })
  }

  setSessionCookie(event, {
    userId: user.id,
    email: user.email
  })

  return {
    message: 'ログインしました',
    user: {
      id: user.id,
      email: user.email,
      role: user.role
    }
  }
})
