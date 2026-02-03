import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// OAuth configuration for each platform
const OAUTH_CONFIG = {
  instagram: {
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
    scope: 'instagram_basic,instagram_content_publish,pages_read_engagement',
    clientId: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    color: '#E4405F',
    icon: '📸'
  },
  facebook: {
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
    scope: 'pages_manage_posts,pages_read_engagement',
    clientId: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    color: '#1877F2',
    icon: '📘'
  },
  tiktok: {
    authUrl: 'https://www.tiktok.com/v2/auth/authorize/',
    tokenUrl: 'https://open.tiktokapis.com/v2/oauth/token/',
    scope: 'user.info.basic,video.publish',
    clientId: process.env.TIKTOK_CLIENT_ID,
    clientSecret: process.env.TIKTOK_CLIENT_SECRET,
    color: '#000000',
    icon: '🎵'
  }
}

export async function GET(req, { params }) {
  try {
    const cookieStore = await cookies()
    const adminAuth = cookieStore.get('admin_session')
    if (!adminAuth) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { platform } = await params
    const config = OAUTH_CONFIG[platform]

    if (!config) {
      return new NextResponse('Invalid platform', { status: 400 })
    }

    const platformName = platform.charAt(0).toUpperCase() + platform.slice(1)

    // Check if OAuth credentials are configured
    if (config.clientId && config.clientSecret) {
      // Real OAuth flow - redirect to platform
      const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/social/auth/${platform}/callback`
      const state = Buffer.from(JSON.stringify({ platform, timestamp: Date.now() })).toString('base64')

      let authUrl
      if (platform === 'tiktok') {
        authUrl = `${config.authUrl}?client_key=${config.clientId}&scope=${encodeURIComponent(config.scope)}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`
      } else {
        authUrl = `${config.authUrl}?client_id=${config.clientId}&scope=${encodeURIComponent(config.scope)}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`
      }

      return NextResponse.redirect(authUrl)
    }

    // Development mode - show simulated OAuth login page
    return new NextResponse(generateOAuthPage(platform, platformName, config), {
      headers: { 'Content-Type': 'text/html' }
    })
  } catch (error) {
    console.error('OAuth error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

function generateOAuthPage(platform, platformName, config) {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>Logga in på ${platformName}</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: ${platform === 'instagram' ? 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' :
                   platform === 'facebook' ? '#f0f2f5' :
                   '#121212'};
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .login-card {
      background: white;
      border-radius: ${platform === 'tiktok' ? '8px' : '12px'};
      box-shadow: 0 2px 20px rgba(0,0,0,0.15);
      width: 100%;
      max-width: 400px;
      overflow: hidden;
    }
    .header {
      background: ${config.color};
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
    .header h1 {
      font-size: 28px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .header p {
      opacity: 0.9;
      font-size: 14px;
    }
    .form-section {
      padding: 30px;
    }
    .input-group {
      margin-bottom: 16px;
    }
    .input-group label {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: #333;
      margin-bottom: 8px;
    }
    .input-group input {
      width: 100%;
      padding: 14px 16px;
      border: 1px solid #dbdbdb;
      border-radius: 6px;
      font-size: 16px;
      transition: border-color 0.2s;
    }
    .input-group input:focus {
      outline: none;
      border-color: ${config.color};
    }
    .input-group input::placeholder {
      color: #8e8e8e;
    }
    .login-btn {
      width: 100%;
      padding: 14px;
      background: ${config.color};
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s, transform 0.1s;
      margin-top: 8px;
    }
    .login-btn:hover {
      opacity: 0.9;
    }
    .login-btn:active {
      transform: scale(0.98);
    }
    .login-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .divider {
      display: flex;
      align-items: center;
      margin: 24px 0;
      color: #8e8e8e;
      font-size: 13px;
    }
    .divider::before, .divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: #dbdbdb;
    }
    .divider span {
      padding: 0 16px;
    }
    .permissions {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 20px;
    }
    .permissions h3 {
      font-size: 13px;
      font-weight: 600;
      color: #333;
      margin-bottom: 12px;
    }
    .permission-item {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;
      color: #555;
      margin-bottom: 8px;
    }
    .permission-item:last-child {
      margin-bottom: 0;
    }
    .permission-icon {
      color: #22c55e;
    }
    .cancel-link {
      display: block;
      text-align: center;
      color: #666;
      text-decoration: none;
      font-size: 14px;
      margin-top: 16px;
    }
    .cancel-link:hover {
      color: #333;
    }
    .loading {
      display: none;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }
    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .dev-notice {
      background: #fef3c7;
      border: 1px solid #fcd34d;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 20px;
      font-size: 12px;
      color: #92400e;
    }
    .dev-notice strong {
      display: block;
      margin-bottom: 4px;
    }
  </style>
</head>
<body>
  <div class="login-card">
    <div class="header">
      <div class="header-icon">${config.icon}</div>
      <h1>${platformName}</h1>
      <p>Logga in för att ansluta till Matvecka</p>
    </div>

    <div class="form-section">
      <div class="dev-notice">
        <strong>🔧 Utvecklingsläge</strong>
        OAuth API-nycklar är inte konfigurerade. Ange ett användarnamn för att simulera anslutning.
      </div>

      <form id="loginForm">
        <div class="input-group">
          <label for="username">${platform === 'facebook' ? 'E-post eller telefon' : 'Användarnamn'}</label>
          <input
            type="text"
            id="username"
            name="username"
            placeholder="${platform === 'instagram' ? '@användarnamn' : platform === 'facebook' ? 'namn@exempel.se' : '@användarnamn'}"
            autocomplete="off"
            required
          >
        </div>

        <div class="input-group">
          <label for="password">Lösenord</label>
          <input
            type="password"
            id="password"
            name="password"
            placeholder="••••••••"
            value="demo_password"
          >
        </div>

        <div class="permissions">
          <h3>Matvecka vill ha tillgång till:</h3>
          <div class="permission-item">
            <span class="permission-icon">✓</span>
            <span>Publicera inlägg på ditt konto</span>
          </div>
          <div class="permission-item">
            <span class="permission-icon">✓</span>
            <span>Läsa statistik och engagemang</span>
          </div>
          <div class="permission-item">
            <span class="permission-icon">✓</span>
            <span>Hantera schemalagda inlägg</span>
          </div>
        </div>

        <button type="submit" class="login-btn" id="submitBtn">
          <span id="btnText">Logga in och auktorisera</span>
          <span class="loading" id="btnLoading">
            <span class="spinner"></span>
            <span>Ansluter...</span>
          </span>
        </button>
      </form>

      <a href="#" class="cancel-link" onclick="window.close(); return false;">Avbryt</a>
    </div>
  </div>

  <script>
    const form = document.getElementById('loginForm');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = document.getElementById('btnText');
    const btnLoading = document.getElementById('btnLoading');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const username = document.getElementById('username').value.replace('@', '');

      if (!username) {
        alert('Ange ett användarnamn');
        return;
      }

      // Show loading state
      submitBtn.disabled = true;
      btnText.style.display = 'none';
      btnLoading.style.display = 'flex';

      // Simulate OAuth delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      try {
        const res = await fetch('/api/admin/social/connections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platform: '${platform}',
            username: username,
            accessToken: 'oauth_${platform}_' + Date.now(),
            refreshToken: 'refresh_${platform}_' + Date.now(),
            profileUrl: '${platform === 'instagram' ? 'https://instagram.com/' : platform === 'facebook' ? 'https://facebook.com/' : 'https://tiktok.com/@'}' + username,
            expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString() // 60 days
          })
        });

        const data = await res.json();

        if (data.success) {
          // Notify parent window
          if (window.opener) {
            window.opener.postMessage({
              type: 'social_auth_success',
              platform: '${platform}',
              username: username
            }, '*');
          }

          // Show success and close
          document.body.innerHTML = \`
            <div style="
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              background: white;
              text-align: center;
              padding: 40px;
            ">
              <div style="font-size: 64px; margin-bottom: 20px;">✅</div>
              <h2 style="font-size: 24px; color: #333; margin-bottom: 8px;">Ansluten!</h2>
              <p style="color: #666;">@\${username} är nu kopplad till Matvecka</p>
              <p style="color: #999; font-size: 14px; margin-top: 16px;">Detta fönster stängs automatiskt...</p>
            </div>
          \`;

          setTimeout(() => window.close(), 2000);
        } else {
          throw new Error(data.error || 'Kunde inte ansluta');
        }
      } catch (err) {
        submitBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
        alert('Fel: ' + err.message);
      }
    });

    // Listen for messages from parent (in case we need to close)
    window.addEventListener('message', (e) => {
      if (e.data === 'close') {
        window.close();
      }
    });
  </script>
</body>
</html>
  `;
}
