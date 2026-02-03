import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// POST - Verify nutrition data for a recipe
export async function POST(request) {
  try {
    const body = await request.json()
    const { recipe_identifier, recipe_data } = body

    if (!recipe_identifier && !recipe_data) {
      return NextResponse.json(
        { error: 'Receptidentifierare eller receptdata krävs' },
        { status: 400 }
      )
    }

    let originalNutrition = null
    let recipeToVerify = recipe_data

    // If identifier provided, try to find the recipe
    if (recipe_identifier && !recipe_data) {
      // Search in meal_plan_recipes
      const { data: mealPlanRecipe } = await supabase
        .from('meal_plan_recipes')
        .select('recipe_data')
        .ilike('recipe_data->>name', `%${recipe_identifier}%`)
        .limit(1)
        .single()

      if (mealPlanRecipe) {
        recipeToVerify = mealPlanRecipe.recipe_data
      }
    }

    if (!recipeToVerify) {
      return NextResponse.json(
        { error: 'Recept hittades inte' },
        { status: 404 }
      )
    }

    originalNutrition = recipeToVerify.nutrition || {}

    // Calculate estimated nutrition from ingredients
    // This is a simplified calculation - in production you'd use a nutrition database
    const calculatedNutrition = calculateNutritionFromIngredients(recipeToVerify.ingredients || [])

    // Calculate variance
    const variance = calculateVariance(originalNutrition, calculatedNutrition)

    // Log the verification
    const { data: logEntry, error: logError } = await supabase
      .from('nutrition_verification_log')
      .insert({
        recipe_identifier: recipe_identifier || recipeToVerify.name,
        original_nutrition: originalNutrition,
        calculated_nutrition: calculatedNutrition,
        variance_percentage: variance,
        verification_method: 'ai_recalc',
        is_approved: false
      })
      .select()
      .single()

    if (logError && logError.code !== '42P01') {
      console.error('Log error:', logError)
    }

    return NextResponse.json({
      success: true,
      verification: {
        recipe_name: recipeToVerify.name || recipe_identifier,
        original_nutrition: originalNutrition,
        calculated_nutrition: calculatedNutrition,
        variance_percentage: variance,
        log_id: logEntry?.id
      }
    })
  } catch (error) {
    console.error('Nutrition verification error:', error)
    return NextResponse.json(
      { error: 'Kunde inte verifiera näringsvärden' },
      { status: 500 }
    )
  }
}

// Simple nutrition estimation from ingredients
function calculateNutritionFromIngredients(ingredients) {
  // Default nutrition values per common ingredient type (very simplified)
  // In production, this would use a proper nutrition database
  const nutritionDb = {
    // Proteins (per 100g)
    'kyckling': { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
    'kycklingfilé': { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
    'nötfärs': { calories: 250, protein: 26, carbs: 0, fat: 17 },
    'lax': { calories: 208, protein: 20, carbs: 0, fat: 13 },
    'ägg': { calories: 155, protein: 13, carbs: 1, fat: 11 },
    'tofu': { calories: 76, protein: 8, carbs: 2, fat: 4 },
    // Carbs (per 100g)
    'pasta': { calories: 131, protein: 5, carbs: 25, fat: 1 },
    'ris': { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
    'potatis': { calories: 77, protein: 2, carbs: 17, fat: 0.1 },
    'bröd': { calories: 265, protein: 9, carbs: 49, fat: 3 },
    // Vegetables (per 100g)
    'tomat': { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
    'lök': { calories: 40, protein: 1.1, carbs: 9, fat: 0.1 },
    'vitlök': { calories: 149, protein: 6, carbs: 33, fat: 0.5 },
    'paprika': { calories: 31, protein: 1, carbs: 6, fat: 0.3 },
    'spenat': { calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4 },
    'broccoli': { calories: 34, protein: 2.8, carbs: 7, fat: 0.4 },
    // Dairy (per 100g/ml)
    'mjölk': { calories: 42, protein: 3.4, carbs: 5, fat: 1 },
    'grädde': { calories: 340, protein: 2, carbs: 3, fat: 36 },
    'ost': { calories: 402, protein: 25, carbs: 1.3, fat: 33 },
    'smör': { calories: 717, protein: 0.9, carbs: 0.1, fat: 81 },
    // Oils
    'olivolja': { calories: 884, protein: 0, carbs: 0, fat: 100 },
    'olja': { calories: 884, protein: 0, carbs: 0, fat: 100 },
  }

  let totalNutrition = { calories: 0, protein: 0, carbs: 0, fat: 0 }

  for (const ingredient of ingredients) {
    const name = (ingredient.name || '').toLowerCase()
    const quantity = parseFloat(ingredient.quantity) || 100

    // Find matching ingredient in database
    let matched = null
    for (const [key, nutrition] of Object.entries(nutritionDb)) {
      if (name.includes(key)) {
        matched = nutrition
        break
      }
    }

    if (matched) {
      // Estimate based on quantity (assuming quantities are roughly in grams or ml)
      const multiplier = quantity / 100
      totalNutrition.calories += Math.round(matched.calories * multiplier)
      totalNutrition.protein += Math.round(matched.protein * multiplier)
      totalNutrition.carbs += Math.round(matched.carbs * multiplier)
      totalNutrition.fat += Math.round(matched.fat * multiplier)
    }
  }

  return totalNutrition
}

// Calculate variance percentage between original and calculated
function calculateVariance(original, calculated) {
  const variance = {}

  for (const key of ['calories', 'protein', 'carbs', 'fat']) {
    const orig = original[key] || 0
    const calc = calculated[key] || 0

    if (orig === 0) {
      variance[key] = calc === 0 ? 0 : 100
    } else {
      variance[key] = Math.round(((calc - orig) / orig) * 100 * 10) / 10
    }
  }

  return variance
}
