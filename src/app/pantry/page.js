'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'
import PantryItemCard from '@/components/PantryItemCard'
import AddToPantryModal from '@/components/AddToPantryModal'

const categoryLabels = {
  dairy: 'Mejeri',
  meat: 'Kött & Fisk',
  produce: 'Grönsaker & Frukt',
  grains: 'Spannmål',
  spices: 'Kryddor',
  frozen: 'Fryst',
  canned: 'Konserver',
  other: 'Övrigt'
}

// SVG Icon components for categories
const CategoryIcon = ({ category, className = "w-5 h-5" }) => {
  const icons = {
    dairy: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
    meat: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
    produce: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
        <circle cx="12" cy="12" r="4" strokeWidth={1.5} />
      </svg>
    ),
    grains: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    spices: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
      </svg>
    ),
    frozen: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v18m0-18l4 4m-4-4L8 7m4 14l4-4m-4 4l-4-4M3 12h18M3 12l4-4m-4 4l4 4m14-4l-4-4m4 4l-4 4" />
      </svg>
    ),
    canned: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    other: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    )
  }
  return icons[category] || icons.other
}

export default function PantryPage() {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [requiresPremium, setRequiresPremium] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)

  // Filters
  const [activeTab, setActiveTab] = useState('all') // all, fridge, freezer, pantry, expiring
  const [searchQuery, setSearchQuery] = useState('')

  // Check user auth
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

  // Fetch pantry items
  const fetchItems = useCallback(async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/pantry')
      const data = await response.json()

      if (!response.ok) {
        if (data.requiresPremium) {
          setRequiresPremium(true)
          return
        }
        throw new Error(data.error || 'Failed to load pantry')
      }

      setItems(data.items || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchItems()
    }
  }, [user, fetchItems])

  // Add item
  const handleAddItem = async (itemData) => {
    const response = await fetch('/api/pantry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(itemData)
    })

    const data = await response.json()
    if (!response.ok) throw new Error(data.error)

    setItems(prev => [data.item, ...prev])
  }

  // Update item
  const handleUpdateItem = async (id, updates) => {
    const response = await fetch(`/api/pantry/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })

    const data = await response.json()
    if (!response.ok) throw new Error(data.error)

    setItems(prev => prev.map(item =>
      item.id === id ? data.item : item
    ))
  }

  // Delete item
  const handleDeleteItem = async (id) => {
    const response = await fetch(`/api/pantry/${id}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error)
    }

    setItems(prev => prev.filter(item => item.id !== id))
  }

  // Filter items
  const filteredItems = items.filter(item => {
    // Location filter
    if (activeTab === 'fridge' && item.location !== 'fridge') return false
    if (activeTab === 'freezer' && item.location !== 'freezer') return false
    if (activeTab === 'pantry' && item.location !== 'pantry') return false
    if (activeTab === 'expiring' && item.expiryStatus !== 'expiring_soon' && item.expiryStatus !== 'expired') return false

    // Search filter
    if (searchQuery && !item.ingredient_name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }

    return true
  })

  // Group by category
  const groupedItems = filteredItems.reduce((acc, item) => {
    const category = item.category || 'other'
    if (!acc[category]) acc[category] = []
    acc[category].push(item)
    return acc
  }, {})

  // Stats
  const expiringCount = items.filter(i => i.expiryStatus === 'expiring_soon').length
  const expiredCount = items.filter(i => i.expiryStatus === 'expired').length

  if (loading && !items.length) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Laddar skafferiet...</p>
        </div>
      </div>
    )
  }

  if (requiresPremium) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-lg mx-auto text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Smart Skafferi
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Håll koll på dina ingredienser hemma, få varningar när saker håller på att gå ut,
              och få receptförslag baserat på vad du har.
            </p>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Premium-funktion inkluderar:</h3>
              <ul className="text-left space-y-3">
                <li className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center text-green-600">✓</span>
                  <span className="text-gray-700 dark:text-gray-300">Lägg till ingredienser du har hemma</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center text-green-600">✓</span>
                  <span className="text-gray-700 dark:text-gray-300">Varningar för utgångsdatum</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center text-green-600">✓</span>
                  <span className="text-gray-700 dark:text-gray-300">Sortera efter kyl, frys och skafferi</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center text-green-600">✓</span>
                  <span className="text-gray-700 dark:text-gray-300">Få receptförslag på vad du kan laga</span>
                </li>
              </ul>
            </div>
            <Link
              href="/pricing"
              className="inline-block px-8 py-4 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-all shadow-lg hover:scale-105"
            >
              Uppgradera till Premium
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Mitt Skafferi</h1>
              <p className="text-green-100">Håll koll på vad du har hemma</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-5 py-3 bg-white text-green-600 font-semibold rounded-xl hover:bg-green-50 transition-colors shadow-lg flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Lägg till
            </button>
          </div>

          {/* Stats */}
          <div className="flex gap-4 mt-6">
            <div className="bg-white/10 px-4 py-3 rounded-lg">
              <p className="text-2xl font-bold">{items.length}</p>
              <p className="text-sm text-green-100">Ingredienser</p>
            </div>
            {expiringCount > 0 && (
              <div className="bg-amber-500/80 px-4 py-3 rounded-lg">
                <p className="text-2xl font-bold">{expiringCount}</p>
                <p className="text-sm text-amber-100">Går ut snart</p>
              </div>
            )}
            {expiredCount > 0 && (
              <div className="bg-red-500/80 px-4 py-3 rounded-lg">
                <p className="text-2xl font-bold">{expiredCount}</p>
                <p className="text-sm text-red-100">Utgångna</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        {/* Tabs & Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* Location Tabs */}
          <div className="flex gap-1 bg-white dark:bg-gray-800 p-1.5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-x-auto">
            {[
              { id: 'all', label: 'Allt', icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              )},
              { id: 'fridge', label: 'Kylskåp', icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2zm0 8h14M8 7h.01M8 15h.01" />
                </svg>
              )},
              { id: 'freezer', label: 'Frys', icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v18m0-18l4 4m-4-4L8 7m4 14l4-4m-4 4l-4-4M3 12h18M3 12l4-4m-4 4l4 4m14-4l-4-4m4 4l-4 4" />
                </svg>
              )},
              { id: 'pantry', label: 'Skafferi', icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              )},
              { id: 'expiring', label: 'Går ut snart', icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              ), badge: expiringCount + expiredCount },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-green-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.badge > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab.id ? 'bg-white/20' : 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Sök ingrediens..."
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Empty State */}
        {filteredItems.length === 0 && !loading && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {searchQuery ? 'Inga träffar' : 'Ditt skafferi är tomt'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {searchQuery
                ? `Inga ingredienser matchar "${searchQuery}"`
                : 'Lägg till ingredienser du har hemma för att hålla koll på dem'
              }
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors"
              >
                Lägg till första ingrediensen
              </button>
            )}
          </div>
        )}

        {/* Items by Category */}
        {filteredItems.length > 0 && (
          <div className="space-y-6">
            {Object.entries(groupedItems).map(([category, categoryItems]) => (
              <div key={category}>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  <span className="text-gray-500 dark:text-gray-400"><CategoryIcon category={category} className="w-5 h-5" /></span>
                  {categoryLabels[category] || 'Övrigt'}
                  <span className="text-sm font-normal text-gray-500 dark:text-gray-400">({categoryItems.length})</span>
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryItems.map(item => (
                    <PantryItemCard
                      key={item.id}
                      item={item}
                      onUpdate={handleUpdateItem}
                      onDelete={handleDeleteItem}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Find Recipes CTA */}
        {items.length > 0 && (
          <div className="mt-12 bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-3">Vad ska du laga?</h2>
            <p className="text-green-100 mb-6 max-w-md mx-auto">
              Få receptförslag baserat på ingredienserna du har hemma
            </p>
            <Link
              href="/leftovers"
              className="inline-block px-8 py-4 bg-white text-green-600 font-semibold rounded-xl hover:bg-green-50 transition-colors shadow-lg"
            >
              Hitta recept
            </Link>
          </div>
        )}
      </main>

      {/* Add Modal */}
      <AddToPantryModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddItem}
      />
    </div>
  )
}
