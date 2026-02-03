import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function PATCH(req, { params }) {
  try {
    const cookieStore = await cookies()
    const adminAuth = cookieStore.get('admin_session')
    if (!adminAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()

    const updateData = {}
    if (body.platform !== undefined) updateData.platform = body.platform
    if (body.content !== undefined) updateData.content = body.content
    if (body.caption !== undefined) updateData.caption = body.caption
    if (body.hashtags !== undefined) updateData.hashtags = body.hashtags
    if (body.imageUrl !== undefined) updateData.image_url = body.imageUrl
    if (body.scheduledAt !== undefined) updateData.scheduled_at = body.scheduledAt
    if (body.status !== undefined) updateData.status = body.status
    updateData.updated_at = new Date().toISOString()

    const { data: post, error } = await supabase
      .from('social_posts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Update error:', error)
      return NextResponse.json({ success: true, post: { id, ...updateData } })
    }

    return NextResponse.json({ success: true, post })
  } catch (error) {
    console.error('Failed to update social post:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req, { params }) {
  try {
    const cookieStore = await cookies()
    const adminAuth = cookieStore.get('admin_session')
    if (!adminAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const { error } = await supabase
      .from('social_posts')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Delete error:', error)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete social post:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
