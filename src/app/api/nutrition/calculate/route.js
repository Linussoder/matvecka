import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createTrackedClaude } from '@/lib/claudeUsageTracker'
import crypto from 'crypto'

export async function POST(request) {
  try {
    const { recipe, mealPlanId, calculateAll } = await request.json()

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // If calculateAll is true, calculate nutrition for all recipes in the meal plan
    if (calculateAll && mealPlanId) {
      const nutrition = await calculateAllRecipesForMealPlan(supabase, mealPlanId)
      return NextResponse.json({
        success: true,
        nutrition
      })
    }

    // Single recipe calculation
    if (!recipe || !recipe.ingredients) {
      return NextResponse.json(
        { error: 'Recipe with ingredients required' },
        { status: 400 }
      )
    }

    // Create hash for caching
    const recipeHash = createRecipeHash(recipe)

    // Check if we already have nutrition data for this recipe
    const { data: existingData } = await supabase
      .from('nutrition_data')
      .select('*')
      .eq('recipe_hash', recipeHash)
      .single()

    if (existingData) {
      return NextResponse.json({
        success: true,
        nutrition: formatNutritionResponse(existingData),
        cached: true
      })
    }

    // Calculate nutrition using AI
    const anthropic = createTrackedClaude('nutrition-calculate')

    const nutritionData = await calculateNutrition(anthropic, recipe)

    // Save to database
    const { data: savedData, error: saveError } = await supabase
      .from('nutrition_data')
      .insert({
        recipe_hash: recipeHash,
        recipe_name: recipe.name || recipe.title,
        ...nutritionData,
        servings: recipe.servings || 4,
        source: 'ai_calculated'
      })
      .select()
      .single()

    if (saveError) {
      console.error('Error saving nutrition data:', saveError)
    }

    // If part of a meal plan, update meal plan nutrition
    if (mealPlanId) {
      await updateMealPlanNutrition(supabase, mealPlanId)
    }

    return NextResponse.json({
      success: true,
      nutrition: formatNutritionResponse(savedData || { ...nutritionData, recipe_name: recipe.name }),
      cached: false
    })

  } catch (error) {
    console.error('Error calculating nutrition:', error)
    return NextResponse.json(
      { error: 'Failed to calculate nutrition' },
      { status: 500 }
    )
  }
}

// GET endpoint to fetch nutrition for a meal plan
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const mealPlanId = searchParams.get('mealPlanId')

    if (!mealPlanId) {
      return NextResponse.json(
        { error: 'mealPlanId required' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { data, error } = await supabase
      .from('meal_plan_nutrition')
      .select('*')
      .eq('meal_plan_id', mealPlanId)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return NextResponse.json({
      success: true,
      nutrition: data || null
    })

  } catch (error) {
    console.error('Error fetching nutrition:', error)
    return NextResponse.json(
      { error: 'Failed to fetch nutrition' },
      { status: 500 }
    )
  }
}

/**
 * Calculate nutrition for all recipes in a meal plan
 */
async function calculateAllRecipesForMealPlan(supabase, mealPlanId) {
  // Get all recipes in the meal plan
  const { data: recipes, error: recipesError } = await supabase
    .from('meal_plan_recipes')
    .select('id, recipe_data, day_number')
    .eq('meal_plan_id', mealPlanId)
    .order('day_number')

  if (recipesError || !recipes || recipes.length === 0) {
    throw new Error('No recipes found for meal plan')
  }

  const anthropic = createTrackedClaude('nutrition-calculate-all')

  // Calculate nutrition for each recipe
  for (const recipeWrapper of recipes) {
    const recipe = recipeWrapper.recipe_data
    if (!recipe || !recipe.ingredients) continue

    const recipeHash = createRecipeHash(recipe)

    // Check if already calculated
    const { data: existingData } = await supabase
      .from('nutrition_data')
      .select('id')
      .eq('recipe_hash', recipeHash)
      .single()

    if (!existingData) {
      // Calculate nutrition for this recipe
      const nutritionData = await calculateNutrition(anthropic, recipe)

      // Save to database
      await supabase
        .from('nutrition_data')
        .insert({
          recipe_hash: recipeHash,
          recipe_name: recipe.name || recipe.title,
          ...nutritionData,
          servings: recipe.servings || 4,
          source: 'ai_calculated'
        })
    }
  }

  // Update meal plan nutrition totals
  await updateMealPlanNutrition(supabase, mealPlanId)

  // Fetch and return the updated meal plan nutrition
  const { data: mealPlanNutrition } = await supabase
    .from('meal_plan_nutrition')
    .select('*')
    .eq('meal_plan_id', mealPlanId)
    .single()

  return mealPlanNutrition
}

function createRecipeHash(recipe) {
  const ingredientString = (recipe.ingredients || [])
    .map(ing => {
      if (typeof ing === 'string') return ing.toLowerCase()
      return `${ing.amount || ''}${ing.unit || ''}${ing.name || ''}`.toLowerCase()
    })
    .sort()
    .join('|')

  const hashInput = `${(recipe.name || recipe.title || '').toLowerCase()}:${ingredientString}`
  return crypto.createHash('md5').update(hashInput).digest('hex')
}

async function calculateNutrition(anthropic, recipe) {
  const ingredientsList = (recipe.ingredients || [])
    .map(ing => {
      if (typeof ing === 'string') return ing
      return `${ing.amount || ''} ${ing.unit || ''} ${ing.name || ''}`.trim()
    })
    .join('\n')

  const prompt = `Du är en näringsexpert. Analysera detta svenska recept och beräkna näringsvärden PER PORTION.

RECEPT: ${recipe.name || recipe.title}
ANTAL PORTIONER: ${recipe.servings || 4}

INGREDIENSER:
${ingredientsList}

Beräkna näringsvärden PER PORTION och svara ENDAST med JSON i detta exakta format:
{
  "calories": <antal kcal>,
  "protein": <gram protein>,
  "carbohydrates": <gram kolhydrater>,
  "fat": <gram fett>,
  "fiber": <gram fiber>,
  "sugar": <gram socker>,
  "sodium": <mg natrium>,
  "saturated_fat": <gram mättat fett>,
  "confidence_score": <0.0-1.0 hur säker du är på beräkningen>
}

Använd svenska näringsdata och vanliga portionsstorlekar. Var realistisk med mängderna.`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }]
  })

  const responseText = message.content[0].text.trim()

  // Extract JSON from response
  let jsonStr = responseText
  const jsonMatch = responseText.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    jsonStr = jsonMatch[0]
  }

  try {
    const nutrition = JSON.parse(jsonStr)
    return {
      calories: Math.round(nutrition.calories) || 0,
      protein: parseFloat(nutrition.protein) || 0,
      carbohydrates: parseFloat(nutrition.carbohydrates) || 0,
      fat: parseFloat(nutrition.fat) || 0,
      fiber: parseFloat(nutrition.fiber) || 0,
      sugar: parseFloat(nutrition.sugar) || 0,
      sodium: parseFloat(nutrition.sodium) || 0,
      saturated_fat: parseFloat(nutrition.saturated_fat) || 0,
      confidence_score: parseFloat(nutrition.confidence_score) || 0.7
    }
  } catch (parseError) {
    console.error('Failed to parse nutrition JSON:', responseText.substring(0, 200))
    // Return estimated defaults
    return {
      calories: 450,
      protein: 25,
      carbohydrates: 40,
      fat: 20,
      fiber: 5,
      sugar: 8,
      sodium: 600,
      saturated_fat: 5,
      confidence_score: 0.3
    }
  }
}

