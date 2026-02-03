'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function SharedMealPlanPage({ params }) {
  const [share, setShare] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [token, setToken] = useState(null)

  useEffect(() => {
    // Handle async params in Next.js 15
    const getToken = async () => {
      const resolvedParams = await params
      setToken(resolvedParams.token)
    }
    getToken()
  }, [params])

  useEffect(() => {
    if (!token) return

    const fetchShare = async () => {
      try {
        console.log('Fetching share with token:', token)
        const res = await fetch(`/api/share/${token}?type=meal_plan`)
        console.log('Response status:', res.status)
        const data = await res.json()
        console.log('Response data:', data)

        if (data.success) {
          setShare(data.share)
        } else {
          setError(data.error || 'Kunde inte ladda matplanen')
        }
      } catch (err) {
        console.error('Fetch error:', err)
        setError(`Något gick fel: ${err.message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchShare()
  }, [token])

  if (loading) {
    return <LoadingPage />
  }

  if (error) {
    return <NotFoundPage message={error} />
  }

  if (!share) {
    return <NotFoundPage />
  }

  const mealPlan = share.meal_plan_data
  const recipes = mealPlan.recipes || []
  const dayNames = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag']

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">M</span>
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">Matvecka</span>
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
          >
            Skapa konto
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Shared badge */}
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          <span>Delad matplan</span>
        </div>

        {/* Header card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 md:p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            {mealPlan.name || 'Veckans matplan'}
          </h1>

          <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{recipes.length} dagar</span>
            </div>
            {mealPlan.servings && (
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{mealPlan.servings} portioner</span>
              </div>
            )}
            {mealPlan.total_cost && (
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>~{Math.round(mealPlan.total_cost)} kr totalt</span>
              </div>
            )}
          </div>
        </div>

        {/* Recipes by day */}
        <div className="space-y-4">
          {recipes.map((recipe, index) => {
            const recipeData = recipe.recipe_data || recipe
            return (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden"
              >
                <div className="flex flex-col md:flex-row">
                  {/* Day indicator */}
                  <div className="md:w-32 bg-green-500 p-4 flex md:flex-col items-center justify-center text-white">
                    <span className="text-sm opacity-80">Dag {index + 1}</span>
                    <span className="font-semibold ml-2 md:ml-0 md:mt-1">
                      {dayNames[index % 7]}
                    </span>
                  </div>

                  {/* Recipe info */}
                  <div className="flex-1 p-4 md:p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {recipeData.name || recipeData.title}
                    </h3>
                    {recipeData.description && (
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                        {recipeData.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
                      {(recipeData.prep_time || recipeData.prepTime) && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {recipeData.prep_time || recipeData.prepTime}
                        </span>
                      )}
                      {(recipeData.estimated_cost || recipeData.estimatedCost) && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          ~{recipeData.estimated_cost || recipeData.estimatedCost} kr
                        </span>
                      )}
                      {recipeData.ingredients && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          {recipeData.ingredients.length} ingredienser
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Shopping list preview */}
        {share.include_shopping_list && mealPlan.shopping_list && (
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 md:p-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Inköpslista
            </h2>
            <div className="grid md:grid-cols-2 gap-2">
              {mealPlan.shopping_list.slice(0, 20).map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 py-2 px-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm"
                >
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-gray-700 dark:text-gray-300">
                    {typeof item === 'string' ? item : `${item.amount || ''} ${item.unit || ''} ${item.name}`.trim()}
                  </span>
                </div>
              ))}
              {mealPlan.shopping_list.length > 20 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 col-span-2 text-center mt-2">
                  +{mealPlan.shopping_list.length - 20} fler varor
                </p>
              )}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Vill du kopiera matplanen och skapa egna?
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            Skapa gratis konto
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
          <p>© 2026 Matvecka. Alla rättigheter förbehållna.</p>
        </div>
      </footer>
    </div>
  )
}

function LoadingPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Laddar matplan...</p>
      </div>
    </div>
  )
}

function NotFoundPage({ message }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Matplanen hittades inte</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {message || 'Länken kan vara felaktig eller matplanen har tagits bort.'}
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
        >
          Gå till startsidan
        </Link>
      </div>
    </div>
  )
}
