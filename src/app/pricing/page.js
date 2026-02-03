'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'
import PromoCodeInput from '@/components/PromoCodeInput'

export default function PricingPage() {
  const [user, setUser] = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [billingPeriod, setBillingPeriod] = useState('monthly')
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [promoCode, setPromoCode] = useState(null)
  const [showPromoInput, setShowPromoInput] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)

      if (session?.user) {
        const res = await fetch('/api/user/subscription')
        const data = await res.json()
        if (data.success) {
          setSubscription(data)
        }
      }
      setLoading(false)
    }
    loadData()
  }, [supabase])

  async function handleSubscribe(priceType) {
    if (!user) {
      window.location.href = '/signup?redirect=/pricing'
      return
    }

    setCheckoutLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceType,
          promoCode: promoCode?.id || null
        }),
      })

      const data = await res.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Något gick fel')
      }
    } catch (error) {
      alert('Kunde inte starta betalning')
    } finally {
      setCheckoutLoading(false)
    }
  }

  const handleValidPromo = (promo) => {
    setPromoCode(promo)
  }

  async function handleManageSubscription() {
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      alert('Kunde inte öppna kundportalen')
    }
  }

  const isPremium = subscription?.plan === 'premium'

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
      <main className="container mx-auto px-4 py-16">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Välj din plan
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Börja gratis och uppgradera när du är redo för mer
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-1 flex">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                billingPeriod === 'monthly'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Månadsvis
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                billingPeriod === 'yearly'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Årsvis
              <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs px-2 py-0.5 rounded-full">
                Spara 30%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 relative">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Gratis</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Perfekt för att testa</p>
            </div>

            <div className="mb-6">
              <span className="text-5xl font-bold text-gray-900 dark:text-white">0</span>
              <span className="text-gray-500 dark:text-gray-400 ml-2">kr/månad</span>
            </div>

            <ul className="space-y-3 mb-8">
              {[
                '3 matplaner per månad',
                '5 receptbyten per månad',
                '20 favoritrecept',
                '7 dagars planering',
                'Alla butiker',
                'Full receptkatalog',
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>

            {!user ? (
              <Link
                href="/signup"
                className="block w-full py-3 px-6 text-center font-semibold rounded-lg border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Kom igång gratis
              </Link>
            ) : isPremium ? (
              <button
                disabled
                className="w-full py-3 px-6 font-semibold rounded-lg border-2 border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed"
              >
                Din nuvarande plan
              </button>
            ) : (
              <button
                disabled
                className="w-full py-3 px-6 font-semibold rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              >
                Din nuvarande plan
              </button>
            )}
          </div>

          {/* Premium Plan */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-green-500 p-8 relative shadow-lg">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="bg-green-500 text-white text-sm font-medium px-4 py-1 rounded-full">
                Populärast
              </span>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Premium</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Allt du behöver</p>
            </div>

            <div className="mb-6">
              {billingPeriod === 'monthly' ? (
                <>
                  <span className="text-5xl font-bold text-gray-900 dark:text-white">59</span>
                  <span className="text-gray-500 dark:text-gray-400 ml-2">kr/månad</span>
                </>
              ) : (
                <>
                  <span className="text-5xl font-bold text-gray-900 dark:text-white">499</span>
                  <span className="text-gray-500 dark:text-gray-400 ml-2">kr/år</span>
                  <p className="text-sm text-green-600 mt-1">~42 kr/månad</p>
                </>
              )}
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              7 dagars gratis provperiod
            </p>

            <ul className="space-y-3 mb-8">
              {[
                'Obegränsade matplaner',
                'Obegränsade receptbyten',
                'Obegränsade favoriter',
                'Upp till 14 dagars planering',
                'PDF-export',
                'Näringsspårning',
                'Receptimport från URL',
                'Smart skafferi',
                'Prioriterad AI',
                'E-postsupport',
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>

            {isPremium ? (
              <button
                onClick={handleManageSubscription}
                className="w-full py-3 px-6 font-semibold rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Hantera prenumeration
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleSubscribe(billingPeriod)}
                  disabled={checkoutLoading}
                  className="w-full py-3 px-6 font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {checkoutLoading ? 'Laddar...' : 'Starta gratis provperiod'}
                </button>

                {/* Promo Code Section */}
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  {!showPromoInput ? (
                    <button
                      onClick={() => setShowPromoInput(true)}
                      className="text-sm text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 flex items-center gap-1 mx-auto"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      Har du en kampanjkod?
                    </button>
                  ) : (
                    <PromoCodeInput
                      onValidCode={handleValidPromo}
                      onError={() => setPromoCode(null)}
                    />
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-24 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Vanliga frågor
          </h2>
          <div className="space-y-4">
            <FAQItem
              question="Kan jag avbryta när som helst?"
              answer="Ja! Du kan avbryta din prenumeration när som helst. Du behåller tillgång till Premium-funktioner fram till slutet av din betalningsperiod."
            />
            <FAQItem
              question="Hur fungerar provperioden?"
              answer="Du får 7 dagars full tillgång till Premium utan kostnad. Vi skickar en påminnelse innan provperioden tar slut så att du kan bestämma om du vill fortsätta."
            />
            <FAQItem
              question="Vilka betalningsmetoder accepteras?"
              answer="Vi accepterar alla vanliga betalkort (Visa, Mastercard, American Express) samt Swish och Klarna via Stripe."
            />
            <FAQItem
              question="Kan jag byta mellan månads- och årsplan?"
              answer="Ja, du kan uppgradera till årsplan när som helst och få den lägre månadskostnaden direkt. Nedgradering sker vid nästa faktureringsperiod."
            />
            <FAQItem
              question="Vad händer med mina matplaner om jag avbryter?"
              answer="Alla dina sparade matplaner, favoriter och inställningar finns kvar. Du går bara tillbaka till gratisplanens gränser."
            />
          </div>
        </div>

        {/* CTA */}
        <div className="mt-24 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Har du frågor?</p>
          <a
            href="mailto:support@matvecka.se"
            className="text-green-600 hover:text-green-700 font-medium"
          >
            Kontakta oss →
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 mt-24">
        <div className="container mx-auto px-4 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
          <p>© 2026 Matvecka. Alla rättigheter förbehållna.</p>
        </div>
      </footer>
    </div>
  )
}

function FAQItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <span className="font-medium text-gray-900 dark:text-white">{question}</span>
        <svg
          className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="px-6 pb-4 text-gray-600 dark:text-gray-300">
          {answer}
        </div>
      )}
    </div>
  )
}
