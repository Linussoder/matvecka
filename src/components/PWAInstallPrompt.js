'use client'

import { useState, useEffect } from 'react'

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Check if already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true
    setIsStandalone(standalone)

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
    setIsIOS(iOS)

    // Check if dismissed recently
    const dismissed = localStorage.getItem('pwa-prompt-dismissed')
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10)
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24)
      if (daysSinceDismissed < 7) {
        return // Don't show for 7 days after dismissal
      }
    }

    // Listen for beforeinstallprompt event (Chrome, Edge, etc.)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      
      // Show prompt after a delay (let user see the app first)
      setTimeout(() => {
        setShowPrompt(true)
      }, 30000) // 30 seconds
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // For iOS, show prompt after delay
    if (iOS && !standalone) {
      setTimeout(() => {
        setShowPrompt(true)
      }, 60000) // 60 seconds for iOS
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    // Show the install prompt
    deferredPrompt.prompt()

    // Wait for the user's response
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('PWA installed')
    }

    // Clear the prompt
    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString())
  }

  // Don't show if already installed
  if (isStandalone || !showPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6">
      <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-500 px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
            <span className="text-xl">🛒</span>
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold">Installera Matvecka</h3>
            <p className="text-green-100 text-sm">Lägg till på hemskärmen</p>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white/70 hover:text-white p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {isIOS ? (
            // iOS Instructions
            <div>
              <p className="text-gray-600 text-sm mb-4">
                Installera Matvecka för snabb åtkomst från din hemskärm:
              </p>
              <ol className="space-y-3 text-sm">
                <li className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium">1</span>
                  <span className="text-gray-700">
                    Tryck på <span className="inline-flex items-center"><svg className="w-4 h-4 mx-1 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path d="M15 8a1 1 0 00-1-1h-3V4a1 1 0 00-2 0v3H6a1 1 0 000 2h3v3a1 1 0 002 0V9h3a1 1 0 001-1z"/><path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm2 0h10v10H5V5z" clipRule="evenodd"/></svg></span> dela-knappen
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium">2</span>
                  <span className="text-gray-700">
                    Scrolla och välj <strong>"Lägg till på hemskärmen"</strong>
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium">3</span>
                  <span className="text-gray-700">
                    Tryck på <strong>"Lägg till"</strong>
                  </span>
                </li>
              </ol>
              <button
                onClick={handleDismiss}
                className="w-full mt-4 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Jag förstår
              </button>
            </div>
          ) : (
            // Chrome/Android Install Button
            <div>
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-1">
                  <p className="text-gray-600 text-sm">
                    Få snabbare åtkomst och en bättre upplevelse genom att installera appen.
                  </p>
                </div>
              </div>
              
              {/* Features */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <span className="text-lg">⚡</span>
                  <p className="text-xs text-gray-600 mt-1">Snabbare</p>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <span className="text-lg">📱</span>
                  <p className="text-xs text-gray-600 mt-1">App-känsla</p>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <span className="text-lg">🔔</span>
                  <p className="text-xs text-gray-600 mt-1">Notiser</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleDismiss}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Senare
                </button>
                <button
                  onClick={handleInstallClick}
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
                >
                  Installera
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
