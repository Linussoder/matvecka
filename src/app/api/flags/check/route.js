import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { evaluateFlag } from '@/lib/featureFlags'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// GET - Check if a feature flag is enabled
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const flagName = searchParams.get('flag')

    // Get current user context
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
    const userId = user?.id

    // Get user subscription info if logged in
    let userContext = { userId, user: null }
    if (userId) {
      const { data: subscription } = await supabaseAdmin
        .from('user_subscriptions')
        .select('plan')
        .eq('user_id', userId)
        .single()

      userContext.user = {
        plan: subscription?.plan || 'free',
        created_at: user?.created_at
      }
    }

    // If specific flag requested
    if (flagName) {
      const { data: flag, error } = await supabaseAdmin
        .from('feature_flags')
        .select('*')
        .eq('name', flagName)
        .single()

      if (error || !flag) {
        return NextResponse.json({
          enabled: false,
          reason: 'flag_not_found'
        })
      }

      const isEnabled = evaluateFlag(flag, userContext)

      return NextResponse.json({
        enabled: isEnabled,
        flag: flagName
      })
    }

    // Return all enabled flags for this user
    const { data: flags, error } = await supabaseAdmin
      .from('feature_flags')
      .select('*')

    if (error) {
      return NextResponse.json({
        flags: {},
        error: 'Failed to fetch flags'
      })
    }

    // Evaluate each flag for the current user
    const enabledFlags = {}
    flags?.forEach(flag => {
      enabledFlags[flag.name] = evaluateFlag(flag, userContext)
    })

    return NextResponse.json({
      flags: enabledFlags
    })
  } catch (error) {
    console.error('Flag check error:', error)
    return NextResponse.json(
      { enabled: false, error: 'Internal error' },
      { status: 500 }
    )
  }
}
