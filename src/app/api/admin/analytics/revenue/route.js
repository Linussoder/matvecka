import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { calculateRevenueMetrics } from '@/lib/revenue-analytics'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const metrics = await calculateRevenueMetrics(supabase)

    if (!metrics) {
      return NextResponse.json({ error: 'Failed to calculate metrics' }, { status: 500 })
    }

    return NextResponse.json({ metrics })
  } catch (error) {
    console.error('Error in revenue API:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
