import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// GET - Fetch campaigns
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const theme = searchParams.get('theme')

    let query = supabase
      .from('seasonal_campaigns')
      .select('*')
      .order('start_date', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    if (theme) {
      query = query.eq('theme', theme)
    }

    const { data, error } = await query

    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST205') {
        return NextResponse.json({
          success: true,
          campaigns: [],
          needsSetup: true
        })
      }
      throw error
    }

    return NextResponse.json({
      success: true,
      campaigns: data || []
    })
  } catch (error) {
    console.error('Campaigns fetch error:', error)
    return NextResponse.json(
      { error: 'Kunde inte hämta kampanjer' },
      { status: 500 }
    )
  }
}

// POST - Create campaign
export async function POST(request) {
  try {
    const body = await request.json()
    const {
      name,
      slug,
      description,
      theme,
      start_date,
      end_date,
      status,
      banner_image_url,
      color_scheme,
      featured_recipes,
      promotion_codes
    } = body

    if (!name || !start_date || !end_date) {
      return NextResponse.json(
        { error: 'Namn, startdatum och slutdatum krävs' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('seasonal_campaigns')
      .insert({
        name,
        slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
        description: description || null,
        theme: theme || null,
        start_date,
        end_date,
        status: status || 'draft',
        banner_image_url: banner_image_url || null,
        color_scheme: color_scheme || null,
        featured_recipes: featured_recipes || [],
        promotion_codes: promotion_codes || []
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'En kampanj med denna slug finns redan' },
          { status: 400 }
        )
      }
      throw error
    }

    return NextResponse.json({
      success: true,
      campaign: data
    })
  } catch (error) {
    console.error('Campaign create error:', error)
    return NextResponse.json(
      { error: 'Kunde inte skapa kampanj' },
      { status: 500 }
    )
  }
}

// PATCH - Update campaign
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
      .from('seasonal_campaigns')
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
      campaign: data
    })
  } catch (error) {
    console.error('Campaign update error:', error)
    return NextResponse.json(
      { error: 'Kunde inte uppdatera kampanj' },
      { status: 500 }
    )
  }
}

// DELETE - Remove campaign
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
      .from('seasonal_campaigns')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Campaign delete error:', error)
    return NextResponse.json(
      { error: 'Kunde inte ta bort kampanj' },
      { status: 500 }
    )
  }
}
