import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'matvecka2026'

export function middleware(request: NextRequest) {
  // Skip auth for login page and API routes
  if (
    request.nextUrl.pathname === '/admin-login' ||
    request.nextUrl.pathname.startsWith('/api/admin')
  ) {
    return NextResponse.next()
  }

  // Check for auth cookie
  const authCookie = request.cookies.get('matvecka-auth')

  if (authCookie?.value === 'authenticated') {
    return NextResponse.next()
  }

  // Redirect to login
  return NextResponse.redirect(new URL('/admin-login', request.url))
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)',
  ],
}
