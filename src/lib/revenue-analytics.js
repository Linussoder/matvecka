import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Pricing constants (SEK)
export const PRICING = {
  MONTHLY: 59,
  ANNUAL: 499,
  ANNUAL_MONTHLY_EQUIVALENT: 499 / 12 // ~41.58 kr/month
}

/**
 * Calculate current revenue metrics
 * @param {Object} supabase - Supabase client
 * @returns {Object} Revenue metrics
 */
export async function calculateRevenueMetrics(supabase) {
  // Get all active subscriptions
  const { data: subscriptions, error } = await supabase
    .from('user_subscriptions')
    .select('*')
    .in('status', ['active', 'trialing'])
    .eq('plan', 'premium')

  if (error) {
    console.error('Error fetching subscriptions:', error)
    return null
  }

  // Determine monthly vs annual (check if subscription_id contains 'yearly' or metadata)
  const monthlySubscriptions = subscriptions.filter(s => {
    // Check if it's an annual subscription based on price or metadata
    const isAnnual = s.stripe_subscription_id?.includes('yearly') ||
                     s.stripe_subscription_id?.includes('annual') ||
                     (s.current_period_end && s.current_period_start &&
                      (new Date(s.current_period_end) - new Date(s.current_period_start)) > 180 * 24 * 60 * 60 * 1000)
    return !isAnnual
  })

  const annualSubscriptions = subscriptions.filter(s => {
    const isAnnual = s.stripe_subscription_id?.includes('yearly') ||
                     s.stripe_subscription_id?.includes('annual') ||
                     (s.current_period_end && s.current_period_start &&
                      (new Date(s.current_period_end) - new Date(s.current_period_start)) > 180 * 24 * 60 * 60 * 1000)
    return isAnnual
  })

  const monthlyCount = monthlySubscriptions.length
  const annualCount = annualSubscriptions.length
  const totalActive = subscriptions.length

  // Calculate MRR
  const mrr = (monthlyCount * PRICING.MONTHLY) + (annualCount * PRICING.ANNUAL_MONTHLY_EQUIVALENT)
  const arr = mrr * 12

  // Get churn data for current month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data: cancelledThisMonth } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('status', 'cancelled')
    .gte('updated_at', startOfMonth.toISOString())

  const churnedCount = cancelledThisMonth?.length || 0

  // Calculate churn rate (% of subscribers who cancelled this month)
  const churnRate = totalActive > 0 ? (churnedCount / (totalActive + churnedCount)) * 100 : 0

  // Calculate ARPU (Average Revenue Per User)
  const arpu = totalActive > 0 ? mrr / totalActive : 0

  // Calculate LTV (Lifetime Value = ARPU / monthly churn rate)
  const monthlyChurnRate = churnRate / 100
  const ltv = monthlyChurnRate > 0 ? arpu / monthlyChurnRate : arpu * 24 // Assume 24 months if no churn

  // Get new subscriptions this month
  const { data: newThisMonth } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('plan', 'premium')
    .gte('created_at', startOfMonth.toISOString())

  const newSubscriptions = newThisMonth?.length || 0

  // Calculate revenue lost from churn
  const revenueLost = churnedCount * PRICING.MONTHLY // Assume monthly for simplicity

  return {
    mrr: Math.round(mrr * 100) / 100,
    arr: Math.round(arr * 100) / 100,
    arpu: Math.round(arpu * 100) / 100,
    ltv: Math.round(ltv * 100) / 100,
    churnRate: Math.round(churnRate * 100) / 100,
    totalActive,
    monthlyCount,
    annualCount,
    newSubscriptions,
    churnedCount,
    revenueLost,
    revenueBreakdown: {
      monthly: {
        count: monthlyCount,
        revenue: monthlyCount * PRICING.MONTHLY,
        percentage: totalActive > 0 ? Math.round((monthlyCount / totalActive) * 100) : 0
      },
      annual: {
        count: annualCount,
        revenue: annualCount * PRICING.ANNUAL_MONTHLY_EQUIVALENT,
        percentage: totalActive > 0 ? Math.round((annualCount / totalActive) * 100) : 0
      }
    }
  }
}

/**
 * Get MRR trend for the last N months
 * @param {Object} supabase
 * @param {number} months
 * @returns {Array} Monthly MRR data
 */
