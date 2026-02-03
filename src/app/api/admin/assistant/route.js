import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { createTrackedClaude } from '@/lib/claudeUsageTracker'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const anthropic = createTrackedClaude('admin-assistant')

const DB_SCHEMA = `
Tillgängliga tabeller i databasen:

1. auth.users - Användare
   - id (uuid, primary key)
   - email (text)
   - created_at (timestamp)
   - last_sign_in_at (timestamp)

2. user_preferences - Användarpreferenser
   - user_id (uuid, references auth.users)
   - diet_type (text)
   - allergies (text[])
   - servings (int)
   - max_cost_per_serving (int)
   - cuisine_style (text)

3. meal_plans - Matplaner
   - id (uuid, primary key)
   - user_id (uuid)
   - days (int)
   - servings (int)
   - recipes (jsonb)
   - created_at (timestamp)

4. user_subscriptions - Prenumerationer
   - user_id (uuid)
   - plan (text: 'free', 'premium')
   - status (text)
   - current_period_start (timestamp)
   - current_period_end (timestamp)

5. usage_tracking - Användningsspårning
   - user_id (uuid)
   - period_start (date)
   - meal_plans_generated (int)
   - recipes_regenerated (int)

6. products - Produkter från reklamblad
   - id (uuid, primary key)
   - name (text)
   - price (decimal)
   - original_price (decimal)
   - store (text)
   - category (text)
   - unit (text)
   - created_at (timestamp)

7. flyers - Reklamblad
   - id (uuid)
   - name (text)
   - store (text)
   - valid_from (date)
   - valid_to (date)
   - page_count (int)

8. recipe_favorites - Sparade recept
   - user_id (uuid)
   - recipe_data (jsonb)
   - created_at (timestamp)
`

export async function POST(req) {
  try {
    const cookieStore = await cookies()
    const adminAuth = cookieStore.get('admin_session')
    if (!adminAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { query } = await req.json()

    // Use Claude to understand the query and generate SQL
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: `Du är en databasassistent för en svensk matplaneringsapp. Du hjälper till att besvara frågor om användardata, produkter och statistik.

${DB_SCHEMA}

När du får en fråga, analysera den och returnera ett JSON-objekt med:
1. En naturlig text-svar på svenska
2. Om relevant, en SQL-query för att hämta data (PostgreSQL-syntax)

VIKTIGT:
- Använd alltid korrekt PostgreSQL-syntax
- Begränsa resultat till max 100 rader
- Returnera ENDAST JSON, ingen annan text

JSON-format:
{
  "response": "Svar på frågan på svenska",
  "sql": "SELECT ... (eller null om ingen query behövs)",
  "needsExecution": true/false
}`,
      messages: [
        { role: 'user', content: query }
      ]
    })

    const responseText = message.content[0].text

    // Parse the AI response
    let aiResponse
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        aiResponse = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found')
      }
    } catch (parseError) {
      return NextResponse.json({
        success: true,
        response: responseText,
        sql: null,
        results: null
      })
    }

    // Execute SQL if provided
    let results = null
    let count = 0

    if (aiResponse.sql && aiResponse.needsExecution) {
      try {
        // Safety check - only allow SELECT queries
        if (!aiResponse.sql.trim().toLowerCase().startsWith('select')) {
          return NextResponse.json({
            success: true,
            response: 'Jag kan bara köra SELECT-frågor av säkerhetsskäl.',
            sql: aiResponse.sql,
            results: null
          })
        }

        const { data, error } = await supabase.rpc('execute_sql', {
          sql_query: aiResponse.sql
        })

        if (error) {
          // Try direct query for simple cases
          if (aiResponse.sql.includes('auth.users')) {
            // Can't query auth.users directly, provide estimate
            results = null
          }
        } else {
          results = data
          count = data?.length || 0
        }
      } catch (sqlError) {
        console.error('SQL execution error:', sqlError)
        // Return response without results
      }
    }

    // Save to chat history
    try {
      await supabase.from('admin_ai_chats').insert({
        query,
        response: aiResponse.response,
        sql_generated: aiResponse.sql,
        result_count: count
      })
    } catch (e) {
      // Ignore if table doesn't exist
    }

    return NextResponse.json({
      success: true,
      response: aiResponse.response,
      sql: aiResponse.sql,
      results,
      count
    })
  } catch (error) {
    console.error('Assistant error:', error)
    return NextResponse.json({
      success: false,
      response: 'Ett fel uppstod. Försök formulera frågan på ett annat sätt.',
      error: error.message
    }, { status: 500 })
  }
}