async function updateMealPlanNutrition(supabase, mealPlanId) {
  try {
    // Get all recipes in the meal plan
    const { data: recipes, error: recipesError } = await supabase
      .from('meal_plan_recipes')
      .select('recipe_data')
      .eq('meal_plan_id', mealPlanId)

    if (recipesError || !recipes) return

    // Calculate totals
    let totals = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0
    }

    for (const recipe of recipes) {
      const recipeHash = createRecipeHash(recipe.recipe_data)
      const { data: nutrition } = await supabase
        .from('nutrition_data')
        .select('*')
        .eq('recipe_hash', recipeHash)
        .single()

      if (nutrition) {
        const servings = recipe.recipe_data?.servings || 4
        totals.calories += (nutrition.calories || 0) * servings
        totals.protein += (nutrition.protein || 0) * servings
        totals.carbs += (nutrition.carbohydrates || 0) * servings
        totals.fat += (nutrition.fat || 0) * servings
        totals.fiber += (nutrition.fiber || 0) * servings
      }
    }

    const daysInPlan = recipes.length || 7
    const avgCaloriesPerDay = Math.round(totals.calories / daysInPlan)

    // Calculate nutrition score (simplified)
    let score = 70 // Base score
    if (totals.fiber / daysInPlan >= 25) score += 10
    if (totals.protein / daysInPlan >= 50) score += 10
    if (avgCaloriesPerDay >= 1500 && avgCaloriesPerDay <= 2500) score += 10
    score = Math.min(100, Math.max(0, score))

    // Upsert meal plan nutrition
    await supabase
      .from('meal_plan_nutrition')
      .upsert({
        meal_plan_id: mealPlanId,
        total_calories: Math.round(totals.calories),
        total_protein: totals.protein,
        total_carbs: totals.carbs,
        total_fat: totals.fat,
        total_fiber: totals.fiber,
        avg_calories_per_day: avgCaloriesPerDay,
        nutrition_score: score,
        warnings: generateWarnings(totals, daysInPlan),
        calculated_at: new Date().toISOString()
      }, {
        onConflict: 'meal_plan_id'
      })

  } catch (error) {
    console.error('Error updating meal plan nutrition:', error)
  }
}

function generateWarnings(totals, days) {
  const warnings = []
  const avgCalories = totals.calories / days
  const avgProtein = totals.protein / days
  const avgFiber = totals.fiber / days

  if (avgCalories < 1200) {
    warnings.push({ type: 'low_calories', message: 'Kalorimängden är låg. Överväg att lägga till mer mat.' })
  }
  if (avgCalories > 3000) {
    warnings.push({ type: 'high_calories', message: 'Kalorimängden är hög för en genomsnittlig person.' })
  }
  if (avgProtein < 40) {
    warnings.push({ type: 'low_protein', message: 'Proteinintaget är lågt. Lägg till mer kött, fisk eller baljväxter.' })
  }
  if (avgFiber < 20) {
    warnings.push({ type: 'low_fiber', message: 'Fiberintaget är lågt. Lägg till mer grönsaker och fullkorn.' })
  }

  return warnings
}

function formatNutritionResponse(data) {
  return {
    recipeName: data.recipe_name,
    perServing: {
      calories: data.calories,
      protein: data.protein,
      carbohydrates: data.carbohydrates,
      fat: data.fat,
      fiber: data.fiber,
      sugar: data.sugar,
      sodium: data.sodium,
      saturatedFat: data.saturated_fat
    },
    servings: data.servings,
    confidenceScore: data.confidence_score,
    source: data.source
  }
}
