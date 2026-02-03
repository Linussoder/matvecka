import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// OAuth configuration
const OAUTH_CONFIG = {
  instagram: {
    tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
    userInfoUrl: 'https://graph.facebook.com/v18.0/me',
    clientId: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET
  },
  facebook: {
    tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
    userInfoUrl: 'https://graph.facebook.com/v18.0/me',
    clientId: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET
  },
  tiktok: {
    tokenUrl: 'https://open.tiktokapis.com/v2/oauth/token/',
    userInfoUrl: 'https://open.tiktokapis.com/v2/user/info/',
    clientId: process.env.TIKTOK_CLIENT_ID,
    clientSecret: process.env.TIKTOK_CLIENT_SECRET
  }
}

export async function GET(req, { params }) {
  const { platform } = await params
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const state = searchParams.get('state')

  // Handle OAuth errors
  if (error) {
    return generateCallbackPage(false, platform, null, error)
  }

  if (!code) {
    return generateCallbackPage(false, platform, null, 'No authorization code received')
  }

  try {
    const config = OAUTH_CONFIG[platform]
    if (!config || !config.clientId) {
      return generateCallbackPage(false, platform, null, 'Platform not configured')
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/social/auth/${platform}/callback`

    // Exchange code for access token
    let tokenData
    if (platform === 'tiktok') {
      const tokenRes = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_key: config.clientId,
          client_secret: config.clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri
        })
      })
      tokenData = await tokenRes.json()
    } else {
      // Facebook/Instagram
      const tokenRes = await fetch(`${config.tokenUrl}?` + new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: redirectUri,
        code
      }))
      tokenData = await tokenRes.json()
    }

    if (tokenData.error || !tokenData.access_token) {
      console.error('Token exchange error:', tokenData)
      return generateCallbackPage(false, platform, null, tokenData.error?.message || 'Failed to get access token')
    }

    // Get user info
    let userInfo
    if (platform === 'tiktok') {
      const userRes = await fetch(`${config.userInfoUrl}?fields=open_id,union_id,avatar_url,display_name`, {
        headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
      })
      const userData = await userRes.json()
      userInfo = {
        username: userData.data?.user?.display_name || 'TikTok User',
        profileUrl: null
      }
    } else {
      // Facebook/Instagram
      const userRes = await fetch(`${config.userInfoUrl}?fields=id,name&access_token=${tokenData.access_token}`)
      const userData = await userRes.json()
      userInfo = {
        username: userData.name || 'Facebook User',
        profileUrl: `https://facebook.com/${userData.id}`
      }
    }

    // Save connection to database
    const { data: existing } = await supabase
      .from('social_connections')
      .select('id')
      .eq('platform', platform)
      .single()

    const connectionData = {
      platform,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || null,
      username: userInfo.username,
      profile_url: userInfo.profileUrl,
      expires_at: tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        : null,
      status: 'connected',
      updated_at: new Date().toISOString()
    }

    if (existing) {
      await supabase
        .from('social_connections')
        .update(connectionData)
        .eq('id', existing.id)
    } else {
      await supabase
        .from('social_connections')
        .insert(connectionData)
    }

    return generateCallbackPage(true, platform, userInfo.username, null)
  } catch (err) {
    console.error('OAuth callback error:', err)
    return generateCallbackPage(false, platform, null, err.message)
  }
}

function generateCallbackPage(success, platform, username, error) {
  const platformName = platform.charAt(0).toUpperCase() + platform.slice(1)

  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>${success ? 'Ansluten' : 'Fel'} - ${platformName}</title>
  <meta charset="utf-8">
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      background: white;
      padding: 48px;
      border-radius: 16px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.1);
      text-align: center;
      max-width: 400px;
    }
    .icon {
      font-size: 64px;
      margin-bottom: 20px;
    }
    h1 {
      font-size: 24px;
      color: #333;
      margin: 0 0 8px;
    }
    p {
      color: #666;
      margin: 0 0 8px;
      font-size: 15px;
    }
    .username {
      color: #10b981;
      font-weight: 600;
    }
    .error {
      color: #ef4444;
      background: #fef2f2;
      padding: 12px;
      border-radius: 8px;
      font-size: 14px;
      margin-top: 16px;
    }
    .close-note {
      color: #999;
      font-size: 13px;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">${success ? '✅' : '❌'}</div>
    <h1>${success ? 'Ansluten!' : 'Något gick fel'}</h1>
    ${success
      ? `<p><span class="username">@${username}</span> är nu kopplad till Matvecka</p>`
      : `<p>Kunde inte ansluta till ${platformName}</p>`
    }
    ${error ? `<div class="error">${error}</div>` : ''}
    <p class="close-note">Detta fönster stängs automatiskt...</p>
  </div>

  <script>
    // Notify parent window
    if (window.opener) {
      window.opener.postMessage({
        type: '${success ? 'social_auth_success' : 'social_auth_error'}',
        platform: '${platform}',
        ${success ? `username: '${username}'` : `error: '${error || 'Unknown error'}'`}
      }, '*');
    }

    // Close after delay
    setTimeout(() => {
      window.close();
    }, ${success ? 2000 : 4000});
  </script>
</body>
</html>
  `

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' }
  })
}
