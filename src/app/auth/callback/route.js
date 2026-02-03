import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { completeReferral } from '@/lib/referral'

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Get the user after successful auth
      const { data: { user } } = await supabase.auth.getUser()

      // Complete any pending referral for this user
      if (user?.id) {
        try {
          const result = await completeReferral(user.id)
          if (result.success) {
            // Referral completed - both users got their bonus
            console.log(`Referral completed for user ${user.id}: ${result.referredBonus} days`)
          }
        } catch (err) {
          // Don't block the callback if referral completion fails
          console.error('Error completing referral:', err)
        }

        // Check if user has completed onboarding
        try {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('onboarding_completed')
            .eq('user_id', user.id)
            .single()

          // If no profile or onboarding not completed, redirect to welcome
          if (!profile || !profile.onboarding_completed) {
            return NextResponse.redirect(`${origin}/welcome`)
          }
        } catch (err) {
          // If profile doesn't exist, redirect to welcome for new users
          console.log('No profile found, redirecting to onboarding')
          return NextResponse.redirect(`${origin}/welcome`)
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return to login page with error
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
