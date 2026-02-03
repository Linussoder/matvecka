'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

const STORES = [
  { id: 'ica', name: 'ICA', color: 'bg-red-100 text-red-700 border-red-200' },
  { id: 'coop', name: 'Coop', color: 'bg-green-100 text-green-700 border-green-200' },
  { id: 'citygross', name: 'City Gross', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { id: 'willys', name: 'Willys', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' }
]

const DIETS = [
  { id: 'none', label: 'Ingen speciell', description: 'Äter allt' },
  { id: 'vegetarian', label: 'Vegetarisk', description: 'Ingen kött eller fisk' },
  { id: 'vegan', label: 'Vegansk', description: 'Inga animaliska produkter' },
  { id: 'pescatarian', label: 'Pescetarian', description: 'Fisk men inget kött' },
  { id: 'keto', label: 'Keto/LCHF', description: 'Lågt kolhydratintag' },
  { id: 'flexitarian', label: 'Flexitarian', description: 'Mestadels vegetariskt' }
]

const ALLERGIES = ['Nötter', 'Jordnötter', 'Skaldjur', 'Fisk', 'Ägg', 'Mjölk', 'Soja', 'Vete', 'Sesam']

const CITIES = ['Stockholm', 'Göteborg', 'Malmö', 'Uppsala', 'Helsingborg', 'Örebro', 'Linköping', 'Västerås', 'Norrköping', 'Jönköping', 'Lund', 'Umeå']

export default function OnboardingWizard() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    preferred_city: 'Stockholm',
    diet_type: 'none',
    allergies: [],
    favorite_stores: [],
    default_servings: 4,
    max_budget_per_serving: 50
  })

  const supabase = createClient()

  const steps = [
    { id: 'welcome', title: 'Välkommen', icon: '👋' },
    { id: 'profile', title: 'Om dig', icon: '👤' },
    { id: 'diet', title: 'Kost', icon: '🥗' },
    { id: 'stores', title: 'Butiker', icon: '🛒' },
    { id: 'household', title: 'Hushåll', icon: '👨‍👩‍👧‍👦' },
    { id: 'complete', title: 'Klart!', icon: '🎉' }
  ]

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const toggleAllergy = (allergy) => {
    setFormData(prev => ({
      ...prev,
      allergies: prev.allergies.includes(allergy)
        ? prev.allergies.filter(a => a !== allergy)
        : [...prev.allergies, allergy]
    }))
  }

  const toggleStore = (storeId) => {
    setFormData(prev => ({
      ...prev,
      favorite_stores: prev.favorite_stores.includes(storeId)
        ? prev.favorite_stores.filter(s => s !== storeId)
        : [...prev.favorite_stores, storeId]
    }))
  }

  const completeOnboarding = async () => {
    setSaving(true)
    setError(null)

    try {
      // Save profile via API
      const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString()
        })
      })

      if (!response.ok) {
        throw new Error('Kunde inte spara profilen')
      }

      // Redirect to meal planner
      router.push('/meal-planner?welcome=true')
    } catch (err) {
      console.error('Error completing onboarding:', err)
      setError(err.message || 'Något gick fel')
      setSaving(false)
    }
  }

  const skipOnboarding = async () => {
    setSaving(true)
    try {
      await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString()
        })
      })
      router.push('/meal-planner')
    } catch (err) {
      router.push('/meal-planner')
    }
  }

  const renderStep = () => {
    switch (steps[currentStep].id) {
      case 'welcome':
        return (
          <div className="text-center py-8">
            <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Välkommen till Matvecka!
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
              Låt oss ställa in appen så den passar just dig. Det tar bara en minut!
            </p>
            <div className="flex flex-col gap-3 max-w-xs mx-auto">
              <button
                onClick={nextStep}
                className="w-full py-4 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors shadow-md"
              >
                Kom igång
              </button>
              <button
                onClick={skipOnboarding}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm"
              >
                Hoppa över och utforska själv
              </button>
            </div>
          </div>
        )

      case 'profile':
        return (
          <div className="py-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Lite om dig
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Så vi kan anpassa upplevelsen för dig
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Vad heter du?
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="Ditt namn"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Var bor du?
                </label>
                <select
                  value={formData.preferred_city}
                  onChange={(e) => setFormData({ ...formData, preferred_city: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  {CITIES.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Vi visar erbjudanden från butiker nära dig
                </p>
              </div>
            </div>
          </div>
        )

      case 'diet':
        return (
          <div className="py-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Dina kostpreferenser
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Så vi kan skapa recept som passar dig
            </p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                  Vilken kosthållning följer du?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {DIETS.map(diet => (
                    <button
                      key={diet.id}
                      onClick={() => setFormData({ ...formData, diet_type: diet.id })}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        formData.diet_type === diet.id
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <p className={`font-medium ${formData.diet_type === diet.id ? 'text-green-700 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                        {diet.label}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{diet.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                  Har du några allergier?
                </label>
                <div className="flex flex-wrap gap-2">
                  {ALLERGIES.map(allergy => (
                    <button
                      key={allergy}
                      onClick={() => toggleAllergy(allergy)}
                      className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                        formData.allergies.includes(allergy)
                          ? 'bg-red-100 text-red-700 border-2 border-red-300'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-2 border-transparent hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {allergy}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      case 'stores':
        return (
          <div className="py-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Dina favoritbutiker
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Vi visar erbjudanden från dessa butiker
            </p>

            <div className="grid grid-cols-2 gap-3">
              {STORES.map(store => (
                <button
                  key={store.id}
                  onClick={() => toggleStore(store.id)}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    formData.favorite_stores.includes(store.id)
                      ? `${store.color} border-current`
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                  }`}
                >
                  <div className="text-2xl mb-2">🛒</div>
                  <p className={`font-semibold ${formData.favorite_stores.includes(store.id) ? '' : 'text-gray-900 dark:text-white'}`}>
                    {store.name}
                  </p>
                  {formData.favorite_stores.includes(store.id) && (
                    <div className="mt-2">
                      <svg className="w-5 h-5 mx-auto text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>

            {formData.favorite_stores.length === 0 && (
              <p className="text-sm text-amber-600 dark:text-amber-400 mt-4 text-center">
                Välj minst en butik för bästa upplevelsen
              </p>
            )}
          </div>
        )

      case 'household':
        return (
          <div className="py-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Ditt hushåll
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Så recepten blir rätt anpassade
            </p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                  Hur många äter ni vanligtvis?
                </label>
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => setFormData({ ...formData, default_servings: Math.max(1, formData.default_servings - 1) })}
                    className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    −
                  </button>
                  <div className="text-center">
                    <span className="text-5xl font-bold text-green-600">{formData.default_servings}</span>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">personer</p>
                  </div>
                  <button
                    onClick={() => setFormData({ ...formData, default_servings: Math.min(12, formData.default_servings + 1) })}
                    className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                  Budget per portion (kr)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="20"
                    max="100"
                    step="5"
                    value={formData.max_budget_per_serving}
                    onChange={(e) => setFormData({ ...formData, max_budget_per_serving: parseInt(e.target.value) })}
                    className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-600"
                  />
                  <span className="w-16 text-center text-lg font-semibold text-gray-900 dark:text-white">
                    {formData.max_budget_per_serving} kr
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>Budget</span>
                  <span>Premium</span>
                </div>
              </div>
            </div>
          </div>
        )

      case 'complete':
        return (
          <div className="text-center py-8">
            <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-bounce">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Allt klart, {formData.full_name || 'du'}!
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
              Nu är du redo att skapa din första veckomeny. Vi har sparat dina preferenser så allt är anpassat för dig.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={completeOnboarding}
              disabled={saving}
              className="w-full max-w-xs py-4 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Sparar...
                </span>
              ) : (
                'Skapa min första veckomeny →'
              )}
            </button>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Progress */}
        {currentStep > 0 && currentStep < steps.length - 1 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Steg {currentStep} av {steps.length - 2}
              </span>
              <span className="text-sm font-medium text-green-600">
                {steps[currentStep].title}
              </span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-300"
                style={{ width: `${((currentStep) / (steps.length - 2)) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Step content */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
          {renderStep()}

          {/* Navigation */}
          {currentStep > 0 && currentStep < steps.length - 1 && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={prevStep}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Tillbaka
              </button>
              <button
                onClick={nextStep}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors"
              >
                Nästa
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Skip link for non-welcome steps */}
        {currentStep > 0 && currentStep < steps.length - 1 && (
          <div className="text-center mt-4">
            <button
              onClick={skipOnboarding}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm"
            >
              Hoppa över och ställ in senare
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
