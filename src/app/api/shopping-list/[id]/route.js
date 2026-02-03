import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request, { params }) {
  try {
    const cookieStore = await cookies()

    // Create authenticated server client
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

    const { id } = await params

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch meal plan - verify ownership if user is logged in
    const mealPlanQuery = supabase
      .from('meal_plans')
      .select('*')
      .eq('id', id)

    if (user) {
      mealPlanQuery.eq('user_id', user.id)
    }

    const { data: mealPlan, error: planError } = await mealPlanQuery.single()

    if (planError) {
      return NextResponse.json(
        { error: 'Meal plan not found or access denied' },
        { status: 404 }
      )
    }

    // Fetch shopping list
    const { data: shoppingListData, error: listError } = await supabase
      .from('shopping_lists')
      .select('*')
      .eq('meal_plan_id', id)
      .single()

    if (listError) throw listError

    // Fetch recipes
    const { data: recipes, error: recipesError } = await supabase
      .from('meal_plan_recipes')
      .select('*')
      .eq('meal_plan_id', id)
      .order('day_number')

    if (recipesError) throw recipesError

    // Apply serving multiplier to shopping list quantities
    const servingMultiplier = parseFloat(mealPlan.serving_multiplier) || 1.0
    const scaledShoppingList = (shoppingListData.items || []).map(item => ({
      ...item,
      originalAmount: item.totalAmount,
      totalAmount: Math.round((item.totalAmount * servingMultiplier) * 10) / 10
    }))

    return NextResponse.json({
      mealPlan,
      shoppingList: scaledShoppingList,
      recipes: recipes || [],
      servingMultiplier
    })

  } catch (error) {
    console.error('Shopping list fetch error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// PATCH - Update meal plan serving multiplier
export async function PATCH(request, { params }) {
  try {
    const cookieStore = await cookies()

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

    const { id } = await params
    const { servingMultiplier } = await request.json()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Validate multiplier range (free: 2-8, premium: 1-20)
    const multiplier = parseFloat(servingMultiplier)
    if (isNaN(multiplier) || multiplier < 0.25 || multiplier > 5) {
      return NextResponse.json(
        { error: 'Invalid serving multiplier' },
        { status: 400 }
      )
    }

    // Update meal plan
    const { data: mealPlan, error } = await supabase
      .from('meal_plans')
      .update({ serving_multiplier: multiplier })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Meal plan update error:', error)
      // Check if it's a column missing error
      if (error.message?.includes('column') || error.code === '42703') {
        return NextResponse.json(
          { error: 'Skalning inte aktiverad. Kör databasmigreringen först.' },
          { status: 500 }
        )
      }
      return NextResponse.json(
        { error: 'Kunde inte uppdatera måltidsplanen' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      mealPlan
    })

  } catch (error) {
    console.error('Meal plan update error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
