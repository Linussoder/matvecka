import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Use service role key for server-side operations (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const preferences = await request.json()

    console.log('Received preferences:', preferences)

    // Fetch products from database
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(30)

    if (productsError) {
      console.error('Products fetch error:', productsError)
      throw productsError
    }

    if (!products || products.length === 0) {
      return NextResponse.json(
        { error: 'Inga produkter i databasen.' },
        { status: 400 }
      )
    }

    console.log(`Found ${products.length} products`)

    // Generate 7 recipes
    const recipes = []
    const usedMainIngredients = []

    for (let day = 1; day <= 7; day++) {
      console.log(`Generating recipe for day ${day}...`)

      try {
        const recipe = await generateRecipe(
          products,
          preferences,
          usedMainIngredients,
          day
        )

        recipes.push(recipe)

        // Track main ingredient to avoid repetition
        if (recipe.ingredients && recipe.ingredients.length > 0) {
          usedMainIngredients.push(recipe.ingredients[0].name.toLowerCase())
        }

        console.log(`Day ${day}: ${recipe.name}`)

      } catch (recipeError) {
        console.error(`Failed to generate recipe for day ${day}:`, recipeError.message)

        // Add a fallback recipe
        recipes.push({
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
        })
      }

      // Small delay between requests to avoid rate limiting
      if (day < 7) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    // Calculate totals
    const totalCost = recipes.reduce((sum, r) => {
      const cost = parseFloat(r.estimatedCost) || 0
      return sum + cost
    }, 0)

    const avgCostPerServing = (totalCost / 7 / (preferences.servings || 4)).toFixed(2)

    console.log(`Generated ${recipes.length} recipes, total cost: ${totalCost} kr`)

    // Save meal plan to database
    const mealPlanId = await saveMealPlan(recipes, preferences, totalCost)

    return NextResponse.json({
      recipes,
      totalCost: totalCost.toFixed(2),
      avgCostPerServing,
      generatedAt: new Date().toISOString(),
      mealPlanId
    })

  } catch (error) {
    console.error('Meal plan generation error:', error)
    return NextResponse.json(
      { error: error.message || 'Ett fel uppstod vid generering av matplan' },
      { status: 500 }
    )
  }
}

async function generateRecipe(products, preferences, usedIngredients, dayNumber) {
  const productList = products
    .map(p => `- ${p.name}: ${p.price} kr/${p.unit}`)
    .join('\n')

  const excludeList = usedIngredients.length > 0
    ? `\n\nUNDVIK dessa huvudingredienser (redan använda): ${usedIngredients.join(', ')}`
    : ''

  const dietRestriction = preferences.diet && preferences.diet !== 'none'
    ? `\nKosthållning: ${preferences.diet}`
    : ''

  const excludedIngredients = preferences.excludedIngredients
    ? `\nUndvik dessa ingredienser: ${preferences.excludedIngredients}`
    : ''

  const prompt = `Du är en svensk kock. Skapa ETT recept baserat på dessa produkter.

TILLGÄNGLIGA PRODUKTER:
${productList}
${excludeList}
${dietRestriction}
${excludedIngredients}

KRAV:
- Max ${preferences.maxCost || 50} kr per portion
- ${preferences.servings || 4} portioner
- Använd minst 3 produkter från listan ovan
- Receptet ska vara för dag ${dayNumber} av 7

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
  "ingredients": [
    {"name": "Ingrediens", "amount": "X", "unit": "g/ml/st/msk"}
  ],
  "instructions": [
    "Steg 1...",
    "Steg 2..."
  ],
  "tips": "Valfritt tips"
}`

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

  // Try to extract JSON from the response
  let jsonStr = responseText

  // If response contains markdown code blocks, extract the JSON
  const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim()
  }

  // If response starts with text before JSON, try to find the JSON object
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

async function saveMealPlan(recipes, preferences, totalCost) {
  try {
    // 1. Create meal plan
    const { data: mealPlan, error: planError } = await supabase
      .from('meal_plans')
      .insert({
        name: `Veckoplan ${new Date().toLocaleDateString('sv-SE')}`,
        week_start_date: getMonday(new Date()).toISOString().split('T')[0],
        total_cost: totalCost.toFixed(2),
        servings: preferences.servings || 4
      })
      .select()
      .single()

    if (planError) {
      console.error('Error creating meal plan:', planError)
      throw planError
    }

    // 2. Save each recipe
    const recipeInserts = recipes.map((recipe, index) => ({
      meal_plan_id: mealPlan.id,
      day_number: index + 1,
      recipe_data: recipe
    }))

    const { error: recipesError } = await supabase
      .from('meal_plan_recipes')
      .insert(recipeInserts)

    if (recipesError) {
      console.error('Error saving recipes:', recipesError)
      throw recipesError
    }

    // 3. Generate and save shopping list
    const shoppingList = generateShoppingList(recipes)

    const { error: listError } = await supabase
      .from('shopping_lists')
      .insert({
        meal_plan_id: mealPlan.id,
        items: shoppingList,
        total_cost: totalCost.toFixed(2)
      })

    if (listError) {
      console.error('Error saving shopping list:', listError)
      throw listError
    }

    return mealPlan.id

  } catch (error) {
    console.error('Error in saveMealPlan:', error)
    throw error
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
