'use client'

// Age group emojis
const AGE_GROUP_EMOJI = {
  toddler: '👶',
  child: '👧',
  teen: '🧑',
  adult: '👨',
  senior: '👴'
}

// Diet labels in Swedish
const DIET_LABELS = {
  none: null,
  vegetarian: 'Vegetariskt',
  vegan: 'Veganskt',
  pescatarian: 'Pescetarianskt'
}

export default function HouseholdSummary({
  familyMembers = [],
  totalServings = 0,
  combinedRestrictions = {},
  compact = false,
  showLink = true,
  onManageClick
}) {
  const memberCount = familyMembers.length

  if (memberCount === 0) {
    return (
      <div className="text-center py-4 text-gray-500 text-sm">
        Inga familjemedlemmar tillagda ännu.
        {showLink && onManageClick && (
          <button
            onClick={onManageClick}
            className="block mx-auto mt-2 text-green-600 hover:text-green-700 font-medium"
          >
            Lägg till första medlemmen
          </button>
        )}
      </div>
    )
  }

  const allergies = combinedRestrictions.allergies || []
  const intolerances = combinedRestrictions.intolerances || []
  const dietType = combinedRestrictions.diet_type || 'none'
  const dislikes = combinedRestrictions.dislikes || []
  const dietLabel = DIET_LABELS[dietType]

  // Round up servings for display
  const displayServings = Math.ceil(totalServings)
  const hasDecimal = totalServings !== displayServings

  if (compact) {
    return (
      <div className="bg-gray-50 rounded-lg p-3">
        {/* Member avatars */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex -space-x-2">
            {familyMembers.slice(0, 5).map((member, idx) => (
              <div
                key={member.id}
                className="w-8 h-8 rounded-full bg-white border-2 border-gray-50 flex items-center justify-center text-sm"
                style={{ zIndex: 5 - idx }}
                title={member.name}
              >
                {AGE_GROUP_EMOJI[member.age_group] || '👤'}
              </div>
            ))}
            {memberCount > 5 && (
              <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-gray-50 flex items-center justify-center text-xs font-medium text-gray-600">
                +{memberCount - 5}
              </div>
            )}
          </div>
          <span className="text-sm text-gray-600">
            {memberCount} {memberCount === 1 ? 'person' : 'personer'}
          </span>
        </div>

        {/* Quick stats */}
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-900 font-medium">
            {displayServings} portioner
          </span>
          {dietLabel && (
            <span className="text-emerald-600">{dietLabel}</span>
          )}
          {allergies.length > 0 && (
            <span className="text-red-600">
              {allergies.length} allergi{allergies.length > 1 ? 'er' : ''}
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
      {/* Header with member avatars */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Avatars */}
          <div className="flex -space-x-2">
            {familyMembers.slice(0, 4).map((member, idx) => (
              <div
                key={member.id}
                className="w-10 h-10 rounded-full bg-white border-2 border-green-50 flex items-center justify-center text-lg shadow-sm"
                style={{ zIndex: 4 - idx }}
                title={member.name}
              >
                {AGE_GROUP_EMOJI[member.age_group] || '👤'}
              </div>
            ))}
            {memberCount > 4 && (
              <div className="w-10 h-10 rounded-full bg-green-100 border-2 border-green-50 flex items-center justify-center text-sm font-medium text-green-700">
                +{memberCount - 4}
              </div>
            )}
          </div>

          {/* Count */}
          <div>
            <div className="font-medium text-gray-900">
              {memberCount} {memberCount === 1 ? 'familjemedlem' : 'familjemedlemmar'}
            </div>
            <div className="text-sm text-gray-600">
              {familyMembers.map(m => m.name).join(', ')}
            </div>
          </div>
        </div>

        {/* Manage link */}
        {showLink && onManageClick && (
          <button
            onClick={onManageClick}
            className="text-green-600 hover:text-green-700 text-sm font-medium"
          >
            Hantera
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Portions */}
        <div className="bg-white rounded-lg p-3">
          <div className="text-2xl font-bold text-gray-900">
            {displayServings}
            {hasDecimal && (
              <span className="text-sm font-normal text-gray-500 ml-1">
                ({totalServings.toFixed(1)})
              </span>
            )}
          </div>
          <div className="text-sm text-gray-600">Portioner totalt</div>
        </div>

        {/* Diet type */}
        <div className="bg-white rounded-lg p-3">
          <div className="text-lg font-bold text-gray-900">
            {dietLabel || 'Blandkost'}
          </div>
          <div className="text-sm text-gray-600">
            {dietType === 'none' ? 'Inga kostbegränsningar' : 'Kosttyp för alla'}
          </div>
        </div>
      </div>

      {/* Restrictions summary */}
      {(allergies.length > 0 || intolerances.length > 0) && (
        <div className="bg-white rounded-lg p-3 space-y-2">
          <div className="text-sm font-medium text-gray-700">Måste undvikas:</div>

          <div className="flex flex-wrap gap-1.5">
            {allergies.map(allergy => (
              <span
                key={allergy}
                className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium"
              >
                🚫 {allergy}
              </span>
            ))}
            {intolerances.map(intolerance => (
              <span
                key={intolerance}
                className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium"
              >
                ⚠️ {intolerance}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Dislikes */}
      {dislikes.length > 0 && (
        <div className="mt-2 text-sm text-gray-500">
          <span className="font-medium">Ogillar:</span>{' '}
          {dislikes.join(', ')}
        </div>
      )}

      {/* All clear message */}
      {allergies.length === 0 && intolerances.length === 0 && dietType === 'none' && (
        <div className="bg-white rounded-lg p-3 text-center">
          <span className="text-green-600 font-medium">
            ✓ Inga särskilda begränsningar
          </span>
          <p className="text-sm text-gray-500 mt-1">
            Alla familjemedlemmar kan äta samma mat
          </p>
        </div>
      )}
    </div>
  )
}
