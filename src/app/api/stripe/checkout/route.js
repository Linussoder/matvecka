import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { stripe, PLANS } from '@/lib/stripe'
import { getOrCreateStripeCustomer } from '@/lib/subscription'
import { validatePromoCode, redeemPromoCode } from '@/lib/promo'

export async function POST(request) {
  try {
    const cookieStore = await cookies()

    // Create Supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
        },
      }
    )

    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Du måste vara inloggad' },
        { status: 401 }
      )
    }

    const { priceType, promoCode } = await request.json()

    // Get the correct price ID based on billing period
    const priceId = priceType === 'yearly'
      ? process.env.STRIPE_PRICE_ID_YEARLY
      : process.env.STRIPE_PRICE_ID_MONTHLY

    if (!priceId) {
      return NextResponse.json(
        { error: 'Pris-ID saknas i konfigurationen' },
        { status: 500 }
      )
    }

    // Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer(user.id, user.email)

    // Handle our promo codes (for free_days type, redeem immediately)
    let promoRedemption = null
    if (promoCode) {
      const validation = await validatePromoCode(promoCode, user.id)
      if (validation.valid && validation.promo.discountType === 'free_days') {
        // Redeem free days promo code immediately
        promoRedemption = await redeemPromoCode(promoCode, user.id)
      }
    }

    // Build checkout session options
    const sessionOptions = {
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: PLANS.premium.trialDays,
        metadata: {
          user_id: user.id,
          promo_code: promoCode || null,
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?subscription=success${promoRedemption?.success ? '&promo=applied' : ''}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pricing?cancelled=true`,
      metadata: {
        user_id: user.id,
        promo_code: promoCode || null,
      },
      locale: 'sv',
      allow_promotion_codes: true, // Also allow Stripe's built-in promo codes
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create(sessionOptions)

    return NextResponse.json({
      url: session.url,
      promoApplied: promoRedemption?.success || false
    })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Kunde inte skapa betalningssession' },
      { status: 500 }
    )
  }
}
