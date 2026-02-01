'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'

export default function DashboardPage() {
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState({
    totalPlans: 0,
    plansThisWeek: 0,
    totalSaved: 0
  })
  const [recentPlans, setRecentPlans] = useState([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    async function loadDashboard() {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        window.location.href = '/login'
        return
      }

      setUser(session.user)

      // Fetch stats
      const { count: totalPlans } = await supabase
        .from('meal_plans')
        .select('*', { count: 'exact', head: true })

      // Fetch plans this week
      const weekStart = getMonday(new Date())
      const { count: plansThisWeek } = await supabase
        .from('meal_plans')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekStart.toISOString())

      // Fetch recent plans
      const { data: plans } = await supabase
        .from('meal_plans')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      setStats({
        totalPlans: totalPlans || 0,
        plansThisWeek: plansThisWeek || 0,
        totalSaved: (totalPlans || 0) * 127 // Estimated savings
      })

      setRecentPlans(plans || [])
      setLoading(false)
    }

    loadDashboard()
  }, [supabase])

  function getMonday(date) {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff))
  }

  function getUserDisplayName() {
    if (!user) return ''
    if (user.user_metadata?.full_name) return user.user_metadata.full_name
    if (user.email) return user.email.split('@')[0]
    return 'Användare'
  }

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('sv-SE', {
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-12">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Hej, {getUserDisplayName()}!
          </h1>
          <p className="text-gray-600 mt-2">
            Välkommen till din dashboard
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📋</span>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{stats.totalPlans}</p>
                <p className="text-gray-600">Totalt matplaner</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📅</span>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{stats.plansThisWeek}/2</p>
                <p className="text-gray-600">Planer denna vecka</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
              <div>
                <p className="text-3xl font-bold text-green-600">{stats.totalSaved} kr</p>
                <p className="text-gray-600">Uppskattad besparing</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Link
            href="/meal-planner"
            className="bg-green-600 text-white rounded-xl p-6 hover:bg-green-700 transition-colors"
          >
            <div className="flex items-center gap-4">
              <span className="text-4xl">🍽️</span>
              <div>
                <h3 className="text-xl font-semibold">Skapa ny matplan</h3>
                <p className="text-green-100 mt-1">
                  Få en 7-dagars plan med smarta recept
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/products"
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all border border-gray-200"
          >
            <div className="flex items-center gap-4">
              <span className="text-4xl">🏷️</span>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Veckans erbjudanden</h3>
                <p className="text-gray-600 mt-1">
                  Se de senaste priserna
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Plans */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Senaste matplaner</h2>
            <Link href="/my-plans" className="text-green-600 hover:text-green-700">
              Visa alla →
            </Link>
          </div>

          {recentPlans.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Du har inga matplaner ännu</p>
              <Link
                href="/meal-planner"
                className="inline-block mt-4 text-green-600 hover:text-green-700"
              >
                Skapa din första matplan →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentPlans.map((plan) => (
                <Link
                  key={plan.id}
                  href={`/meal-plan/${plan.id}`}
                  className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900">{plan.name}</p>
                    <p className="text-sm text-gray-500">
                      {formatDate(plan.created_at)} • {plan.servings} portioner
                    </p>
                  </div>
                  <span className="text-green-600 font-semibold">
                    {plan.total_cost?.toFixed(0)} kr
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
