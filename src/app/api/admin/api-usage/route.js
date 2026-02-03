import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// GET - Fetch API usage statistics
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const endpoint = searchParams.get('endpoint')

    // Build query for raw logs
    let logsQuery = supabase
      .from('api_usage_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500)

    if (startDate) {
      logsQuery = logsQuery.gte('created_at', startDate)
    }
    if (endDate) {
      logsQuery = logsQuery.lte('created_at', endDate)
    }
    if (endpoint) {
      logsQuery = logsQuery.eq('endpoint', endpoint)
    }

    const { data: logs, error: logsError } = await logsQuery

    if (logsError) {
      if (logsError.code === '42P01' || logsError.code === 'PGRST205') {
        return NextResponse.json({
          success: true,
          stats: {
            totalRequests: 0,
            totalInputTokens: 0,
            totalOutputTokens: 0,
            totalCost: 0,
            avgResponseTime: 0,
            errorCount: 0,
            byEndpoint: {},
            byModel: {},
            recentLogs: []
          },
          needsSetup: true
        })
      }
      throw logsError
    }

    // Calculate aggregates
    const stats = {
      totalRequests: logs.length,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCost: 0,
      avgResponseTime: 0,
      errorCount: 0,
      byEndpoint: {},
      byModel: {},
      byDay: {},
      recentLogs: logs.slice(0, 20)
    }

    let totalResponseTime = 0

    logs.forEach(log => {
      stats.totalInputTokens += log.input_tokens || 0
      stats.totalOutputTokens += log.output_tokens || 0
      stats.totalCost += parseFloat(log.cost_usd || 0)
      totalResponseTime += log.response_time_ms || 0
      if (log.status_code >= 400) stats.errorCount++

      // By endpoint
      if (!stats.byEndpoint[log.endpoint]) {
        stats.byEndpoint[log.endpoint] = { requests: 0, tokens: 0, cost: 0, avgTime: 0, totalTime: 0 }
      }
      stats.byEndpoint[log.endpoint].requests++
      stats.byEndpoint[log.endpoint].tokens += (log.input_tokens || 0) + (log.output_tokens || 0)
      stats.byEndpoint[log.endpoint].cost += parseFloat(log.cost_usd || 0)
      stats.byEndpoint[log.endpoint].totalTime += log.response_time_ms || 0

      // By model
      if (!stats.byModel[log.model]) {
        stats.byModel[log.model] = { requests: 0, tokens: 0, cost: 0 }
      }
      stats.byModel[log.model].requests++
      stats.byModel[log.model].tokens += (log.input_tokens || 0) + (log.output_tokens || 0)
      stats.byModel[log.model].cost += parseFloat(log.cost_usd || 0)

      // By day
      const day = log.created_at?.split('T')[0] || 'unknown'
      if (!stats.byDay[day]) {
        stats.byDay[day] = { requests: 0, tokens: 0, cost: 0 }
      }
      stats.byDay[day].requests++
      stats.byDay[day].tokens += (log.input_tokens || 0) + (log.output_tokens || 0)
      stats.byDay[day].cost += parseFloat(log.cost_usd || 0)
    })

    // Calculate averages
    stats.avgResponseTime = logs.length > 0 ? Math.round(totalResponseTime / logs.length) : 0
    stats.totalCost = Math.round(stats.totalCost * 100) / 100

    // Calculate avg time per endpoint
    Object.keys(stats.byEndpoint).forEach(ep => {
      stats.byEndpoint[ep].avgTime = Math.round(
        stats.byEndpoint[ep].totalTime / stats.byEndpoint[ep].requests
      )
      stats.byEndpoint[ep].cost = Math.round(stats.byEndpoint[ep].cost * 100) / 100
      delete stats.byEndpoint[ep].totalTime
    })

    // Round costs by model
    Object.keys(stats.byModel).forEach(m => {
      stats.byModel[m].cost = Math.round(stats.byModel[m].cost * 100) / 100
    })

    // Round costs by day
    Object.keys(stats.byDay).forEach(d => {
      stats.byDay[d].cost = Math.round(stats.byDay[d].cost * 100) / 100
    })

    return NextResponse.json({
      success: true,
      stats
    })
  } catch (error) {
    console.error('API usage fetch error:', error)
    return NextResponse.json(
      { error: 'Kunde inte hämta API-statistik' },
      { status: 500 }
    )
  }
}
