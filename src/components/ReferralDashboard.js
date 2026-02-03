'use client'

import { useState, useEffect } from 'react'

export default function ReferralDashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)
  const [copied, setCopied] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const [showAllShare, setShowAllShare] = useState(false)

  useEffect(() => {
    fetchReferralStats()
  }, [])

  async function fetchReferralStats() {
    try {
      const response = await fetch('/api/referral/stats')
      const result = await response.json()

      if (result.success) {
        setData(result)
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError('Kunde inte hämta värvningsdata')
    }
    setLoading(false)
  }

  async function copyToClipboard(text, isCode = false) {
    try {
      await navigator.clipboard.writeText(text)
      if (isCode) {
        setCopiedCode(true)
        setTimeout(() => setCopiedCode(false), 2000)
      } else {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Share functions
  const shareText = data ? `Testa Matvecka - Sveriges smartaste matplanerare! Använd min länk och få ${data.config.referredBonusDays} gratis Premium-dagar: ${data.referralLink}` : ''
  const shareTitle = 'Prova Matvecka - gratis Premium-dagar!'

  function shareViaWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank')
  }

  function shareViaFacebook() {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(data.referralLink)}&quote=${encodeURIComponent(shareText)}`, '_blank')
  }

  function shareViaTwitter() {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank')
  }

  function shareViaTelegram() {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(data.referralLink)}&text=${encodeURIComponent(shareText)}`, '_blank')
  }

  function shareViaLinkedIn() {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(data.referralLink)}`, '_blank')
  }

  function shareViaSMS() {
    window.open(`sms:?body=${encodeURIComponent(shareText)}`, '_blank')
  }

  function shareViaMessenger() {
    window.open(`fb-messenger://share/?link=${encodeURIComponent(data.referralLink)}`, '_blank')
  }

  function shareViaEmail() {
    const subject = shareTitle
    const body = `Hej!\n\nJag vill tipsa dig om Matvecka - en smart app för matplanering och inköpslistor.\n\nAnvänd min länk så får du ${data.config.referredBonusDays} gratis Premium-dagar:\n${data.referralLink}\n\nHälsningar`
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank')
  }

  async function shareNative() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: data.referralLink,
        })
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Share failed:', err)
        }
      }
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
        <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
        {error}
      </div>
    )
  }

  // Calculate progress to next milestone
  const milestones = [1, 5, 10, 25, 50]
  const currentConverted = data.stats.totalConverted
  const nextMilestone = milestones.find(m => m > currentConverted) || 50
  const prevMilestone = milestones.filter(m => m <= currentConverted).pop() || 0
  const progress = ((currentConverted - prevMilestone) / (nextMilestone - prevMilestone)) * 100

  return (
    <div className="space-y-6">
      {/* Referral Link Card - Green Theme */}
      <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Din värvningslänk</h3>
            <p className="text-green-100 text-sm mt-1">
              Dela länken och få {data.config.referrerBonusDays} gratis Premium-dagar per vän!
            </p>
          </div>
          <div className="bg-white/20 rounded-lg px-3 py-1.5">
            <span className="text-sm font-mono font-bold">{data.referralCode}</span>
          </div>
        </div>

        {/* Link box */}
        <div className="bg-white/10 backdrop-blur rounded-lg p-3 flex items-center gap-3 mb-4">
          <code className="flex-1 text-sm truncate font-mono">{data.referralLink}</code>
          <button
            onClick={() => copyToClipboard(data.referralLink)}
            className="px-4 py-2 bg-white text-green-600 rounded-lg text-sm font-medium hover:bg-green-50 transition-colors flex items-center gap-2"
          >
            {copied ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Kopierad!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Kopiera
              </>
            )}
          </button>
        </div>

        {/* Primary share buttons */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          <button
            onClick={shareViaWhatsApp}
            className="py-2.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors flex flex-col items-center gap-1"
            title="Dela via WhatsApp"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            <span className="text-xs">WhatsApp</span>
          </button>
          <button
            onClick={shareViaFacebook}
            className="py-2.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors flex flex-col items-center gap-1"
            title="Dela via Facebook"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            <span className="text-xs">Facebook</span>
          </button>
          <button
            onClick={shareViaTwitter}
            className="py-2.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors flex flex-col items-center gap-1"
            title="Dela via X"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            <span className="text-xs">X</span>
          </button>
          <button
            onClick={shareViaEmail}
            className="py-2.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors flex flex-col items-center gap-1"
            title="Dela via e-post"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="text-xs">E-post</span>
          </button>
        </div>

        {/* More share options */}
        {showAllShare && (
          <div className="grid grid-cols-4 gap-2 mb-3">
            <button
              onClick={shareViaSMS}
              className="py-2.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors flex flex-col items-center gap-1"
              title="Dela via SMS"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-xs">SMS</span>
            </button>
            <button
              onClick={shareViaTelegram}
              className="py-2.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors flex flex-col items-center gap-1"
              title="Dela via Telegram"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
              <span className="text-xs">Telegram</span>
            </button>
            <button
              onClick={shareViaMessenger}
              className="py-2.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors flex flex-col items-center gap-1"
              title="Dela via Messenger"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.3 2.246.464 3.443.464 6.627 0 12-4.975 12-11.111S18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8l3.131 3.259L19.752 8l-6.561 6.963z"/>
              </svg>
              <span className="text-xs">Messenger</span>
            </button>
            <button
              onClick={shareViaLinkedIn}
              className="py-2.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors flex flex-col items-center gap-1"
              title="Dela via LinkedIn"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              <span className="text-xs">LinkedIn</span>
            </button>
          </div>
        )}

        {/* Toggle more/native share */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowAllShare(!showAllShare)}
            className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            {showAllShare ? 'Visa färre' : 'Fler alternativ'}
            <svg className={`w-4 h-4 transition-transform ${showAllShare ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {typeof navigator !== 'undefined' && navigator.share && (
            <button
              onClick={shareNative}
              className="flex-1 py-2 bg-white text-green-600 hover:bg-green-50 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Dela...
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center border border-gray-100 dark:border-gray-700">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {data.stats.totalInvited}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Inbjudna</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center border border-gray-100 dark:border-gray-700">
          <p className="text-2xl font-bold text-green-600">
            {data.stats.totalConverted}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Registrerade</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center border border-gray-100 dark:border-gray-700">
          <p className="text-2xl font-bold text-green-600">
            {data.stats.totalDaysEarned}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Dagar intjänade</p>
        </div>
      </div>

      {/* Milestone Progress */}
      {currentConverted < 50 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900 dark:text-white">Nästa milstolpe</h4>
            <span className="text-sm text-green-600 font-medium">{currentConverted}/{nextMilestone} vänner</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-2">
            <div
              className="bg-green-600 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progress, 100)}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Värva {nextMilestone - currentConverted} till för att nå {nextMilestone} vänner och få {nextMilestone * data.config.referrerBonusDays} totala bonusdagar!
          </p>
        </div>
      )}

      {/* Premium Credits */}
      {data.premiumCredits.hasCredits && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Dina Premium-krediter
          </h4>
          <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
            <span className="text-gray-700 dark:text-gray-300">Totalt kvar:</span>
            <span className="text-xl font-bold text-green-600">
              {data.premiumCredits.totalDays} dagar
            </span>
          </div>
          {data.premiumCredits.credits.length > 0 && (
            <div className="mt-3 space-y-2">
              {data.premiumCredits.credits.map((credit) => (
                <div
                  key={credit.id}
                  className="flex items-center justify-between text-sm bg-gray-50 dark:bg-gray-700 rounded px-3 py-2"
                >
                  <span className="text-gray-600 dark:text-gray-300 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    {credit.source === 'referral_bonus' ? 'Värvningsbonus' :
                     credit.source === 'referred_welcome' ? 'Välkomstbonus' :
                     credit.source === 'promo' ? 'Kampanj' : 'Bonus'}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    Går ut {new Date(credit.expiresAt).toLocaleDateString('sv-SE')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recent Referrals */}
      {data.recentReferrals.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
            Senaste värvningar
          </h4>
          <div className="space-y-2">
            {data.recentReferrals.map((referral) => (
              <div
                key={referral.id}
                className="flex items-center justify-between text-sm bg-gray-50 dark:bg-gray-700 rounded px-3 py-2"
              >
                <span className="text-gray-600 dark:text-gray-300">
                  {new Date(referral.createdAt).toLocaleDateString('sv-SE')}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  referral.status === 'completed'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                }`}>
                  {referral.status === 'completed' ? 'Klar' : 'Väntar'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-100 dark:border-green-800">
        <h4 className="font-semibold text-green-800 dark:text-green-300 mb-2 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Så fungerar det
        </h4>
        <ol className="text-sm text-green-700 dark:text-green-400 space-y-2">
          <li className="flex items-start gap-2">
            <span className="bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
            <span>Dela din unika länk med vänner och familj</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
            <span>När de registrerar sig och verifierar sin e-post får ni båda <strong>{data.config.referrerBonusDays} Premium-dagar</strong></span>
          </li>
          <li className="flex items-start gap-2">
            <span className="bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
            <span>Du kan bjuda in upp till {data.config.maxReferrals} vänner - det blir {data.config.maxReferrals * data.config.referrerBonusDays} gratis Premium-dagar!</span>
          </li>
        </ol>
      </div>
    </div>
  )
}
