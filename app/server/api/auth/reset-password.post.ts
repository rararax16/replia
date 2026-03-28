import { prisma } from '../../utils/prisma'
import { hashPassword } from '../../utils/password'

type ResetPasswordBody = {
  token?: string
  password?: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<ResetPasswordBody>(event)
  const token = body.token?.trim() || ''
  const password = body.password?.trim() || ''

  if (!token) {
    throw createError({
      statusCode: 400,
      message: 'リセットトークンが必要です'
    })
  }

  if (!password || password.length < 8) {
    throw createError({
      statusCode: 400,
      message: 'パスワードは8文字以上で入力してください'
    })
  }

  const resetRecord = await prisma.passwordReset.findUnique({
    where: { token },
    select: {
      id: true,
      userId: true,
      expiresAt: true,
      user: {
        select: {
          id: true,
          enabled: true
        }
      }
    }
  })

  if (!resetRecord) {
    throw createError({
      statusCode: 400,
      message: '無効なリセットリンクです。再度パスワードリセットを申請してください。'
    })
  }

  if (resetRecord.expiresAt < new Date()) {
    await prisma.passwordReset.delete({ where: { id: resetRecord.id } })
    throw createError({
      statusCode: 400,
      message: 'リセットリンクの有効期限が切れています。再度パスワードリセットを申請してください。'
    })
  }

  if (!resetRecord.user.enabled) {
    throw createError({
      statusCode: 403,
      message: 'このアカウントは無効化されています。管理者にお問い合わせください。'
    })
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetRecord.userId },
      data: { passwordHash: hashPassword(password) }
    }),
    prisma.passwordReset.deleteMany({
      where: { userId: resetRecord.userId }
    })
  ])

  return {
    message: 'パスワードを変更しました。新しいパスワードでログインしてください。'
  }
})
