import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// GET - Fetch all content items
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'banner', 'announcement', 'featured'
    const active = searchParams.get('active')

    let query = supabase
      .from('site_content')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (type) {
      query = query.eq('type', type)
    }

    if (active === 'true') {
      query = query.eq('is_active', true)
    }

    const { data: content, error } = await query

    if (error) {
      // If table doesn't exist, return empty array with setup flag
      // PGRST205 = table not found in PostgREST schema cache
      // 42P01 = PostgreSQL table doesn't exist
      if (error.code === '42P01' || error.code === 'PGRST205') {
        return NextResponse.json({
          success: true,
          content: [],
          needsSetup: true
        })
      }
      throw error
    }

    return NextResponse.json({
      success: true,
      content: content || []
    })
  } catch (error) {
    console.error('Content fetch error:', error)
    return NextResponse.json(
      { error: 'Kunde inte hämta innehåll' },
      { status: 500 }
    )
  }
}

// POST - Create new content item
export async function POST(request) {
  try {
    const body = await request.json()
    const { type, title, content, link_url, link_text, image_url, background_color, text_color, is_active, sort_order, starts_at, ends_at } = body

    if (!type || !title) {
      return NextResponse.json(
        { error: 'Typ och titel krävs' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('site_content')
      .insert({
        type,
        title,
        content: content || null,
        link_url: link_url || null,
        link_text: link_text || null,
        image_url: image_url || null,
        background_color: background_color || '#3b82f6',
        text_color: text_color || '#ffffff',
        is_active: is_active ?? true,
        sort_order: sort_order || 0,
        starts_at: starts_at || null,
        ends_at: ends_at || null
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      item: data
    })
  } catch (error) {
    console.error('Content create error:', error)
    return NextResponse.json(
      { error: 'Kunde inte skapa innehåll' },
      { status: 500 }
    )
  }
}

// PATCH - Update content item
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
      .from('site_content')
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
      item: data
    })
  } catch (error) {
    console.error('Content update error:', error)
    return NextResponse.json(
      { error: 'Kunde inte uppdatera innehåll' },
      { status: 500 }
    )
  }
}

// DELETE - Remove content item
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
      .from('site_content')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Content delete error:', error)
    return NextResponse.json(
      { error: 'Kunde inte ta bort innehåll' },
      { status: 500 }
    )
  }
}
