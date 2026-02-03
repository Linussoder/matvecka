import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// POST - Kill switch: disable all feature flags
export async function POST() {
  try {
    const cookieStore = await cookies()
    const adminAuth = cookieStore.get('admin_session')
    if (!adminAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // First get all flags
    const { data: flags } = await supabase
      .from('feature_flags')
      .select('id')

    if (!flags || flags.length === 0) {
      return NextResponse.json({ success: true, message: 'No flags to disable' })
    }

    // Disable all flags
    const { error } = await supabase
      .from('feature_flags')
      .update({ enabled: false })
      .in('id', flags.map(f => f.id))

    if (error) {
      console.error('Kill switch error:', error)
      return NextResponse.json({ error: 'Failed to disable flags' }, { status: 500 })
    }

    console.log(`🚨 KILL SWITCH: Disabled ${flags.length} feature flags`)

    return NextResponse.json({
      success: true,
      disabledCount: flags.length
    })
  } catch (error) {
    console.error('Kill switch error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
