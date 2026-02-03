import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { canPerformAction } from '@/lib/subscription'

// GET - List user's templates
export async function GET(request) {
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

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: templates, error } = await supabase
      .from('meal_plan_templates')
      .select('*')
      .eq('user_id', user.id)
      .order('use_count', { ascending: false })

    if (error) throw error

    return NextResponse.json({
      success: true,
      templates: templates || []
    })

  } catch (error) {
    console.error('Templates fetch error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// POST - Create template from meal plan
export async function POST(request) {
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

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, mealPlanId, meals, preferences } = body

    // Check template limit
    const { allowed, reason, upgradePath } = await canPerformAction(user.id, 'create_template')
    if (!allowed) {
      return NextResponse.json(
        { error: reason, requiresPremium: true, upgradePath },
        { status: 403 }
      )
    }

    let mealsData = meals

    // If mealPlanId provided, fetch recipes from that plan
    if (mealPlanId && !meals) {
      const { data: recipes, error: recipesError } = await supabase
        .from('meal_plan_recipes')
        .select('day_number, recipe_data')
        .eq('meal_plan_id', mealPlanId)
        .order('day_number')

      if (recipesError) throw recipesError

      mealsData = recipes.map(r => ({
        day: r.day_number,
        recipe: r.recipe_data
      }))

      // Also get preferences from meal plan
      if (!preferences) {
        const { data: mealPlan } = await supabase
          .from('meal_plans')
          .select('preferences')
          .eq('id', mealPlanId)
          .single()

        body.preferences = mealPlan?.preferences
      }
    }

    if (!mealsData || mealsData.length === 0) {
      return NextResponse.json(
        { error: 'No meals provided for template' },
        { status: 400 }
      )
    }

    const { data: template, error } = await supabase
      .from('meal_plan_templates')
      .insert({
        user_id: user.id,
        name: name || 'Min mall',
        description: description || null,
        meals: mealsData,
        preferences: preferences || null
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      template
    })

  } catch (error) {
    console.error('Template create error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
