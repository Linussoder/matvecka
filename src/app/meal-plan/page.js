'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'

export default function MealPlanIndexPage() {
  const supabase = createClient()
  const [mealPlans, setMealPlans] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadMealPlans() {
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        setLoading(false)
        return
      }

      // Only fetch meal plans for the current user
      const { data, error } = await supabase
        .from('meal_plans')
        .select(`
          *,
          meal_plan_recipes(count)
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(12)

      if (!error) {
        setMealPlans(data || [])
      }
      setLoading(false)
    }
    loadMealPlans()
  }, [supabase])

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Veckomenyer</h1>
          <p className="text-gray-600">
            Utforska dina sparade veckoplaneringar och skapa nya
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-4 mb-10">
          <Link
            href="/meal-planner"
            className="group bg-green-600 text-white rounded-2xl p-6 hover:bg-green-700 transition-all hover:scale-[1.02] shadow-lg"
          >
            <div className="flex items-center gap-4">
              <span className="text-4xl">✨</span>
              <div>
                <h2 className="text-xl font-bold">Skapa ny veckomeny</h2>
                <p className="text-green-100 text-sm">Få 7 smarta recept baserade på veckans erbjudanden</p>
              </div>
              <svg className="w-6 h-6 ml-auto group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          <Link
            href="/my-plans"
            className="group bg-white rounded-2xl p-6 hover:shadow-xl transition-all hover:scale-[1.02] shadow-lg border border-gray-100"
          >
            <div className="flex items-center gap-4">
              <span className="text-4xl">📋</span>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Alla mina planer</h2>
                <p className="text-gray-600 text-sm">Se hela listan med dina sparade veckomenyer</p>
              </div>
              <svg className="w-6 h-6 ml-auto text-gray-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
                <div className="flex gap-4">
                  <div className="h-4 bg-gray-200 rounded w-16" />
                  <div className="h-4 bg-gray-200 rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recent Meal Plans */}
        {!loading && mealPlans.length > 0 && (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Senaste veckomenyerna</h2>
              <Link href="/my-plans" className="text-green-600 hover:text-green-700 text-sm font-medium">
                Visa alla →
              </Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mealPlans.map((plan) => (
                <MealPlanCard key={plan.id} plan={plan} />
              ))}
            </div>
          </>
        )}

        {/* Empty State */}
        {!loading && mealPlans.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center max-w-xl mx-auto">
            <span className="text-6xl block mb-4">🌟</span>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Inga veckomenyer ännu
            </h2>
            <p className="text-gray-600 mb-6">
              Skapa din första veckomeny och börja spara tid och pengar på veckohandlingen!
            </p>
            <Link
              href="/meal-planner"
              className="inline-block px-8 py-4 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors"
            >
              Skapa din första veckomeny →
            </Link>
          </div>
        )}

        {/* CTA Section */}
        {!loading && mealPlans.length > 0 && (
          <div className="mt-12 bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-8 md:p-12 text-white text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-40 h-40 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-60 h-60 bg-white/10 rounded-full translate-x-1/3 translate-y-1/3" />

            <div className="relative z-10">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                Dags för en ny vecka?
              </h2>
              <p className="text-green-100 mb-6 max-w-xl mx-auto">
                Skapa en ny veckomeny baserad på veckans bästa erbjudanden
              </p>
              <Link
                href="/meal-planner"
                className="inline-block px-8 py-4 bg-white text-green-600 font-semibold rounded-xl hover:bg-gray-100 transition-all hover:scale-105 shadow-xl"
              >
                Skapa ny veckomeny →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function MealPlanCard({ plan }) {
  const recipeCount = plan.meal_plan_recipes?.[0]?.count || 0

  return (
    <Link
      href={`/meal-plan/${plan.id}`}
      className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all border border-gray-100 overflow-hidden group"
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📋</span>
            <div>
              <h3 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                {plan.name}
              </h3>
              <p className="text-xs text-gray-500">
                {new Date(plan.created_at).toLocaleDateString('sv-SE')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex gap-3 text-gray-500">
            <span>{recipeCount} recept</span>
            <span>{plan.servings} port.</span>
          </div>
          <span className="font-semibold text-green-600">{plan.total_cost?.toFixed(0) || '—'} kr</span>
        </div>
      </div>
    </Link>
  )
}
