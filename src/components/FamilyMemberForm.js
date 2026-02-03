'use client'

import { useState, useEffect } from 'react'

// Predefined options for dropdowns and chips
const AGE_GROUPS = [
  { value: 'toddler', label: 'Småbarn (1-3 år)', emoji: '👶' },
  { value: 'child', label: 'Barn (4-12 år)', emoji: '👧' },
  { value: 'teen', label: 'Tonåring (13-17 år)', emoji: '🧑' },
  { value: 'adult', label: 'Vuxen (18-64 år)', emoji: '👨' },
  { value: 'senior', label: 'Senior (65+ år)', emoji: '👴' }
]

const PORTION_SIZES = [
  { value: 'small', label: 'Liten portion', description: 'Mindre än normalt' },
  { value: 'normal', label: 'Normal portion', description: 'Standardportion' },
  { value: 'large', label: 'Stor portion', description: 'Större än normalt' }
]

const COMMON_ALLERGIES = [
  { value: 'nuts', label: 'Nötter' },
  { value: 'peanuts', label: 'Jordnötter' },
  { value: 'shellfish', label: 'Skaldjur' },
  { value: 'fish', label: 'Fisk' },
  { value: 'eggs', label: 'Ägg' },
  { value: 'milk', label: 'Mjölkprotein' },
  { value: 'wheat', label: 'Vete' },
  { value: 'soy', label: 'Soja' },
  { value: 'sesame', label: 'Sesam' }
]

const COMMON_INTOLERANCES = [
  { value: 'lactose', label: 'Laktos' },
  { value: 'gluten', label: 'Gluten' },
  { value: 'fructose', label: 'Fruktos' },
  { value: 'histamine', label: 'Histamin' }
]

const DIET_TYPES = [
  { value: 'none', label: 'Ingen särskild kost' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'pescatarian', label: 'Pescetarian (äter fisk)' }
]

export default function FamilyMemberForm({
  member = null, // Existing member for editing, null for new
  onSubmit,
  onCancel,
  isLoading = false
}) {
  const [name, setName] = useState('')
  const [ageGroup, setAgeGroup] = useState('adult')
  const [portionSize, setPortionSize] = useState('normal')
  const [allergies, setAllergies] = useState([])
  const [intolerances, setIntolerances] = useState([])
  const [dietType, setDietType] = useState('none')
  const [dislikes, setDislikes] = useState('')
  const [errors, setErrors] = useState({})

  // Populate form when editing existing member
  useEffect(() => {
    if (member) {
      setName(member.name || '')
      setAgeGroup(member.age_group || 'adult')
      setPortionSize(member.portion_size || 'normal')
      const restrictions = member.dietary_restrictions || {}
      setAllergies(restrictions.allergies || [])
      setIntolerances(restrictions.intolerances || [])
      setDietType(restrictions.diet_type || 'none')
      setDislikes((restrictions.dislikes || []).join(', '))
    }
  }, [member])

  const toggleAllergy = (allergyValue) => {
    setAllergies(prev =>
      prev.includes(allergyValue)
        ? prev.filter(a => a !== allergyValue)
        : [...prev, allergyValue]
    )
  }

  const toggleIntolerance = (intoleranceValue) => {
    setIntolerances(prev =>
      prev.includes(intoleranceValue)
        ? prev.filter(i => i !== intoleranceValue)
        : [...prev, intoleranceValue]
    )
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    // Validate
    const newErrors = {}
    if (!name.trim()) {
      newErrors.name = 'Namn krävs'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    // Parse dislikes from comma-separated string
    const dislikesList = dislikes
      .split(',')
      .map(d => d.trim())
      .filter(d => d.length > 0)

    const memberData = {
      name: name.trim(),
      age_group: ageGroup,
      portion_size: portionSize,
      dietary_restrictions: {
        allergies,
        intolerances,
        diet_type: dietType,
        dislikes: dislikesList
      }
    }

    onSubmit(memberData)
  }

  const isEditing = Boolean(member)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Namn *
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            if (errors.name) setErrors({ ...errors, name: null })
          }}
          placeholder="T.ex. Anna, Pappa, Mormor..."
          className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
            errors.name ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name}</p>
        )}
      </div>

      {/* Age Group */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Åldersgrupp
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {AGE_GROUPS.map((age) => (
            <button
              key={age.value}
              type="button"
              onClick={() => setAgeGroup(age.value)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm ${
                ageGroup === age.value
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <span>{age.emoji}</span>
              <span>{age.label}</span>
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-gray-500">
          Åldersgruppen påverkar automatiskt portionsstorleken
        </p>
      </div>

      {/* Portion Size */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Portionsstorlek
        </label>
        <div className="flex gap-2">
          {PORTION_SIZES.map((size) => (
            <button
              key={size.value}
              type="button"
              onClick={() => setPortionSize(size.value)}
              className={`flex-1 px-3 py-2.5 rounded-lg border transition-all ${
                portionSize === size.value
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <div className="font-medium text-sm">{size.label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{size.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Diet Type */}
      <div>
        <label htmlFor="dietType" className="block text-sm font-medium text-gray-700 mb-1">
          Kosttyp
        </label>
        <select
          id="dietType"
          value={dietType}
          onChange={(e) => setDietType(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
        >
          {DIET_TYPES.map((diet) => (
            <option key={diet.value} value={diet.value}>
              {diet.label}
            </option>
          ))}
        </select>
      </div>

      {/* Allergies */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Allergier
        </label>
        <div className="flex flex-wrap gap-2">
          {COMMON_ALLERGIES.map((allergy) => (
            <button
              key={allergy.value}
              type="button"
              onClick={() => toggleAllergy(allergy.value)}
              className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                allergies.includes(allergy.value)
                  ? 'bg-red-100 text-red-700 border border-red-300'
                  : 'bg-gray-100 text-gray-600 border border-gray-200 hover:border-gray-300'
              }`}
            >
              {allergies.includes(allergy.value) && (
                <span className="mr-1">✓</span>
              )}
              {allergy.label}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-gray-500">
          Allergier undviks alltid i recepten
        </p>
      </div>

      {/* Intolerances */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Intoleranser
        </label>
        <div className="flex flex-wrap gap-2">
          {COMMON_INTOLERANCES.map((intolerance) => (
            <button
              key={intolerance.value}
              type="button"
              onClick={() => toggleIntolerance(intolerance.value)}
              className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                intolerances.includes(intolerance.value)
                  ? 'bg-orange-100 text-orange-700 border border-orange-300'
                  : 'bg-gray-100 text-gray-600 border border-gray-200 hover:border-gray-300'
              }`}
            >
              {intolerances.includes(intolerance.value) && (
                <span className="mr-1">✓</span>
              )}
              {intolerance.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dislikes */}
      <div>
        <label htmlFor="dislikes" className="block text-sm font-medium text-gray-700 mb-1">
          Ogillar (valfritt)
        </label>
        <input
          type="text"
          id="dislikes"
          value={dislikes}
          onChange={(e) => setDislikes(e.target.value)}
          placeholder="T.ex. svamp, oliver, koriander..."
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
        />
        <p className="mt-1.5 text-xs text-gray-500">
          Separera med kommatecken. AI:n försöker undvika dessa ingredienser.
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Avbryt
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Sparar...</span>
            </>
          ) : (
            <span>{isEditing ? 'Spara ändringar' : 'Lägg till'}</span>
          )}
        </button>
      </div>
    </form>
  )
}
