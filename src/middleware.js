import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

// Set to true to enable maintenance mode (shows "Under utveckling" to all visitors)
const MAINTENANCE_MODE = true

export async function middleware(request) {
  const { pathname } = request.nextUrl
  const adminSession = request.cookies.get('admin_session')

  // ===== MAINTENANCE MODE =====
  if (MAINTENANCE_MODE) {
    // Always allow these paths during maintenance:
    const allowedPaths = [
      '/admin/login',      // Admin login page
      '/api/admin',        // Admin API routes
      '/maintenance',      // Maintenance page itself
      '/_next',            // Next.js internals
      '/favicon.ico',      // Favicon
    ]

    const isAllowedPath = allowedPaths.some(path => pathname.startsWith(path))
    const isAdminRoute = pathname.startsWith('/admin')
    const hasAdminSession = !!adminSession?.value

    // If admin is logged in, allow all access
    if (hasAdminSession) {
      // Continue to normal flow
    }
    // If trying to access non-allowed paths without admin session, redirect to maintenance
    else if (!isAllowedPath) {
      return NextResponse.redirect(new URL('/maintenance', request.url))
    }
  }

  // ===== ADMIN ROUTE PROTECTION =====
  // Check if accessing admin routes (except login and API)
  if (
    pathname.startsWith('/admin') &&
    !pathname.startsWith('/admin/login') &&
    !pathname.startsWith('/api/admin')
  ) {
    if (!adminSession?.value) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session - this is the key part!
  await supabase.auth.getUser()

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
