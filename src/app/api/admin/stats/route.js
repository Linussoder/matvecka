import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET() {
  try {
    // Get flyer stats
    const { count: flyerCount } = await supabase
      .from('flyers')
      .select('*', { count: 'exact', head: true })

    const { count: flyerPageCount } = await supabase
      .from('flyer_pages')
      .select('*', { count: 'exact', head: true })

    // Get product stats
    const { count: productCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })

    const { count: hotspotCount } = await supabase
      .from('flyer_hotspots')
      .select('*', { count: 'exact', head: true })

    // Get user stats from auth
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()
    const userCount = usersError ? 0 : users?.length || 0

    // Get meal plan stats
    const { count: mealPlanCount } = await supabase
      .from('meal_plans')
      .select('*', { count: 'exact', head: true })

    // Get shopping list stats
    const { count: shoppingListCount } = await supabase
      .from('shopping_lists')
      .select('*', { count: 'exact', head: true })

    // Get recent flyers
    const { data: recentFlyers } = await supabase
      .from('flyers')
      .select('id, name, store, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    // Get recent users
    const recentUsers = users?.slice(0, 5).map(u => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      last_sign_in: u.last_sign_in_at
    })) || []

    return NextResponse.json({
      success: true,
      stats: {
        flyers: flyerCount || 0,
        flyerPages: flyerPageCount || 0,
        products: productCount || 0,
        hotspots: hotspotCount || 0,
        users: userCount,
        mealPlans: mealPlanCount || 0,
        shoppingLists: shoppingListCount || 0,
      },
      recent: {
        flyers: recentFlyers || [],
        users: recentUsers,
      }
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json(
      { error: 'Kunde inte hämta statistik' },
      { status: 500 }
    )
  }
}
