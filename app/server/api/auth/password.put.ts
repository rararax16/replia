import { requireAuth } from '../../utils/auth'
import { hashPassword, verifyPassword } from '../../utils/password'
import { prisma } from '../../utils/prisma'

type UpdatePasswordBody = {
  currentPassword?: string
  newPassword?: string
}

export default defineEventHandler(async (event) => {
  const authUser = await requireAuth(event)
  const body = await readBody<UpdatePasswordBody>(event)

  const currentPassword = body.currentPassword?.trim() || ''
  const newPassword = body.newPassword?.trim() || ''

  if (!currentPassword || !newPassword) {
    throw createError({
      statusCode: 400,
      message: '現在のパスワードと新しいパスワードを入力してください'
    })
  }

  if (newPassword.length < 8) {
    throw createError({
      statusCode: 400,
      message: '新しいパスワードは8文字以上で入力してください'
    })
  }

  const user = await prisma.user.findFirst({
    where: {
      id: authUser.id
    },
    select: {
      id: true,
      passwordHash: true
    }
  })

  if (!user) {
    throw createError({
      statusCode: 404,
      message: 'ユーザー情報が見つかりません'
    })
  }

  if (!verifyPassword(currentPassword, user.passwordHash)) {
    throw createError({
      statusCode: 400,
      message: '現在のパスワードが正しくありません'
    })
  }

  if (verifyPassword(newPassword, user.passwordHash)) {
    throw createError({
      statusCode: 400,
      message: '新しいパスワードは現在のパスワードと異なるものを入力してください'
    })
  }

  await prisma.user.update({
    where: {
      id: user.id
    },
    data: {
      passwordHash: hashPassword(newPassword)
    }
  })

  return {
    message: 'パスワードを変更しました'
  }
})
