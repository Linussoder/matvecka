import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function GET(request, { params }) {
  try {
    const { id } = await params
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get all assignments for this experiment
    const { data: assignments, error } = await supabase
      .from('ab_assignments')
      .select('variant_id, converted, conversion_value')
      .eq('experiment_id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Group by variant
    const variantStats = {}
    assignments.forEach(a => {
      if (!variantStats[a.variant_id]) {
        variantStats[a.variant_id] = {
          users: 0,
          conversions: 0,
          totalValue: 0
        }
      }
      variantStats[a.variant_id].users++
      if (a.converted) {
        variantStats[a.variant_id].conversions++
        variantStats[a.variant_id].totalValue += a.conversion_value || 0
      }
    })

    // Calculate conversion rates and confidence
    const results = Object.entries(variantStats).map(([variantId, stats]) => {
      const conversionRate = stats.users > 0 ? (stats.conversions / stats.users) * 100 : 0
      return {
        variantId,
        users: stats.users,
        conversions: stats.conversions,
        conversionRate: Math.round(conversionRate * 100) / 100,
        avgValue: stats.conversions > 0 ? stats.totalValue / stats.conversions : 0
      }
    })

    // Calculate statistical significance (simplified z-test)
    const control = results.find(r => r.variantId === 'control')
    const variants = results.filter(r => r.variantId !== 'control')

    variants.forEach(variant => {
      if (control && control.users >= 30 && variant.users >= 30) {
        const p1 = control.conversionRate / 100
        const p2 = variant.conversionRate / 100
        const n1 = control.users
        const n2 = variant.users

        const pooledP = (p1 * n1 + p2 * n2) / (n1 + n2)
        const se = Math.sqrt(pooledP * (1 - pooledP) * (1/n1 + 1/n2))

        if (se > 0) {
          const z = (p2 - p1) / se
          variant.zScore = Math.round(z * 100) / 100
          variant.confidence = Math.min(99, Math.round(
            (1 - 2 * (1 - normalCDF(Math.abs(z)))) * 100
          ))
          variant.significant = Math.abs(z) >= 1.96
        }
      } else {
        variant.confidence = 0
        variant.significant = false
        variant.zScore = 0
      }
    })

    return NextResponse.json({
      totalUsers: assignments.length,
      results,
      hasWinner: variants.some(v => v.significant && v.conversionRate > (control?.conversionRate || 0))
    })
  } catch (error) {
    console.error('Error getting experiment results:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * Standard normal cumulative distribution function
 */
function normalCDF(x) {
  const a1 =  0.254829592
  const a2 = -0.284496736
  const a3 =  1.421413741
  const a4 = -1.453152027
  const a5 =  1.061405429
  const p  =  0.3275911

  const sign = x < 0 ? -1 : 1
  x = Math.abs(x) / Math.sqrt(2)

  const t = 1.0 / (1.0 + p * x)
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)

  return 0.5 * (1.0 + sign * y)
}
