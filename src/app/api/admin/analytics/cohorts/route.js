import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'active' // 'active' or 'premium'
    const months = parseInt(searchParams.get('months') || '6')

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Try to get from cached cohort_data table first
    const { data: cached, error: cacheError } = await supabase
      .from('cohort_data')
      .select('*')
      .order('cohort_month', { ascending: false })
      .limit(months)

    // If cache table exists and has data, use it
    if (!cacheError && cached && cached.length > 0) {
      // Transform cached data into the expected format
      const cohorts = transformCachedData(cached)
      return NextResponse.json({ cohorts })
    }

    // Calculate cohorts on the fly if no cached data
    const cohorts = await calculateCohorts(supabase, months, type)

    return NextResponse.json({ cohorts })
  } catch (error) {
    console.error('Error in cohorts API:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function transformCachedData(cached) {
  // Group by cohort_month
  const grouped = {}
  cached.forEach(row => {
    const monthKey = row.cohort_month
    if (!grouped[monthKey]) {
      grouped[monthKey] = {
        month: monthKey,
        size: row.cohort_size,
        months: {}
      }
    }
    grouped[monthKey].months[row.month_offset] = row.retention_rate
  })

  return Object.values(grouped).sort((a, b) => new Date(b.month) - new Date(a.month))
}

async function calculateCohorts(supabase, numMonths, type) {
  const now = new Date()
  const cohorts = []

  for (let i = 0; i < numMonths; i++) {
    const cohortDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const cohortEnd = new Date(cohortDate.getFullYear(), cohortDate.getMonth() + 1, 0)
    const cohortMonth = cohortDate.toISOString().split('T')[0].substring(0, 7)

    // Get users who signed up in this cohort month
    const { data: cohortUsers, error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 10000
    })

    if (error) {
      console.error('Error fetching users:', error)
      continue
    }

    // Filter to users created in this month
    const usersInCohort = cohortUsers.users.filter(u => {
      const created = new Date(u.created_at)
      return created >= cohortDate && created <= cohortEnd
    })

    const cohortSize = usersInCohort.length

    if (cohortSize === 0) {
      continue
    }

    // Calculate retention for each subsequent month
    const months = { 0: 100 } // Month 0 is always 100%

    for (let m = 1; m <= Math.min(i, 6); m++) {
      const checkDate = new Date(cohortDate.getFullYear(), cohortDate.getMonth() + m, 1)
      const checkEnd = new Date(checkDate.getFullYear(), checkDate.getMonth() + 1, 0)

      // Count users who were active in month m
      let activeCount = 0

      if (type === 'premium') {
        // Check premium subscriptions
        const { count } = await supabase
          .from('user_subscriptions')
          .select('*', { count: 'exact', head: true })
          .eq('plan', 'premium')
          .in('user_id', usersInCohort.map(u => u.id))
          .in('status', ['active', 'trialing'])
          .lte('created_at', checkEnd.toISOString())

        activeCount = count || 0
      } else {
        // Check for any activity (meal plans created)
        const { count } = await supabase
          .from('meal_plans')
          .select('user_id', { count: 'exact', head: true })
          .in('user_id', usersInCohort.map(u => u.id))
          .gte('created_at', checkDate.toISOString())
          .lte('created_at', checkEnd.toISOString())

        activeCount = count || 0
      }

      months[m] = Math.round((activeCount / cohortSize) * 100)
    }

    cohorts.push({
      month: cohortMonth + '-01',
      size: cohortSize,
      months
    })
  }

  return cohorts.sort((a, b) => new Date(b.month) - new Date(a.month))
}
