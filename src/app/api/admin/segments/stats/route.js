import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET() {
  try {
    const cookieStore = await cookies()
    const adminAuth = cookieStore.get('admin_session')
    if (!adminAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all users from Supabase Auth
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers({
      perPage: 1000
    })

    if (usersError || !users) {
      return NextResponse.json({
        success: true,
        stats: {
          total: 0,
          premium: 0,
          active7d: 0,
          atLimit: 0,
          churnRisk: 0
        }
      })
    }

    const now = new Date()

    // Get subscription data
    const { data: subscriptions } = await supabase
      .from('user_subscriptions')
      .select('user_id, plan, status')

    const premiumUsers = new Set(
      subscriptions
        ?.filter(s => s.plan === 'premium' && s.status === 'active')
        .map(s => s.user_id) || []
    )

    // Get usage data
    const { data: usage } = await supabase
      .from('usage_tracking')
      .select('user_id, meal_plans_generated')
      .gte('period_start', new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0])

    const usageMap = new Map(usage?.map(u => [u.user_id, u.meal_plans_generated]) || [])

    // Calculate stats
    let active7d = 0
    let atLimit = 0
    let churnRisk = 0

    for (const user of users) {
      const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at) : null
      const daysSinceSignIn = lastSignIn ? Math.floor((now - lastSignIn) / (1000 * 60 * 60 * 24)) : 999

      // Active in last 7 days
      if (daysSinceSignIn <= 7) {
        active7d++
      }

      // At limit (3 meal plans for free users)
      const plansThisMonth = usageMap.get(user.id) || 0
      if (!premiumUsers.has(user.id) && plansThisMonth >= 3) {
        atLimit++
      }

      // Churn risk (inactive 30+ days but was active before, or at limit and not premium)
      if (daysSinceSignIn > 30 && daysSinceSignIn < 180) {
        churnRisk++
      } else if (plansThisMonth >= 3 && !premiumUsers.has(user.id)) {
        churnRisk++
      }
    }

    return NextResponse.json({
      success: true,
      stats: {
        total: users.length,
        premium: premiumUsers.size,
        active7d,
        atLimit,
        churnRisk
      }
    })
  } catch (error) {
    console.error('Failed to fetch segment stats:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
