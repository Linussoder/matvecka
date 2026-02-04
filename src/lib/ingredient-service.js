/**
 * Ingredient Service
 * Handles ingredient database, prices, substitutes, and nutrition verification
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// ==========================================
// INGREDIENT LOOKUP
// ==========================================

/**
 * Search for ingredients by name
 */
export async function searchIngredients(query, limit = 10) {
  const { data, error } = await supabase
    .from('swedish_ingredients')
    .select('*')
    .or(`name_sv.ilike.%${query}%,name_en.ilike.%${query}%`)
    .limit(limit)

  if (error) {
    console.error('Error searching ingredients:', error)
    return []
  }

  return data
}

/**
 * Get ingredient by ID
 */
export async function getIngredientById(id) {
  const { data, error } = await supabase
    .from('swedish_ingredients')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching ingredient:', error)
    return null
  }

  return data
}

/**
 * Get ingredient by Swedish name
 */
export async function getIngredientByName(name) {
  const { data, error } = await supabase
    .from('swedish_ingredients')
    .select('*')
    .ilike('name_sv', name)
    .single()

  if (error) {
    // Try partial match
    const { data: partial } = await supabase
      .from('swedish_ingredients')
      .select('*')
      .ilike('name_sv', `%${name}%`)
      .limit(1)

    return partial?.[0] || null
  }

  return data
}

/**
 * Get all ingredients by category
 */
export async function getIngredientsByCategory(category) {
  const { data, error } = await supabase
    .from('swedish_ingredients')
    .select('*')
    .eq('category', category)
    .order('name_sv')

  if (error) {
    console.error('Error fetching ingredients by category:', error)
    return []
  }

  return data
}

/**
 * Get all ingredient categories
 */
export async function getCategories() {
  const { data, error } = await supabase
    .from('swedish_ingredients')
    .select('category')
    .order('category')

  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }

  return [...new Set(data.map(d => d.category))]
}

// ==========================================
// INGREDIENT SUBSTITUTES
// ==========================================

/**
 * Get substitutes for an ingredient
 */
export async function getSubstitutes(ingredientId, options = {}) {
  const { dietaryFilter = null, forBudget = false } = options

  // Use the database function if available
  if (dietaryFilter) {
    const { data, error } = await supabase
      .rpc('get_ingredient_substitutes', {
        p_ingredient_id: ingredientId,
        p_dietary_filter: dietaryFilter
      })

    if (!error && data) {
      return data
    }
  }

  // Fallback to direct query
  let query = supabase
    .from('ingredient_substitutes')
    .select(`
      *,
      substitute:swedish_ingredients!substitute_id(
        id, name_sv, name_en, category, calories, protein, carbs, fat
      )
    `)
    .eq('ingredient_id', ingredientId)
    .eq('is_verified', true)

  if (forBudget) {
    query = query.eq('for_budget', true)
  }

  query = query.order('quality_score', { ascending: false })

  const { data, error } = await query

  if (error) {
    console.error('Error fetching substitutes:', error)
    return []
  }

  return data.map(s => ({
    substituteId: s.substitute.id,
    name: s.substitute.name_sv,
    nameEn: s.substitute.name_en,
    category: s.substitute.category,
    ratio: s.ratio,
    notes: s.notes,
    qualityScore: s.quality_score,
    forDietary: s.for_dietary,
    forBudget: s.for_budget,
    nutrition: {
      calories: s.substitute.calories,
      protein: s.substitute.protein,
      carbs: s.substitute.carbs,
      fat: s.substitute.fat
    }
  }))
}

/**
 * Find substitutes for a recipe ingredient
 */
export async function findSubstituteForRecipe(ingredientName, dietaryRestrictions = []) {
  // First, find the ingredient in our database
  const ingredient = await getIngredientByName(ingredientName)

  if (!ingredient) {
    return {
      found: false,
      ingredient: ingredientName,
      substitutes: [],
      message: 'Ingredient not found in database'
    }
  }

  // Get substitutes
  const substitutes = await getSubstitutes(ingredient.id, {
    dietaryFilter: dietaryRestrictions.length ? dietaryRestrictions : null
  })

  return {
    found: true,
    ingredient: {
      id: ingredient.id,
      name: ingredient.name_sv,
      category: ingredient.category
    },
    substitutes,
    message: substitutes.length
      ? `Found ${substitutes.length} substitute(s)`
      : 'No substitutes available'
  }
}

