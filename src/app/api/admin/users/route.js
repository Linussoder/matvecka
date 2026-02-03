import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET() {
  try {
    // Get all users from Supabase Auth
    const { data: { users }, error } = await supabase.auth.admin.listUsers()

    if (error) {
      throw error
    }

    // Get user preferences and meal plan counts
    const userIds = users.map(u => u.id)

    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('user_id, household_size, dietary_restrictions')
      .in('user_id', userIds)

    const { data: mealPlanCounts } = await supabase
      .from('meal_plans')
      .select('user_id')
      .in('user_id', userIds)

    // Count meal plans per user
    const mealPlansByUser = {}
    mealPlanCounts?.forEach(mp => {
      mealPlansByUser[mp.user_id] = (mealPlansByUser[mp.user_id] || 0) + 1
    })

    // Combine user data
    const enrichedUsers = users.map(user => {
      const prefs = preferences?.find(p => p.user_id === user.id)
      return {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in: user.last_sign_in_at,
        email_confirmed: user.email_confirmed_at !== null,
        provider: user.app_metadata?.provider || 'email',
        household_size: prefs?.household_size || null,
        dietary_restrictions: prefs?.dietary_restrictions || [],
        meal_plan_count: mealPlansByUser[user.id] || 0,
      }
    })

    return NextResponse.json({
      success: true,
      users: enrichedUsers,
      total: users.length,
    })
  } catch (error) {
    console.error('Admin users error:', error)
    return NextResponse.json(
      { error: 'Kunde inte hämta användare' },
      { status: 500 }
    )
  }
}
