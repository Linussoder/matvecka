import { createClient } from '@supabase/supabase-js'

// Create Supabase client
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

// Simple hash function for consistent rollout
function hashString(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}

// Get a consistent percentage value for a user
function getUserPercentage(userId, flagName) {
  const combined = `${userId}-${flagName}`
  return hashString(combined) % 100
}

// Check if user matches segment
function matchesSegment(user, segment) {
  if (!segment || segment === 'all') return true

  switch (segment) {
    case 'premium':
      return user?.plan === 'premium'
    case 'free':
      return !user?.plan || user?.plan === 'free'
    case 'new_users':
      if (!user?.created_at) return false
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      return new Date(user.created_at) > thirtyDaysAgo
    case 'beta_testers':
      return user?.is_beta_tester === true
    default:
      return true
  }
}

/**
 * Evaluate if a feature flag is enabled for a given context
 *
 * @param {Object} flag - The feature flag object
 * @param {Object} context - Context for evaluation (userId, user object)
 * @returns {boolean} - Whether the flag is enabled
 */
export function evaluateFlag(flag, context = {}) {
  // Flag must exist and be enabled
  if (!flag || !flag.enabled) return false

  const { userId, user } = context

  // Check rollout percentage if less than 100%
  if (flag.rollout_percentage !== undefined && flag.rollout_percentage < 100) {
    if (!userId) {
      // Anonymous users get the flag based on a random value
      // For consistent experience, you might want to use a session ID
      return Math.random() * 100 < flag.rollout_percentage
    }

    const userPercentage = getUserPercentage(userId, flag.name)
    if (userPercentage >= flag.rollout_percentage) {
      return false
    }
  }

  // Check target segment if specified
  if (flag.target_segment && flag.target_segment !== 'all') {
    if (!matchesSegment(user, flag.target_segment)) {
      return false
    }
  }

  return true
}

/**
 * Server-side function to check if a feature flag is enabled
 * Use this in API routes and Server Components
 *
 * @param {string} flagName - Name of the feature flag
 * @param {Object} context - Context for evaluation
 * @returns {Promise<boolean>} - Whether the flag is enabled
 */
export async function checkFeatureFlag(flagName, context = {}) {
  try {
    const supabase = getSupabase()

    const { data: flag, error } = await supabase
      .from('feature_flags')
      .select('*')
      .eq('name', flagName)
      .single()

    if (error || !flag) {
      console.warn(`Feature flag "${flagName}" not found`)
      return false
    }

    return evaluateFlag(flag, context)
  } catch (error) {
    console.error(`Error checking feature flag "${flagName}":`, error)
    return false
  }
}

/**
 * Server-side function to get all feature flags
 *
 * @returns {Promise<Object>} - Map of flag names to flag objects
 */
export async function getAllFlags() {
  try {
    const supabase = getSupabase()

    const { data: flags, error } = await supabase
      .from('feature_flags')
      .select('*')
      .eq('enabled', true)

    if (error) {
      console.error('Error fetching flags:', error)
      return {}
    }

    // Convert to map for easy lookup
    const flagMap = {}
    flags?.forEach(flag => {
      flagMap[flag.name] = flag
    })

    return flagMap
  } catch (error) {
    console.error('Error fetching all flags:', error)
    return {}
  }
}

/**
 * Kill switch - immediately disable all flags
 * Use this for emergency situations
 */
export async function killAllFlags() {
  try {
    const supabase = getSupabase()

    const { error } = await supabase
      .from('feature_flags')
      .update({ enabled: false })
      .neq('id', '00000000-0000-0000-0000-000000000000') // Update all rows

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error killing all flags:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Client-side hook for feature flags
 * Import this in client components
 *
 * Usage:
 *   import { useFeatureFlag } from '@/lib/featureFlags/client'
 *   const isEnabled = useFeatureFlag('my-feature')
 */
export const clientHookCode = `
'use client'
import { useState, useEffect } from 'react'

export function useFeatureFlag(flagName, defaultValue = false) {
  const [isEnabled, setIsEnabled] = useState(defaultValue)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkFlag() {
      try {
        const res = await fetch(\`/api/flags/check?flag=\${encodeURIComponent(flagName)}\`)
        const data = await res.json()
        setIsEnabled(data.enabled || false)
      } catch (error) {
        console.error('Error checking flag:', error)
        setIsEnabled(defaultValue)
      } finally {
        setLoading(false)
      }
    }
    checkFlag()
  }, [flagName, defaultValue])

  return { isEnabled, loading }
}
`
