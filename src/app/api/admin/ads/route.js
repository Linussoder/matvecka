import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// GET - Fetch all saved ads
export async function GET() {
  try {
    const cookieStore = await cookies()
    const adminAuth = cookieStore.get('admin_session')
    if (!adminAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: assets, error } = await supabase
      .from('admin_assets')
      .select('*')
      .in('type', ['post', 'caption'])
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      return NextResponse.json({ success: true, assets: [] })
    }

    return NextResponse.json({ success: true, assets })
  } catch (error) {
    console.error('Failed to fetch ads:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Save a generated ad
export async function POST(req) {
  try {
    const cookieStore = await cookies()
    const adminAuth = cookieStore.get('admin_session')
    if (!adminAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, platform, content, campaignId } = body

    // Save the main post content
    const { data: asset, error } = await supabase
      .from('admin_assets')
      .insert({
        campaign_id: campaignId || null,
        type: 'post',
        platform: platform || 'instagram',
        content: content.caption,
        metadata: {
          name,
          hashtags: content.hashtags,
          alternatives: content.alternatives,
          imagePrompts: content.imagePrompts,
          ctas: content.ctas,
          bestPostTime: content.bestPostTime
        }
      })
      .select()
      .single()

    if (error) {
      console.error('Save error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, asset })
  } catch (error) {
    console.error('Failed to save ad:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Delete a saved ad
export async function DELETE(req) {
  try {
    const cookieStore = await cookies()
    const adminAuth = cookieStore.get('admin_session')
    if (!adminAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }

    const { error } = await supabase
      .from('admin_assets')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete ad:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
