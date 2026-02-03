import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(req, { params }) {
  try {
    const cookieStore = await cookies()
    const adminAuth = cookieStore.get('admin_session')
    if (!adminAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get notification
    const { data: notification, error: fetchError } = await supabase
      .from('push_notifications')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    // Get target users
    let userCount = 0
    try {
      if (notification.target_all) {
        // Get all users with push subscriptions
        const { count } = await supabase
          .from('push_subscriptions')
          .select('id', { count: 'exact', head: true })
        userCount = count || 0
      } else if (notification.target_segment) {
        // Get segment user count
        const { data: segment } = await supabase
          .from('admin_segments')
          .select('user_count')
          .eq('id', notification.target_segment)
          .single()
        userCount = segment?.user_count || 0
      }
    } catch (e) {
      // Fallback to 0
    }

    // Update notification status
    const { data: updatedNotification, error: updateError } = await supabase
      .from('push_notifications')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        sent_count: userCount
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // TODO: Actually send push notifications using web-push library

    return NextResponse.json({
      success: true,
      notification: updatedNotification,
      sentCount: userCount
    })
  } catch (error) {
    console.error('Failed to send notification:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
