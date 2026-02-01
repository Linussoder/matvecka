'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'

export default function MyShoppingListsPage() {
  const [shoppingLists, setShoppingLists] = useState([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchShoppingLists() {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        window.location.href = '/login'
        return
      }

      // Fetch shopping lists with their meal plans
      const { data, error } = await supabase
        .from('shopping_lists')
        .select(`
          *,
          meal_plans (
            id,
            name,
            week_start_date,
            total_cost,
            servings
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20)

      if (!error && data) {
        setShoppingLists(data)
      }
      setLoading(false)
    }

    fetchShoppingLists()
  }, [supabase])

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  function countItems(items) {
    if (!items) return 0
    return Array.isArray(items) ? items.length : 0
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mina inköpslistor</h1>
            <p className="text-gray-600 mt-2">Alla dina sparade inköpslistor</p>
          </div>
          <Link
            href="/meal-planner"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            + Skapa ny matplan
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : shoppingLists.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Inga inköpslistor ännu
            </h2>
            <p className="text-gray-600 mb-6">
              Skapa en matplan för att få din första inköpslista
            </p>
            <Link
              href="/meal-planner"
              className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Skapa matplan
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {shoppingLists.map((list) => (
              <Link
                key={list.id}
                href={`/shopping-list/${list.meal_plan_id}`}
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all border border-gray-100"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">🛒</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {list.meal_plans?.name || 'Inköpslista'}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Skapad {formatDate(list.created_at)}
                      </p>
                      <div className="flex gap-4 mt-2 text-sm text-gray-600">
                        <span>📦 {countItems(list.items)} varor</span>
                        <span>👥 {list.meal_plans?.servings || 4} portioner</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">
                      {list.total_cost?.toFixed(0) || '—'} kr
                    </p>
                    <p className="text-xs text-gray-500">Uppskattad kostnad</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
