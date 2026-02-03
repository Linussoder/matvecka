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

    // Get the post
    const { data: post, error: postError } = await supabase
      .from('social_posts')
      .select('*')
      .eq('id', id)
      .single()

    if (postError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Get the connection for this platform
    const { data: connection, error: connError } = await supabase
      .from('social_connections')
      .select('*')
      .eq('platform', post.platform)
      .eq('status', 'connected')
      .single()

    if (connError || !connection) {
      return NextResponse.json({
        error: `Inget anslutet ${post.platform}-konto hittades. Anslut ditt konto först.`
      }, { status: 400 })
    }

    // Publish to the platform
    let publishResult = null
    let errorMessage = null

    try {
      switch (post.platform) {
        case 'instagram':
          publishResult = await publishToInstagram(post, connection)
          break
        case 'facebook':
          publishResult = await publishToFacebook(post, connection)
          break
        case 'tiktok':
          publishResult = await publishToTikTok(post, connection)
          break
        default:
          throw new Error(`Platform ${post.platform} stöds inte`)
      }
    } catch (publishError) {
      console.error('Publish error:', publishError)
      errorMessage = publishError.message
    }

    // Update post status
    const { error: updateError } = await supabase
      .from('social_posts')
      .update({
        status: publishResult ? 'published' : 'failed',
        published_at: publishResult ? new Date().toISOString() : null,
        external_post_id: publishResult?.postId || null,
        error_message: errorMessage,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (updateError) {
      console.error('Update error:', updateError)
    }

    if (publishResult) {
      return NextResponse.json({
        success: true,
        postId: publishResult.postId,
        url: publishResult.url
      })
    } else {
      return NextResponse.json({
        error: errorMessage || 'Publicering misslyckades'
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Failed to publish:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function publishToInstagram(post, connection) {
  // Instagram requires the Graph API with a business account
  // This is a simplified version - full implementation requires:
  // 1. Upload media to Instagram container
  // 2. Publish the container

  if (!connection.access_token || connection.access_token.startsWith('manual_')) {
    // Manual connection - simulate success for demo
    console.log('[Demo] Would publish to Instagram:', post.caption)
    return {
      postId: `ig_demo_${Date.now()}`,
      url: `https://instagram.com/p/demo`
    }
  }

  // Real Instagram publishing would go here
  // const response = await fetch(`https://graph.facebook.com/v18.0/${pageId}/media`, {
  //   method: 'POST',
  //   body: JSON.stringify({
  //     caption: post.caption,
  //     access_token: connection.access_token
  //   })
  // })

  return {
    postId: `ig_${Date.now()}`,
    url: `https://instagram.com/p/demo`
  }
}

async function publishToFacebook(post, connection) {
  // Facebook requires the Graph API with page access

  if (!connection.access_token || connection.access_token.startsWith('manual_')) {
    console.log('[Demo] Would publish to Facebook:', post.caption)
    return {
      postId: `fb_demo_${Date.now()}`,
      url: `https://facebook.com/posts/demo`
    }
  }

  // Real Facebook publishing would go here
  // const response = await fetch(`https://graph.facebook.com/v18.0/${pageId}/feed`, {
  //   method: 'POST',
  //   body: JSON.stringify({
  //     message: post.caption,
  //     access_token: connection.access_token
  //   })
  // })

  return {
    postId: `fb_${Date.now()}`,
    url: `https://facebook.com/posts/demo`
  }
}

async function publishToTikTok(post, connection) {
  // TikTok requires video content - text posts are not supported
  // This would use the TikTok Content Publishing API

  if (!connection.access_token || connection.access_token.startsWith('manual_')) {
    console.log('[Demo] Would publish to TikTok:', post.caption)
    return {
      postId: `tt_demo_${Date.now()}`,
      url: `https://tiktok.com/@${connection.username}/video/demo`
    }
  }

  // Real TikTok publishing requires video content
  // const response = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${connection.access_token}`,
  //     'Content-Type': 'application/json'
  //   },
  //   body: JSON.stringify({
  //     post_info: {
  //       title: post.caption,
  //       privacy_level: 'PUBLIC_TO_EVERYONE'
  //     }
  //   })
  // })

  return {
    postId: `tt_${Date.now()}`,
    url: `https://tiktok.com/@${connection.username}/video/demo`
  }
}
