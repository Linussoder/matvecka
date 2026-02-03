import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// GET - Get nutrition data for date range
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

    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    // Get meal plans in date range
    let query = supabase
      .from('meal_plans')
      .select('id, name, week_start_date, servings')
      .eq('user_id', user.id)
      .order('week_start_date', { ascending: false })

    if (from) {
      query = query.gte('week_start_date', from)
    }
    if (to) {
      query = query.lte('week_start_date', to)
    }

    const { data: mealPlans, error: plansError } = await query

    if (plansError) throw plansError

    if (!mealPlans || mealPlans.length === 0) {
      return NextResponse.json({
        success: true,
        nutrition: {
          totalCalories: 0,
          totalProtein: 0,
          totalCarbs: 0,
          totalFat: 0,
          totalFiber: 0,
          mealCount: 0,
          dailyAverages: {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            fiber: 0
          }
        },
        mealPlans: []
      })
    }

    // Get recipes for these meal plans
    const planIds = mealPlans.map(p => p.id)
    const { data: recipes, error: recipesError } = await supabase
      .from('meal_plan_recipes')
      .select('meal_plan_id, day_number, recipe_data')
      .in('meal_plan_id', planIds)

    if (recipesError) throw recipesError

    // Calculate totals from recipe nutrition data
    let totalCalories = 0
    let totalProtein = 0
    let totalCarbs = 0
    let totalFat = 0
    let totalFiber = 0
    let mealCount = 0

    const planNutrition = {}

    recipes?.forEach(recipe => {
      const nutrition = recipe.recipe_data?.nutrition
      if (nutrition) {
        totalCalories += parseInt(nutrition.calories) || 0
        totalProtein += parseInt(nutrition.protein) || 0
        totalCarbs += parseInt(nutrition.carbs) || 0
        totalFat += parseInt(nutrition.fat) || 0
        totalFiber += parseInt(nutrition.fiber) || 0
        mealCount++

        // Track per plan
        if (!planNutrition[recipe.meal_plan_id]) {
          planNutrition[recipe.meal_plan_id] = {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            fiber: 0,
            mealCount: 0
          }
        }
        planNutrition[recipe.meal_plan_id].calories += parseInt(nutrition.calories) || 0
        planNutrition[recipe.meal_plan_id].protein += parseInt(nutrition.protein) || 0
        planNutrition[recipe.meal_plan_id].carbs += parseInt(nutrition.carbs) || 0
        planNutrition[recipe.meal_plan_id].fat += parseInt(nutrition.fat) || 0
        planNutrition[recipe.meal_plan_id].fiber += parseInt(nutrition.fiber) || 0
        planNutrition[recipe.meal_plan_id].mealCount++
      }
    })

    // Calculate daily averages
    const days = mealCount > 0 ? Math.ceil(mealCount / 1) : 1 // Assuming 1 meal per day

    return NextResponse.json({
      success: true,
      nutrition: {
        totalCalories,
        totalProtein,
        totalCarbs,
        totalFat,
        totalFiber,
        mealCount,
        dailyAverages: {
          calories: mealCount > 0 ? Math.round(totalCalories / mealCount) : 0,
          protein: mealCount > 0 ? Math.round(totalProtein / mealCount) : 0,
          carbs: mealCount > 0 ? Math.round(totalCarbs / mealCount) : 0,
          fat: mealCount > 0 ? Math.round(totalFat / mealCount) : 0,
          fiber: mealCount > 0 ? Math.round(totalFiber / mealCount) : 0
        }
      },
      mealPlans: mealPlans.map(plan => ({
        ...plan,
        nutrition: planNutrition[plan.id] || null
      }))
    })

  } catch (error) {
    console.error('Nutrition fetch error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
