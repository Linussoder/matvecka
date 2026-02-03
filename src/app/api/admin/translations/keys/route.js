import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// GET - Fetch all translation keys
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    let query = supabase
      .from('translation_keys')
      .select('*')
      .order('key', { ascending: true })

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST205') {
        return NextResponse.json({
          success: true,
          keys: [],
          needsSetup: true
        })
      }
      throw error
    }

    return NextResponse.json({
      success: true,
      keys: data || []
    })
  } catch (error) {
    console.error('Translation keys fetch error:', error)
    return NextResponse.json(
      { error: 'Kunde inte hämta nycklar' },
      { status: 500 }
    )
  }
}

// POST - Create translation key
export async function POST(request) {
  try {
    const body = await request.json()
    const { key, context, category, default_value, max_length, is_plural } = body

    if (!key || !default_value) {
      return NextResponse.json(
        { error: 'Nyckel och standardvärde krävs' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('translation_keys')
      .insert({
        key,
        context: context || null,
        category: category || 'ui',
        default_value,
        max_length: max_length || null,
        is_plural: is_plural || false
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'En nyckel med detta namn finns redan' },
          { status: 400 }
        )
      }
      throw error
    }

    return NextResponse.json({
      success: true,
      key: data
    })
  } catch (error) {
    console.error('Translation key create error:', error)
    return NextResponse.json(
      { error: 'Kunde inte skapa nyckel' },
      { status: 500 }
    )
  }
}

// PATCH - Update translation key
export async function PATCH(request) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID krävs' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('translation_keys')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      key: data
    })
  } catch (error) {
    console.error('Translation key update error:', error)
    return NextResponse.json(
      { error: 'Kunde inte uppdatera nyckel' },
      { status: 500 }
    )
  }
}

// DELETE - Remove translation key
export async function DELETE(request) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'ID krävs' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('translation_keys')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Translation key delete error:', error)
    return NextResponse.json(
      { error: 'Kunde inte ta bort nyckel' },
      { status: 500 }
    )
  }
}
