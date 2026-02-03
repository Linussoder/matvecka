import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { password } = await request.json()

    if (!process.env.ADMIN_PASSWORD) {
      console.error('ADMIN_PASSWORD not configured')
      return NextResponse.json(
        { error: 'Admin ej konfigurerad' },
        { status: 500 }
      )
    }

    if (password === process.env.ADMIN_PASSWORD) {
      // Create session token with timestamp
      const token = Buffer.from(`admin:${Date.now()}`).toString('base64')

      const response = NextResponse.json({ success: true })
      response.cookies.set('admin_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      })
      return response
    }

    return NextResponse.json({ error: 'Fel lösenord' }, { status: 401 })
  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { error: 'Ett fel uppstod' },
      { status: 500 }
    )
  }
}
