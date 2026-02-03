import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

export async function POST(request) {
  try {
    const { mealPlanId, mealPlanRecipeId, dayNumber } = await request.json()

    console.log('Regenerate recipe request:', { mealPlanId, mealPlanRecipeId, dayNumber })

    if (!mealPlanRecipeId || !dayNumber) {
      console.log('Missing required fields')
      return NextResponse.json(
        { error: 'Fält saknas: mealPlanRecipeId eller dayNumber' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })

    // Get meal plan details including stored preferences
    const { data: mealPlan, error: mealPlanError } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('id', mealPlanId)
      .single()

    if (mealPlanError) {
      console.log('Error fetching meal plan:', mealPlanError)
    }

    // Use stored preferences or defaults
    const storedPreferences = mealPlan?.preferences || {}
    console.log('Using preferences:', storedPreferences)

    // Get existing recipes in this meal plan to avoid duplicates
    const { data: existingRecipes } = await supabase
      .from('meal_plan_recipes')
      .select('recipe_data')
      .eq('meal_plan_id', mealPlanId)
      .neq('id', mealPlanRecipeId)

    const usedIngredients = existingRecipes
      ?.map(r => r.recipe_data?.ingredients?.[0]?.name?.toLowerCase())
      .filter(Boolean) || []

    // Get product mode and selected stores from stored preferences
    const productMode = storedPreferences.productMode || 'shopping-list'
    const selectedStores = storedPreferences.selectedStores || ['ICA', 'Coop', 'City Gross', 'Willys']
    const userId = storedPreferences.userId

    console.log('Product mode:', productMode, 'Selected stores:', selectedStores)

    let products = []

    // Handle different product modes
    if (productMode === 'shopping-list') {
      // Use shopping list items stored in meal plan preferences
      const shoppingListItems = storedPreferences.shoppingListItems || []

      if (shoppingListItems.length > 0) {
        products = shoppingListItems.map(item => ({
          name: item.name || 'Okänd produkt',
          price: item.price || 0,
          unit: item.unit || 'st'
        }))
      }

      console.log('Found', products.length, 'items from stored shopping list')

      if (products.length === 0) {
        return NextResponse.json(
          { error: 'Inköpslistan är tom eller kunde inte hittas. Försök med ett annat produktläge.' },
          { status: 400 }
        )
      }
    } else if (productMode === 'free-generate') {
      console.log('Free-generate mode: skipping product fetch')
    } else {
      // store-only or store-plus: Fetch products from database
      const { data: weekData, error: weekError } = await supabase
        .from('weeks')
        .select('id')
        .order('start_date', { ascending: false })
        .limit(1)
        .single()

      console.log('Week data:', weekData, 'Error:', weekError)

      if (weekData?.id) {
        // Filter by selected stores
        const { data: weekProducts } = await supabase
          .from('products')
          .select('*')
          .eq('week_id', weekData.id)
          .in('store', selectedStores)
          .limit(50)

        products = weekProducts || []
      }

      // If no products for current week, try to get any products from selected stores
      if (products.length === 0) {
        console.log('No products for current week, trying to get any products from selected stores')
        const { data: anyProducts } = await supabase
          .from('products')
          .select('*')
          .in('store', selectedStores)
          .limit(50)

        products = anyProducts || []
      }

      console.log('Found', products.length, 'products from stores:', selectedStores.join(', '))

      // Only require products for store-only mode
      if (productMode === 'store-only' && (!products || products.length === 0)) {
        return NextResponse.json(
          { error: `Inga produkter hittades för valda butiker. Välj fler butiker eller ändra produktläge.` },
          { status: 400 }
        )
      }
    }

    // Generate new recipe using stored preferences
    const recipe = await generateRecipe(
      anthropic,
      products,
      {
        servings: mealPlan?.servings || 4,
        maxCostPerServing: storedPreferences.maxCostPerServing || 50,
        diet: storedPreferences.diet || 'none',
        proteinType: storedPreferences.proteinType || 'any',
        cuisineStyle: storedPreferences.cuisineStyle || 'mixed',
        cookingTime: storedPreferences.cookingTime || 'medium',
        skillLevel: storedPreferences.skillLevel || 'easy',
        familyFriendly: storedPreferences.familyFriendly || false,
        productMode: productMode,
        excludedIngredients: storedPreferences.excludedIngredients || '',
        preferredIngredients: storedPreferences.preferredIngredients || ''
      },
      usedIngredients,
      dayNumber
    )

    // Update the recipe in the database
    const { error: updateError } = await supabase
      .from('meal_plan_recipes')
      .update({
        recipe_data: recipe
      })
      .eq('id', mealPlanRecipeId)

    if (updateError) {
      console.error('Error updating recipe:', updateError)
      return NextResponse.json(
        { error: `Failed to update recipe: ${updateError.message}` },
        { status: 500 }
      )
    }

    // Regenerate the shopping list
    if (mealPlanId) {
      await regenerateShoppingList(supabase, mealPlanId)
    }

    return NextResponse.json({
      success: true,
      recipe
    })

  } catch (error) {
    console.error('Error in regenerate-recipe API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function generateRecipe(anthropic, products, preferences, usedIngredients, dayNumber) {
  const productList = products
    .map(p => `- ${p.name}: ${p.price} kr/${p.unit}`)
    .join('\n')

  const excludeList = usedIngredients.length > 0
    ? `\n\nUNDVIK dessa huvudingredienser (redan använda): ${usedIngredients.join(', ')}`
    : ''

  // Build preference constraints (same as generate/route.js)
  const constraints = []

  // Diet restriction
  if (preferences.diet && preferences.diet !== 'none') {
    const dietLabels = {
      'vegetarian': 'Vegetariskt (inget kött eller fisk)',
      'vegan': 'Veganskt (inga animaliska produkter)',
      'pescatarian': 'Pescetarianskt (fisk ok, inget kött)',
      'high-protein': 'Högt proteininnehåll (minst 30g protein per portion)',
      'keto': 'Keto (mycket lite kolhydrater, högfett)',
      'low-carb': 'Låg kolhydrat (max 20g kolhydrater per portion)',
      'low-fat': 'Fettsnålt (minimera fett)',
      'gluten-free': 'Glutenfritt (inga glutenhaltiga ingredienser)',
      'dairy-free': 'Laktosfritt (inga mejeriprodukter)',
      'fodmap': 'Låg FODMAP (undvik lök, vitlök, vete, baljväxter)',
      'diabetic-friendly': 'Diabetesvänligt (lågt glykemiskt index, balanserade kolhydrater)'
    }
    constraints.push(`Kosthållning: ${dietLabels[preferences.diet] || preferences.diet}`)
  }

  // Protein type
  if (preferences.proteinType && preferences.proteinType !== 'any') {
    const proteinLabels = {
      'meat': 'Använd ENDAST kött (nöt, fläsk, lamm) som huvudprotein',
      'poultry': 'Använd ENDAST fågel (kyckling, kalkon) som huvudprotein',
      'fish': 'Använd ENDAST fisk eller skaldjur som huvudprotein',
      'plant-based': 'Använd ENDAST växtbaserat protein (bönor, linser, tofu, tempeh)',
      'eggs': 'Använd ägg som huvudprotein'
    }
    constraints.push(proteinLabels[preferences.proteinType])
  }

  // Cuisine style
  if (preferences.cuisineStyle && preferences.cuisineStyle !== 'mixed') {
    const cuisineLabels = {
      'swedish': 'Svensk husmanskost med traditionella svenska smaker',
      'mediterranean': 'Medelhavskök med olivolja, örter och grönsaker',
      'asian': 'Asiatiskt kök med soja, ingefära och asiatiska smaker',
      'mexican': 'Mexikanskt kök med lime, koriander och kryddor',
      'italian': 'Italienskt kök med tomat, basilika och parmesan',
      'indian': 'Indiskt kök med curry, gurkmeja och aromatiska kryddor',
      'american': 'Amerikanskt kök'
    }
    constraints.push(`Matstil: ${cuisineLabels[preferences.cuisineStyle] || preferences.cuisineStyle}`)
  }

  // Cooking time
  if (preferences.cookingTime && preferences.cookingTime !== 'any') {
    const timeLabels = {
      'quick': 'Total tillagningstid under 30 minuter',
      'medium': 'Total tillagningstid 30-60 minuter',
      'long': 'Tillagningstid över 60 minuter är ok (långkok, ugnsrätter)'
    }
    constraints.push(timeLabels[preferences.cookingTime])
  }

  // Skill level
  if (preferences.skillLevel && preferences.skillLevel !== 'any') {
    const skillLabels = {
      'easy': 'Enkelt recept med få steg och vanliga tekniker',
      'medium': 'Medelsvårt recept',
      'advanced': 'Avancerat recept med mer komplexa tekniker'
    }
    constraints.push(skillLabels[preferences.skillLevel])
  }

  // Family-friendly
  if (preferences.familyFriendly) {
    constraints.push('BARNVÄNLIGT: Undvik starka kryddor, chili, vitlök. Använd milda smaker som barn gillar.')
  }

  // Excluded ingredients
  if (preferences.excludedIngredients) {
    constraints.push(`Undvik dessa ingredienser: ${preferences.excludedIngredients}`)
  }

  // Preferred ingredients
  if (preferences.preferredIngredients) {
    constraints.push(`Försök inkludera dessa ingredienser om möjligt: ${preferences.preferredIngredients}`)
  }

  const constraintsText = constraints.length > 0
    ? '\n\nPREFERENSER:\n' + constraints.map(c => `- ${c}`).join('\n')
    : ''

  // Build prompt based on product mode
  const productMode = preferences.productMode || 'shopping-list'
  let prompt

  if (productMode === 'shopping-list') {
    // Shopping list mode - use only items from user's shopping list
    prompt = `Du är en svensk kock. Skapa ETT nytt recept baserat på produkterna i min inköpslista.

MIN INKÖPSLISTA:
${productList}
${excludeList}
${constraintsText}

KRAV:
- Max ${preferences.maxCostPerServing || 50} kr per portion
- ${preferences.servings || 4} portioner
- Använd ENDAST produkter från inköpslistan ovan
- Receptet ska vara för dag ${dayNumber} av 7
- Skapa ett NYTT och ANNORLUNDA recept

VIKTIGT: Svara ENDAST med JSON. Ingen annan text före eller efter JSON.

Svara med exakt detta JSON-format:
{
  "name": "Receptnamn på svenska",
  "description": "Kort beskrivning på svenska",
  "servings": ${preferences.servings || 4},
  "prepTime": "X min",
  "cookTime": "X min",
  "difficulty": "Lätt/Medel/Svår",
  "estimatedCost": "XX",
  "nutrition": {
    "calories": 450,
    "protein": 25,
    "carbs": 35,
    "fat": 20,
    "fiber": 8
  },
  "ingredients": [
    {"name": "Ingrediens", "amount": "X", "unit": "g/ml/st/msk"}
  ],
  "instructions": [
    "Steg 1...",
    "Steg 2..."
  ],
  "tips": "Valfritt tips"
}`
  } else if (productMode === 'free-generate') {
    // Free generate mode - no product list, just preferences
    prompt = `Du är en svensk kock. Skapa ETT nytt recept baserat på mina preferenser.
${excludeList}
${constraintsText}

KRAV:
- Max ${preferences.maxCostPerServing || 50} kr per portion (uppskattad kostnad)
- ${preferences.servings || 4} portioner
- Receptet ska vara för dag ${dayNumber} av 7
- Skapa ett NYTT och ANNORLUNDA recept
- Använd vanliga ingredienser som finns i svenska matbutiker

VIKTIGT: Svara ENDAST med JSON. Ingen annan text före eller efter JSON.

Svara med exakt detta JSON-format:
{
  "name": "Receptnamn på svenska",
  "description": "Kort beskrivning på svenska",
  "servings": ${preferences.servings || 4},
  "prepTime": "X min",
  "cookTime": "X min",
  "difficulty": "Lätt/Medel/Svår",
  "estimatedCost": "XX",
  "nutrition": {
    "calories": 450,
    "protein": 25,
    "carbs": 35,
    "fat": 20,
    "fiber": 8
  },
  "ingredients": [
    {"name": "Ingrediens", "amount": "X", "unit": "g/ml/st/msk"}
  ],
  "instructions": [
    "Steg 1...",
    "Steg 2..."
  ],
  "tips": "Valfritt tips"
}`
  } else if (productMode === 'store-plus') {
    // Store-plus mode - use products as base but allow additional ingredients
    prompt = `Du är en svensk kock. Skapa ETT nytt recept som använder produkter från veckans erbjudanden.

VECKANS ERBJUDANDEN (använd gärna dessa):
${productList}
${excludeList}
${constraintsText}

KRAV:
- Max ${preferences.maxCostPerServing || 50} kr per portion
- ${preferences.servings || 4} portioner
- Försök använda produkter från listan ovan för att spara pengar
- Du FÅR också använda andra vanliga ingredienser som inte finns i listan
- Receptet ska vara för dag ${dayNumber} av 7
- Skapa ett NYTT och ANNORLUNDA recept

VIKTIGT: Svara ENDAST med JSON. Ingen annan text före eller efter JSON.

Svara med exakt detta JSON-format:
{
  "name": "Receptnamn på svenska",
  "description": "Kort beskrivning på svenska",
  "servings": ${preferences.servings || 4},
  "prepTime": "X min",
  "cookTime": "X min",
  "difficulty": "Lätt/Medel/Svår",
  "estimatedCost": "XX",
  "nutrition": {
    "calories": 450,
    "protein": 25,
    "carbs": 35,
    "fat": 20,
    "fiber": 8
  },
  "ingredients": [
    {"name": "Ingrediens", "amount": "X", "unit": "g/ml/st/msk"}
  ],
  "instructions": [
    "Steg 1...",
    "Steg 2..."
  ],
  "tips": "Valfritt tips"
}`
  } else {
    // Default store-only mode - only use listed products
    prompt = `Du är en svensk kock. Skapa ETT nytt recept baserat på dessa produkter.

TILLGÄNGLIGA PRODUKTER:
${productList}
${excludeList}
${constraintsText}

KRAV:
- Max ${preferences.maxCostPerServing || 50} kr per portion
- ${preferences.servings || 4} portioner
- Använd minst 3 produkter från listan ovan
- Receptet ska vara för dag ${dayNumber} av 7
- Skapa ett NYTT och ANNORLUNDA recept

VIKTIGT: Svara ENDAST med JSON. Ingen annan text före eller efter JSON.

Svara med exakt detta JSON-format:
{
  "name": "Receptnamn på svenska",
  "description": "Kort beskrivning på svenska",
  "servings": ${preferences.servings || 4},
  "prepTime": "X min",
  "cookTime": "X min",
  "difficulty": "Lätt/Medel/Svår",
  "estimatedCost": "XX",
  "nutrition": {
    "calories": 450,
    "protein": 25,
    "carbs": 35,
    "fat": 20,
    "fiber": 8
  },
  "ingredients": [
    {"name": "Ingrediens", "amount": "X", "unit": "g/ml/st/msk"}
  ],
  "instructions": [
    "Steg 1...",
    "Steg 2..."
  ],
  "tips": "Valfritt tips"
}`
  }

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ],
  })

  const responseText = message.content[0].text.trim()

  let jsonStr = responseText

  const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim()
  }

  const jsonStartIndex = jsonStr.indexOf('{')
  const jsonEndIndex = jsonStr.lastIndexOf('}')

  if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
    jsonStr = jsonStr.substring(jsonStartIndex, jsonEndIndex + 1)
  }

  try {
    const recipe = JSON.parse(jsonStr)
    return recipe
  } catch (parseError) {
    console.error('JSON parse error. Response was:', responseText.substring(0, 200))
    throw new Error(`Could not parse recipe JSON: ${parseError.message}`)
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
