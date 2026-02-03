'use client'

import { useState, useEffect, useRef } from 'react'
import { subscribeToActivityFeed, formatActivityEvent } from '@/lib/supabase-realtime'

/**
 * Real-time activity feed showing user actions
 */
export default function ActivityFeed({
  maxItems = 50,
  eventTypes = null, // null = all events
  autoScroll = true,
  showHeader = true,
  className = ''
}) {
  const [activities, setActivities] = useState([])
  const [isPaused, setIsPaused] = useState(false)
  const [newCount, setNewCount] = useState(0)
  const feedRef = useRef(null)

  useEffect(() => {
    // Subscribe to real-time events
    const subscription = subscribeToActivityFeed(
      (event) => {
        if (isPaused) {
          setNewCount(prev => prev + 1)
          return
        }

        const formatted = formatActivityEvent(event)
        setActivities(prev => {
          const updated = [formatted, ...prev].slice(0, maxItems)
          return updated
        })
      },
      { eventTypes }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [isPaused, maxItems, eventTypes])

  // Auto-scroll to top when new items arrive
  useEffect(() => {
    if (autoScroll && feedRef.current && !isPaused) {
      feedRef.current.scrollTop = 0
    }
  }, [activities, autoScroll, isPaused])

  const handleResume = () => {
    setIsPaused(false)
    setNewCount(0)
  }

  const handleClear = () => {
    setActivities([])
  }

  const getEventIcon = (type) => {
    const icons = {
      user_signup: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
        </svg>
      ),
      user_login: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
        </svg>
      ),
      meal_plan_created: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
        </svg>
      ),
      recipe_favorited: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
      ),
      recipe_made: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      premium_upgrade: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
        </svg>
      ),
      subscription_cancelled: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      page_view: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    }
    return icons[type] || icons.page_view
  }

  const getEventColor = (type) => {
    const colors = {
      user_signup: 'bg-emerald-100 text-emerald-600',
      user_login: 'bg-blue-100 text-blue-600',
      meal_plan_created: 'bg-violet-100 text-violet-600',
      recipe_favorited: 'bg-pink-100 text-pink-600',
      recipe_made: 'bg-green-100 text-green-600',
      premium_upgrade: 'bg-amber-100 text-amber-600',
      subscription_cancelled: 'bg-red-100 text-red-600',
      page_view: 'bg-slate-100 text-slate-600'
    }
    return colors[type] || 'bg-slate-100 text-slate-600'
  }

  const getEventDescription = (activity) => {
    switch (activity.type) {
      case 'user_signup':
        return `Ny användare registrerade sig`
      case 'user_login':
        return `Användare loggade in`
      case 'meal_plan_created':
        return `Skapade en matplan${activity.data?.days ? ` (${activity.data.days} dagar)` : ''}`
      case 'recipe_favorited':
        return `Sparade recept: ${activity.data?.recipe_name || 'Okänt recept'}`
      case 'recipe_made':
        return `Lagade: ${activity.data?.recipe_name || 'Okänt recept'}`
      case 'premium_upgrade':
        return `Uppgraderade till Premium!`
      case 'subscription_cancelled':
        return `Avslutade prenumeration`
      case 'page_view':
        return `Besökte ${activity.pageUrl || 'en sida'}`
      default:
        return activity.label || activity.type
    }
  }

  return (
    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${className}`}>
      {showHeader && (
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">Aktivitet</h3>
            {!isPaused && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isPaused ? (
              <button
                onClick={handleResume}
                className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 flex items-center gap-1"
              >
                Återuppta
                {newCount > 0 && (
                  <span className="bg-green-500 text-white px-1.5 rounded-full">{newCount}</span>
                )}
              </button>
            ) : (
              <button
                onClick={() => setIsPaused(true)}
                className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200"
              >
                Pausa
              </button>
            )}
            <button
              onClick={handleClear}
              className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200"
            >
              Rensa
            </button>
          </div>
        </div>
      )}

      <div
        ref={feedRef}
        className="max-h-96 overflow-y-auto"
      >
        {activities.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
            <p>Väntar på aktivitet...</p>
            <p className="text-xs mt-1">Händelser visas här i realtid</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {activities.map((activity, index) => (
              <div
                key={activity.id || index}
                className="px-4 py-3 hover:bg-gray-50 transition-colors animate-fadeIn"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${getEventColor(activity.type)}`}>
                    {getEventIcon(activity.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      {getEventDescription(activity)}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {activity.timeAgo}
                      {activity.userId && (
                        <span className="ml-2 text-gray-400">
                          • {activity.userId.slice(0, 8)}...
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
