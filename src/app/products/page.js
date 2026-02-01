'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase-browser'
import Image from 'next/image'
import Link from 'next/link'

// Category configuration with images and colors
const categories = {
  'kött': {
    name: 'Kött & Fågel',
    icon: '🥩',
    color: 'bg-red-100 text-red-700 border-red-200',
    image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&q=80'
  },
  'fisk': {
    name: 'Fisk & Skaldjur',
    icon: '🐟',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    image: 'https://images.unsplash.com/photo-1510130387422-82bed34b37e9?w=400&q=80'
  },
  'grönsaker': {
    name: 'Grönsaker',
    icon: '🥬',
    color: 'bg-green-100 text-green-700 border-green-200',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&q=80'
  },
  'frukt': {
    name: 'Frukt & Bär',
    icon: '🍎',
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    image: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&q=80'
  },
  'mejeri': {
    name: 'Mejeri & Ägg',
    icon: '🧈',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=400&q=80'
  },
  'bröd': {
    name: 'Bröd & Bageri',
    icon: '🍞',
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80'
  },
  'skafferi': {
    name: 'Skafferi',
    icon: '🥫',
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    image: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400&q=80'
  },
  'fryst': {
    name: 'Fryst',
    icon: '🧊',
    color: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    image: 'https://images.unsplash.com/photo-1594997756045-f188d785cf65?w=400&q=80'
  },
  'dryck': {
    name: 'Dryck',
    icon: '🥤',
    color: 'bg-pink-100 text-pink-700 border-pink-200',
    image: 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=400&q=80'
  },
  'snacks': {
    name: 'Snacks & Godis',
    icon: '🍿',
    color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    image: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400&q=80'
  },
}

const stores = [
  { id: 'ica', name: 'ICA', color: 'bg-red-500', logo: '🔴' },
  { id: 'coop', name: 'Coop', color: 'bg-green-600', logo: '🟢' },
  { id: 'citygross', name: 'City Gross', color: 'bg-blue-600', logo: '🔵' },
]

