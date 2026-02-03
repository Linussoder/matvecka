import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createTrackedClaude } from '@/lib/claudeUsageTracker'

const anthropic = createTrackedClaude('ads-generate')

const audiencePrompts = {
  families: 'svenska familjer med barn, fokusera på barnvänlig mat, tidsbesparingar och enkel matplanering',
  health: 'hälsomedvetna vuxna, fokusera på näringsvärden, hälsosamma val och balanserad kost',
  budget: 'prismedvetna konsumenter, fokusera på besparingar, bra deals och smart shopping',
  foodies: 'matentusiaster, fokusera på nya spännande recept, matkreativitet och kulinariska upptäckter',
  busy: 'upptagna yrkespersoner, fokusera på snabbhet, enkelhet och minimal planering'
}

const campaignPrompts = {
  premium: 'marknadsföring av Premium-prenumeration med obegränsade matplaner, PDF-export och näringsspårning',
  features: 'visa upp nya app-funktioner och förbättringar',
  seasonal: 'säsongsbetonad kampanj passande för aktuell högtid',
  deals: 'veckans bästa erbjudanden och prisjämförelser',
  recipes: 'populära och inspirerande recept'
}

const tonePrompts = {
  friendly: 'vänlig, avslappnad och inbjudande ton',
  professional: 'professionell och informativ ton',
  fun: 'lekfull, kul och engagerande ton med emojis',
  urgent: 'brådskande och actiondriven ton som skapar FOMO'
}

export async function POST(req) {
  try {
    // Check admin auth
    const cookieStore = await cookies()
    const adminAuth = cookieStore.get('admin_session')
    if (!adminAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { audience, campaignType, tone, customPrompt } = body
    const platforms = body.platforms || (body.platform ? [body.platform] : ['instagram'])

    const systemPrompt = `Du är en expert på svensk digital marknadsföring för matappar. Du skapar engagerande innehåll för sociala medier.

Appen heter "Matvecka" - en AI-driven matplaneringsapp som hjälper svenska familjer planera veckans mat, jämföra priser mellan ICA, Coop och Willys, och spara pengar.

Svara ALLTID på svenska.`

    const userPrompt = `Skapa marknadsföringsmaterial för Matvecka med följande specifikationer:

MÅLGRUPP: ${audiencePrompts[audience] || 'svenska familjer'}

KAMPANJTYP: ${campaignPrompts[campaignType] || 'allmän marknadsföring'}

TON: ${tonePrompts[tone] || 'vänlig och inbjudande'}

PLATTFORMAR: ${platforms.join(', ')}

${customPrompt ? `EXTRA INSTRUKTIONER: ${customPrompt}` : ''}

Returnera ett JSON-objekt med följande struktur:
{
  "caption": "Huvudtext för inlägget (2-3 meningar, inkludera call to action)",
  "hashtags": ["relevanta", "svenska", "hashtags"],
  "alternatives": [
    "Alternativ version 1 av texten",
    "Alternativ version 2 av texten"
  ],
  "imagePrompts": [
    "Detaljerad bildprompt på engelska för DALL-E/Midjourney att generera passande bild",
    "Alternativ bildprompt"
  ],
  "ctas": ["Call to action 1", "Call to action 2", "Call to action 3"],
  "bestPostTime": "Rekommenderad tid att posta för svensk publik"
}

Returnera ENDAST valid JSON, ingen annan text.`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        { role: 'user', content: userPrompt }
      ],
      system: systemPrompt
    })

    const responseText = message.content[0].text

    // Try to parse JSON from response
    let content
    try {
      // Find JSON in response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        content = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found')
      }
    } catch (parseError) {
      // Return raw response if parsing fails
      content = {
        caption: responseText,
        hashtags: ['matvecka', 'matplanering', 'sparapengar'],
        alternatives: [],
        imagePrompts: [],
        ctas: ['Ladda ner appen idag!', 'Prova gratis']
      }
    }

    return NextResponse.json({
      success: true,
      content
    })
  } catch (error) {
    console.error('Ad generation error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
