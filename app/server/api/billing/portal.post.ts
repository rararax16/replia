import { getStripe } from '../../services/stripe.service'
import { prisma } from '../../utils/prisma'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const authUser = await requireAuth(event)

  const config = useRuntimeConfig()
  const appBaseUrl = config.appBaseUrl || process.env.APP_BASE_URL

  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { stripeCustomerId: true }
  })

  if (!user?.stripeCustomerId) {
    throw createError({ statusCode: 400, message: 'Stripeの顧客情報がありません' })
  }

  const session = await getStripe().billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${appBaseUrl}/my-page`
  })

  return { message: 'ポータルセッションを作成しました', data: { url: session.url } }
})
