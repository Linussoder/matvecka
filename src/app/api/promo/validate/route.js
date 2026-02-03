import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { validatePromoCode, redeemPromoCode } from '@/lib/promo'

// Helper to create Supabase client
async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
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
}

// POST - Validate a promo code
export async function POST(request) {
  try {
    const { code, redeem = false, subscriptionId = null } = await request.json()

    if (!code) {
      return NextResponse.json(
        { error: 'Ange en kampanjkod' },
        { status: 400 }
      )
    }

    // Get user if logged in (optional for validation)
    const supabase = await getSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    // Validate the code
    const validation = await validatePromoCode(code, user?.id || null)

    if (!validation.valid) {
      return NextResponse.json(
        { valid: false, error: validation.error },
        { status: 200 }
      )
    }

    // If redeem flag is set and user is logged in, redeem the code
    if (redeem && user) {
      const redemption = await redeemPromoCode(code, user.id, subscriptionId)

      if (!redemption.success) {
        return NextResponse.json(
          { valid: true, redeemed: false, error: redemption.error, promo: validation.promo },
          { status: 200 }
        )
      }

      return NextResponse.json({
        valid: true,
        redeemed: true,
        promo: validation.promo,
        redemption: redemption.redemption
      })
    }

    return NextResponse.json({
      valid: true,
      redeemed: false,
      promo: validation.promo
    })
  } catch (error) {
    console.error('Promo validation error:', error)
    return NextResponse.json(
      { error: 'Något gick fel' },
      { status: 500 }
    )
  }
}
