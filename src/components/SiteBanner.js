'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function SiteBanner({ type = 'banner' }) {
  const [items, setItems] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [dismissed, setDismissed] = useState([])

  useEffect(() => {
    fetchContent()
  }, [type])

  useEffect(() => {
    // Load dismissed banners from localStorage
    const saved = localStorage.getItem('dismissed-banners')
    if (saved) {
      setDismissed(JSON.parse(saved))
    }
  }, [])

  async function fetchContent() {
    try {
      const response = await fetch(`/api/content?type=${type}`)
      const data = await response.json()

      if (data.success && data.content.length > 0) {
        setItems(data.content)
      }
    } catch (err) {
      // Silently fail - banners are optional
    }
  }

  function handleDismiss(id) {
    const newDismissed = [...dismissed, id]
    setDismissed(newDismissed)
    localStorage.setItem('dismissed-banners', JSON.stringify(newDismissed))

    // Move to next banner if available
    if (currentIndex < visibleItems.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  // Filter out dismissed banners
  const visibleItems = items.filter(item => !dismissed.includes(item.id))

  if (visibleItems.length === 0) return null

  const currentItem = visibleItems[currentIndex]

  if (type === 'banner') {
    return (
      <div
        className="relative"
        style={{ backgroundColor: currentItem.background_color }}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex-1 flex items-center justify-center sm:justify-start gap-3">
              <p
                className="font-medium text-center sm:text-left"
                style={{ color: currentItem.text_color }}
              >
                <span className="inline">{currentItem.title}</span>
                {currentItem.content && (
                  <span className="hidden sm:inline ml-2 opacity-90">
                    {currentItem.content}
                  </span>
                )}
              </p>
              {currentItem.link_url && (
                <Link
                  href={currentItem.link_url}
                  className="flex-shrink-0 whitespace-nowrap font-medium underline hover:opacity-80"
                  style={{ color: currentItem.text_color }}
                >
                  {currentItem.link_text || 'Läs mer'} →
                </Link>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Pagination dots if multiple banners */}
              {visibleItems.length > 1 && (
                <div className="flex gap-1">
                  {visibleItems.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentIndex(i)}
                      className={`w-2 h-2 rounded-full transition-opacity ${
                        i === currentIndex ? 'opacity-100' : 'opacity-50'
                      }`}
                      style={{ backgroundColor: currentItem.text_color }}
                    />
                  ))}
                </div>
              )}

              {/* Dismiss button */}
              <button
                onClick={() => handleDismiss(currentItem.id)}
                className="p-1 rounded-full hover:bg-black/10 transition-colors"
                style={{ color: currentItem.text_color }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (type === 'announcement') {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 my-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <h3 className="font-medium text-blue-800 dark:text-blue-200">{currentItem.title}</h3>
            {currentItem.content && (
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">{currentItem.content}</p>
            )}
            {currentItem.link_url && (
              <Link
                href={currentItem.link_url}
                className="inline-block mt-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                {currentItem.link_text || 'Läs mer'} →
              </Link>
            )}
          </div>
          <button
            onClick={() => handleDismiss(currentItem.id)}
            className="p-1 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-800 rounded"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  return null
}
