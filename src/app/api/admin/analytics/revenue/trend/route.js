import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { getMRRTrend } from '@/lib/revenue-analytics'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const months = parseInt(searchParams.get('months') || '12')

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const trend = await getMRRTrend(supabase, months)

    return NextResponse.json({ trend })
  } catch (error) {
    console.error('Error in revenue trend API:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
