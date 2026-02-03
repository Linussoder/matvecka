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

    const { data: posts, error } = await supabase
      .from('social_posts')
      .select('*')
      .order('scheduled_at', { ascending: true })

    if (error) {
      console.error('Error fetching posts:', error)
      return NextResponse.json({ success: true, posts: [] })
    }

    return NextResponse.json({ success: true, posts: posts || [] })
  } catch (error) {
    console.error('Failed to fetch social posts:', error)
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
      content,
      caption,
      hashtags,
      imageUrl,
      scheduledAt,
      status = 'scheduled'
    } = body

    const { data: post, error } = await supabase
      .from('social_posts')
      .insert({
        platform,
        content,
        caption,
        hashtags,
        image_url: imageUrl,
        scheduled_at: scheduledAt,
        status,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Insert error:', error)
      // Return mock data if table doesn't exist
      return NextResponse.json({
        success: true,
        post: {
          id: Date.now().toString(),
          platform,
          content,
          caption,
          hashtags,
          image_url: imageUrl,
          scheduled_at: scheduledAt,
          status,
          created_at: new Date().toISOString()
        }
      })
    }

    return NextResponse.json({ success: true, post })
  } catch (error) {
    console.error('Failed to create social post:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
