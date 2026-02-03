import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { getUserSubscription } from '@/lib/subscription'
import { getRemainingUsage, PLANS } from '@/lib/stripe'

export async function GET(request) {
  try {
    const cookieStore = await cookies()

    // Create Supabase client for auth
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

    // Get subscription and usage data
    const { plan, status, subscription, usage, premiumCredits } = await getUserSubscription(user.id)

    // Calculate remaining usage
    const remaining = getRemainingUsage(usage, plan)

    // Get plan details
    const planDetails = PLANS[plan] || PLANS.free

    return NextResponse.json({
      success: true,
      plan,
      status,
      planName: planDetails.name,
      features: planDetails.features,
      limits: planDetails.limits,
      usage: {
        mealPlansGenerated: usage.meal_plans_generated,
        recipesRegenerated: usage.recipes_regenerated,
        favoritesCount: usage.favorites_count,
      },
      remaining,
      subscription: subscription ? {
        currentPeriodEnd: subscription.current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        trialEnd: subscription.trial_end,
      } : null,
      premiumCredits: premiumCredits ? {
        hasCredits: premiumCredits.hasCredits,
        totalDays: premiumCredits.totalDays,
      } : null,
    })
  } catch (error) {
    console.error('Subscription status error:', error)
    return NextResponse.json(
      { error: 'Kunde inte hämta prenumerationsstatus' },
      { status: 500 }
    )
  }
}
