import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

// Pricing per 1M tokens (as of 2024)
const PRICING = {
  'claude-sonnet-4-20250514': {
    input: 3.00,    // $3 per 1M input tokens
    output: 15.00   // $15 per 1M output tokens
  },
  'claude-3-5-sonnet-20241022': {
    input: 3.00,
    output: 15.00
  },
  'claude-3-haiku-20240307': {
    input: 0.25,
    output: 1.25
  },
  // Default fallback
  default: {
    input: 3.00,
    output: 15.00
  }
}

// Calculate cost from tokens
function calculateCost(model, inputTokens, outputTokens) {
  const pricing = PRICING[model] || PRICING.default
  const inputCost = (inputTokens / 1_000_000) * pricing.input
  const outputCost = (outputTokens / 1_000_000) * pricing.output
  return inputCost + outputCost
}

// Create Supabase client for logging
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

/**
 * Tracked Claude client that logs API usage to the database
 *
 * Usage:
 *   import { createTrackedClaude } from '@/lib/claudeUsageTracker'
 *
 *   const claude = createTrackedClaude('meal-plan-generate')
 *   const message = await claude.messages.create({ ... })
 */
export function createTrackedClaude(endpoint, options = {}) {
  const anthropic = new Anthropic()
  const { userId = null, sessionId = null } = options

  return {
    messages: {
      create: async (params) => {
        const startTime = Date.now()
        let response = null
        let error = null
        let statusCode = 200

        try {
          response = await anthropic.messages.create(params)
          return response
        } catch (err) {
          error = err
          statusCode = err.status || 500
          throw err
        } finally {
          const endTime = Date.now()
          const responseTimeMs = endTime - startTime

          // Log usage to database (non-blocking)
          logUsage({
            endpoint,
            model: params.model || 'claude-sonnet-4-20250514',
            inputTokens: response?.usage?.input_tokens || 0,
            outputTokens: response?.usage?.output_tokens || 0,
            responseTimeMs,
            statusCode,
            errorMessage: error?.message || null,
            userId,
            sessionId,
            metadata: {
              maxTokens: params.max_tokens,
              hasSystem: !!params.system,
              messageCount: params.messages?.length || 0
            }
          }).catch(console.error)
        }
      }
    }
  }
}

/**
 * Log usage to the database
 */
async function logUsage({
  endpoint,
  model,
  inputTokens,
  outputTokens,
  responseTimeMs,
  statusCode,
  errorMessage,
  userId,
  sessionId,
  metadata
}) {
  try {
    const supabase = getSupabase()
    const costUsd = calculateCost(model, inputTokens, outputTokens)

    await supabase.from('api_usage_logs').insert({
      endpoint,
      model,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      cost_usd: costUsd,
      response_time_ms: responseTimeMs,
      status_code: statusCode,
      error_message: errorMessage,
      user_id: userId,
      session_id: sessionId,
      metadata
    })
  } catch (err) {
    // Don't let logging failures affect the main flow
    console.error('Failed to log API usage:', err)
  }
}

/**
 * Wrapper function for existing code - tracks a single API call
 *
 * Usage:
 *   import { trackClaudeUsage } from '@/lib/claudeUsageTracker'
 *
 *   const message = await trackClaudeUsage(
 *     'meal-plan-generate',
 *     () => anthropic.messages.create({ ... })
 *   )
 */
export async function trackClaudeUsage(endpoint, apiCall, options = {}) {
  const { userId = null, sessionId = null, model = 'claude-sonnet-4-20250514' } = options
  const startTime = Date.now()
  let response = null
  let error = null
  let statusCode = 200

  try {
    response = await apiCall()
    return response
  } catch (err) {
    error = err
    statusCode = err.status || 500
    throw err
  } finally {
    const endTime = Date.now()
    const responseTimeMs = endTime - startTime

    // Log usage to database (non-blocking)
    logUsage({
      endpoint,
      model,
      inputTokens: response?.usage?.input_tokens || 0,
      outputTokens: response?.usage?.output_tokens || 0,
      responseTimeMs,
      statusCode,
      errorMessage: error?.message || null,
      userId,
      sessionId,
      metadata: {}
    }).catch(console.error)
  }
}

/**
 * Get usage statistics
 */
export async function getUsageStats(options = {}) {
  const { startDate, endDate, endpoint } = options
  const supabase = getSupabase()

  let query = supabase
    .from('api_usage_logs')
    .select('*')
    .order('created_at', { ascending: false })

  if (startDate) {
    query = query.gte('created_at', startDate)
  }
  if (endDate) {
    query = query.lte('created_at', endDate)
  }
  if (endpoint) {
    query = query.eq('endpoint', endpoint)
  }

  const { data, error } = await query.limit(1000)

  if (error) throw error

  // Calculate aggregates
  const stats = {
    totalRequests: data.length,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalCost: 0,
    avgResponseTime: 0,
    errorCount: 0,
    byEndpoint: {},
    byModel: {}
  }

  let totalResponseTime = 0

  data.forEach(log => {
    stats.totalInputTokens += log.input_tokens
    stats.totalOutputTokens += log.output_tokens
    stats.totalCost += parseFloat(log.cost_usd)
    totalResponseTime += log.response_time_ms
    if (log.status_code >= 400) stats.errorCount++

    // By endpoint
    if (!stats.byEndpoint[log.endpoint]) {
      stats.byEndpoint[log.endpoint] = { requests: 0, tokens: 0, cost: 0 }
    }
    stats.byEndpoint[log.endpoint].requests++
    stats.byEndpoint[log.endpoint].tokens += log.input_tokens + log.output_tokens
    stats.byEndpoint[log.endpoint].cost += parseFloat(log.cost_usd)

    // By model
    if (!stats.byModel[log.model]) {
      stats.byModel[log.model] = { requests: 0, tokens: 0, cost: 0 }
    }
    stats.byModel[log.model].requests++
    stats.byModel[log.model].tokens += log.input_tokens + log.output_tokens
    stats.byModel[log.model].cost += parseFloat(log.cost_usd)
  })

  stats.avgResponseTime = data.length > 0 ? Math.round(totalResponseTime / data.length) : 0
  stats.totalCost = Math.round(stats.totalCost * 100) / 100

  return stats
}

/**
 * Get slow queries (response time > threshold)
 */
export async function getSlowQueries(thresholdMs = 5000, limit = 50) {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('api_usage_logs')
    .select('*')
    .gte('response_time_ms', thresholdMs)
    .order('response_time_ms', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}
