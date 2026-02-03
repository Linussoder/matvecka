import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { getChurnAnalysis } from '@/lib/revenue-analytics'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const analysis = await getChurnAnalysis(supabase, days)

    return NextResponse.json({ analysis })
  } catch (error) {
    console.error('Error in churn analysis API:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
