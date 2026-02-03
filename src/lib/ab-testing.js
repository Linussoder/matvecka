import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/**
 * Get or create Supabase client for A/B testing
 */
function getClient() {
  if (typeof window === 'undefined') return null
  return createClient(supabaseUrl, supabaseAnonKey)
}

/**
 * Get session ID for anonymous users
 */
function getSessionId() {
  if (typeof window === 'undefined') return null

  let sessionId = sessionStorage.getItem('ab_session_id')
  if (!sessionId) {
    sessionId = `ab_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    sessionStorage.setItem('ab_session_id', sessionId)
  }
  return sessionId
}

/**
 * Assign a variant based on weights
 * @param {Array} variants - Array of variant objects with id and weight
 * @returns {Object} Selected variant
 */
function selectVariant(variants) {
  const totalWeight = variants.reduce((sum, v) => sum + (v.weight || 50), 0)
  const random = Math.random() * totalWeight

  let cumulative = 0
  for (const variant of variants) {
    cumulative += variant.weight || 50
    if (random <= cumulative) {
      return variant
    }
  }

  return variants[0] // Fallback to first variant
}

/**
 * Check if user should be included in experiment based on traffic percentage
 * @param {number} trafficPercentage - Percentage of users to include (0-100)
 * @returns {boolean}
 */
function shouldIncludeInExperiment(trafficPercentage) {
  return Math.random() * 100 <= trafficPercentage
}

/**
 * Get the variant for a user in an experiment
 * @param {string} experimentName - Name of the experiment
 * @param {string|null} userId - User ID (null for anonymous)
 * @returns {Promise<string|null>} Variant ID or null if not in experiment
 */
export async function getVariant(experimentName, userId = null) {
  const client = getClient()
  if (!client) return 'control'

  const sessionId = getSessionId()

  try {
    // Check if user/session already has an assignment
    let query = client
      .from('ab_assignments')
      .select('variant_id')
      .eq('experiment_id', experimentName)

    if (userId) {
      query = query.eq('user_id', userId)
    } else {
      query = query.eq('session_id', sessionId)
    }

    const { data: existing } = await query.single()

    if (existing) {
      return existing.variant_id
    }

    // Get experiment details
    const { data: experiment, error: expError } = await client
      .from('ab_experiments')
      .select('*')
      .eq('name', experimentName)
      .eq('status', 'running')
      .single()

    if (expError || !experiment) {
      return 'control' // Experiment not found or not running
    }

    // Check if user should be in experiment
    if (!shouldIncludeInExperiment(experiment.traffic_percentage)) {
      return 'control'
    }

    // Assign variant
    const variants = experiment.variants || [
      { id: 'control', name: 'Control', weight: 50 },
      { id: 'variant_b', name: 'Variant B', weight: 50 }
    ]
    const selectedVariant = selectVariant(variants)

    // Save assignment
    await client.from('ab_assignments').insert({
      user_id: userId,
      session_id: userId ? null : sessionId,
      experiment_id: experiment.id,
      variant_id: selectedVariant.id
    })

    return selectedVariant.id
  } catch (error) {
    console.error('Error getting variant:', error)
    return 'control'
  }
}

/**
 * Track a conversion for an experiment
 * @param {string} experimentName - Name of the experiment
 * @param {string|null} userId - User ID (null for anonymous)
 * @param {number|null} value - Optional conversion value
 */
export async function trackConversion(experimentName, userId = null, value = null) {
  const client = getClient()
  if (!client) return

  const sessionId = getSessionId()

  try {
    // Find experiment ID
    const { data: experiment } = await client
      .from('ab_experiments')
      .select('id')
      .eq('name', experimentName)
      .single()

    if (!experiment) return

    // Update assignment with conversion
    let query = client
      .from('ab_assignments')
      .update({
        converted: true,
        converted_at: new Date().toISOString(),
        conversion_value: value
      })
      .eq('experiment_id', experiment.id)

    if (userId) {
      query = query.eq('user_id', userId)
    } else {
      query = query.eq('session_id', sessionId)
    }

    await query
  } catch (error) {
    console.error('Error tracking conversion:', error)
  }
}

/**
 * Get experiment results with statistical analysis
 * @param {string} experimentId - Experiment ID
 * @returns {Promise<Object>} Experiment results
 */
export async function getExperimentResults(experimentId) {
  const client = getClient()
  if (!client) return null

  try {
    // Get all assignments for this experiment
    const { data: assignments, error } = await client
      .from('ab_assignments')
      .select('variant_id, converted, conversion_value')
      .eq('experiment_id', experimentId)

    if (error) throw error

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
          // Two-tailed test, 95% confidence = z > 1.96
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

    return {
      totalUsers: assignments.length,
      results,
      hasWinner: variants.some(v => v.significant && v.conversionRate > (control?.conversionRate || 0))
    }
  } catch (error) {
    console.error('Error getting experiment results:', error)
    return null
  }
}

/**
 * Standard normal cumulative distribution function
 * Used for calculating p-values
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

/**
 * React hook for A/B testing
 * @param {string} experimentName - Name of the experiment
 * @param {string|null} userId - Optional user ID
 * @returns {Object} { variant, loading }
 */
export function useExperiment(experimentName, userId = null) {
  const [variant, setVariant] = useState('control')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getVariant(experimentName, userId)
      .then(v => {
        setVariant(v)
        setLoading(false)
      })
      .catch(() => {
        setVariant('control')
        setLoading(false)
      })
  }, [experimentName, userId])

  return { variant, loading }
}

// Need to import these for the hook
import { useState, useEffect } from 'react'

/**
 * Experiment status constants
 */
export const EXPERIMENT_STATUS = {
  DRAFT: 'draft',
  RUNNING: 'running',
  PAUSED: 'paused',
  COMPLETED: 'completed'
}

/**
 * Create a new experiment (admin only)
 * @param {Object} supabase - Supabase client with service role
 * @param {Object} experimentData - Experiment configuration
 */
export async function createExperiment(supabase, experimentData) {
  const { data, error } = await supabase
    .from('ab_experiments')
    .insert({
      name: experimentData.name,
      description: experimentData.description,
      metric: experimentData.metric,
      variants: experimentData.variants || [
        { id: 'control', name: 'Control', weight: 50 },
        { id: 'variant_b', name: 'Variant B', weight: 50 }
      ],
      traffic_percentage: experimentData.trafficPercentage || 100,
      status: 'draft'
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Start an experiment (admin only)
 * @param {Object} supabase - Supabase client with service role
 * @param {string} experimentId - Experiment ID
 */
export async function startExperiment(supabase, experimentId) {
  const { error } = await supabase
    .from('ab_experiments')
    .update({
      status: 'running',
      start_date: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', experimentId)

  if (error) throw error
}

/**
 * Stop an experiment and optionally declare winner (admin only)
 * @param {Object} supabase - Supabase client with service role
 * @param {string} experimentId - Experiment ID
 * @param {string|null} winnerVariant - Optional winner variant ID
 */
export async function stopExperiment(supabase, experimentId, winnerVariant = null) {
  const { error } = await supabase
    .from('ab_experiments')
    .update({
      status: 'completed',
      end_date: new Date().toISOString(),
      winner_variant: winnerVariant,
      updated_at: new Date().toISOString()
    })
    .eq('id', experimentId)

  if (error) throw error
}
