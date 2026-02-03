import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// GET - Fetch active content for public display
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'banner', 'announcement', 'featured'

    const now = new Date().toISOString()

    let query = supabase
      .from('site_content')
      .select('id, type, title, content, link_url, link_text, image_url, background_color, text_color')
      .eq('is_active', true)
      .or(`starts_at.is.null,starts_at.lte.${now}`)
      .or(`ends_at.is.null,ends_at.gte.${now}`)
      .order('sort_order', { ascending: true })

    if (type) {
      query = query.eq('type', type)
    }

    const { data: content, error } = await query

    if (error) {
      // If table doesn't exist, return empty array
      // PGRST205 = table not found in PostgREST schema cache
      if (error.code === '42P01' || error.code === 'PGRST205') {
        return NextResponse.json({ success: true, content: [] })
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
      { success: true, content: [] }
    )
  }
}