/**
 * Add a new substitute
 */
export async function addSubstitute({
  ingredientId,
  substituteId,
  ratio = 1.0,
  notes = null,
  qualityScore = 3,
  forDietary = [],
  forBudget = false,
  forAvailability = false,
  verifiedBy = null
}) {
  const { data, error } = await supabase
    .from('ingredient_substitutes')
    .insert({
      ingredient_id: ingredientId,
      substitute_id: substituteId,
      ratio,
      notes,
      quality_score: qualityScore,
      for_dietary: forDietary,
      for_budget: forBudget,
      for_availability: forAvailability,
      is_verified: !!verifiedBy,
      verified_by: verifiedBy
    })
    .select()
    .single()

  if (error) {
    console.error('Error adding substitute:', error)
    return null
  }

  return data
}

// ==========================================
// INGREDIENT PRICES
// ==========================================

/**
 * Get current prices for an ingredient
 */
export async function getIngredientPrices(ingredientId) {
  const { data, error } = await supabase
    .from('ingredient_prices')
    .select('*')
    .eq('ingredient_id', ingredientId)
    .order('recorded_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('Error fetching prices:', error)
    return []
  }

  return data
}

/**
 * Get best price for an ingredient
 */
export async function getBestPrice(ingredientId) {
  const { data, error } = await supabase
    .from('ingredient_prices')
    .select('*')
    .eq('ingredient_id', ingredientId)
    .order('price_per_kg', { ascending: true })
    .limit(1)

  if (error || !data?.length) {
    return null
  }

  return data[0]
}

/**
 * Get prices by store
 */
export async function getPricesByStore(store, limit = 50) {
  const { data, error } = await supabase
    .from('ingredient_prices')
    .select(`
      *,
      ingredient:swedish_ingredients!ingredient_id(name_sv, category)
    `)
    .eq('store', store)
    .order('recorded_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching store prices:', error)
    return []
  }

  return data
}

/**
 * Add a new price record
 */
export async function addPrice({
  ingredientId,
  store,
  price,
  unit,
  quantity = 1,
  isOffer = false,
  offerValidFrom = null,
  offerValidTo = null,
  source = 'manual',
  sourceUrl = null
}) {
  // Calculate price per kg if possible
  let pricePerKg = null
  if (unit === 'kg') {
    pricePerKg = price / quantity
  } else if (unit === 'g') {
    pricePerKg = (price / quantity) * 1000
  }

  const { data, error } = await supabase
    .from('ingredient_prices')
    .insert({
      ingredient_id: ingredientId,
      store,
      price,
      unit,
      quantity,
      price_per_kg: pricePerKg,
      is_offer: isOffer,
      offer_valid_from: offerValidFrom,
      offer_valid_to: offerValidTo,
      source,
      source_url: sourceUrl
    })
    .select()
    .single()

  if (error) {
    console.error('Error adding price:', error)
    return null
  }

  // Update ingredient's current average price
  await updateIngredientAvgPrice(ingredientId)

  return data
}

/**
 * Update ingredient's average price
 */
async function updateIngredientAvgPrice(ingredientId) {
  const { data: prices } = await supabase
    .from('ingredient_prices')
    .select('price_per_kg')
    .eq('ingredient_id', ingredientId)
    .not('price_per_kg', 'is', null)
    .order('recorded_at', { ascending: false })
    .limit(10)

  if (!prices?.length) return

  const avgPrice = prices.reduce((sum, p) => sum + p.price_per_kg, 0) / prices.length

  await supabase
    .from('swedish_ingredients')
    .update({
      current_avg_price: avgPrice,
      price_updated_at: new Date().toISOString()
    })
    .eq('id', ingredientId)
}

// ==========================================
// NUTRITION VERIFICATION
// ==========================================

/**
 * Verify nutrition data for an ingredient
 */