export async function getMRRTrend(supabase, months = 12) {
  // Try to get from cached revenue_metrics table first
  const { data: cached } = await supabase
    .from('revenue_metrics')
    .select('*')
    .order('date', { ascending: true })
    .limit(months)

  if (cached && cached.length > 0) {
    return cached.map(row => ({
      date: row.date,
      mrr: row.mrr,
      arr: row.arr,
      subscribers: row.active_subscriptions,
      newSubscriptions: row.new_subscriptions,
      churned: row.churned_subscriptions
    }))
  }

  // If no cached data, calculate on the fly (slower)
  const trend = []
  const now = new Date()

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0)

    // Count active subscriptions as of end of that month
    const { count } = await supabase
      .from('user_subscriptions')
      .select('*', { count: 'exact' })
      .eq('plan', 'premium')
      .in('status', ['active', 'trialing'])
      .lte('created_at', endDate.toISOString())

    const activeCount = count || 0
    const mrr = activeCount * PRICING.MONTHLY // Simplified

    trend.push({
      date: date.toISOString().split('T')[0],
      mrr,
      arr: mrr * 12,
      subscribers: activeCount
    })
  }

  return trend
}

/**
 * Get churn analysis with reasons
 * @param {Object} supabase
 * @param {number} days - Look back period
 * @returns {Object} Churn analysis
 */
export async function getChurnAnalysis(supabase, days = 30) {
  const since = new Date()
  since.setDate(since.getDate() - days)

  const { data: cancelled } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('status', 'cancelled')
    .gte('updated_at', since.toISOString())

  const churnedUsers = cancelled || []

  // Group by cancellation reason if available
  const reasons = {}
  churnedUsers.forEach(user => {
    const reason = user.cancellation_reason || 'Ej angiven'
    reasons[reason] = (reasons[reason] || 0) + 1
  })

  // Convert to array and calculate percentages
  const total = churnedUsers.length
  const reasonsArray = Object.entries(reasons).map(([reason, count]) => ({
    reason,
    count,
    percentage: total > 0 ? Math.round((count / total) * 100) : 0
  })).sort((a, b) => b.count - a.count)

  return {
    totalChurned: total,
    revenueLost: total * PRICING.MONTHLY,
    period: `${days} dagar`,
    reasons: reasonsArray
  }
}

/**
 * Calculate Net Revenue Retention (NRR)
 * @param {Object} supabase
 * @returns {number} NRR percentage
 */
export async function calculateNRR(supabase) {
  const now = new Date()
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  // MRR at start of last month (simplified calculation)
  const { count: lastMonthCount } = await supabase
    .from('user_subscriptions')
    .select('*', { count: 'exact' })
    .eq('plan', 'premium')
    .in('status', ['active', 'trialing'])
    .lte('created_at', startOfLastMonth.toISOString())

  // MRR at end of this month from same cohort
  const { count: retainedCount } = await supabase
    .from('user_subscriptions')
    .select('*', { count: 'exact' })
    .eq('plan', 'premium')
    .in('status', ['active', 'trialing'])
    .lte('created_at', startOfLastMonth.toISOString())

  const mrrStart = (lastMonthCount || 0) * PRICING.MONTHLY
  const mrrEnd = (retainedCount || 0) * PRICING.MONTHLY

  // NRR = (MRR end from existing customers) / (MRR start) * 100
  const nrr = mrrStart > 0 ? (mrrEnd / mrrStart) * 100 : 100

  return Math.round(nrr * 10) / 10
}

/**
 * Format currency for display (SEK)
 * @param {number} amount
 * @returns {string}
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

/**
 * Format percentage change with arrow
 * @param {number} current
 * @param {number} previous
 * @returns {Object} { value, direction, formatted }
 */
export function formatChange(current, previous) {
  if (!previous || previous === 0) {
    return { value: 0, direction: 'neutral', formatted: '-' }
  }

  const change = ((current - previous) / previous) * 100
  const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'

  return {
    value: Math.abs(Math.round(change * 10) / 10),
    direction,
    formatted: `${direction === 'up' ? '+' : direction === 'down' ? '-' : ''}${Math.abs(Math.round(change * 10) / 10)}%`
  }
}
