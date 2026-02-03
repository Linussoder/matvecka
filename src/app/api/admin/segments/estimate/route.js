import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(req) {
  try {
    const cookieStore = await cookies()
    const adminAuth = cookieStore.get('admin_session')
    if (!adminAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { filters } = await req.json()

    // Get all users from Supabase Auth
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers({
      perPage: 1000
    })

    if (usersError || !users) {
      return NextResponse.json({ success: true, count: 0 })
    }

    let filteredUsers = users
    const now = new Date()

    // Apply subscription filter
    if (filters.subscription?.length > 0) {
      const { data: subscriptions } = await supabase
        .from('user_subscriptions')
        .select('user_id, plan, status')

      const subMap = new Map(subscriptions?.map(s => [s.user_id, s]) || [])

      filteredUsers = filteredUsers.filter(user => {
        const sub = subMap.get(user.id)
        if (filters.subscription.includes('free')) {
          return !sub || sub.plan === 'free'
        }
        if (filters.subscription.includes('premium')) {
          return sub?.plan === 'premium' && sub?.status === 'active'
        }
        if (filters.subscription.includes('churned')) {
          return sub?.status === 'cancelled' || sub?.status === 'past_due'
        }
        return true
      })
    }

    // Apply activity filter
    if (filters.activity?.length > 0) {
      filteredUsers = filteredUsers.filter(user => {
        const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at) : null
        const daysSinceSignIn = lastSignIn ? Math.floor((now - lastSignIn) / (1000 * 60 * 60 * 24)) : 999

        if (filters.activity.includes('active_7d')) {
          return daysSinceSignIn <= 7
        }
        if (filters.activity.includes('active_30d')) {
          return daysSinceSignIn <= 30
        }
        if (filters.activity.includes('inactive_30d')) {
          return daysSinceSignIn > 30
        }
        if (filters.activity.includes('inactive_90d')) {
          return daysSinceSignIn > 90
        }
        return true
      })
    }

    // Apply meal plans filter
    if (filters.mealPlans?.length > 0) {
      const { data: mealPlans } = await supabase
        .from('meal_plans')
        .select('user_id')

      const planCounts = new Map()
      mealPlans?.forEach(mp => {
        planCounts.set(mp.user_id, (planCounts.get(mp.user_id) || 0) + 1)
      })

      filteredUsers = filteredUsers.filter(user => {
        const count = planCounts.get(user.id) || 0

        if (filters.mealPlans.includes('has_plans')) {
          return count > 0
        }
        if (filters.mealPlans.includes('no_plans')) {
          return count === 0
        }
        if (filters.mealPlans.includes('plans_5plus')) {
          return count >= 5
        }
        if (filters.mealPlans.includes('plans_10plus')) {
          return count >= 10
        }
        return true
      })
    }

    // Apply registration filter
    if (filters.registration?.length > 0) {
      filteredUsers = filteredUsers.filter(user => {
        const createdAt = new Date(user.created_at)
        const daysSinceCreation = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24))

        if (filters.registration.includes('new_7d')) {
          return daysSinceCreation <= 7
        }
        if (filters.registration.includes('new_30d')) {
          return daysSinceCreation <= 30
        }
        if (filters.registration.includes('veteran_6m')) {
          return daysSinceCreation >= 180
        }
        return true
      })
    }

    return NextResponse.json({ success: true, count: filteredUsers.length })
  } catch (error) {
    console.error('Failed to estimate segment:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
