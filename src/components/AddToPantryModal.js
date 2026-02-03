'use client'

import { useState } from 'react'

const categories = [
  { value: 'dairy', label: 'Mejeri' },
  { value: 'meat', label: 'Kött & Fisk' },
  { value: 'produce', label: 'Grönsaker & Frukt' },
  { value: 'grains', label: 'Spannmål' },
  { value: 'spices', label: 'Kryddor' },
  { value: 'frozen', label: 'Fryst' },
  { value: 'canned', label: 'Konserver' },
  { value: 'other', label: 'Övrigt' },
]

const locations = [
  { value: 'pantry', label: 'Skafferiet' },
  { value: 'fridge', label: 'Kylskåpet' },
  { value: 'freezer', label: 'Frysen' },
]

export default function AddToPantryModal({ isOpen, onClose, onAdd }) {
  const [formData, setFormData] = useState({
    ingredient_name: '',
    quantity: '',
    unit: '',
    category: 'other',
    location: 'pantry',
    expiry_date: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.ingredient_name.trim()) {
      setError('Namn på ingrediensen krävs')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await onAdd({
        ingredient_name: formData.ingredient_name.trim(),
        quantity: formData.quantity ? parseFloat(formData.quantity) : null,
        unit: formData.unit || null,
        category: formData.category,
        location: formData.location,
        expiry_date: formData.expiry_date || null
      })

      // Reset form
      setFormData({
        ingredient_name: '',
        quantity: '',
        unit: '',
        category: 'other',
        location: 'pantry',
        expiry_date: ''
      })
      onClose()
    } catch (err) {
      setError(err.message || 'Något gick fel')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Lägg till i skafferiet</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ingrediens *
            </label>
            <input
              type="text"
              value={formData.ingredient_name}
              onChange={(e) => setFormData({ ...formData, ingredient_name: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="t.ex. Mjölk, Pasta, Tomater..."
              autoFocus
            />
          </div>

          {/* Quantity & Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mängd
              </label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="0"
                step="0.1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Enhet
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Välj...</option>
                <option value="g">gram (g)</option>
                <option value="kg">kilogram (kg)</option>
                <option value="ml">milliliter (ml)</option>
                <option value="dl">deciliter (dl)</option>
                <option value="l">liter (l)</option>
                <option value="st">stycken (st)</option>
                <option value="förp">förpackning</option>
                <option value="msk">matsked (msk)</option>
                <option value="tsk">tesked (tsk)</option>
              </select>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kategori
            </label>
            <div className="grid grid-cols-4 gap-2">
              {categories.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: cat.value })}
                  className={`p-3 rounded-lg text-center transition-all ${
                    formData.category === cat.value
                      ? 'bg-green-100 border-2 border-green-500'
                      : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                  }`}
                >
                  <span className="text-xl block">{cat.icon}</span>
                  <span className="text-xs text-gray-600 mt-1 block">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Plats
            </label>
            <div className="flex gap-2">
              {locations.map(loc => (
                <button
                  key={loc.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, location: loc.value })}
                  className={`flex-1 p-3 rounded-lg text-center transition-all ${
                    formData.location === loc.value
                      ? 'bg-green-100 border-2 border-green-500'
                      : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                  }`}
                >
                  <span className="text-xl block">{loc.icon}</span>
                  <span className="text-xs text-gray-600 mt-1 block">{loc.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Expiry Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bäst före (valfritt)
            </label>
            <input
              type="date"
              value={formData.expiry_date}
              onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              Avbryt
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 text-white bg-green-600 font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Lägger till...' : 'Lägg till'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
