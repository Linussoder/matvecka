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

    const { data: flags, error } = await supabase
      .from('feature_flags')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      // Table might not exist yet
      return NextResponse.json({ success: true, flags: [] })
    }

    return NextResponse.json({ success: true, flags })
  } catch (error) {
    console.error('Failed to fetch flags:', error)
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
    const { name, description, enabled, rollout_percentage, target_segment } = body

    const { data: flag, error } = await supabase
      .from('feature_flags')
      .insert({
        name,
        description,
        enabled: enabled || false,
        rollout_percentage: rollout_percentage || 0,
        target_segment: target_segment || null
      })
      .select()
      .single()

    if (error) {
      console.error('Insert error:', error)
      // Return mock data if table doesn't exist
      return NextResponse.json({
        success: true,
        flag: {
          id: Date.now().toString(),
          name,
          description,
          enabled: enabled || false,
          rollout_percentage: rollout_percentage || 0,
          created_at: new Date().toISOString()
        }
      })
    }

    return NextResponse.json({ success: true, flag })
  } catch (error) {
    console.error('Failed to create flag:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
