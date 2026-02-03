import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createTrackedClaude } from '@/lib/claudeUsageTracker'
import { canPerformAction } from '@/lib/subscription'

// POST - Get recipe suggestions based on pantry items
export async function POST(request) {
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

    // Check premium status
    const { allowed, reason, upgradePath } = await canPerformAction(user.id, 'use_leftovers')
    if (!allowed) {
      return NextResponse.json(
        { error: reason, requiresPremium: true, upgradePath },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { ingredients, preferences = {} } = body

    if (!ingredients || ingredients.length === 0) {
      return NextResponse.json(
        { error: 'At least one ingredient is required' },
        { status: 400 }
      )
    }

    const anthropic = createTrackedClaude('leftovers-suggestions', { userId: user.id })

    // Build the prompt
    const ingredientList = ingredients.map(i =>
      typeof i === 'string' ? i : `${i.ingredient_name} (${i.quantity || ''} ${i.unit || ''})`
    ).join(', ')

    // Build constraints from preferences
    const constraints = []
    if (preferences.diet && preferences.diet !== 'none') {
      const dietLabels = {
        'vegetarian': 'Vegetariskt',
        'vegan': 'Veganskt',
        'pescatarian': 'Pescetarianskt',
      }
      constraints.push(`Kost: ${dietLabels[preferences.diet] || preferences.diet}`)
    }
    if (preferences.cookingTime === 'quick') {
      constraints.push('Snabb tillagning (under 30 minuter)')
    }

    const constraintsText = constraints.length > 0
      ? `\nPREFERENSER:\n${constraints.join('\n')}`
      : ''

    const prompt = `Du är en svensk kock. Föreslå 3 enkla recept baserade på dessa ingredienser som någon har hemma:

TILLGÄNGLIGA INGREDIENSER:
${ingredientList}
${constraintsText}

KRAV:
- Recepten SKA använda så många av ingredienserna ovan som möjligt
- Fokusera på enkla, snabba rätter
- Få eller inga extra ingredienser behövs (max 3-4 basvaror som salt, olja, kryddor)
- Svenska recept med svenska mått

VIKTIGT: Svara ENDAST med JSON. Ingen annan text före eller efter JSON.

Svara med exakt detta JSON-format:
{
  "suggestions": [
    {
      "name": "Receptnamn",
      "description": "Kort beskrivning",
      "usesIngredients": ["ingrediens1", "ingrediens2"],
      "additionalIngredients": ["salt", "peppar"],
      "prepTime": "X min",
      "difficulty": "Lätt/Medel",
      "servings": 4,
      "ingredients": [
        {"name": "Ingrediens", "amount": "X", "unit": "g/ml/st"}
      ],
      "instructions": [
        "Steg 1...",
        "Steg 2..."
      ]
    }
  ]
}`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    const responseText = message.content[0].text.trim()

    // Parse JSON from response
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

    const result = JSON.parse(jsonStr)

    return NextResponse.json({
      success: true,
      suggestions: result.suggestions || [],
      usedIngredients: ingredients
    })

  } catch (error) {
    console.error('Leftover suggestions error:', error)
    return NextResponse.json(
      { error: error.message || 'Kunde inte generera förslag' },
      { status: 500 }
    )
  }
}
