'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase-browser'
import Image from 'next/image'
import Link from 'next/link'

const categories = [
  { id: 'alla', name: 'Alla produkter', icon: '🛒' },
  { id: 'kött', name: 'Kött & Fågel', icon: '🥩' },
  { id: 'fisk', name: 'Fisk & Skaldjur', icon: '🐟' },
  { id: 'mejeri', name: 'Mejeri', icon: '🥛' },
  { id: 'frukt', name: 'Frukt & Grönt', icon: '🥬' },
  { id: 'bröd', name: 'Bröd & Bageri', icon: '🍞' },
  { id: 'fryst', name: 'Fryst', icon: '🧊' },
  { id: 'dryck', name: 'Drycker', icon: '🥤' },
  { id: 'skafferi', name: 'Skafferi', icon: '🥫' },
  { id: 'godis', name: 'Godis & Snacks', icon: '🍫' },
  { id: 'hygien', name: 'Hygien & Hemmet', icon: '🧴' },
]

const stores = ['Alla', 'ICA', 'Coop', 'City Gross', 'Willys']

export default function ProductsListPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('alla')
  const [selectedStore, setSelectedStore] = useState('Alla')
  const [sortBy, setSortBy] = useState('name')
  const [weekInfo, setWeekInfo] = useState(null)

  // Get current week number
  const getWeekNumber = () => {
    const now = new Date()
    const start = new Date(now.getFullYear(), 0, 1)
    const diff = now - start
    const oneWeek = 604800000
    return Math.ceil((diff / oneWeek) + 1)
  }

  // Fetch products
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true)
      const supabase = createClient()

      const { data: weeks } = await supabase
        .from('weeks')
        .select('*')
        .eq('is_current', true)
        .single()

      if (weeks) {
        setWeekInfo(weeks)
      }

      const { data } = await supabase
        .from('products')
        .select('*')
        .order('name')

      if (data) {
        setProducts(data)
      }

      setLoading(false)
    }

    fetchProducts()
  }, [])

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = [...products]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(p =>
        p.name?.toLowerCase().includes(query) ||
        p.store?.toLowerCase().includes(query)
      )
    }

    if (selectedCategory !== 'alla') {
      result = result.filter(p =>
        p.category?.toLowerCase() === selectedCategory.toLowerCase()
      )
    }

    if (selectedStore !== 'Alla') {
      result = result.filter(p =>
        p.store?.toLowerCase() === selectedStore.toLowerCase()
      )
    }

    if (sortBy === 'name') {
      result.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'sv'))
    } else if (sortBy === 'price-low') {
      result.sort((a, b) => (a.price || 0) - (b.price || 0))
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => (b.price || 0) - (a.price || 0))
    } else if (sortBy === 'discount') {
      result.sort((a, b) => {
        const discountA = a.original_price ? ((a.original_price - a.price) / a.original_price) : 0
        const discountB = b.original_price ? ((b.original_price - b.price) / b.original_price) : 0
        return discountB - discountA
      })
    }

    return result
  }, [products, searchQuery, selectedCategory, selectedStore, sortBy])

  const formatDate = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('sv-SE', {
      day: 'numeric',
      month: 'short'
    })
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategory('alla')
    setSelectedStore('Alla')
    setSortBy('name')
  }

  const hasActiveFilters = searchQuery || selectedCategory !== 'alla' || selectedStore !== 'Alla'

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8 md:py-12">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
            <Link href="/" className="hover:text-gray-700">Hem</Link>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <Link href="/products" className="hover:text-gray-700">Erbjudanden</Link>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-gray-900">Produkter</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              {/* Week badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-4">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Vecka {getWeekNumber()} - {filteredProducts.length} erbjudanden
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Alla erbjudanden
              </h1>
              <p className="text-gray-600 text-lg">
                {weekInfo ? `${formatDate(weekInfo.start_date)} – ${formatDate(weekInfo.end_date)}` : 'Sök och filtrera bland veckans deals'}
              </p>
            </div>

            {/* Store logos */}
            <div className="flex items-center gap-6">
              <span className="text-sm text-gray-400">Från</span>
              <div className="flex items-center gap-4 opacity-70">
                <span className="text-lg font-bold text-red-600">ICA</span>
                <span className="text-lg font-bold text-green-700">Coop</span>
                <span className="text-lg font-bold text-blue-600">City Gross</span>
                <span className="text-lg font-bold text-orange-500">Willys</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-72 shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sticky top-20">
              {/* Search */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-3">Sök produkt</label>
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Sök..."
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-0 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Store Filter */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-3">Butik</label>
                <div className="flex flex-wrap gap-2">
                  {stores.map((store) => (
                    <button
                      key={store}
                      onClick={() => setSelectedStore(store)}
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                        selectedStore === store
                          ? 'bg-green-600 text-white shadow-md shadow-green-600/25'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {store}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Filter */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-3">Kategori</label>
                <div className="space-y-1 max-h-75 overflow-y-auto">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                        selectedCategory === cat.id
                          ? 'bg-gray-900 text-white font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-lg">{cat.icon}</span>
                      <span>{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-3">Sortera</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 border-0 rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-green-500"
                >
                  <option value="name">Namn (A-Ö)</option>
                  <option value="price-low">Pris (lägst först)</option>
                  <option value="price-high">Pris (högst först)</option>
                  <option value="discount">Rabatt</option>
                </select>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="w-full px-4 py-2.5 text-sm text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors font-medium"
                >
                  Rensa alla filter
                </button>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Active Filters */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <span className="text-sm text-gray-500">Aktiva filter:</span>
                {searchQuery && (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    "{searchQuery}"
                    <button onClick={() => setSearchQuery('')} className="hover:text-green-900 ml-1">×</button>
                  </span>
                )}
                {selectedCategory !== 'alla' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    {categories.find(c => c.id === selectedCategory)?.icon} {categories.find(c => c.id === selectedCategory)?.name}
                    <button onClick={() => setSelectedCategory('alla')} className="hover:text-green-900 ml-1">×</button>
                  </span>
                )}
                {selectedStore !== 'Alla' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    {selectedStore}
                    <button onClick={() => setSelectedStore('Alla')} className="hover:text-green-900 ml-1">×</button>
                  </span>
                )}
              </div>
            )}

            {/* Products Grid */}
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl p-4 animate-pulse shadow-sm">
                    <div className="aspect-square bg-gray-200 rounded-xl mb-3" />
                    <div className="h-4 bg-gray-200 rounded mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                  🔍
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Inga produkter hittades</h3>
                <p className="text-gray-500 mb-4">Prova att ändra dina filter</p>
                <button
                  onClick={clearFilters}
                  className="px-6 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
                >
                  Rensa filter
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-16 grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4 text-2xl">
              🔄
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Uppdateras varje vecka</h3>
            <p className="text-gray-600 text-sm">Nya erbjudanden laddas upp varje måndag</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4 text-2xl">
              🏷️
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Jämför priser</h3>
            <p className="text-gray-600 text-sm">Se erbjudanden från alla butiker på ett ställe</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4 text-2xl">
              📱
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Fungerar överallt</h3>
            <p className="text-gray-600 text-sm">Använd på datorn eller mobilen i butiken</p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-8 md:p-12 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-40 h-40 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-60 h-60 bg-white/10 rounded-full translate-x-1/3 translate-y-1/3" />

          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              Vill du spara ännu mer?
            </h2>
            <p className="text-green-100 mb-6 max-w-xl mx-auto">
              Låt oss skapa en smart matplan baserad på veckans bästa erbjudanden
            </p>
            <Link
              href="/meal-planner"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-green-600 font-semibold rounded-xl hover:bg-gray-100 transition-all hover:scale-105 shadow-xl"
            >
              Skapa matplan gratis
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// Product Card Component
function ProductCard({ product }) {
  const discount = product.original_price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : null

  const storeColors = {
    'ica': 'bg-red-500',
    'coop': 'bg-green-600',
    'city gross': 'bg-blue-600',
    'willys': 'bg-orange-500',
  }

  const storeColor = storeColors[product.store?.toLowerCase()] || 'bg-gray-500'

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 overflow-hidden border border-gray-100 group">
      {/* Image */}
      <div className="aspect-square bg-gray-50 relative overflow-hidden">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-300">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Store badge */}
        <div className={`absolute top-2 left-2 ${storeColor} text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-lg`}>
          {product.store}
        </div>

        {/* Discount badge */}
        {discount && discount > 0 && (
          <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full shadow-lg">
            -{discount}%
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-2 min-h-[2.5rem]">
          {product.name}
        </h3>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold text-gray-900">
            {product.price?.toFixed(0)}:-
          </span>
          {product.original_price && product.original_price > product.price && (
            <span className="text-sm text-gray-400 line-through">
              {product.original_price?.toFixed(0)}:-
            </span>
          )}
        </div>
        {product.unit && (
          <p className="text-xs text-gray-500 mt-1">{product.unit}</p>
        )}
      </div>
    </div>
  )
}
