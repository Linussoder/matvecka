import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const device = searchParams.get('device') || 'all'
    const minDuration = parseInt(searchParams.get('minDuration') || '0')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    let query = supabase
      .from('session_recordings')
      .select('*')
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (device !== 'all') {
      query = query.eq('device_type', device)
    }

    if (minDuration > 0) {
      query = query.gte('duration_seconds', minDuration)
    }

    const { data: sessions, error } = await query

    if (error) {
      // If table doesn't exist, return empty array instead of error
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('session_recordings table does not exist. Run the migration first.')
        return NextResponse.json({ sessions: [], tableNotFound: true })
      }
      console.error('Error fetching sessions:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ sessions: sessions || [] })
  } catch (error) {
    console.error('Error in sessions API:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
