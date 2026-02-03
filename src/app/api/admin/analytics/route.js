import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET() {
  try {
    // Get user signups over time (last 30 days)
    const { data: { users } } = await supabase.auth.admin.listUsers()

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Group users by day
    const usersByDay = {}
    users?.forEach(user => {
      const date = new Date(user.created_at).toISOString().split('T')[0]
      if (new Date(date) >= thirtyDaysAgo) {
        usersByDay[date] = (usersByDay[date] || 0) + 1
      }
    })

    // Get meal plans over time
    const { data: mealPlans } = await supabase
      .from('meal_plans')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())

    const mealPlansByDay = {}
    mealPlans?.forEach(mp => {
      const date = new Date(mp.created_at).toISOString().split('T')[0]
      mealPlansByDay[date] = (mealPlansByDay[date] || 0) + 1
    })

    // Get products by store
    const { data: productsByStore } = await supabase
      .from('products')
      .select('store')

    const storeStats = {}
    productsByStore?.forEach(p => {
      if (p.store) {
        storeStats[p.store] = (storeStats[p.store] || 0) + 1
      }
    })

    // Get top products (most used in meal plans - approximate by checking shopping lists)
    const { data: topProducts } = await supabase
      .from('products')
      .select('name, store, price')
      .order('created_at', { ascending: false })
      .limit(10)

    // Get flyers status distribution
    const { data: flyerStatus } = await supabase
      .from('flyers')
      .select('status')

    const statusStats = {}
    flyerStatus?.forEach(f => {
      statusStats[f.status] = (statusStats[f.status] || 0) + 1
    })

    // Get daily active users (users who logged in recently)
    const activeUsers = users?.filter(u => {
      if (!u.last_sign_in_at) return false
      const lastSignIn = new Date(u.last_sign_in_at)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      return lastSignIn >= sevenDaysAgo
    }).length || 0

    return NextResponse.json({
      success: true,
      analytics: {
        userSignups: usersByDay,
        mealPlansCreated: mealPlansByDay,
        productsByStore: storeStats,
        flyerStatus: statusStats,
        topProducts: topProducts || [],
        activeUsers,
        totalUsers: users?.length || 0,
      }
    })
  } catch (error) {
    console.error('Admin analytics error:', error)
    return NextResponse.json(
      { error: 'Kunde inte hämta analytics' },
      { status: 500 }
    )
  }
}
