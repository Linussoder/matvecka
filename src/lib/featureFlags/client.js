'use client'

import { useState, useEffect } from 'react'

/**
 * Client-side hook to check if a feature flag is enabled
 *
 * Usage:
 *   const { isEnabled, loading } = useFeatureFlag('my-feature')
 *   if (loading) return <Loading />
 *   if (isEnabled) return <NewFeature />
 *   return <OldFeature />
 *
 * @param {string} flagName - Name of the feature flag
 * @param {boolean} defaultValue - Default value while loading
 * @returns {{ isEnabled: boolean, loading: boolean }}
 */
export function useFeatureFlag(flagName, defaultValue = false) {
  const [isEnabled, setIsEnabled] = useState(defaultValue)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkFlag() {
      try {
        const res = await fetch(`/api/flags/check?flag=${encodeURIComponent(flagName)}`)
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

/**
 * Hook to get all enabled feature flags for the current user
 *
 * @returns {{ flags: Object, loading: boolean }}
 */
export function useFeatureFlags() {
  const [flags, setFlags] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchFlags() {
      try {
        const res = await fetch('/api/flags/check')
        const data = await res.json()
        setFlags(data.flags || {})
      } catch (error) {
        console.error('Error fetching flags:', error)
        setFlags({})
      } finally {
        setLoading(false)
      }
    }
    fetchFlags()
  }, [])

  return { flags, loading }
}
