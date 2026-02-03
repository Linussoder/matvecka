'use client'

import { useState, useEffect } from 'react'

export default function AdminProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [store, setStore] = useState('Alla')
  const [stores, setStores] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [editingProduct, setEditingProduct] = useState(null)

  useEffect(() => {
    fetchProducts()
  }, [page, store])

  async function fetchProducts() {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        ...(store !== 'Alla' && { store }),
        ...(search && { search }),
      })

      const response = await fetch(`/api/admin/products?${params}`)
      const data = await response.json()

      if (data.success) {
        setProducts(data.products)
        setTotal(data.total)
        setTotalPages(data.totalPages)
        if (data.stores) setStores(data.stores)
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Kunde inte ladda produkter')
    } finally {
      setLoading(false)
    }
  }

  async function handleSearch(e) {
    e.preventDefault()
    setPage(1)
    fetchProducts()
  }

  async function handleDelete(productId) {
    if (!confirm('Är du säker på att du vill ta bort denna produkt?')) return

    try {
      const response = await fetch('/api/admin/products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: productId }),
      })

      if (response.ok) {
        setProducts(products.filter(p => p.id !== productId))
        setTotal(t => t - 1)
      }
    } catch (err) {
      alert('Kunde inte ta bort produkten')
    }
  }

  async function handleSave(product) {
    try {
      const response = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      })

      const data = await response.json()

      if (data.success) {
        setProducts(products.map(p => p.id === product.id ? data.product : p))
        setEditingProduct(null)
      }
    } catch (err) {
      alert('Kunde inte spara produkten')
    }
  }

  const storeColors = {
    'ICA': 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400',
    'Coop': 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400',
    'Willys': 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-400',
    'Hemköp': 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400',
    'City Gross': 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-400',
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Produkter</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {total} produkter extraherade från reklamblad
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <select
          value={store}
          onChange={(e) => { setStore(e.target.value); setPage(1) }}
          className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        >
          <option value="Alla">Alla butiker</option>
          {stores.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <form onSubmit={handleSearch} className="relative flex-1 max-w-xs">
          <input
            type="text"
            placeholder="Sök produkt..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
          />
          <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </form>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Products Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {products.map(product => (
              <div key={product.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                {editingProduct?.id === product.id ? (
                  <EditProductForm
                    product={editingProduct}
                    onChange={setEditingProduct}
                    onSave={() => handleSave(editingProduct)}
                    onCancel={() => setEditingProduct(null)}
                  />
                ) : (
                  <>
                    <div className="flex">
                      {product.image_url && (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-24 h-24 object-cover bg-gray-100 dark:bg-gray-700"
                        />
                      )}
                      <div className="flex-1 p-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-white line-clamp-1">{product.name}</h3>
                            <p className="text-lg font-bold text-green-600 dark:text-green-400">
                              {product.price} kr
                              {product.comparison_price && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 font-normal ml-1">
                                  ({product.comparison_price})
                                </span>
                              )}
                            </p>
                          </div>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${storeColors[product.store] || 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                            {product.store}
                          </span>
                        </div>
                        {product.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">{product.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
                      <button
                        onClick={() => setEditingProduct({ ...product })}
                        className="px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                      >
                        Redigera
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                      >
                        Ta bort
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {products.length === 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
              Inga produkter hittades
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Föregående
              </button>
              <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                Sida {page} av {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Nästa
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function EditProductForm({ product, onChange, onSave, onCancel }) {
  return (
    <div className="p-4 space-y-3">
      <div>
        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Namn</label>
        <input
          type="text"
          value={product.name || ''}
          onChange={(e) => onChange({ ...product, name: e.target.value })}
          className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Pris</label>
          <input
            type="number"
            step="0.01"
            value={product.price || ''}
            onChange={(e) => onChange({ ...product, price: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Butik</label>
          <select
            value={product.store || ''}
            onChange={(e) => onChange({ ...product, store: e.target.value })}
            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
          >
            <option value="ICA">ICA</option>
            <option value="Coop">Coop</option>
            <option value="Willys">Willys</option>
            <option value="Hemköp">Hemköp</option>
            <option value="City Gross">City Gross</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Beskrivning</label>
        <textarea
          value={product.description || ''}
          onChange={(e) => onChange({ ...product, description: e.target.value })}
          className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
          rows={2}
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          Avbryt
        </button>
        <button
          onClick={onSave}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Spara
        </button>
      </div>
    </div>
  )
}
