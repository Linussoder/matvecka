import { NextResponse } from 'next/server'
import { validateReferralCode } from '@/lib/referral'

export async function POST(request) {
  try {
    const { code } = await request.json()

    if (!code) {
      return NextResponse.json(
        { valid: false, error: 'Ingen kod angiven' },
        { status: 400 }
      )
    }

    const codeData = await validateReferralCode(code)

    if (!codeData) {
      return NextResponse.json({
        valid: false,
        error: 'Ogiltig värvningskod',
      })
    }

    // Get referrer bonus days from config
    const referredBonusDays = parseInt(process.env.REFERRAL_REFERRED_DAYS || '7')

    return NextResponse.json({
      valid: true,
      bonusDays: referredBonusDays,
      message: `Du får ${referredBonusDays} gratis Premium-dagar när du registrerar dig!`,
    })
  } catch (error) {
    console.error('Referral validate error:', error)
    return NextResponse.json(
      { valid: false, error: 'Kunde inte validera kod' },
      { status: 500 }
    )
  }
}
