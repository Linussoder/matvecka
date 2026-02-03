import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// GET - Fetch slow API queries
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const threshold = parseInt(searchParams.get('threshold') || '5000')
    const limit = parseInt(searchParams.get('limit') || '50')

    const { data, error } = await supabase
      .from('api_usage_logs')
      .select('*')
      .gte('response_time_ms', threshold)
      .order('response_time_ms', { ascending: false })
      .limit(limit)

    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST205') {
        return NextResponse.json({
          success: true,
          slowQueries: [],
          needsSetup: true
        })
      }
      throw error
    }

    return NextResponse.json({
      success: true,
      slowQueries: data || [],
      threshold
    })
  } catch (error) {
    console.error('Slow queries fetch error:', error)
    return NextResponse.json(
      { error: 'Kunde inte hämta långsamma frågor' },
      { status: 500 }
    )
  }
}
