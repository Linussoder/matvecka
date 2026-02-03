import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'

// GET - List all subscriptions with user info
export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Get all users with their subscriptions and usage
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()

    if (usersError) {
      throw usersError
    }

    // Get all subscriptions
    const { data: subscriptions } = await supabase
      .from('user_subscriptions')
      .select('*')

    // Get current month's usage for all users
    const currentMonth = new Date().toISOString().slice(0, 7) + '-01'
    const { data: usageData } = await supabase
      .from('usage_tracking')
      .select('*')
      .eq('period_start', currentMonth)

    // Create maps for quick lookup
    const subscriptionMap = new Map()
    subscriptions?.forEach(sub => {
      subscriptionMap.set(sub.user_id, sub)
    })

    const usageMap = new Map()
    usageData?.forEach(usage => {
      usageMap.set(usage.user_id, usage)
    })

    // Combine data
    const combinedData = users.users.map(user => {
      const subscription = subscriptionMap.get(user.id)
      const usage = usageMap.get(user.id)

      return {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in: user.last_sign_in_at,
        subscription: subscription ? {
          plan: subscription.plan,
          status: subscription.status,
          stripe_customer_id: subscription.stripe_customer_id,
          stripe_subscription_id: subscription.stripe_subscription_id,
          current_period_start: subscription.current_period_start,
          current_period_end: subscription.current_period_end,
          cancel_at_period_end: subscription.cancel_at_period_end,
          trial_end: subscription.trial_end,
        } : null,
        usage: usage ? {
          meal_plans_generated: usage.meal_plans_generated,
          recipes_regenerated: usage.recipes_regenerated,
          favorites_count: usage.favorites_count,
        } : {
          meal_plans_generated: 0,
          recipes_regenerated: 0,
          favorites_count: 0,
        },
      }
    })

    // Calculate stats
    const stats = {
      total: combinedData.length,
      premium: combinedData.filter(u => u.subscription?.plan === 'premium' && ['active', 'trialing'].includes(u.subscription?.status)).length,
      trialing: combinedData.filter(u => u.subscription?.status === 'trialing').length,
      cancelled: combinedData.filter(u => u.subscription?.cancel_at_period_end).length,
      free: combinedData.filter(u => !u.subscription || u.subscription.plan === 'free').length,
    }

    return NextResponse.json({
      success: true,
      users: combinedData,
      stats,
    })
  } catch (error) {
    console.error('Admin subscriptions error:', error)
    return NextResponse.json(
      { error: 'Kunde inte hämta prenumerationer' },
      { status: 500 }
    )
  }
}

// PUT - Update subscription (grant premium, cancel, etc.)
export async function PUT(request) {
  try {
    const { userId, action, plan } = await request.json()

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'userId och action krävs' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    switch (action) {
      case 'grant_premium': {
        // Grant premium without Stripe (admin override)
        const endDate = new Date()
        endDate.setMonth(endDate.getMonth() + 1)

        await supabase
          .from('user_subscriptions')
          .upsert({
            user_id: userId,
            plan: 'premium',
            status: 'active',
            current_period_start: new Date().toISOString(),
            current_period_end: endDate.toISOString(),
            cancel_at_period_end: false,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' })

        return NextResponse.json({ success: true, message: 'Premium beviljad' })
      }

      case 'revoke_premium': {
        // Revoke premium (set to free)
        await supabase
          .from('user_subscriptions')
          .update({
            plan: 'free',
            status: 'active',
            stripe_subscription_id: null,
            current_period_end: null,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId)

        return NextResponse.json({ success: true, message: 'Premium borttagen' })
      }

      case 'cancel_stripe': {
        // Cancel Stripe subscription
        if (!stripe) {
          return NextResponse.json(
            { error: 'Stripe is not configured' },
            { status: 503 }
          )
        }

        const { data: subscription } = await supabase
          .from('user_subscriptions')
          .select('stripe_subscription_id')
          .eq('user_id', userId)
          .single()

        if (subscription?.stripe_subscription_id) {
          await stripe.subscriptions.update(subscription.stripe_subscription_id, {
            cancel_at_period_end: true,
          })

          await supabase
            .from('user_subscriptions')
            .update({
              cancel_at_period_end: true,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId)
        }

        return NextResponse.json({ success: true, message: 'Prenumeration avbruten' })
      }

      case 'reset_usage': {
        // Reset usage for current month
        const currentMonth = new Date().toISOString().slice(0, 7) + '-01'

        await supabase
          .from('usage_tracking')
          .delete()
          .eq('user_id', userId)
          .eq('period_start', currentMonth)

        return NextResponse.json({ success: true, message: 'Användning återställd' })
      }

      default:
        return NextResponse.json(
          { error: 'Okänd åtgärd' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Admin subscription update error:', error)
    return NextResponse.json(
      { error: 'Kunde inte uppdatera prenumeration' },
      { status: 500 }
    )
  }
}
