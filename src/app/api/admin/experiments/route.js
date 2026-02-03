import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: experiments, error } = await supabase
      .from('ab_experiments')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      // If table doesn't exist, return empty array
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('ab_experiments table does not exist. Run the migration first.')
        return NextResponse.json({ experiments: [], tableNotFound: true })
      }
      console.error('Error fetching experiments:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ experiments: experiments || [] })
  } catch (error) {
    console.error('Error in experiments API:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { name, description, metric, trafficPercentage } = body

    if (!name || !metric) {
      return NextResponse.json({ error: 'Name and metric are required' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data, error } = await supabase
      .from('ab_experiments')
      .insert({
        name,
        description,
        metric,
        traffic_percentage: trafficPercentage || 100,
        variants: [
          { id: 'control', name: 'Control', weight: 50 },
          { id: 'variant_b', name: 'Variant B', weight: 50 }
        ],
        status: 'draft'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating experiment:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ experiment: data })
  } catch (error) {
    console.error('Error in create experiment API:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
