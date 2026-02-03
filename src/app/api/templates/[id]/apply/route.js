import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { canPerformAction, incrementUsage } from '@/lib/subscription'

// POST - Create new meal plan from template
export async function POST(request, { params }) {
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

    // Check subscription limit for creating meal plans
    const { allowed, reason, upgradePath } = await canPerformAction(user.id, 'create_meal_plan')
    if (!allowed) {
      return NextResponse.json(
        { error: reason, limitReached: true, upgradePath },
        { status: 403 }
      )
    }

    const { id } = await params

    // Get template
    const { data: template, error: templateError } = await supabase
      .from('meal_plan_templates')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (templateError) {
      if (templateError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 })
      }
      throw templateError
    }

    // Create new meal plan from template
    const today = new Date()
    const monday = new Date(today)
    monday.setDate(today.getDate() - today.getDay() + 1)

    const { data: mealPlan, error: planError } = await supabase
      .from('meal_plans')
      .insert({
        name: `${template.name} - ${today.toLocaleDateString('sv-SE')}`,
        week_start_date: monday.toISOString().split('T')[0],
        total_cost: '0',
        servings: template.preferences?.servings || 4,
        preferences: template.preferences,
        user_id: user.id
      })
      .select()
      .single()

    if (planError) throw planError

    // Create recipes from template meals
    const recipes = template.meals.map((meal, index) => ({
      meal_plan_id: mealPlan.id,
      day_number: meal.day || index + 1,
      recipe_data: meal.recipe
    }))

    const { error: recipesError } = await supabase
      .from('meal_plan_recipes')
      .insert(recipes)

    if (recipesError) throw recipesError

    // Calculate total cost from recipes
    const totalCost = template.meals.reduce((sum, meal) => {
      const cost = parseFloat(meal.recipe?.estimatedCost) || 0
      return sum + cost
    }, 0)

    // Update meal plan with total cost
    await supabase
      .from('meal_plans')
      .update({ total_cost: totalCost.toFixed(2) })
      .eq('id', mealPlan.id)

    // Generate shopping list from template recipes
    const shoppingList = generateShoppingList(template.meals.map(m => m.recipe))

    await supabase
      .from('shopping_lists')
      .insert({
        meal_plan_id: mealPlan.id,
        items: shoppingList,
        total_cost: totalCost.toFixed(2),
        user_id: user.id
      })

    // Increment template use count
    await supabase
      .from('meal_plan_templates')
      .update({ use_count: template.use_count + 1 })
      .eq('id', id)

    // Increment usage counter
    await incrementUsage(user.id, 'create_meal_plan')

    return NextResponse.json({
      success: true,
      mealPlanId: mealPlan.id,
      mealPlan
    })

  } catch (error) {
    console.error('Template apply error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// Helper function to generate shopping list from recipes
function generateShoppingList(recipes) {
  const items = {}

  recipes.forEach((recipe, dayIndex) => {
    if (!recipe?.ingredients) return

    recipe.ingredients.forEach(ingredient => {
      const key = ingredient.name?.toLowerCase()
      if (!key) return

      if (!items[key]) {
        items[key] = {
          name: ingredient.name,
          totalAmount: 0,
          unit: ingredient.unit,
          usedInDays: [],
          category: categorizeIngredient(ingredient.name)
        }
      }

      items[key].totalAmount += parseFloat(ingredient.amount) || 0
      items[key].usedInDays.push(dayIndex + 1)
    })
  })

  return Object.values(items).sort((a, b) => {
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category, 'sv')
    }
    return a.name.localeCompare(b.name, 'sv')
  })
}

function categorizeIngredient(name) {
  if (!name) return 'Övrigt'
  const nameLower = name.toLowerCase()

  if (nameLower.match(/kyckling|kött|biff|fläsk|lamm|kalv|korv|färs|bacon/)) return 'Kött'
  if (nameLower.match(/fisk|lax|torsk|räk|musslor|sill|tonfisk/)) return 'Fisk'
  if (nameLower.match(/tomat|gurka|sallad|paprika|lök|morot|potatis|broccoli|spenat|zucchini|aubergine|svamp/)) return 'Grönsaker'
  if (nameLower.match(/äpple|banan|apelsin|päron|druv|melon|bär|citron|lime/)) return 'Frukt'
  if (nameLower.match(/mjölk|yoghurt|ost|smör|grädde|fil|ägg|créme/)) return 'Mejeri'
  if (nameLower.match(/bröd|pasta|ris|müsli|flingor|havre|mjöl|couscous|quinoa/)) return 'Spannmål'
  if (nameLower.match(/juice|läsk|vatten|kaffe|te|öl|vin/)) return 'Dryck'

  return 'Övrigt'
}