const cities = [
  'Stockholm', 'Göteborg', 'Malmö', 'Uppsala', 'Linköping',
  'Örebro', 'Helsingborg', 'Jönköping', 'Norrköping', 'Lund'
]

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCity, setSelectedCity] = useState('Stockholm')
  const [selectedStores, setSelectedStores] = useState(['ica', 'coop', 'citygross'])
  const [selectedCategories, setSelectedCategories] = useState([])
  const [priceRange, setPriceRange] = useState([0, 500])
  const [sortBy, setSortBy] = useState('price-asc')
  const [viewMode, setViewMode] = useState('grid')

  // Mobile filter panel
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true)

      try {
        // Create client inside the function
        const supabase = createClient()

        // Try to get most recent week
        const { data: weeks, error: weekError } = await supabase
          .from('weeks')
          .select('id, start_date, end_date')
          .order('start_date', { ascending: false })
          .limit(1)

        if (weekError) {
          console.error('Week fetch error:', weekError)
        }

        let productsData = null
        let productError = null

        // If we have a week, try to get products for that week
        if (weeks && weeks.length > 0) {
          const latestWeek = weeks[0]
          console.log('Found week:', latestWeek.id)

          const result = await supabase
            .from('products')
            .select('*')
            .eq('week_id', latestWeek.id)

          productsData = result.data
          productError = result.error

          console.log(`Products for week ${latestWeek.id}:`, productsData?.length || 0)
        }

        // If no products found for week (or no week), get ALL products
        if (!productsData || productsData.length === 0) {
          console.log('No week-specific products, fetching all products...')

          const result = await supabase
            .from('products')
            .select('*')
            .order('price', { ascending: true })
            .limit(100)

          productsData = result.data
          productError = result.error

          console.log('All products found:', productsData?.length || 0)
        }

        if (productError) {
          console.error('Products fetch error:', productError)
          throw productError
        }

        setProducts(productsData || [])
        setError(null)

      } catch (err) {
        console.error('Error:', err)
        setError(err.message)
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = [...products]

    // Search filter
    if (searchQuery) {
      result = result.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Category filter
    if (selectedCategories.length > 0) {
      result = result.filter(p =>
        selectedCategories.includes(p.category?.toLowerCase())
      )
    }

    // Price filter
    result = result.filter(p =>
      p.price >= priceRange[0] && p.price <= priceRange[1]
    )

    // Sorting
    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        result.sort((a, b) => b.price - a.price)
        break
      case 'name-asc':
        result.sort((a, b) => a.name.localeCompare(b.name, 'sv'))
        break
      case 'category':
        result.sort((a, b) => (a.category || '').localeCompare(b.category || '', 'sv'))
        break
    }

    return result
  }, [products, searchQuery, selectedCategories, priceRange, sortBy])

  const toggleCategory = (category) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const toggleStore = (storeId) => {
    setSelectedStores(prev =>
      prev.includes(storeId)
        ? prev.filter(s => s !== storeId)
        : [...prev, storeId]
    )
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategories([])
    setSelectedStores(['ica', 'coop', 'citygross'])
    setPriceRange([0, 500])
    setSortBy('price-asc')
  }

  const activeFilterCount =
    (searchQuery ? 1 : 0) +
    selectedCategories.length +
    (selectedStores.length < 3 ? 1 : 0) +
    (priceRange[0] > 0 || priceRange[1] < 500 ? 1 : 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                Veckans erbjudanden
              </h1>
              <p className="text-green-100">
                {filteredProducts.length} produkter från ICA, Coop och City Gross
              </p>
            </div>

            {/* City Selector */}
            <div className="flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2">
              <span className="text-green-100">📍</span>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
              >
                {cities.map(city => (
                  <option key={city} value={city} className="text-gray-900">
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6">
        {/* Search and Filter Bar */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 sticky top-16 z-40">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-grow">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                🔍
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Sök produkt..."
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-700 bg-white min-w-[160px]"
            >
              <option value="price-asc">Pris: Lägst först</option>
              <option value="price-desc">Pris: Högst först</option>
              <option value="name-asc">Namn: A-Ö</option>
              <option value="category">Kategori</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-3 ${viewMode === 'grid' ? 'bg-green-100 text-green-700' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-3 ${viewMode === 'list' ? 'bg-green-100 text-green-700' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>

            {/* Filter Button (Mobile) */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <span>⚙️</span>
              Filter
              {activeFilterCount > 0 && (
                <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Category Pills - Desktop */}
          <div className="hidden md:flex gap-2 mt-4 flex-wrap">
            {Object.entries(categories).map(([key, cat]) => (
              <button
                key={key}
                onClick={() => toggleCategory(key)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  selectedCategories.includes(key)
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.icon} {cat.name}
              </button>
            ))}

            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="px-3 py-1.5 rounded-full text-sm font-medium text-red-600 hover:bg-red-50"
              >
                ✕ Rensa filter
              </button>
            )}
          </div>
        </div>

        {/* Mobile Filter Panel */}
        {showFilters && (
          <div className="md:hidden bg-white rounded-xl shadow-sm p-4 mb-6 animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Filter</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* Categories */}
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Kategorier</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(categories).map(([key, cat]) => (
                  <button
                    key={key}
                    onClick={() => toggleCategory(key)}
                    className={`px-3 py-1.5 rounded-full text-sm ${
                      selectedCategories.includes(key)
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {cat.icon} {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Stores */}
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Butiker</p>
              <div className="flex gap-2">
                {stores.map(store => (
                  <button
                    key={store.id}
                    onClick={() => toggleStore(store.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      selectedStores.includes(store.id)
                        ? `${store.color} text-white`
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {store.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Pris: {priceRange[0]} - {priceRange[1]} kr
              </p>
              <input
                type="range"
                min="0"
                max="500"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                className="w-full accent-green-600"
              />
            </div>

            {/* Clear Filters */}
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="w-full py-2 text-red-600 font-medium hover:bg-red-50 rounded-lg"
              >
                Rensa alla filter
              </button>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-lg mb-3" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-700">Ett fel uppstod: {error}</p>
          </div>
        )}

        {/* Products Grid */}
        {!loading && !error && (
          <>
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center">
                <span className="text-6xl mb-4 block">🔍</span>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Inga produkter hittades
                </h3>
                <p className="text-gray-600 mb-4">
                  Prova att ändra dina filter eller sökord
                </p>
                <button
                  onClick={clearFilters}
                  className="text-green-600 font-medium hover:text-green-700"
                >
                  Rensa alla filter
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredProducts.map((product) => (
                  <ProductListItem key={product.id} product={product} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Results Summary */}
        {!loading && filteredProducts.length > 0 && (
          <div className="mt-8 text-center text-gray-500">
            Visar {filteredProducts.length} av {products.length} produkter
          </div>
        )}
      </main>

      {/* CTA Banner */}
      <div className="bg-green-600 text-white py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-2">
            Vill du ha recept baserade på dessa erbjudanden?
          </h2>
          <p className="text-green-100 mb-4">
            Skapa en matplan och få en komplett inköpslista automatiskt
          </p>
          <Link
            href="/meal-planner"
            className="inline-block px-6 py-3 bg-white text-green-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
          >
            Skapa matplan →
          </Link>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Product Card Component (Grid View)
// ============================================
function ProductCard({ product }) {
  const category = categories[product.category?.toLowerCase()] || {
    name: 'Övrigt',
    icon: '📦',
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    image: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=400&q=80'
  }

  // Use product image if available, otherwise use category image
  const imageUrl = product.image_url || category.image

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all overflow-hidden group border border-gray-100">
      {/* Image */}
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          unoptimized
        />

        {/* Store Badge */}
        <div className="absolute top-2 left-2">
          <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded">
            ICA
          </span>
        </div>

        {/* Discount Badge */}
        {product.original_price && product.original_price > product.price && (
          <div className="absolute top-2 right-2">
            <span className="px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded">
              -{Math.round((1 - product.price / product.original_price) * 100)}%
            </span>
          </div>
        )}

        {/* Category Badge */}
        <div className="absolute bottom-2 left-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${category.color}`}>
            {category.icon} {category.name}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-2 min-h-[40px]">
          {product.name}
        </h3>

        <div className="flex items-end justify-between">
          <div>
            <span className="text-2xl font-bold text-green-600">
              {product.price}
            </span>
            <span className="text-gray-500 text-sm ml-1">
              kr/{product.unit || 'st'}
            </span>

            {/* Original Price */}
            {product.original_price && product.original_price > product.price && (
              <p className="text-gray-400 text-sm line-through">
                {product.original_price} kr
              </p>
            )}
          </div>

          {/* Add Button */}
          <button className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center hover:bg-green-600 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Product List Item Component (List View)
// ============================================
function ProductListItem({ product }) {
  const category = categories[product.category?.toLowerCase()] || {
    name: 'Övrigt',
    icon: '📦',
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    image: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=400&q=80'
  }

  const imageUrl = product.image_url || category.image

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden border border-gray-100 flex items-center p-3 gap-4">
      {/* Image */}
      <div className="relative w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          className="object-cover"
          unoptimized
        />
      </div>

      {/* Content */}
      <div className="flex-grow min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-medium text-gray-900 truncate">
              {product.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded">
                ICA
              </span>
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${category.color}`}>
                {category.icon} {category.name}
              </span>
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <span className="text-xl font-bold text-green-600">
              {product.price} kr
            </span>
            <span className="text-gray-500 text-sm">/{product.unit || 'st'}</span>
            {product.original_price && product.original_price > product.price && (
              <p className="text-gray-400 text-sm line-through">
                {product.original_price} kr
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Add Button */}
      <button className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center hover:bg-green-600 hover:text-white transition-colors flex-shrink-0">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  )
}
