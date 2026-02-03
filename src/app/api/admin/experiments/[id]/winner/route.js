import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function POST(request, { params }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { winnerId } = body

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { error } = await supabase
      .from('ab_experiments')
      .update({
        status: 'completed',
        winner_variant: winnerId,
        end_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error declaring winner:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
