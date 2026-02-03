import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// GET - Fetch calendar events
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || new Date().getFullYear())
    const month = parseInt(searchParams.get('month') || new Date().getMonth() + 1)
    const contentType = searchParams.get('type')
    const status = searchParams.get('status')

    // Calculate date range for the month
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`

    let query = supabase
      .from('content_calendar')
      .select('*')
      .gte('scheduled_date', startDate)
      .lte('scheduled_date', endDate)
      .order('scheduled_date', { ascending: true })

    if (contentType) {
      query = query.eq('content_type', contentType)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST205') {
        return NextResponse.json({
          success: true,
          events: [],
          needsSetup: true
        })
      }
      throw error
    }

    return NextResponse.json({
      success: true,
      events: data || []
    })
  } catch (error) {
    console.error('Calendar fetch error:', error)
    return NextResponse.json(
      { error: 'Kunde inte hämta kalenderhändelser' },
      { status: 500 }
    )
  }
}

// POST - Create calendar event
export async function POST(request) {
  try {
    const body = await request.json()
    const {
      title,
      content_type,
      description,
      content_data,
      scheduled_date,
      scheduled_time,
      end_date,
      status,
      target_audience,
      linked_content_ids,
      tags,
      created_by
    } = body

    if (!title || !scheduled_date || !content_type) {
      return NextResponse.json(
        { error: 'Titel, datum och typ krävs' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('content_calendar')
      .insert({
        title,
        content_type,
        description: description || null,
        content_data: content_data || null,
        scheduled_date,
        scheduled_time: scheduled_time || null,
        end_date: end_date || null,
        status: status || 'draft',
        target_audience: target_audience || null,
        linked_content_ids: linked_content_ids || [],
        tags: tags || [],
        created_by: created_by || null
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      event: data
    })
  } catch (error) {
    console.error('Calendar event create error:', error)
    return NextResponse.json(
      { error: 'Kunde inte skapa händelse' },
      { status: 500 }
    )
  }
}

// PATCH - Update calendar event
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
      .from('content_calendar')
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
      event: data
    })
  } catch (error) {
    console.error('Calendar event update error:', error)
    return NextResponse.json(
      { error: 'Kunde inte uppdatera händelse' },
      { status: 500 }
    )
  }
}

// DELETE - Remove calendar event
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
      .from('content_calendar')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Calendar event delete error:', error)
    return NextResponse.json(
      { error: 'Kunde inte ta bort händelse' },
      { status: 500 }
    )
  }
}
