import { sendRedirect } from 'h3'
import { buildInstagramOAuthUrl } from '../../../services/meta-oauth.service'
import { requireAuth } from '../../../utils/auth'
import { createInstagramOAuthState } from '../../../utils/oauth-state'
import { prisma } from '../../../utils/prisma'

const IG_ACCOUNT_LIMIT = 1

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)

    const accountCount = await prisma.igAccount.count({ where: { userId: user.id } })
    if (accountCount >= IG_ACCOUNT_LIMIT) {
      return sendRedirect(event, `/instagram?ig_error=${encodeURIComponent(`Instagramアカウントは${IG_ACCOUNT_LIMIT}件まで連携できます。既存のアカウントを削除してから再連携してください。`)}`)
    }

    const state = createInstagramOAuthState(user.id)
    const oauthUrl = buildInstagramOAuthUrl(state)

    return sendRedirect(event, oauthUrl)
  }
  catch (error: any) {
    const message = error?.statusMessage || error?.message || 'Instagram連携の設定に失敗しました'
    return sendRedirect(event, `/instagram?ig_error=${encodeURIComponent(message)}`)
  }
})
