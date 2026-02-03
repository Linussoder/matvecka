import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// GET - Fetch all languages
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('supported_languages')
      .select('*')
      .order('is_default', { ascending: false })
      .order('name', { ascending: true })

    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST205') {
        return NextResponse.json({
          success: true,
          languages: [],
          needsSetup: true
        })
      }
      throw error
    }

    return NextResponse.json({
      success: true,
      languages: data || []
    })
  } catch (error) {
    console.error('Languages fetch error:', error)
    return NextResponse.json(
      { error: 'Kunde inte hämta språk' },
      { status: 500 }
    )
  }
}

// PATCH - Update language settings
export async function PATCH(request) {
  try {
    const body = await request.json()
    const { code, is_active, translation_progress } = body

    if (!code) {
      return NextResponse.json(
        { error: 'Språkkod krävs' },
        { status: 400 }
      )
    }

    const updates = {}
    if (typeof is_active === 'boolean') {
      updates.is_active = is_active
    }
    if (typeof translation_progress === 'number') {
      updates.translation_progress = translation_progress
    }

    const { data, error } = await supabase
      .from('supported_languages')
      .update(updates)
      .eq('code', code)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      language: data
    })
  } catch (error) {
    console.error('Language update error:', error)
    return NextResponse.json(
      { error: 'Kunde inte uppdatera språk' },
      { status: 500 }
    )
  }
}
