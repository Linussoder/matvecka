import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function POST(request) {
  try {
    const body = await request.json()
    const { event_type, event_data, page_url, session_id, user_id } = body

    if (!event_type) {
      return NextResponse.json({ error: 'event_type is required' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get user agent from headers
    const userAgent = request.headers.get('user-agent') || null

    // Hash IP for privacy (we don't store the actual IP)
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : null
    const ipHash = ip ? hashString(ip) : null

    const { error } = await supabase
      .from('analytics_events')
      .insert({
        event_type,
        event_data: event_data || {},
        page_url,
        session_id,
        user_id,
        user_agent: userAgent,
        ip_hash: ipHash
      })

    if (error) {
      console.error('Error tracking event:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in track API:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * Simple string hash function for IP privacy
 */
function hashString(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return hash.toString(16)
}
