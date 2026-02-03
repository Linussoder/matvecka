'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage(null)
    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) throw error

      setSent(true)
      setMessage({
        type: 'success',
        text: 'Ett e-postmeddelande har skickats med instruktioner för att återställa ditt lösenord.'
      })
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">{sent ? '📧' : '🔑'}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {sent ? 'Kolla din e-post' : 'Glömt lösenord?'}
          </h1>
          <p className="text-gray-600 mt-2">
            {sent
              ? 'Vi har skickat dig en länk för att återställa ditt lösenord.'
              : 'Ange din e-postadress så skickar vi en återställningslänk.'
            }
          </p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            <div className="flex items-center gap-2">
              <span>{message.type === 'success' ? '✓' : '!'}</span>
              <span>{message.text}</span>
            </div>
          </div>
        )}

        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                E-postadress
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="din@email.se"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
            >
              {loading ? 'Skickar...' : 'Skicka återställningslänk'}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
              <p className="mb-2">
                <strong>Hittar du inte e-posten?</strong>
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Kolla din skräppost/spam-mapp</li>
                <li>Kontrollera att du angav rätt e-postadress</li>
                <li>Vänta några minuter och försök igen</li>
              </ul>
            </div>

            <button
              onClick={() => {
                setSent(false)
                setMessage(null)
                setEmail('')
              }}
              className="w-full py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              Försök med en annan e-postadress
            </button>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-sm text-gray-600 hover:text-green-600"
          >
            Tillbaka till inloggning
          </Link>
        </div>
      </div>
    </div>
  )
}
