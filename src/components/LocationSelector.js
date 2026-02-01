'use client'

import { useState, useEffect, useRef } from 'react'
import { popularCities, searchCities, getRegionForCity, getAllCities, saveUserLocation } from '@/lib/swedish-locations'
import { detectLocation, getLocationFromIP } from '@/lib/geolocation'

export default function LocationSelector({
  selectedCity,
  onCityChange,
  variant = 'default' // 'default' | 'header' | 'hero'
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isDetecting, setIsDetecting] = useState(false)
  const [detectionError, setDetectionError] = useState(null)
  const [detectedLocation, setDetectedLocation] = useState(null)
  const modalRef = useRef(null)
  const inputRef = useRef(null)

  // Handle search
  useEffect(() => {
    if (searchQuery.length >= 2) {
      const results = searchCities(searchQuery)
      setSearchResults(results)
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  // Auto-detect location on first visit (IP-based, silent)
  useEffect(() => {
    async function autoDetect() {
      if (typeof window === 'undefined') return

      const hasLocation = localStorage.getItem('matvecka-location')
      const hasAutoDetected = localStorage.getItem('matvecka-auto-detected')

      // Only auto-detect if no saved location and haven't tried before
      if (!hasLocation && !hasAutoDetected) {
        localStorage.setItem('matvecka-auto-detected', 'true')

        try {
          const result = await getLocationFromIP()
          if (result && result.city) {
            setDetectedLocation({
              city: result.city,
              distance: result.distance,
              source: 'ip'
            })
          }
        } catch (e) {
          // Silent fail for auto-detection
        }
      }
    }

    autoDetect()
  }, [])

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      setTimeout(() => inputRef.current?.focus(), 100)
    }

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Close on escape
  useEffect(() => {
    function handleEscape(event) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  const handleSelectCity = (city) => {
    onCityChange(city)
    setIsOpen(false)
    setSearchQuery('')
    setDetectionError(null)
    setDetectedLocation(null)
    saveUserLocation(city)
  }

  const handleDetectLocation = async () => {
    setIsDetecting(true)
    setDetectionError(null)
    setDetectedLocation(null)

    try {
      const result = await detectLocation()

      if (result.error) {
        setDetectionError(result.error)
      } else if (result.city) {
        // Found a matching city - select it directly
        handleSelectCity(result.city)
      } else if (result.detectedCity) {
        setDetectionError(`Hittade "${result.detectedCity}" men den finns inte i vår lista. Välj en närliggande ort.`)
      }
    } catch (error) {
      setDetectionError('Något gick fel. Försök igen.')
    } finally {
      setIsDetecting(false)
    }
  }

  const region = getRegionForCity(selectedCity)

  // Variant styles
  const buttonStyles = {
    default: 'flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors',
    header: 'flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors',
    hero: 'flex items-center gap-2 bg-white/10 hover:bg-white/20 rounded-lg px-3 py-2 transition-colors'
  }

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={buttonStyles[variant]}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="font-medium">{selectedCity}</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-[10vh] px-4">
          <div
            ref={modalRef}
            className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Välj plats</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              {/* Auto-detect Button */}
              <button
                onClick={handleDetectLocation}
                disabled={isDetecting}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                  isDetecting
                    ? 'bg-gray-100 text-gray-400 cursor-wait'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}
              >
                {isDetecting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-gray-300 border-t-white rounded-full animate-spin" />
                    <span>Söker...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Använd min plats</span>
                  </>
                )}
              </button>

              {/* Detection Error */}
              {detectionError && (
                <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg">
                  <p className="text-red-600 text-sm">{detectionError}</p>
                </div>
              )}

              {/* IP-detected suggestion */}
              {detectedLocation && detectedLocation.source === 'ip' && selectedCity !== detectedLocation.city && !detectionError && (
                <button
                  onClick={() => handleSelectCity(detectedLocation.city)}
                  className="w-full mt-3 flex items-center justify-between px-4 py-3 bg-blue-50 border border-blue-100 rounded-lg text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Är du i <strong>{detectedLocation.city}</strong>?</span>
                  </span>
                  <span className="text-sm font-medium">Välj</span>
                </button>
              )}

              {/* Divider */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-sm text-gray-400">eller välj manuellt</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Search Input */}
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Sök ort..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 placeholder-gray-400"
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
            </div>

            {/* City List */}
            <div className="max-h-64 overflow-y-auto border-t">
              {searchQuery.length >= 2 ? (
                // Search Results
                searchResults.length > 0 ? (
                  <div className="py-1">
                    {searchResults.map((city) => (
                      <CityButton
                        key={city}
                        city={city}
                        isSelected={city === selectedCity}
                        onClick={() => handleSelectCity(city)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-500">
                    <p>Ingen ort hittades för "{searchQuery}"</p>
                  </div>
                )
              ) : (
                <>
                  {/* Current Selection */}
                  {selectedCity && (
                    <div className="py-2 px-4 bg-gray-50">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Nuvarande</p>
                      <div className="flex items-center gap-2 text-gray-900">
                        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium">{selectedCity}</span>
                        {region && <span className="text-sm text-gray-500">({region})</span>}
                      </div>
                    </div>
                  )}

                  {/* Popular Cities */}
                  <div className="py-2">
                    <p className="px-4 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">Populära</p>
                    {popularCities.map((city) => (
                      <CityButton
                        key={city}
                        city={city}
                        isSelected={city === selectedCity}
                        onClick={() => handleSelectCity(city)}
                      />
                    ))}
                  </div>

                  {/* Hint */}
                  <div className="px-4 py-3 bg-gray-50 text-center">
                    <p className="text-xs text-gray-500">
                      Skriv minst 2 bokstäver för att söka bland alla {getAllCities().length} orter
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// City Button Component
function CityButton({ city, isSelected, onClick }) {
  const region = getRegionForCity(city)

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors ${
        isSelected
          ? 'bg-gray-100 text-gray-900'
          : 'hover:bg-gray-50 text-gray-700'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="font-medium">{city}</span>
        {region && <span className="text-sm text-gray-400">{region}</span>}
      </div>
      {isSelected && (
        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )}
    </button>
  )
}
