import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request, { params }) {
  try {
    const { id } = await params

    // Get user from Supabase Auth
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(id)

    if (userError || !user) {
      return NextResponse.json({ error: 'Användare hittades inte' }, { status: 404 })
    }

    // Get user preferences
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', id)
      .single()

    // Get user's meal plans
    const { data: mealPlans } = await supabase
      .from('meal_plans')
      .select(`
        id,
        created_at,
        status,
        preferences,
        recipes:meal_plan_recipes(count)
      `)
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(10)

    // Get user's shopping lists
    const { data: shoppingLists } = await supabase
      .from('shopping_lists')
      .select('id, created_at, items')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(10)

    // Get user's favorite recipes
    const { data: favorites } = await supabase
      .from('recipe_favorites')
      .select('id, created_at, recipe_data')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(10)

    // Build activity timeline
    const activities = []

    // Add meal plan creations
    mealPlans?.forEach(mp => {
      activities.push({
        type: 'meal_plan',
        date: mp.created_at,
        description: `Skapade matplan`,
        details: `${mp.recipes?.[0]?.count || 0} recept`
      })
    })

    // Add favorites
    favorites?.forEach(fav => {
      activities.push({
        type: 'favorite',
        date: fav.created_at,
        description: `Sparade recept som favorit`,
        details: fav.recipe_data?.name || 'Recept'
      })
    })

    // Sort by date
    activities.sort((a, b) => new Date(b.date) - new Date(a.date))

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in: user.last_sign_in_at,
        email_confirmed: user.email_confirmed_at !== null,
        provider: user.app_metadata?.provider || 'email',
        user_metadata: user.user_metadata,
      },
      preferences,
      stats: {
        mealPlans: mealPlans?.length || 0,
        shoppingLists: shoppingLists?.length || 0,
        favorites: favorites?.length || 0,
      },
      mealPlans: mealPlans || [],
      shoppingLists: shoppingLists || [],
      favorites: favorites || [],
      activities: activities.slice(0, 20),
    })
  } catch (error) {
    console.error('Admin user detail error:', error)
    return NextResponse.json(
      { error: 'Kunde inte hämta användardata' },
      { status: 500 }
    )
  }
}
