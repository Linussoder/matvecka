import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// GET - Fetch blog posts
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    let query = supabase
      .from('blog_posts')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (status) {
      query = query.eq('status', status)
    }

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error, count } = await query

    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST205') {
        return NextResponse.json({
          success: true,
          posts: [],
          needsSetup: true
        })
      }
      throw error
    }

    return NextResponse.json({
      success: true,
      posts: data || [],
      total: count,
      page,
      totalPages: Math.ceil((count || 0) / limit)
    })
  } catch (error) {
    console.error('Blog posts fetch error:', error)
    return NextResponse.json(
      { error: 'Kunde inte hämta bloggposter' },
      { status: 500 }
    )
  }
}

// POST - Create blog post
export async function POST(request) {
  try {
    const body = await request.json()
    const {
      title,
      slug,
      excerpt,
      content,
      featured_image_url,
      author,
      category,
      tags,
      status,
      scheduled_at,
      seo_title,
      seo_description,
      read_time_minutes
    } = body

    if (!title) {
      return NextResponse.json(
        { error: 'Titel krävs' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('blog_posts')
      .insert({
        title,
        slug: slug || title.toLowerCase().replace(/\s+/g, '-'),
        excerpt: excerpt || null,
        content: content || null,
        featured_image_url: featured_image_url || null,
        author: author || null,
        category: category || 'tips',
        tags: tags || [],
        status: status || 'draft',
        scheduled_at: scheduled_at || null,
        seo_title: seo_title || null,
        seo_description: seo_description || null,
        read_time_minutes: read_time_minutes || null,
        published_at: status === 'published' ? new Date().toISOString() : null
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Ett inlägg med denna slug finns redan' },
          { status: 400 }
        )
      }
      throw error
    }

    return NextResponse.json({
      success: true,
      post: data
    })
  } catch (error) {
    console.error('Blog post create error:', error)
    return NextResponse.json(
      { error: 'Kunde inte skapa inlägg' },
      { status: 500 }
    )
  }
}

// PATCH - Update blog post
export async function PATCH(request) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID krävs' },
        { status: 400 }
      )
    }

    // Set published_at if status changes to published
    if (updates.status === 'published' && !updates.published_at) {
      updates.published_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('blog_posts')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      post: data
    })
  } catch (error) {
    console.error('Blog post update error:', error)
    return NextResponse.json(
      { error: 'Kunde inte uppdatera inlägg' },
      { status: 500 }
    )
  }
}

// DELETE - Remove blog post
export async function DELETE(request) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'ID krävs' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Blog post delete error:', error)
    return NextResponse.json(
      { error: 'Kunde inte ta bort inlägg' },
      { status: 500 }
    )
  }
}
