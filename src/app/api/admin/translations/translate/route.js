import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// POST - Save or update a translation
export async function POST(request) {
  try {
    const body = await request.json()
    const {
      translation_key_id,
      language_code,
      translated_value,
      status,
      machine_translated,
      confidence_score
    } = body

    if (!translation_key_id || !language_code || !translated_value) {
      return NextResponse.json(
        { error: 'Nyckel-ID, språkkod och översättning krävs' },
        { status: 400 }
      )
    }

    // Upsert translation (insert or update if exists)
    const { data, error } = await supabase
      .from('translations')
      .upsert({
        translation_key_id,
        language_code,
        translated_value,
        status: status || 'draft',
        machine_translated: machine_translated || false,
        confidence_score: confidence_score || null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'translation_key_id,language_code'
      })
      .select()
      .single()

    if (error) throw error

    // Update language progress
    await updateLanguageProgress(language_code)

    return NextResponse.json({
      success: true,
      translation: data
    })
  } catch (error) {
    console.error('Translation save error:', error)
    return NextResponse.json(
      { error: 'Kunde inte spara översättning' },
      { status: 500 }
    )
  }
}

// Helper function to update language progress
async function updateLanguageProgress(languageCode) {
  try {
    // Count total keys
    const { count: totalKeys } = await supabase
      .from('translation_keys')
      .select('*', { count: 'exact', head: true })

    // Count translated keys for this language
    const { count: translatedKeys } = await supabase
      .from('translations')
      .select('*', { count: 'exact', head: true })
      .eq('language_code', languageCode)

    // Calculate progress
    const progress = totalKeys > 0
      ? Math.round((translatedKeys / totalKeys) * 100)
      : 0

    // Update language progress
    await supabase
      .from('supported_languages')
      .update({ translation_progress: progress })
      .eq('code', languageCode)
  } catch (error) {
    console.error('Progress update error:', error)
  }
}
