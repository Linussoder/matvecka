'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'

// Simple bar chart component
function NutritionBar({ label, value, max, color, unit = 'g' }) {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">{label}</span>
        <span className="font-medium text-gray-900 dark:text-white">
          {value}{unit}
        </span>
      </div>
      <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

// Macro circle component
function MacroCircle({ label, value, percentage, color, icon }) {
  return (
    <div className="text-center">
      <div className={`w-16 h-16 ${color} rounded-full flex items-center justify-center mx-auto mb-2`}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}g</div>
      <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
      <div className="text-xs text-gray-400 dark:text-gray-500">{percentage}%</div>
    </div>
  )
}

export default function NutritionPage() {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState(null)
  const [nutritionData, setNutritionData] = useState(null)
  const [mealPlans, setMealPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dateRange, setDateRange] = useState('week') // week, month, all

  // Check auth
  useEffect(() => {
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      setUser(session.user)
    }
    checkUser()
  }, [supabase, router])

  // Fetch nutrition data
  const fetchNutrition = useCallback(async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      // Calculate date range
      let from = null
      const today = new Date()

      if (dateRange === 'week') {
        const weekAgo = new Date(today)
        weekAgo.setDate(today.getDate() - 7)
        from = weekAgo.toISOString().split('T')[0]
      } else if (dateRange === 'month') {
        const monthAgo = new Date(today)
        monthAgo.setMonth(today.getMonth() - 1)
        from = monthAgo.toISOString().split('T')[0]
      }

      const url = new URL('/api/nutrition', window.location.origin)
      if (from) url.searchParams.set('from', from)

      const response = await fetch(url)
      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      setNutritionData(data.nutrition)
      setMealPlans(data.mealPlans || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user, dateRange])

  useEffect(() => {
    if (user) fetchNutrition()
  }, [user, fetchNutrition])

  // Calculate macro percentages
  const calculateMacroPercentages = () => {
    if (!nutritionData) return { protein: 0, carbs: 0, fat: 0 }

    const { totalProtein, totalCarbs, totalFat } = nutritionData
    const total = (totalProtein * 4) + (totalCarbs * 4) + (totalFat * 9)

    if (total === 0) return { protein: 0, carbs: 0, fat: 0 }

    return {
      protein: Math.round((totalProtein * 4 / total) * 100),
      carbs: Math.round((totalCarbs * 4 / total) * 100),
      fat: Math.round((totalFat * 9 / total) * 100)
    }
  }

  const macroPercentages = calculateMacroPercentages()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Laddar näringsvärden...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">Näringsvärden</h1>
          <p className="text-green-100">Översikt över dina måltiders näringsvärden</p>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-800">
            {error}
          </div>
        )}

        {/* Date Range Selector */}
        <div className="flex gap-2 mb-8">
          {[
            { id: 'week', label: 'Senaste veckan' },
            { id: 'month', label: 'Senaste månaden' },
            { id: 'all', label: 'Alla' }
          ].map(range => (
            <button
              key={range.id}
              onClick={() => setDateRange(range.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                dateRange === range.id
                  ? 'bg-green-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>

        {/* No data state */}
        {(!nutritionData || nutritionData.mealCount === 0) && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Inga näringsvärden ännu
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Skapa en veckomeny för att börja spåra näringsvärden.
              AI genererar näringsinformation för varje recept.
            </p>
            <Link
              href="/meal-planner"
              className="inline-block px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700"
            >
              Skapa veckomeny
            </Link>
          </div>
        )}

        {nutritionData && nutritionData.mealCount > 0 && (
          <>
            {/* Overview Cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/50 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {nutritionData.totalCalories.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Totala kalorier</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {nutritionData.dailyAverages.calories}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Snitt per måltid</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {nutritionData.mealCount}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Måltider</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {mealPlans.length}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Veckomenyer</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Macro Distribution */}
            <div className="grid lg:grid-cols-2 gap-8 mb-8">
              {/* Macros Circle */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Makrofördelning</h2>
                <div className="flex justify-around">
                  <MacroCircle
                    label="Protein"
                    value={nutritionData.totalProtein}
                    percentage={macroPercentages.protein}
                    color="bg-red-100 dark:bg-red-900/50"
                    icon={
                      <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                      </svg>
                    }
                  />
                  <MacroCircle
                    label="Kolhydrater"
                    value={nutritionData.totalCarbs}
                    percentage={macroPercentages.carbs}
                    color="bg-yellow-100 dark:bg-yellow-900/50"
                    icon={
                      <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                      </svg>
                    }
                  />
                  <MacroCircle
                    label="Fett"
                    value={nutritionData.totalFat}
                    percentage={macroPercentages.fat}
                    color="bg-green-100 dark:bg-green-900/50"
                    icon={
                      <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                    }
                  />
                </div>
              </div>

              {/* Daily Averages */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Genomsnitt per måltid</h2>
                <div className="space-y-4">
                  <NutritionBar
                    label="Kalorier"
                    value={nutritionData.dailyAverages.calories}
                    max={800}
                    color="bg-orange-500"
                    unit=" kcal"
                  />
                  <NutritionBar
                    label="Protein"
                    value={nutritionData.dailyAverages.protein}
                    max={50}
                    color="bg-red-500"
                  />
                  <NutritionBar
                    label="Kolhydrater"
                    value={nutritionData.dailyAverages.carbs}
                    max={100}
                    color="bg-yellow-500"
                  />
                  <NutritionBar
                    label="Fett"
                    value={nutritionData.dailyAverages.fat}
                    max={40}
                    color="bg-green-500"
                  />
                  <NutritionBar
                    label="Fiber"
                    value={nutritionData.dailyAverages.fiber}
                    max={15}
                    color="bg-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Meal Plans with Nutrition */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Veckomenyer</h2>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {mealPlans.map(plan => (
                  <Link
                    key={plan.id}
                    href={`/meal-plan/${plan.id}`}
                    className="flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{plan.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(plan.week_start_date).toLocaleDateString('sv-SE')}
                      </p>
                    </div>
                    {plan.nutrition && (
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                          </svg>
                          {plan.nutrition.calories} kcal
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                          </svg>
                          {plan.nutrition.protein}g
                        </span>
                        <span className="text-gray-400 dark:text-gray-500">{plan.nutrition.mealCount} recept</span>
                      </div>
                    )}
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
