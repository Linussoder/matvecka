import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request) {
  try {
    const preferences = await request.json()

    // 1. Fetch available products
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .limit(30)

    if (error) throw error

    // 2. Generate 3 recipes (faster, change to 7 for full week)
    const recipes = []
    const usedIngredients = new Set()
    const recipeCount = 3

    for (let day = 1; day <= recipeCount; day++) {
      const recipe = await generateRecipe(products, preferences, usedIngredients)

      // Track used ingredients
      recipe.ingredients.slice(0, 2).forEach(ing => {
        usedIngredients.add(ing.name.toLowerCase())
      })

      recipes.push(recipe)

      // Rate limit between requests
      if (day < recipeCount) {
        await sleep(1000)
      }
    }

    // 3. Calculate totals
    const totalCost = recipes.reduce((sum, r) => sum + (parseFloat(r.estimatedCost) || 0), 0)
    const avgCostPerServing = (totalCost / recipes.length).toFixed(2)

    return NextResponse.json({
      recipes,
      totalCost: totalCost.toFixed(2),
      avgCostPerServing,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Meal plan generation error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

async function generateRecipe(products, preferences, usedIngredients) {
  // Build product list
  const productList = products
    .filter(p => {
      // Filter out heavily used ingredients
      const ingredientCount = Array.from(usedIngredients)
        .filter(ing => p.name.toLowerCase().includes(ing)).length
      return ingredientCount < 2
    })
    .map(p => `- ${p.name}: ${p.price} kr/${p.unit}`)
    .join('\n')

  // Build constraints
  const constraints = []
  constraints.push(`- Max kostnad per portion: ${preferences.maxCostPerServing || 60} kr`)
  constraints.push(`- Antal portioner: ${preferences.servings || 4}`)
  constraints.push(`- Max tillagningstid: 45 minuter`)

  if (preferences.diet && preferences.diet !== 'none') {
    const dietMap = {
      'vegetarian': 'Vegetariskt (inget kött/fisk)',
      'vegan': 'Veganskt (inga animaliska produkter)',
      'pescatarian': 'Pescetarianskt (fisk ok, inget kött)',
      'keto': 'Keto (låg kolhydrater)',
      'low-carb': 'Låg kolhydrater'
    }
    constraints.push(`- Kost: ${dietMap[preferences.diet]}`)
  }

  if (preferences.excludedIngredients) {
    constraints.push(`- Undvik: ${preferences.excludedIngredients}`)
  }

  if (usedIngredients.size > 0) {
    constraints.push(`- Undvik dessa ingredienser (använts nyligen): ${Array.from(usedIngredients).join(', ')}`)
  }

  const prompt = `Du är en svensk kock som skapar prisvärdiga och smakrika recept.

TILLGÄNGLIGA PRODUKTER DENNA VECKA:
${productList}

KRAV:
${constraints.join('\n')}

Skapa ett komplett recept som:
1. Använder ENDAST produkter från listan ovan
2. Är praktiskt och enkelt att laga
3. Är kostnadseffektivt
4. Passar svenska smaklökar

Svara ENDAST med JSON (ingen annan text):
{
  "name": "Receptnamn på svenska",
  "description": "Kort beskrivning",
  "servings": 4,
  "prepTime": "15 min",
  "cookTime": "30 min",
  "difficulty": "Lätt",
  "ingredients": [
    {
      "name": "Produktnamn exakt som i listan",
      "amount": "500",
      "unit": "g",
      "notes": "hackad"
    }
  ],
  "instructions": [
    "Steg 1 med detaljerad instruktion",
    "Steg 2 med detaljerad instruktion"
  ],
  "estimatedCost": "95",
  "tips": "Valfritt tips för extra smak"
}`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  })

  let responseText = message.content[0].text

  // Strip markdown code blocks if present (handles ```json, ``` json, ```\n, etc.)
  responseText = responseText
    .replace(/^```(?:json)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim()

  // Find JSON object in response if still not clean
  const jsonMatch = responseText.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    responseText = jsonMatch[0]
  }

  const recipe = JSON.parse(responseText)

  return recipe
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
