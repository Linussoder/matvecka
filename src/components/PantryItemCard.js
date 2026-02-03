'use client'

import { useState } from 'react'

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
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
    grains: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    spices: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
    frozen: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v18m-6-6l6 6 6-6M6 9l6-6 6 6M3 12h18" />
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

const locationLabels = {
  pantry: 'Skafferiet',
  fridge: 'Kylskåpet',
  freezer: 'Frysen'
}

export default function PantryItemCard({
  item,
  onUpdate,
  onDelete,
  compact = false
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    quantity: item.quantity || '',
    unit: item.unit || '',
    expiry_date: item.expiry_date || ''
  })
  const [isDeleting, setIsDeleting] = useState(false)

  const getExpiryColor = () => {
    if (!item.expiry_date) return 'text-gray-400'
    if (item.expiryStatus === 'expired') return 'text-red-600 bg-red-50'
    if (item.expiryStatus === 'expiring_soon') return 'text-orange-600 bg-orange-50'
    return 'text-green-600 bg-green-50'
  }

  const getExpiryText = () => {
    if (!item.expiry_date) return null
    const date = new Date(item.expiry_date)
    const today = new Date()
    const daysUntil = Math.ceil((date - today) / (1000 * 60 * 60 * 24))

    if (daysUntil < 0) return `Utgången ${Math.abs(daysUntil)} dagar sedan`
    if (daysUntil === 0) return 'Går ut idag!'
    if (daysUntil === 1) return 'Går ut imorgon'
    if (daysUntil <= 3) return `Går ut om ${daysUntil} dagar`
    return date.toLocaleDateString('sv-SE')
  }

  const handleSave = async () => {
    await onUpdate(item.id, {
      quantity: editData.quantity ? parseFloat(editData.quantity) : null,
      unit: editData.unit || null,
      expiry_date: editData.expiry_date || null
    })
    setIsEditing(false)
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    await onDelete(item.id)
  }

  if (compact) {
    return (
      <div className={`flex items-center gap-3 p-3 rounded-lg bg-white border ${
        item.expiryStatus === 'expired' ? 'border-red-200' :
        item.expiryStatus === 'expiring_soon' ? 'border-orange-200' : 'border-gray-200'
      }`}>
        <span className="text-gray-500"><CategoryIcon category={item.category} className="w-5 h-5" /></span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">{item.ingredient_name}</p>
          {item.quantity && (
            <p className="text-sm text-gray-500">{item.quantity} {item.unit}</p>
          )}
        </div>
        {item.expiry_date && (
          <span className={`text-xs px-2 py-1 rounded-full ${getExpiryColor()}`}>
            {getExpiryText()}
          </span>
        )}
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-xl border-2 overflow-hidden ${
      item.expiryStatus === 'expired' ? 'border-red-200' :
      item.expiryStatus === 'expiring_soon' ? 'border-orange-200' : 'border-gray-100'
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-gray-500"><CategoryIcon category={item.category} className="w-6 h-6" /></span>
            <div>
              <h3 className="font-semibold text-gray-900">{item.ingredient_name}</h3>
              <p className="text-sm text-gray-500">
                {categoryLabels[item.category] || 'Övrigt'} • {locationLabels[item.location] || 'Skafferiet'}
              </p>
            </div>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Details */}
      {isEditing ? (
        <div className="p-4 space-y-3 bg-gray-50">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mängd</label>
              <input
                type="number"
                value={editData.quantity}
                onChange={(e) => setEditData({ ...editData, quantity: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="0"
                step="0.1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Enhet</label>
              <select
                value={editData.unit}
                onChange={(e) => setEditData({ ...editData, unit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Välj...</option>
                <option value="g">g</option>
                <option value="kg">kg</option>
                <option value="ml">ml</option>
                <option value="l">l</option>
                <option value="dl">dl</option>
                <option value="st">st</option>
                <option value="förp">förp</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Bäst före</label>
            <input
              type="date"
              value={editData.expiry_date}
              onChange={(e) => setEditData({ ...editData, expiry_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(false)}
              className="flex-1 px-3 py-2 text-gray-600 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Avbryt
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-3 py-2 text-white bg-green-600 rounded-lg text-sm font-medium hover:bg-green-700"
            >
              Spara
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4">
          <div className="flex items-center justify-between">
            {item.quantity ? (
              <span className="text-lg font-medium text-gray-900">
                {item.quantity} {item.unit || 'st'}
              </span>
            ) : (
              <span className="text-gray-400 text-sm">Ingen mängd angiven</span>
            )}

            {item.expiry_date && (
              <span className={`text-sm px-3 py-1 rounded-full font-medium ${getExpiryColor()}`}>
                {getExpiryText()}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
