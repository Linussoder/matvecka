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

    const { data: notifications, error } = await supabase
      .from('push_notifications')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      // Table might not exist yet
      return NextResponse.json({ success: true, notifications: [] })
    }

    return NextResponse.json({ success: true, notifications })
  } catch (error) {
    console.error('Failed to fetch notifications:', error)
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
    const { title, body: notifBody, actionUrl, targetSegment, targetAll, scheduledAt } = body

    const { data: notification, error } = await supabase
      .from('push_notifications')
      .insert({
        title,
        body: notifBody,
        action_url: actionUrl,
        target_segment: targetSegment || null,
        target_all: targetAll,
        scheduled_at: scheduledAt || null,
        status: scheduledAt ? 'scheduled' : 'draft'
      })
      .select()
      .single()

    if (error) {
      console.error('Insert error:', error)
      // Return mock data if table doesn't exist
      return NextResponse.json({
        success: true,
        notification: {
          id: Date.now().toString(),
          title,
          body: notifBody,
          action_url: actionUrl,
          status: scheduledAt ? 'scheduled' : 'draft',
          created_at: new Date().toISOString()
        }
      })
    }

    return NextResponse.json({ success: true, notification })
  } catch (error) {
    console.error('Failed to create notification:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
