import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { canPerformAction, incrementUsage } from '@/lib/subscription'
import { createTrackedClaude } from '@/lib/claudeUsageTracker'

// Don't create clients at top level - do it inside the function

export async function POST(request) {
  try {
    // Create clients INSIDE the function
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const anthropic = createTrackedClaude('meal-plan-generate', { userId })

    const preferences = await request.json()

    console.log('📝 Received preferences:', preferences)

    // Get product mode and selected stores
    const productMode = preferences.productMode || 'shopping-list'
    const selectedStores = preferences.selectedStores || ['ICA', 'Coop', 'City Gross', 'Willys']
    const userId = preferences.userId

    // Check subscription limits before generating
    if (userId) {
      const { allowed, reason, upgradePath } = await canPerformAction(userId, 'create_meal_plan')
      if (!allowed) {
        return NextResponse.json(
          {
            error: reason,
            limitReached: true,
            upgradePath,
          },
          { status: 403 }
        )
      }
    }

    console.log('Product mode:', productMode, 'Selected stores:', selectedStores, 'User ID:', userId)

    let products = []

    // Handle different product modes
    if (productMode === 'shopping-list') {
      // Use shopping list items passed from frontend
      const shoppingListItems = preferences.shoppingListItems || []

      if (shoppingListItems.length > 0) {
        // Convert shopping list items to product format
        products = shoppingListItems.map(item => ({
          name: item.name || 'Okänd produkt',
          price: item.price || 0,
          unit: item.unit || 'st'
        }))
      }

      console.log('Found', products.length, 'items from shopping list')

      if (products.length === 0) {
        return NextResponse.json(
          { error: 'Din inköpslista är tom. Lägg till produkter i din inköpslista eller välj ett annat produktläge.' },
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
          { error: `Inga produkter hittades för valda butiker (${selectedStores.join(', ')}). Välj fler butiker eller använd "Generera fritt".` },
          { status: 400 }
        )
      }
    }

    console.log(`📦 Found ${products.length} products (mode: ${productMode})`)

    // Create meal plan FIRST so it's saved even if user leaves
    const { data: mealPlan, error: planError } = await supabase
      .from('meal_plans')
      .insert({
        name: `Veckoplan ${new Date().toLocaleDateString('sv-SE')}`,
        week_start_date: getMonday(new Date()).toISOString().split('T')[0],
        total_cost: '0',
        servings: preferences.servings || 4,
        preferences: preferences,
        user_id: userId || null
      })
      .select()
      .single()

    if (planError) {
      console.error('Error creating meal plan:', planError)
      throw new Error('Kunde inte skapa veckoplan')
    }

    const mealPlanId = mealPlan.id
    console.log(`📋 Created meal plan: ${mealPlanId}`)

    // Generate recipes for each day and save immediately
    const recipes = []
    const usedMainIngredients = []
    const totalDays = preferences.days || 7

    for (let day = 1; day <= totalDays; day++) {
      console.log(`🍳 Generating recipe for day ${day}...`)

      let recipe
      try {
        recipe = await generateRecipe(
          anthropic,
          products,
          preferences,
          usedMainIngredients,
          day
        )

        if (recipe.ingredients && recipe.ingredients.length > 0) {
          usedMainIngredients.push(recipe.ingredients[0].name.toLowerCase())
        }

        console.log(`✅ Day ${day}: ${recipe.name}`)

      } catch (recipeError) {
        console.error(`❌ Failed to generate recipe for day ${day}:`, recipeError.message)

        recipe = {
          name: `Dag ${day} - Recept kunde inte genereras`,
          description: 'Försök igen senare',
          servings: preferences.servings || 4,
          prepTime: '30 min',
          cookTime: '30 min',
          difficulty: 'Medel',
          estimatedCost: '0',
          ingredients: [],
          instructions: ['Recept kunde inte genereras'],
          tips: ''
        }
      }

      recipes.push(recipe)

      // Save recipe immediately after generation
      const { error: recipeError } = await supabase
        .from('meal_plan_recipes')
        .insert({
          meal_plan_id: mealPlanId,
          day_number: day,
          recipe_data: recipe
        })

      if (recipeError) {
        console.error(`Error saving recipe for day ${day}:`, recipeError)
      }

      if (day < totalDays) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    const totalCost = recipes.reduce((sum, r) => {
      const cost = parseFloat(r.estimatedCost) || 0
      return sum + cost
    }, 0)

    const avgCostPerServing = (totalCost / totalDays / (preferences.servings || 4)).toFixed(2)

    console.log(`✅ Generated ${recipes.length} recipes, total cost: ${totalCost} kr`)

    // Update meal plan with final cost and generate shopping list
    await finalizeMealPlan(supabase, mealPlanId, recipes, totalCost, userId)

    // Increment usage counter for subscription tracking
    if (userId) {
      await incrementUsage(userId, 'create_meal_plan')
    }

    return NextResponse.json({
      recipes,
      totalCost: totalCost.toFixed(2),
      avgCostPerServing,
      generatedAt: new Date().toISOString(),
      mealPlanId
    })

  } catch (error) {
    console.error('❌ Meal plan generation error:', error)
    return NextResponse.json(
      { error: error.message || 'Ett fel uppstod vid generering av veckomeny' },
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

  // Build preference constraints
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

  // Family/Household constraints - overrides individual preferences when enabled
  if (preferences.useHousehold && preferences.householdRestrictions) {
    const hr = preferences.householdRestrictions
    const familyMembers = preferences.familyMembers || []

    // Add family context
    if (familyMembers.length > 0) {
      const memberNames = familyMembers.map(m => m.name).join(', ')
      constraints.push(`FAMILJ (${familyMembers.length} personer: ${memberNames})`)
    }

    // Diet type from family (strictest wins: vegan > vegetarian > pescatarian > none)
    if (hr.diet_type && hr.diet_type !== 'none') {
      const dietLabels = {
        'vegetarian': 'Vegetariskt (en familjemedlem är vegetarian, så ALLA rätter måste vara vegetariska)',
        'vegan': 'Veganskt (en familjemedlem är vegan, så ALLA rätter måste vara veganska)',
        'pescatarian': 'Pescetarianskt (en familjemedlem är pescetarian, så INGA köttprodukter)'
      }
      constraints.push(`FAMILJENS KOST: ${dietLabels[hr.diet_type] || hr.diet_type}`)
    }

    // Allergies - MUST avoid
    if (hr.allergies && hr.allergies.length > 0) {
      constraints.push(`ALLERGIER (MÅSTE UNDVIKAS): ${hr.allergies.join(', ')} - Dessa ingredienser får INTE finnas i receptet`)
    }

    // Intolerances - MUST avoid
    if (hr.intolerances && hr.intolerances.length > 0) {
      constraints.push(`INTOLERANSER (MÅSTE UNDVIKAS): ${hr.intolerances.join(', ')}`)
    }

    // Dislikes - try to avoid
    if (hr.dislikes && hr.dislikes.length > 0) {
      constraints.push(`OGILLAR (försök undvika): ${hr.dislikes.join(', ')}`)
    }
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
    prompt = `Du är en svensk kock. Skapa ETT recept baserat på produkterna i min inköpslista.

MIN INKÖPSLISTA:
${productList}
${excludeList}
${constraintsText}

KRAV:
- Max ${preferences.maxCostPerServing || preferences.maxCost || 50} kr per portion
- ${preferences.servings || 4} portioner
- Använd ENDAST produkter från inköpslistan ovan
- Receptet ska vara för dag ${dayNumber} av ${preferences.days || 7}

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
    prompt = `Du är en svensk kock. Skapa ETT recept baserat på mina preferenser.
${excludeList}
${constraintsText}

KRAV:
- Max ${preferences.maxCostPerServing || preferences.maxCost || 50} kr per portion (uppskattad kostnad)
- ${preferences.servings || 4} portioner
- Receptet ska vara för dag ${dayNumber} av ${preferences.days || 7}
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
    prompt = `Du är en svensk kock. Skapa ETT recept som använder produkter från veckans erbjudanden.

VECKANS ERBJUDANDEN (använd gärna dessa):
${productList}
${excludeList}
${constraintsText}

KRAV:
- Max ${preferences.maxCostPerServing || preferences.maxCost || 50} kr per portion
- ${preferences.servings || 4} portioner
- Försök använda produkter från listan ovan för att spara pengar
- Du FÅR också använda andra vanliga ingredienser som inte finns i listan
- Receptet ska vara för dag ${dayNumber} av ${preferences.days || 7}

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
    prompt = `Du är en svensk kock. Skapa ETT recept baserat på dessa produkter.

TILLGÄNGLIGA PRODUKTER:
${productList}
${excludeList}
${constraintsText}

KRAV:
- Max ${preferences.maxCostPerServing || preferences.maxCost || 50} kr per portion
- ${preferences.servings || 4} portioner
- Använd minst 3 produkter från listan ovan
- Receptet ska vara för dag ${dayNumber} av ${preferences.days || 7}

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

async function finalizeMealPlan(supabase, mealPlanId, recipes, totalCost, userId) {
  try {
    // 1. Update meal plan with final total cost
    const { error: updateError } = await supabase
      .from('meal_plans')
      .update({ total_cost: totalCost.toFixed(2) })
      .eq('id', mealPlanId)

    if (updateError) {
      console.error('Error updating meal plan cost:', updateError)
    }

    // 2. Generate and save shopping list
    const shoppingList = generateShoppingList(recipes)

    const { error: listError } = await supabase
      .from('shopping_lists')
      .insert({
        meal_plan_id: mealPlanId,
        items: shoppingList,
        total_cost: totalCost.toFixed(2),
        user_id: userId || null
      })

    if (listError) {
      console.error('Error saving shopping list:', listError)
    }

    console.log('✅ Meal plan finalized with shopping list')

  } catch (error) {
    console.error('Error in finalizeMealPlan:', error)
  }
}

function generateShoppingList(recipes) {
  const items = {}

  recipes.forEach((recipe, dayIndex) => {
    recipe.ingredients?.forEach(ingredient => {
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

function getMonday(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.setDate(diff))
}
