import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { upsertSubscription } from '@/lib/subscription'

export async function POST(request) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    )
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        console.log('Checkout completed:', session.id)

        // Get the subscription
        if (session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription)
          await handleSubscriptionUpdate(subscription)
        }
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object
        console.log('Subscription updated:', subscription.id, subscription.status)
        await handleSubscriptionUpdate(subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        console.log('Subscription cancelled:', subscription.id)
        await handleSubscriptionCancelled(subscription)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object
        console.log('Payment succeeded:', invoice.id)
        // Could send a receipt email here
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object
        console.log('Payment failed:', invoice.id)
        // Could send a notification email here
        break
      }

      case 'customer.subscription.trial_will_end': {
        const subscription = event.data.object
        console.log('Trial ending soon:', subscription.id)
        // Could send a reminder email here (3 days before trial ends)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }

  return NextResponse.json({ received: true })
}

async function handleSubscriptionUpdate(subscription) {
  // Get user ID from metadata
  const userId = subscription.metadata?.user_id

  if (!userId) {
    // Try to get user ID from customer
    const customer = await stripe.customers.retrieve(subscription.customer)
    if (!customer.metadata?.user_id) {
      console.error('No user_id found in subscription or customer metadata')
      return
    }
  }

  const finalUserId = userId || (await stripe.customers.retrieve(subscription.customer)).metadata?.user_id

  // Map Stripe status to our status
  const statusMap = {
    'active': 'active',
    'trialing': 'trialing',
    'past_due': 'past_due',
    'canceled': 'cancelled',
    'incomplete': 'incomplete',
    'incomplete_expired': 'cancelled',
    'unpaid': 'past_due',
  }

  await upsertSubscription(finalUserId, {
    customerId: subscription.customer,
    subscriptionId: subscription.id,
    status: statusMap[subscription.status] || subscription.status,
    plan: 'premium', // All paid subscriptions are premium
    currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    trialEnd: subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null,
  })
}

async function handleSubscriptionCancelled(subscription) {
  const customer = await stripe.customers.retrieve(subscription.customer)
  const userId = subscription.metadata?.user_id || customer.metadata?.user_id

  if (!userId) {
    console.error('No user_id found for cancelled subscription')
    return
  }

  await upsertSubscription(userId, {
    customerId: subscription.customer,
    subscriptionId: subscription.id,
    status: 'cancelled',
    plan: 'free', // Downgrade to free
    currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
    cancelAtPeriodEnd: true,
    trialEnd: null,
  })
}
