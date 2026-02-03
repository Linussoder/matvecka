import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// GET - Fetch translations for a language
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const language = searchParams.get('language')

    if (!language) {
      return NextResponse.json(
        { error: 'Språkkod krävs' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('translations')
      .select('*')
      .eq('language_code', language)

    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST205') {
        return NextResponse.json({
          success: true,
          translations: [],
          needsSetup: true
        })
      }
      throw error
    }

    return NextResponse.json({
      success: true,
      translations: data || []
    })
  } catch (error) {
    console.error('Translations fetch error:', error)
    return NextResponse.json(
      { error: 'Kunde inte hämta översättningar' },
      { status: 500 }
    )
  }
}
