import { NextResponse } from 'next/server'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

if (!ADMIN_PASSWORD) {
  console.error('ADMIN_PASSWORD environment variable is not set')
}

export async function POST(request: Request) {
  try {
    if (!ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Admin login not configured' },
        { status: 503 }
      )
    }

    const { password } = await request.json()

    if (password === ADMIN_PASSWORD) {
      const response = NextResponse.json({ success: true })

      // Set auth cookie (expires in 7 days)
      response.cookies.set('matvecka-auth', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/'
      })

      return response
    }

    return NextResponse.json(
      { error: 'Invalid password' },
      { status: 401 }
    )
  } catch {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )
  }
}
