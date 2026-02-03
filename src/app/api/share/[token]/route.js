import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// GET - Fetch a shared item by token (public endpoint, no auth required)
export async function GET(request, { params }) {
  try {
    const resolvedParams = await params
    const token = resolvedParams.token
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'meal_plan'

    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase environment variables')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Create admin client inside the handler
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const table = type === 'recipe' ? 'recipe_shares' : 'meal_plan_shares'

    console.log(`Fetching share: table=${table}, token=${token}`)

    const { data: share, error } = await supabaseAdmin
      .from(table)
      .select('*')
      .eq('share_token', token)
      .eq('is_active', true)
      .single()

    if (error) {
      console.error('Share fetch error:', error.message, error.code)
      return NextResponse.json(
        { error: 'Delningen hittades inte', details: error.message },
        { status: 404 }
      )
    }

    if (!share) {
      return NextResponse.json(
        { error: 'Delningen hittades inte' },
        { status: 404 }
      )
    }

    // Check if expired
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Delningen har gått ut' },
        { status: 410 }
      )
    }

    // Increment view count (fire and forget)
    supabaseAdmin
      .from(table)
      .update({
        view_count: (share.view_count || 0) + 1,
        last_viewed_at: new Date().toISOString()
      })
      .eq('id', share.id)
      .then(() => {})
      .catch((err) => console.error('View count update error:', err))

    return NextResponse.json({
      success: true,
      share
    })
  } catch (error) {
    console.error('Share API error:', error)
    return NextResponse.json(
      { error: 'Något gick fel', details: error.message },
      { status: 500 }
    )
  }
}
