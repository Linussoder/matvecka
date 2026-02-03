import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createTrackedClaude } from '@/lib/claudeUsageTracker'
import { getUserSubscription } from '@/lib/subscription'

export async function POST(request) {
  try {
    const cookieStore = await cookies()

    // Create Supabase client for auth
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

    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Du måste vara inloggad' },
        { status: 401 }
      )
    }

    // Check premium subscription
    const { plan } = await getUserSubscription(user.id)

    if (plan !== 'premium') {
      return NextResponse.json(
        {
          error: 'Receptimport kräver Premium-prenumeration',
          upgradePath: '/pricing'
        },
        { status: 403 }
      )
    }

    // Get URL from request
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json(
        { error: 'URL saknas' },
        { status: 400 }
      )
    }

    // Validate URL format
    let parsedUrl
    try {
      parsedUrl = new URL(url)
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Invalid protocol')
      }
    } catch {
      return NextResponse.json(
        { error: 'Ogiltig URL. Ange en komplett webbadress (t.ex. https://koket.se/recept)' },
        { status: 400 }
      )
    }

    console.log(`📥 Importing recipe from: ${url}`)

    // Fetch URL content
    let pageContent
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Matvecka/1.0; +https://matvecka.se)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'sv-SE,sv;q=0.9,en;q=0.8',
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      pageContent = await response.text()
    } catch (fetchError) {
      console.error('Fetch error:', fetchError)
      return NextResponse.json(
        { error: 'Kunde inte hämta sidan. Kontrollera att URL:en är korrekt och tillgänglig.' },
        { status: 400 }
      )
    }

    // Strip HTML to get text content (basic extraction)
    const textContent = stripHtmlForAI(pageContent)

    if (textContent.length < 100) {
      return NextResponse.json(
        { error: 'Sidan verkar inte innehålla tillräckligt med innehåll för att extrahera ett recept.' },
        { status: 400 }
      )
    }

    // Limit content size to avoid token limits
    const truncatedContent = textContent.substring(0, 15000)

    console.log(`📝 Extracted ${truncatedContent.length} characters of text`)

    // Create tracked Anthropic client
    const anthropic = createTrackedClaude('recipe-import', { userId: user.id })

    // Send to Claude for extraction
    const prompt = `Du är en receptexpert. Extrahera receptinformation från denna webbsida.

WEBBSIDANS INNEHÅLL:
${truncatedContent}

INSTRUKTIONER:
1. Hitta och extrahera receptet från texten
2. Översätt till svenska om receptet är på annat språk
3. Standardisera måttenheter (dl, msk, tsk, g, kg, st)
4. Uppskatta näringsvärden per portion om de inte finns

Returnera ENDAST valid JSON utan markdown-formattering:
{
  "name": "Receptnamn på svenska",
  "description": "Kort beskrivning (1-2 meningar)",
  "servings": 4,
  "prepTime": "X min",
  "cookTime": "X min",
  "difficulty": "Lätt/Medel/Svår",
  "nutrition": {
    "calories": 450,
    "protein": 25,
    "carbs": 35,
    "fat": 20,
    "fiber": 8
  },
  "ingredients": [
    {"name": "Ingrediens", "amount": "100", "unit": "g"}
  ],
  "instructions": [
    "Steg 1...",
    "Steg 2..."
  ],
  "tips": "Eventuella tips från receptet"
}

Om du INTE kan hitta ett recept på sidan, returnera:
{"error": "Kunde inte hitta ett recept på denna sida"}`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
    })

    const responseText = message.content[0].text.trim()

    // Parse JSON response
    let recipe
    try {
      let jsonStr = responseText

      // Remove markdown code blocks if present
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim()
      }

      // Find JSON object
      const jsonStartIndex = jsonStr.indexOf('{')
      const jsonEndIndex = jsonStr.lastIndexOf('}')

      if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
        jsonStr = jsonStr.substring(jsonStartIndex, jsonEndIndex + 1)
      }

      recipe = JSON.parse(jsonStr)
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Response:', responseText.substring(0, 200))
      return NextResponse.json(
        { error: 'Kunde inte tolka receptet. Försök med en annan URL.' },
        { status: 500 }
      )
    }

    // Check if AI returned an error
    if (recipe.error) {
      return NextResponse.json(
        { error: recipe.error },
        { status: 400 }
      )
    }

    // Validate required fields
    if (!recipe.name || !recipe.ingredients || recipe.ingredients.length === 0) {
      return NextResponse.json(
        { error: 'Kunde inte extrahera ett komplett recept. Försök med en annan URL.' },
        { status: 400 }
      )
    }

    // Add source URL to recipe
    recipe.source_url = url
    recipe.source_domain = parsedUrl.hostname

    console.log(`✅ Successfully imported recipe: ${recipe.name}`)

    return NextResponse.json({
      success: true,
      recipe
    })

  } catch (error) {
    console.error('Recipe import error:', error)
    return NextResponse.json(
      { error: 'Ett fel uppstod vid import av receptet' },
      { status: 500 }
    )
  }
}

/**
 * Strip HTML tags and extract readable text for AI processing
 */
function stripHtmlForAI(html) {
  // Remove script and style elements completely
  let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')

  // Remove HTML comments
  text = text.replace(/<!--[\s\S]*?-->/g, '')

  // Remove all HTML tags
  text = text.replace(/<[^>]+>/g, ' ')

  // Decode common HTML entities
  text = text.replace(/&nbsp;/g, ' ')
  text = text.replace(/&amp;/g, '&')
  text = text.replace(/&lt;/g, '<')
  text = text.replace(/&gt;/g, '>')
  text = text.replace(/&quot;/g, '"')
  text = text.replace(/&#39;/g, "'")
  text = text.replace(/&auml;/g, 'ä')
  text = text.replace(/&ouml;/g, 'ö')
  text = text.replace(/&aring;/g, 'å')
  text = text.replace(/&Auml;/g, 'Ä')
  text = text.replace(/&Ouml;/g, 'Ö')
  text = text.replace(/&Aring;/g, 'Å')

  // Normalize whitespace
  text = text.replace(/\s+/g, ' ')

  // Trim
  text = text.trim()

  return text
}
