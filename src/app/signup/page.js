'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  // Referral state
  const [referralCode, setReferralCode] = useState(null)
  const [referralValid, setReferralValid] = useState(false)
  const [referralBonusDays, setReferralBonusDays] = useState(0)
  const [referralChecking, setReferralChecking] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Check for referral code in URL on mount
  useEffect(() => {
    const refCode = searchParams.get('ref')
    if (refCode) {
      validateReferralCode(refCode)
    }
  }, [searchParams])

  async function validateReferralCode(code) {
    setReferralChecking(true)
    try {
      const response = await fetch('/api/referral/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const data = await response.json()

      if (data.valid) {
        setReferralCode(code.toUpperCase())
        setReferralValid(true)
        setReferralBonusDays(data.bonusDays)
        // Store in localStorage for auth callback
        localStorage.setItem('referralCode', code.toUpperCase())
      } else {
        setReferralCode(null)
        setReferralValid(false)
        localStorage.removeItem('referralCode')
      }
    } catch (err) {
      console.error('Error validating referral code:', err)
    }
    setReferralChecking(false)
  }

  async function handleSignup(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Lösenorden matchar inte')
      setLoading(false)
      return
    }

    // Validate password strength
    if (password.length < 6) {
      setError('Lösenordet måste vara minst 6 tecken')
      setLoading(false)
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          referral_code: referralCode, // Store in user metadata
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else if (data?.user?.identities?.length === 0) {
      setError('Ett konto med denna e-postadress finns redan')
      setLoading(false)
    } else {
      // If we have a valid referral code and a new user, record the pending referral
      if (referralValid && referralCode && data?.user?.id) {
        try {
          await fetch('/api/referral/record', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: referralCode }),
          })
        } catch (err) {
          // Don't block signup if referral recording fails
          console.error('Error recording referral:', err)
        }
      }
      setMessage('Kolla din e-post för att verifiera ditt konto!')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-green-600">
            Matvecka
          </Link>
          <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
            Skapa ditt konto
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Har du redan ett konto?{' '}
            <Link href="/login" className="text-green-600 hover:text-green-700 font-medium">
              Logga in
            </Link>
          </p>
        </div>

        {/* Referral Bonus Banner */}
        {referralValid && (
          <div className="mb-4 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎁</span>
              <div>
                <p className="font-semibold text-purple-700 dark:text-purple-300">
                  Du har blivit inbjuden!
                </p>
                <p className="text-sm text-purple-600 dark:text-purple-400">
                  Registrera dig och få {referralBonusDays} gratis Premium-dagar
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400">
            {message}
            {referralValid && (
              <p className="mt-2 text-sm">
                Dina {referralBonusDays} bonusdagar aktiveras efter e-postverifiering.
              </p>
            )}
          </div>
        )}

        {/* Signup Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8">
          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fullständigt namn
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Anna Andersson"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                E-postadress
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="din@email.se"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Lösenord
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Minst 6 tecken"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bekräfta lösenord
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Ange lösenordet igen"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
            >
              {loading ? 'Skapar konto...' : 'Skapa konto'}
            </button>
          </form>

          {/* Terms */}
          <p className="mt-6 text-xs text-gray-500 dark:text-gray-400 text-center">
            Genom att skapa ett konto godkänner du våra{' '}
            <Link href="/terms" className="text-green-600 hover:underline">
              användarvillkor
            </Link>{' '}
            och{' '}
            <Link href="/privacy" className="text-green-600 hover:underline">
              integritetspolicy
            </Link>
            .
          </p>
        </div>

        {/* Benefits */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Med ett konto får du:</h3>
          <ul className="space-y-3 text-gray-600 dark:text-gray-300">
            <li className="flex items-center gap-3">
              <span className="text-green-500">✓</span>
              Spara dina veckomenyer
            </li>
            <li className="flex items-center gap-3">
              <span className="text-green-500">✓</span>
              Anpassa dina kostpreferenser
            </li>
            <li className="flex items-center gap-3">
              <span className="text-green-500">✓</span>
              Få personliga receptförslag
            </li>
            <li className="flex items-center gap-3">
              <span className="text-green-500">✓</span>
              Skicka inköpslistor till din e-post
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