export async function verifyNutrition(ingredientId, sourceId, nutritionData) {
  const { data, error } = await supabase
    .from('nutrition_verifications')
    .upsert({
      ingredient_id: ingredientId,
      source_id: sourceId,
      calories: nutritionData.calories,
      protein: nutritionData.protein,
      carbs: nutritionData.carbs,
      fat: nutritionData.fat,
      fiber: nutritionData.fiber,
      saturated_fat: nutritionData.saturatedFat,
      sugar: nutritionData.sugar,
      sodium: nutritionData.sodium,
      confidence_score: nutritionData.confidenceScore || 1.0,
      raw_response: nutritionData.rawResponse
    }, {
      onConflict: 'ingredient_id,source_id'
    })
    .select()
    .single()

  if (error) {
    console.error('Error verifying nutrition:', error)
    return null
  }

  return data
}

/**
 * Get nutrition verifications for an ingredient
 */
export async function getNutritionVerifications(ingredientId) {
  const { data, error } = await supabase
    .from('nutrition_verifications')
    .select(`
      *,
      source:nutrition_sources!source_id(name, priority)
    `)
    .eq('ingredient_id', ingredientId)
    .order('source.priority')

  if (error) {
    console.error('Error fetching nutrition verifications:', error)
    return []
  }

  return data
}

/**
 * Calculate recipe nutrition from ingredients
 */
export async function calculateRecipeNutrition(ingredients, servings = 4) {
  let totalNutrition = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0
  }

  const unmatchedIngredients = []

  for (const ing of ingredients) {
    const name = typeof ing === 'string' ? ing : (ing.name || ing.ingredient)
    const amount = typeof ing === 'string' ? 100 : (ing.amount || 100)
    const unit = typeof ing === 'string' ? 'g' : (ing.unit || 'g')

    // Find ingredient in database
    const dbIngredient = await getIngredientByName(name)

    if (dbIngredient) {
      // Convert amount to grams for calculation
      let grams = amount
      if (unit === 'kg') grams = amount * 1000
      else if (unit === 'dl') grams = amount * 100 // Approximate for liquids
      else if (unit === 'msk') grams = amount * 15
      else if (unit === 'tsk') grams = amount * 5
      else if (unit === 'st' && dbIngredient.unit_weight_grams) {
        grams = amount * dbIngredient.unit_weight_grams
      }

      // Add nutrition (values are per 100g in database)
      const factor = grams / 100
      totalNutrition.calories += (dbIngredient.calories || 0) * factor
      totalNutrition.protein += (dbIngredient.protein || 0) * factor
      totalNutrition.carbs += (dbIngredient.carbs || 0) * factor
      totalNutrition.fat += (dbIngredient.fat || 0) * factor
      totalNutrition.fiber += (dbIngredient.fiber || 0) * factor
    } else {
      unmatchedIngredients.push(name)
    }
  }

  // Calculate per serving
  const perServing = {
    calories: Math.round(totalNutrition.calories / servings),
    protein: Math.round(totalNutrition.protein / servings * 10) / 10,
    carbs: Math.round(totalNutrition.carbs / servings * 10) / 10,
    fat: Math.round(totalNutrition.fat / servings * 10) / 10,
    fiber: Math.round(totalNutrition.fiber / servings * 10) / 10
  }

  return {
    total: totalNutrition,
    perServing,
    matchedIngredients: ingredients.length - unmatchedIngredients.length,
    unmatchedIngredients,
    accuracy: ingredients.length
      ? ((ingredients.length - unmatchedIngredients.length) / ingredients.length * 100).toFixed(0)
      : 0
  }
}

/**
 * Validate ingredients array - check if ingredients exist in database
 */
export async function validateIngredients(ingredients) {
  if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
    return { valid: true, issues: [], matched: [], unmatched: [] }
  }

  const issues = []
  const matched = []
  const unmatched = []

  for (const ingredient of ingredients) {
    const name = typeof ingredient === 'string' ? ingredient : ingredient.name || ingredient.ingredient
    if (!name) continue

    const found = await getIngredientByName(name)
    if (found) {
      matched.push({ name, id: found.id, data: found })
    } else {
      unmatched.push({ name })
      issues.push({
        type: 'ingredient_not_found',
        ingredient: name,
        suggestion: 'Lägg till i ingrediensdatabasen'
      })
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    matched,
    unmatched,
    matchRate: ingredients.length > 0 ? matched.length / ingredients.length : 1
  }
}

/**
 * Check recipe nutrition for realism
 */
