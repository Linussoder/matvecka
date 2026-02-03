'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function UpgradeBanner({ type = 'inline' }) {
  const [subscription, setSubscription] = useState(null)
  const [dismissed, setDismissed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadSubscription() {
      try {
        const res = await fetch('/api/user/subscription')
        const data = await res.json()
        if (data.success) {
          setSubscription(data)
        }
      } catch (error) {
        // Silently fail
      } finally {
        setLoading(false)
      }
    }
    loadSubscription()

    // Check if banner was dismissed recently
    const dismissedAt = localStorage.getItem('upgrade-banner-dismissed')
    if (dismissedAt) {
      const dismissedDate = new Date(dismissedAt)
      const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24)
      if (daysSinceDismissed < 3) {
        setDismissed(true)
      }
    }
  }, [])

  function handleDismiss() {
    setDismissed(true)
    localStorage.setItem('upgrade-banner-dismissed', new Date().toISOString())
  }

  // Don't show for premium users or while loading
  if (loading || dismissed || subscription?.plan === 'premium') {
    return null
  }

  // Check if user is close to limits
  const usage = subscription?.usage || {}
  const limits = subscription?.limits || { mealPlansPerMonth: 3, recipeRegensPerMonth: 5 }

  const mealPlanUsage = usage.mealPlansGenerated || 0
  const recipeRegenUsage = usage.recipesRegenerated || 0

  const mealPlanPercentage = (mealPlanUsage / limits.mealPlansPerMonth) * 100
  const regenPercentage = (recipeRegenUsage / limits.recipeRegensPerMonth) * 100

  // Show banner if user has used 66%+ of any limit
  const showBanner = mealPlanPercentage >= 66 || regenPercentage >= 66

  if (!showBanner && type !== 'always') {
    return null
  }

  if (type === 'floating') {
    return (
      <div className="fixed bottom-4 right-4 max-w-sm bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl shadow-2xl p-4 z-50">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-white/70 hover:text-white"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">🚀</span>
          <div>
            <p className="font-semibold">Uppgradera till Premium</p>
            <p className="text-sm text-green-100">Obegränsade matplaner</p>
          </div>
        </div>
        <Link
          href="/pricing"
          className="block w-full text-center py-2 bg-white text-green-700 rounded-lg font-medium hover:bg-green-50 transition-colors"
        >
          Se priser →
        </Link>
      </div>
    )
  }

  // Inline banner
  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              {mealPlanPercentage >= 100
                ? 'Du har nått din gräns för matplaner'
                : `Du har använt ${mealPlanUsage} av ${limits.mealPlansPerMonth} matplaner denna månad`}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Uppgradera för obegränsade matplaner och fler funktioner
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDismiss}
            className="px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            Senare
          </button>
          <Link
            href="/pricing"
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors text-sm"
          >
            Uppgradera
          </Link>
        </div>
      </div>
    </div>
  )
}

// Usage indicator component for showing current usage
export function UsageIndicator({ compact = false }) {
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadSubscription() {
      try {
        const res = await fetch('/api/user/subscription')
        const data = await res.json()
        if (data.success) {
          setSubscription(data)
        }
      } catch (error) {
        // Silently fail
      } finally {
        setLoading(false)
      }
    }
    loadSubscription()
  }, [])

  if (loading || !subscription) {
    return null
  }

  // Premium users don't need to see usage
  if (subscription.plan === 'premium') {
    return compact ? null : (
      <div className="text-sm text-green-600 flex items-center gap-1">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        Premium
      </div>
    )
  }

  const remaining = subscription.remaining || {}

  if (compact) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400">
        {remaining.mealPlans} matplaner kvar
      </div>
    )
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">Matplaner denna månad</span>
        <span className="font-medium text-gray-900 dark:text-white">
          {subscription.usage.mealPlansGenerated} / {subscription.limits.mealPlansPerMonth}
        </span>
      </div>
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            subscription.usage.mealPlansGenerated >= subscription.limits.mealPlansPerMonth
              ? 'bg-red-500'
              : subscription.usage.mealPlansGenerated >= subscription.limits.mealPlansPerMonth * 0.66
                ? 'bg-yellow-500'
                : 'bg-green-500'
          }`}
          style={{
            width: `${Math.min(100, (subscription.usage.mealPlansGenerated / subscription.limits.mealPlansPerMonth) * 100)}%`
          }}
        />
      </div>
      {subscription.usage.mealPlansGenerated >= subscription.limits.mealPlansPerMonth && (
        <Link
          href="/pricing"
          className="block text-center text-sm text-green-600 hover:text-green-700 font-medium"
        >
          Uppgradera för obegränsade planer →
        </Link>
      )}
    </div>
  )
}
