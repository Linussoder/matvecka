import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Don't create client at top level - do it inside the function

export async function GET(request, { params }) {
  try {
    // Create client INSIDE the function
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const { id } = await params

    // Fetch meal plan
    const { data: mealPlan, error: planError } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('id', id)
      .single()

    if (planError) throw planError

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

    return NextResponse.json({
      mealPlan,
      shoppingList: shoppingListData.items || [],
      recipes: recipes || []
    })

  } catch (error) {
    console.error('Shopping list fetch error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