export async function checkRecipeNutritionRealism(recipe) {
  const issues = []
  const calculated = await calculateRecipeNutrition(
    recipe.ingredients || [],
    recipe.servings || 4
  )

  const reported = recipe.nutrition?.perServing || recipe.nutrition || {}

  // Compare calculated vs reported
  if (reported.calories) {
    const variance = Math.abs(calculated.perServing.calories - reported.calories) / reported.calories
    if (variance > 0.3) {
      issues.push({
        type: 'calories_mismatch',
        reported: reported.calories,
        calculated: calculated.perServing.calories,
        variance: Math.round(variance * 100) + '%'
      })
    }
  }

  // Check for unrealistic values
  if (calculated.perServing.calories > 1500) {
    issues.push({ type: 'calories_too_high', value: calculated.perServing.calories })
  }
  if (calculated.perServing.protein > 100) {
    issues.push({ type: 'protein_too_high', value: calculated.perServing.protein })
  }
  if (calculated.perServing.fat > 80) {
    issues.push({ type: 'fat_too_high', value: calculated.perServing.fat })
  }

  // Save check result
  const recipeHash = recipe.recipeHash || (recipe.name ?
    require('crypto').createHash('md5').update(recipe.name.toLowerCase()).digest('hex') : null)

  if (recipeHash) {
    await supabase
      .from('recipe_nutrition_checks')
      .insert({
        recipe_hash: recipeHash,
        calculated_calories: calculated.perServing.calories,
        calculated_protein: calculated.perServing.protein,
        calculated_carbs: calculated.perServing.carbs,
        calculated_fat: calculated.perServing.fat,
        is_realistic: issues.length === 0,
        issues: issues.map(i => i.type)
      })
  }

  return {
    isRealistic: issues.length === 0,
    issues,
    calculated,
    accuracy: calculated.accuracy
  }
}

// ==========================================
// INGREDIENT MANAGEMENT (Admin)
// ==========================================

/**
 * Add a new ingredient to the database
 */
export async function addIngredient(ingredientData) {
  const { data, error } = await supabase
    .from('swedish_ingredients')
    .insert(ingredientData)
    .select()
    .single()

  if (error) {
    console.error('Error adding ingredient:', error)
    return null
  }

  return data
}

/**
 * Update an ingredient
 */
export async function updateIngredient(id, updates) {
  const { data, error } = await supabase
    .from('swedish_ingredients')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating ingredient:', error)
    return null
  }

  return data
}

/**
 * Get ingredient statistics
 */
export async function getIngredientStats() {
  const { data: ingredients } = await supabase
    .from('swedish_ingredients')
    .select('id, category, is_vegetarian, is_vegan, is_gluten_free')

  const { data: substitutes } = await supabase
    .from('ingredient_substitutes')
    .select('id, is_verified')

  const { data: prices } = await supabase
    .from('ingredient_prices')
    .select('id, store')

  const categoryCount = {}
  ingredients?.forEach(i => {
    categoryCount[i.category] = (categoryCount[i.category] || 0) + 1
  })

  const storeCount = {}
  prices?.forEach(p => {
    storeCount[p.store] = (storeCount[p.store] || 0) + 1
  })

  return {
    totalIngredients: ingredients?.length || 0,
    byCategory: categoryCount,
    vegetarianCount: ingredients?.filter(i => i.is_vegetarian).length || 0,
    veganCount: ingredients?.filter(i => i.is_vegan).length || 0,
    glutenFreeCount: ingredients?.filter(i => i.is_gluten_free).length || 0,
    totalSubstitutes: substitutes?.length || 0,
    verifiedSubstitutes: substitutes?.filter(s => s.is_verified).length || 0,
    totalPrices: prices?.length || 0,
    pricesByStore: storeCount
  }
}

export default {
  // Lookup
  searchIngredients,
  getIngredientById,
  getIngredientByName,
  getIngredientsByCategory,
  getCategories,
  // Substitutes
  getSubstitutes,
  findSubstituteForRecipe,
  addSubstitute,
  // Prices
  getIngredientPrices,
  getBestPrice,
  getPricesByStore,
  addPrice,
  // Nutrition
  verifyNutrition,
  getNutritionVerifications,
  calculateRecipeNutrition,
  checkRecipeNutritionRealism,
  // Admin
  addIngredient,
  updateIngredient,
  getIngredientStats
}
