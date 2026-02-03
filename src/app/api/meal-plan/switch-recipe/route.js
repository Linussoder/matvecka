import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const body = await request.json()
    const { mealPlanId, mealPlanRecipeId, newRecipeData } = body

    console.log('Switch recipe request:', { mealPlanId, mealPlanRecipeId, hasRecipeData: !!newRecipeData })

    if (!mealPlanRecipeId || !newRecipeData) {
      return NextResponse.json(
        { error: 'Missing required fields', details: { mealPlanRecipeId: !!mealPlanRecipeId, newRecipeData: !!newRecipeData } },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // First check if the record exists and get meal_plan_id
    const { data: existing, error: findError } = await supabase
      .from('meal_plan_recipes')
      .select('id, meal_plan_id')
      .eq('id', mealPlanRecipeId)
      .single()

    if (findError) {
      console.error('Error finding recipe:', findError)
      return NextResponse.json(
        { error: `Recipe not found: ${findError.message}`, code: findError.code },
        { status: 404 }
      )
    }

    // Always use the meal_plan_id from the database record (correct type)
    const actualMealPlanId = existing.meal_plan_id
    console.log('Using meal_plan_id from database:', actualMealPlanId)

    // Update the recipe data in the meal_plan_recipes table
    const { data, error } = await supabase
      .from('meal_plan_recipes')
      .update({
        recipe_data: newRecipeData
      })
      .eq('id', mealPlanRecipeId)
      .select()
      .single()

    if (error) {
      console.error('Error switching recipe:', error)
      return NextResponse.json(
        { error: `Failed to switch recipe: ${error.message}`, code: error.code },
        { status: 500 }
      )
    }

    console.log('Recipe switched successfully:', data?.id)

    // Now regenerate the shopping list
    if (actualMealPlanId) {
      console.log('Calling regenerateShoppingList with mealPlanId:', actualMealPlanId)
      await regenerateShoppingList(supabase, actualMealPlanId)
    } else {
      console.log('WARNING: No mealPlanId available, cannot update shopping list')
    }

    return NextResponse.json({
      success: true,
      recipe: data.recipe_data
    })
  } catch (error) {
    console.error('Error in switch-recipe API:', error)
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    )
  }
}

async function regenerateShoppingList(supabase, mealPlanId) {
  try {
    console.log('Regenerating shopping list for meal plan:', mealPlanId)

    // Fetch all recipes for this meal plan
    const { data: recipes, error: recipesError } = await supabase
      .from('meal_plan_recipes')
      .select('recipe_data, day_number')
      .eq('meal_plan_id', mealPlanId)
      .order('day_number')

    if (recipesError) {
      console.error('Error fetching recipes for shopping list:', recipesError)
      return
    }

    console.log('Found', recipes?.length, 'recipes for shopping list')

    // Generate new shopping list
    const shoppingList = generateShoppingList(recipes.map(r => r.recipe_data))

    // Calculate total cost
    const totalCost = recipes.reduce((sum, r) => {
      const cost = parseFloat(r.recipe_data?.estimatedCost) || 0
      return sum + cost
    }, 0)

    console.log('Generated shopping list with', shoppingList.length, 'items, total cost:', totalCost)

    // Check if shopping list exists
    const { data: existingList, error: checkError } = await supabase
      .from('shopping_lists')
      .select('id')
      .eq('meal_plan_id', mealPlanId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking for existing shopping list:', checkError)
    }

    if (existingList) {
      // Update existing shopping list
      const { error: updateError } = await supabase
        .from('shopping_lists')
        .update({
          items: shoppingList,
          total_cost: totalCost.toFixed(2)
        })
        .eq('meal_plan_id', mealPlanId)

      if (updateError) {
        console.error('Error updating shopping list:', updateError)
      } else {
        console.log('Shopping list updated successfully for meal plan:', mealPlanId)
      }
    } else {
      // Create new shopping list
      console.log('No existing shopping list found, creating new one')
      const { error: insertError } = await supabase
        .from('shopping_lists')
        .insert({
          meal_plan_id: mealPlanId,
          items: shoppingList,
          total_cost: totalCost.toFixed(2)
        })

      if (insertError) {
        console.error('Error creating shopping list:', insertError)
      } else {
        console.log('Shopping list created successfully for meal plan:', mealPlanId)
      }
    }
  } catch (error) {
    console.error('Error regenerating shopping list:', error)
  }
}

function generateShoppingList(recipes) {
  const items = {}

  recipes.forEach((recipe, dayIndex) => {
    recipe?.ingredients?.forEach(ingredient => {
      const key = ingredient.name.toLowerCase()

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
