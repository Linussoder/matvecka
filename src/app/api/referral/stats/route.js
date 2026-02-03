import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { getReferralStats, getOrCreateReferralCode } from '@/lib/referral'

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

    // Ensure user has a referral code
    await getOrCreateReferralCode(user.id)

    // Get full stats
    const stats = await getReferralStats(user.id)

    if (!stats) {
      return NextResponse.json(
        { error: 'Kunde inte hämta statistik' },
        { status: 500 }
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://matvecka.se'
    const referralLink = stats.referralCode
      ? `${baseUrl}/signup?ref=${stats.referralCode}`
      : null

    return NextResponse.json({
      success: true,
      referralCode: stats.referralCode,
      referralLink,
      isCodeActive: stats.isCodeActive,
      stats: {
        totalInvited: stats.stats.total_invited,
        totalConverted: stats.stats.total_converted,
        totalDaysEarned: stats.stats.total_days_earned,
        lastReferralAt: stats.stats.last_referral_at,
      },
      recentReferrals: stats.recentReferrals.map(r => ({
        id: r.id,
        status: r.status,
        createdAt: r.created_at,
        completedAt: r.completed_at,
      })),
      premiumCredits: {
        hasCredits: stats.premiumCredits.hasCredits,
        totalDays: stats.premiumCredits.totalDays,
        credits: stats.premiumCredits.credits.map(c => ({
          id: c.id,
          daysAmount: c.days_amount,
          source: c.source,
          expiresAt: c.expires_at,
        })),
      },
      config: stats.config,
    })
  } catch (error) {
    console.error('Referral stats error:', error)
    return NextResponse.json(
      { error: 'Kunde inte hämta värvningsstatistik' },
      { status: 500 }
    )
  }
}
