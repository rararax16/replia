import { UserPlan } from '@prisma/client'
import type Stripe from 'stripe'
import { getStripe } from '../../services/stripe.service'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const rawBody = await readRawBody(event, 'utf-8')
  const signature = getHeader(event, 'stripe-signature')

  if (!rawBody || !signature) {
    throw createError({ statusCode: 400, message: 'リクエストが不正です' })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    throw createError({ statusCode: 500, message: 'STRIPE_WEBHOOK_SECRET が設定されていません' })
  }

  let stripeEvent: Stripe.Event

  try {
    stripeEvent = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret)
  }
  catch {
    throw createError({ statusCode: 400, message: 'Webhook署名の検証に失敗しました' })
  }

  try {
    await handleStripeEvent(stripeEvent)
  }
  catch (error) {
    console.error('[Stripe Webhook] 処理中にエラーが発生しました:', stripeEvent.type, error)
    // 処理エラーは 200 を返す（Stripe の再送ループを防ぐ）
  }

  return { received: true }
})

async function handleStripeEvent(event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.payment_status !== 'paid') break

      const userId = session.metadata?.userId
      if (!userId) {
        console.error('[Stripe Webhook] checkout.session.completed: metadata.userId がありません')
        break
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          plan: UserPlan.PRO,
          planAutoRenew: true,
          planExpiresAt: null,
          stripeCustomerId: typeof session.customer === 'string' ? session.customer : null,
          stripeSubscriptionId: typeof session.subscription === 'string' ? session.subscription : null
        }
      })
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = typeof subscription.customer === 'string' ? subscription.customer : null
      if (!customerId) break

      const isActive = subscription.status === 'active' || subscription.status === 'trialing'
      const willAutoRenew = isActive && !subscription.cancel_at_period_end
      // キャンセル済み（期間終了まで有効）の場合は期間終了日をセット、それ以外はnull
      const planExpiresAt = (isActive && subscription.cancel_at_period_end)
        ? new Date(subscription.current_period_end * 1000)
        : null

      await prisma.user.updateMany({
        where: { stripeCustomerId: customerId },
        data: {
          plan: isActive ? UserPlan.PRO : UserPlan.FREE,
          planAutoRenew: willAutoRenew,
          planExpiresAt
        }
      })
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = typeof subscription.customer === 'string' ? subscription.customer : null
      if (!customerId) break

      await prisma.user.updateMany({
        where: { stripeCustomerId: customerId },
        data: {
          plan: UserPlan.FREE,
          planAutoRenew: false,
          stripeSubscriptionId: null
        }
      })
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      console.warn('[Stripe Webhook] 支払い失敗:', invoice.id, invoice.customer)
      break
    }

    default:
      break
  }
}
