'use client'

import { useState } from 'react'

// Age group labels and emojis
const AGE_GROUP_INFO = {
  toddler: { label: 'Småbarn', emoji: '👶', color: 'bg-pink-100 text-pink-700' },
  child: { label: 'Barn', emoji: '👧', color: 'bg-blue-100 text-blue-700' },
  teen: { label: 'Tonåring', emoji: '🧑', color: 'bg-purple-100 text-purple-700' },
  adult: { label: 'Vuxen', emoji: '👨', color: 'bg-green-100 text-green-700' },
  senior: { label: 'Senior', emoji: '👴', color: 'bg-amber-100 text-amber-700' }
}

// Diet type labels
const DIET_LABELS = {
  none: null,
  vegetarian: { label: 'Vegetarian', color: 'bg-emerald-100 text-emerald-700' },
  vegan: { label: 'Vegan', color: 'bg-lime-100 text-lime-700' },
  pescatarian: { label: 'Pescetarian', color: 'bg-cyan-100 text-cyan-700' }
}

// Portion size labels
const PORTION_LABELS = {
  small: 'Liten',
  normal: 'Normal',
  large: 'Stor'
}

export default function FamilyMemberCard({
  member,
  onEdit,
  onDelete,
  compact = false
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const ageInfo = AGE_GROUP_INFO[member.age_group] || AGE_GROUP_INFO.adult
  const dietInfo = DIET_LABELS[member.dietary_restrictions?.diet_type]
  const allergies = member.dietary_restrictions?.allergies || []
  const intolerances = member.dietary_restrictions?.intolerances || []
  const dislikes = member.dietary_restrictions?.dislikes || []

  // Get initials for avatar
  const initials = member.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const handleDelete = async () => {
    setIsDeleting(true)
    await onDelete(member.id)
    setIsDeleting(false)
    setShowDeleteConfirm(false)
  }

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
        {/* Avatar */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${ageInfo.color}`}>
          {ageInfo.emoji}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 truncate">{member.name}</div>
          <div className="text-xs text-gray-500">
            {ageInfo.label} • {member.portion_multiplier}x portion
          </div>
        </div>

        {/* Restriction badges */}
        {(allergies.length > 0 || dietInfo) && (
          <div className="flex items-center gap-1">
            {allergies.length > 0 && (
              <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                {allergies.length} allergi{allergies.length > 1 ? 'er' : ''}
              </span>
            )}
            {dietInfo && (
              <span className={`px-1.5 py-0.5 text-xs rounded ${dietInfo.color}`}>
                {dietInfo.label}
              </span>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-start gap-4">
        {/* Avatar */}
        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl ${ageInfo.color}`}>
          {ageInfo.emoji}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900">{member.name}</h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ageInfo.color}`}>
              {ageInfo.label}
            </span>
            <span className="text-sm text-gray-500">
              {PORTION_LABELS[member.portion_size]} portion ({member.portion_multiplier}x)
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(member)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Redigera"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Ta bort"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Restrictions */}
      {(dietInfo || allergies.length > 0 || intolerances.length > 0 || dislikes.length > 0) && (
        <div className="px-4 pb-4 space-y-2">
          {/* Diet */}
          {dietInfo && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-20">Kost:</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${dietInfo.color}`}>
                {dietInfo.label}
              </span>
            </div>
          )}

          {/* Allergies */}
          {allergies.length > 0 && (
            <div className="flex items-start gap-2">
              <span className="text-xs text-gray-500 w-20 pt-0.5">Allergier:</span>
              <div className="flex flex-wrap gap-1">
                {allergies.map(allergy => (
                  <span key={allergy} className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs">
                    {allergy}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Intolerances */}
          {intolerances.length > 0 && (
            <div className="flex items-start gap-2">
              <span className="text-xs text-gray-500 w-20 pt-0.5">Intoleranser:</span>
              <div className="flex flex-wrap gap-1">
                {intolerances.map(intolerance => (
                  <span key={intolerance} className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs">
                    {intolerance}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Dislikes */}
          {dislikes.length > 0 && (
            <div className="flex items-start gap-2">
              <span className="text-xs text-gray-500 w-20 pt-0.5">Ogillar:</span>
              <div className="flex flex-wrap gap-1">
                {dislikes.map(dislike => (
                  <span key={dislike} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                    {dislike}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="p-4 bg-red-50 border-t border-red-100">
          <p className="text-sm text-red-800 mb-3">
            Är du säker på att du vill ta bort {member.name}?
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
              className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-white transition-colors disabled:opacity-50"
            >
              Avbryt
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Tar bort...</span>
                </>
              ) : (
                <span>Ta bort</span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
