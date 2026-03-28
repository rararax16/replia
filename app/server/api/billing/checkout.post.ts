import { UserPlan } from '@prisma/client'
import { getStripe } from '../../services/stripe.service'
import { prisma } from '../../utils/prisma'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const authUser = await requireAuth(event)

  const config = useRuntimeConfig()
  const appBaseUrl = config.appBaseUrl || process.env.APP_BASE_URL
  const priceId = config.stripeProPriceId || process.env.STRIPE_PRO_PRICE_ID

  if (!priceId) {
    throw createError({ statusCode: 500, message: 'STRIPE_PRO_PRICE_ID が設定されていません' })
  }

  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { plan: true, stripeCustomerId: true, stripeSubscriptionId: true, email: true }
  })

  if (!user) {
    throw createError({ statusCode: 404, message: 'ユーザーが見つかりません' })
  }

  if (user.stripeSubscriptionId) {
    throw createError({ statusCode: 400, message: 'すでに有効なサブスクリプションがあります' })
  }

  const stripe = getStripe()

  let customerId = user.stripeCustomerId

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId: authUser.id }
    })
    customerId = customer.id
    await prisma.user.update({
      where: { id: authUser.id },
      data: { stripeCustomerId: customerId }
    })
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appBaseUrl}/my-page?checkout=success`,
    cancel_url: `${appBaseUrl}/my-page`,
    locale: 'ja',
    metadata: { userId: authUser.id }
  })

  return { message: 'チェックアウトセッションを作成しました', data: { url: session.url } }
})
