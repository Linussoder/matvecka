'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase-browser'
import Image from 'next/image'
import Link from 'next/link'
import LocationSelector from '@/components/LocationSelector'

// Simple category list without emojis
const categories = [
  { id: 'kött', name: 'Kött & Fågel' },
  { id: 'fisk', name: 'Fisk & Skaldjur' },
  { id: 'grönsaker', name: 'Grönsaker' },
  { id: 'frukt', name: 'Frukt & Bär' },
  { id: 'mejeri', name: 'Mejeri & Ägg' },
  { id: 'bröd', name: 'Bröd & Bageri' },
  { id: 'skafferi', name: 'Skafferi' },
  { id: 'fryst', name: 'Fryst' },
  { id: 'dryck', name: 'Dryck' },
  { id: 'snacks', name: 'Snacks & Godis' },
]

// Placeholder images by category
const categoryImages = {
  'kött': 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&q=80',
  'fisk': 'https://images.unsplash.com/photo-1510130387422-82bed34b37e9?w=400&q=80',
  'grönsaker': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&q=80',
  'frukt': 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&q=80',
  'mejeri': 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=400&q=80',
  'bröd': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80',
  'skafferi': 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400&q=80',
  'fryst': 'https://images.unsplash.com/photo-1594997756045-f188d785cf65?w=400&q=80',
  'dryck': 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=400&q=80',
  'snacks': 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400&q=80',
  'default': 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=400&q=80'
}

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [weekInfo, setWeekInfo] = useState(null)

  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCity, setSelectedCity] = useState('Stockholm')
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [sortBy, setSortBy] = useState('price-asc')

  // Load saved location
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLocation = localStorage.getItem('matvecka-location')
      if (savedLocation) {
        setSelectedCity(savedLocation)
      }
    }
  }, [])

  // Fetch products
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true)

      try {
        const supabase = createClient()

        const { data: weeks, error: weekError } = await supabase
          .from('weeks')
          .select('id, start_date, end_date')
          .order('start_date', { ascending: false })
          .limit(1)

        if (weekError) throw weekError

        let productsData = []

        if (weeks && weeks.length > 0) {
          const latestWeek = weeks[0]
          setWeekInfo(latestWeek)

          const { data, error: productError } = await supabase
            .from('products')
            .select('*')
            .eq('week_id', latestWeek.id)

          if (productError) throw productError
          productsData = data || []
        }

        // Fallback: get all products if no week-specific products
        if (productsData.length === 0) {
          const { data, error: productError } = await supabase
            .from('products')
            .select('*')
            .order('price', { ascending: true })
            .limit(100)

          if (productError) throw productError
          productsData = data || []
        }

        setProducts(productsData)

      } catch (err) {
        console.error('Error:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  // Filter and sort
  const filteredProducts = useMemo(() => {
    let result = [...products]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(p => p.name.toLowerCase().includes(query))
    }

    if (selectedCategory) {
      result = result.filter(p => p.category?.toLowerCase() === selectedCategory)
    }

    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        result.sort((a, b) => b.price - a.price)
        break
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name, 'sv'))
        break
    }

    return result
  }, [products, searchQuery, selectedCategory, sortBy])

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('sv-SE', {
      day: 'numeric',
      month: 'short'
    })
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">
                Veckans erbjudanden
              </h1>
              {weekInfo && (
                <p className="text-gray-500 mt-1">
                  {formatDate(weekInfo.start_date)} – {formatDate(weekInfo.end_date)} · {filteredProducts.length} produkter
                </p>
              )}
              {!weekInfo && !loading && (
                <p className="text-gray-500 mt-1">
                  {filteredProducts.length} produkter
                </p>
              )}
            </div>

            <LocationSelector
              selectedCity={selectedCity}
              onCityChange={setSelectedCity}
              variant="header"
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Sidebar - Categories */}
          <aside className="lg:w-56 flex-shrink-0">
            <div className="lg:sticky lg:top-20">
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                Kategorier
              </h2>
              <nav className="space-y-1">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    !selectedCategory
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Alla kategorier
                </button>
                {categories.map((cat) => {
                  const count = products.filter(p => p.category?.toLowerCase() === cat.id).length
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between ${
                        selectedCategory === cat.id
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span>{cat.name}</span>
                      {count > 0 && (
                        <span className={`text-xs ${
                          selectedCategory === cat.id ? 'text-gray-300' : 'text-gray-400'
                        }`}>
                          {count}
                        </span>
                      )}
                    </button>
                  )
                })}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Search and Sort Bar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              {/* Search */}
              <div className="relative flex-1">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Sök produkt..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-gray-900 placeholder-gray-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2.5 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-gray-700 bg-white text-sm min-w-[140px]"
              >
                <option value="price-asc">Pris: Lägst först</option>
                <option value="price-desc">Pris: Högst först</option>
                <option value="name">Namn A–Ö</option>
              </select>
            </div>

            {/* Active Filters */}
            {(selectedCategory || searchQuery) && (
              <div className="flex items-center gap-2 mb-4 text-sm">
                <span className="text-gray-500">Filter:</span>
                {selectedCategory && (
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    {categories.find(c => c.id === selectedCategory)?.name}
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    "{searchQuery}"
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={() => { setSelectedCategory(null); setSearchQuery(''); }}
                  className="text-gray-500 hover:text-gray-700 ml-2"
                >
                  Rensa alla
                </button>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-square bg-gray-100 rounded-md mb-3" />
                    <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-gray-100 rounded w-1/3" />
                  </div>
                ))}
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="text-center py-12">
                <p className="text-gray-500">Ett fel uppstod: {error}</p>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && filteredProducts.length === 0 && (
              <div className="text-center py-16">
                <p className="text-gray-900 font-medium mb-1">Inga produkter hittades</p>
                <p className="text-gray-500 text-sm mb-4">
                  Prova att ändra dina filter eller sökord
                </p>
                <button
                  onClick={() => { setSelectedCategory(null); setSearchQuery(''); }}
                  className="text-sm text-gray-900 underline hover:no-underline"
                >
                  Visa alla produkter
                </button>
              </div>
            )}

            {/* Products Grid */}
            {!loading && !error && filteredProducts.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="border-t bg-gray-50 mt-12">
        <div className="container mx-auto px-4 py-10 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Skapa en matplan baserad på erbjudandena
          </h2>
          <p className="text-gray-600 mb-5 max-w-lg mx-auto">
            Få personliga recept och en färdig inköpslista som sparar dig tid och pengar.
          </p>
          <Link
            href="/meal-planner"
            className="inline-block px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
          >
            Skapa matplan
          </Link>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Clean Product Card
// ============================================
function ProductCard({ product }) {
  const imageUrl = product.image_url || categoryImages[product.category?.toLowerCase()] || categoryImages.default

  return (
    <div className="group">
      {/* Image */}
      <div className="relative aspect-square bg-gray-50 rounded-md overflow-hidden mb-3">
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          unoptimized
        />

        {/* Store badge - subtle */}
        <div className="absolute top-2 left-2">
          <span className="px-1.5 py-0.5 bg-white/90 text-xs font-medium text-gray-700 rounded">
            ICA
          </span>
        </div>

        {/* Discount badge */}
        {product.original_price && product.original_price > product.price && (
          <div className="absolute top-2 right-2">
            <span className="px-1.5 py-0.5 bg-red-600 text-xs font-medium text-white rounded">
              -{Math.round((1 - product.price / product.original_price) * 100)}%
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div>
        {/* Category - small and subtle */}
        <p className="text-xs text-gray-400 mb-0.5 uppercase tracking-wide">
          {product.category || 'Övrigt'}
        </p>

        {/* Name */}
        <h3 className="text-sm text-gray-900 font-medium leading-tight mb-1 line-clamp-2">
          {product.name}
        </h3>

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-semibold text-gray-900">
            {product.price} kr
          </span>
          <span className="text-sm text-gray-400">
            /{product.unit || 'st'}
          </span>

          {product.original_price && product.original_price > product.price && (
            <span className="text-sm text-gray-400 line-through">
              {product.original_price} kr
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
