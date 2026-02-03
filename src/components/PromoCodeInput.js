'use client'

import { useState } from 'react'

export default function PromoCodeInput({
  onValidCode,
  onError,
  autoRedeem = false,
  subscriptionId = null,
  className = ''
}) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [validatedPromo, setValidatedPromo] = useState(null)
  const [error, setError] = useState(null)

  const validateCode = async () => {
    if (!code.trim()) {
      setError('Ange en kampanjkod')
      return
    }

    setLoading(true)
    setError(null)
    setValidatedPromo(null)

    try {
      const response = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim(),
          redeem: autoRedeem,
          subscriptionId
        })
      })

      const data = await response.json()

      if (!data.valid) {
        setError(data.error || 'Ogiltig kampanjkod')
        onError?.(data.error)
        return
      }

      setValidatedPromo(data.promo)
      onValidCode?.(data.promo, data.redeemed, data.redemption)

    } catch (err) {
      console.error('Validation error:', err)
      setError('Kunde inte validera koden')
      onError?.('Kunde inte validera koden')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      validateCode()
    }
  }

  const clearCode = () => {
    setCode('')
    setValidatedPromo(null)
    setError(null)
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase())
              setError(null)
              if (validatedPromo) setValidatedPromo(null)
            }}
            onKeyPress={handleKeyPress}
            placeholder="Ange kampanjkod"
            disabled={loading || validatedPromo}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent uppercase tracking-wider font-mono ${
              validatedPromo
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                : error
                ? 'border-red-300 bg-red-50 dark:bg-red-900/20'
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          />
          {validatedPromo && (
            <button
              onClick={clearCode}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <button
          onClick={validateCode}
          disabled={loading || validatedPromo || !code.trim()}
          className="px-5 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="hidden sm:inline">Kollar...</span>
            </>
          ) : validatedPromo ? (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="hidden sm:inline">Giltig!</span>
            </>
          ) : (
            'Aktivera'
          )}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Success message */}
      {validatedPromo && (
        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <svg className="w-5 h-5 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-medium text-green-800 dark:text-green-200">
              {validatedPromo.displayValue}
            </p>
            {validatedPromo.description && (
              <p className="text-sm text-green-600 dark:text-green-400">
                {validatedPromo.description}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Compact version for inline use
export function PromoCodeInputCompact({
  onValidCode,
  onError,
  className = ''
}) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null) // 'valid', 'invalid', null

  const validateCode = async () => {
    if (!code.trim()) return

    setLoading(true)
    setStatus(null)

    try {
      const response = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() })
      })

      const data = await response.json()

      if (data.valid) {
        setStatus('valid')
        onValidCode?.(data.promo)
      } else {
        setStatus('invalid')
        onError?.(data.error)
      }
    } catch (err) {
      setStatus('invalid')
      onError?.('Kunde inte validera koden')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <input
        type="text"
        value={code}
        onChange={(e) => {
          setCode(e.target.value.toUpperCase())
          setStatus(null)
        }}
        onBlur={validateCode}
        placeholder="Kampanjkod"
        className={`px-3 py-2 border rounded-lg text-sm font-mono uppercase tracking-wider ${
          status === 'valid'
            ? 'border-green-500 bg-green-50'
            : status === 'invalid'
            ? 'border-red-300 bg-red-50'
            : 'border-gray-300'
        }`}
        disabled={loading}
      />
      {loading && (
        <svg className="animate-spin h-4 w-4 text-gray-400" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {status === 'valid' && (
        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )}
      {status === 'invalid' && (
        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
    </div>
  )
}
