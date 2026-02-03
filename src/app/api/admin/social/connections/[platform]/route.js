import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function DELETE(req, { params }) {
  try {
    const cookieStore = await cookies()
    const adminAuth = cookieStore.get('admin_session')
    if (!adminAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { platform } = await params

    const { error } = await supabase
      .from('social_connections')
      .delete()
      .eq('platform', platform)

    if (error) {
      console.error('Delete error:', error)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to disconnect:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
