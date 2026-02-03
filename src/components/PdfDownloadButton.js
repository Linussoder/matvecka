'use client'

import { useState } from 'react'

export default function PdfDownloadButton({ type, id, label, isPremium = false, size = 'md' }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Size variants to match different page button styles
  const sizeClasses = {
    sm: 'px-4 py-2 rounded-lg text-sm',
    md: 'px-5 py-2.5 rounded-lg font-medium',  // Shopping list style
    lg: 'px-6 py-3 rounded-xl font-semibold',  // Meal plan detail style
  }

  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'

  const handleDownload = async () => {
    if (!isPremium) {
      // Redirect to pricing page
      window.location.href = '/pricing'
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/pdf/${type}/${id}`)

      if (!response.ok) {
        const data = await response.json()
        if (data.upgradePath) {
          window.location.href = data.upgradePath
          return
        }
        throw new Error(data.error || 'Kunde inte generera PDF')
      }

      // Get the blob and create download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || `${type}-${id}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('PDF download error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Non-premium: show disabled gray button with Premium badge
  if (!isPremium) {
    return (
      <div className="relative group">
        <button
          disabled
          className={`inline-flex items-center gap-2 ${sizeClasses[size]} bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed`}
          title="Uppgradera till Premium för PDF-export"
        >
          {/* Lock icon */}
          <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span>PDF</span>
          <span className="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">Premium</span>
        </button>
        {/* Tooltip on hover */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Uppgradera till Premium för PDF-export
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={handleDownload}
        disabled={loading}
        className={`inline-flex items-center gap-2 ${sizeClasses[size]} transition-all bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {loading ? (
          <>
            <svg className={`animate-spin ${iconSize}`} fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Genererar...</span>
          </>
        ) : (
          <>
            <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>{label || 'Ladda ner PDF'}</span>
          </>
        )}
      </button>
      {error && (
        <p className="absolute top-full left-0 mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  )
}
