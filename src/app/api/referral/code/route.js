import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { getOrCreateReferralCode } from '@/lib/referral'

export async function GET(request) {
  try {
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
        { error: 'Du måste vara inloggad' },
        { status: 401 }
      )
    }

    const codeData = await getOrCreateReferralCode(user.id)

    if (!codeData) {
      return NextResponse.json(
        { error: 'Kunde inte skapa värvningskod' },
        { status: 500 }
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://matvecka.se'
    const referralLink = `${baseUrl}/signup?ref=${codeData.code}`

    return NextResponse.json({
      success: true,
      code: codeData.code,
      isActive: codeData.is_active,
      referralLink,
      createdAt: codeData.created_at,
    })
  } catch (error) {
    console.error('Referral code error:', error)
    return NextResponse.json(
      { error: 'Kunde inte hämta värvningskod' },
      { status: 500 }
    )
  }
}
