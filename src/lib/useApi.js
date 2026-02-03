'use client'

import useSWR from 'swr'

// Default fetcher for SWR with error retry logic
const fetcher = async (url) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.')
    error.status = res.status
    error.info = await res.json().catch(() => ({}))
    throw error
  }
  return res.json()
}

// Retry logic for transient errors
const onErrorRetry = (error, key, config, revalidate, { retryCount }) => {
  // Don't retry on 401/403/404
  if (error.status === 401 || error.status === 403 || error.status === 404) return

  // Only retry up to 3 times
  if (retryCount >= 3) return

  // Exponential backoff: 1s, 2s, 4s
  const delay = Math.min(1000 * Math.pow(2, retryCount), 4000)
  setTimeout(() => revalidate({ retryCount }), delay)
}

/**
 * Custom hook for API calls with caching
 * Uses SWR for automatic caching, revalidation, and deduplication
 *
 * @param {string|null} url - The API endpoint to fetch (null to skip)
 * @param {object} options - SWR options
 * @returns {object} - { data, error, isLoading, isValidating, mutate }
 */
export function useApi(url, options = {}) {
  const {
    revalidateOnFocus = false,
    revalidateOnReconnect = true,
    dedupingInterval = 60000, // 1 minute default
    errorRetryCount = 3,
    ...restOptions
  } = options

  return useSWR(url, fetcher, {
    revalidateOnFocus,
    revalidateOnReconnect,
    dedupingInterval,
    errorRetryCount,
    onErrorRetry,
    ...restOptions
  })
}

/**
 * Hook for user subscription data with longer cache
 */
export function useSubscription() {
  return useApi('/api/user/subscription', {
    dedupingInterval: 300000, // 5 minutes
    revalidateOnFocus: false,
    errorRetryCount: 2
  })
}

/**
 * Hook for meal plans list
 */
export function useMealPlans(userId) {
  return useApi(userId ? '/api/meal-plans' : null, {
    dedupingInterval: 60000, // 1 minute
    errorRetryCount: 3
  })
}

/**
 * Hook for household data
 */
export function useHouseholdData() {
  return useApi('/api/household', {
    dedupingInterval: 120000, // 2 minutes
    revalidateOnFocus: false,
    errorRetryCount: 2
  })
}

/**
 * Hook for user profile/preferences
 */
export function useUserProfile() {
  return useApi('/api/user/profile', {
    dedupingInterval: 300000, // 5 minutes
    revalidateOnFocus: false,
    errorRetryCount: 2
  })
}

/**
 * Hook for favorites list
 */
export function useFavoritesData() {
  return useApi('/api/favorites', {
    dedupingInterval: 60000, // 1 minute
    errorRetryCount: 2
  })
}

/**
 * Hook for a single meal plan
 */
export function useMealPlan(planId) {
  return useApi(planId ? `/api/meal-plans/${planId}` : null, {
    dedupingInterval: 120000, // 2 minutes
    errorRetryCount: 2
  })
}

/**
 * Hook for shopping list
 */
export function useShoppingListData(planId) {
  return useApi(planId ? `/api/shopping-list/${planId}` : null, {
    dedupingInterval: 60000, // 1 minute
    errorRetryCount: 2
  })
}

/**
 * Mutate (revalidate) all SWR caches matching a pattern
 * Useful for invalidating related data after mutations
 */
export function invalidateCache(pattern) {
  const { mutate } = useSWR.useSWRConfig?.() || {}
  if (mutate) {
    mutate(
      key => typeof key === 'string' && key.includes(pattern),
      undefined,
      { revalidate: true }
    )
  }
}

export default useApi
