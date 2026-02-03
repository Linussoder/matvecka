import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET() {
  try {
    const cookieStore = await cookies()
    const adminAuth = cookieStore.get('admin_session')
    if (!adminAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: connections, error } = await supabase
      .from('social_connections')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching connections:', error)
      return NextResponse.json({ success: true, connections: [] })
    }

    return NextResponse.json({ success: true, connections: connections || [] })
  } catch (error) {
    console.error('Failed to fetch social connections:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const cookieStore = await cookies()
    const adminAuth = cookieStore.get('admin_session')
    if (!adminAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      platform,
      accessToken,
      refreshToken,
      username,
      profileUrl,
      expiresAt
    } = body

    // Check if connection already exists
    const { data: existing } = await supabase
      .from('social_connections')
      .select('id')
      .eq('platform', platform)
      .single()

    let connection
    if (existing) {
      // Update existing connection
      const { data, error } = await supabase
        .from('social_connections')
        .update({
          access_token: accessToken,
          refresh_token: refreshToken,
          username,
          profile_url: profileUrl,
          expires_at: expiresAt,
          status: 'connected',
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      connection = data
    } else {
      // Create new connection
      const { data, error } = await supabase
        .from('social_connections')
        .insert({
          platform,
          access_token: accessToken,
          refresh_token: refreshToken,
          username,
          profile_url: profileUrl,
          expires_at: expiresAt,
          status: 'connected'
        })
        .select()
        .single()

      if (error) throw error
      connection = data
    }

    return NextResponse.json({ success: true, connection })
  } catch (error) {
    console.error('Failed to save social connection:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
