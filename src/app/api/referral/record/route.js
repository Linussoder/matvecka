import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { recordPendingReferral } from '@/lib/referral'

export async function POST(request) {
  try {
    const { code } = await request.json()

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Ingen kod angiven' },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Du måste vara inloggad' },
        { status: 401 }
      )
    }

    const result = await recordPendingReferral(user.id, code)

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Värvning registrerad! Du får dina bonusdagar efter e-postverifiering.',
    })
  } catch (error) {
    console.error('Referral record error:', error)
    return NextResponse.json(
      { success: false, error: 'Kunde inte registrera värvning' },
      { status: 500 }
    )
  }
}
