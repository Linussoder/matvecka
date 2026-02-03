'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { EyeIcon, ArrowPathIcon, ClockIcon } from '@/components/admin/Icons'

export default function SessionsPage() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tableNotFound, setTableNotFound] = useState(false)
  const [filter, setFilter] = useState({
    device: 'all',
    minDuration: 0,
    page: 1
  })

  const fetchSessions = async () => {
    setLoading(true)
    setError(null)
    setTableNotFound(false)

    try {
      const params = new URLSearchParams({
        device: filter.device,
        minDuration: filter.minDuration.toString(),
        page: filter.page.toString(),
        limit: '20'
      })

      const res = await fetch(`/api/admin/analytics/sessions?${params}`)

      if (res.ok) {
        const data = await res.json()
        setSessions(data.sessions || [])
        if (data.tableNotFound) {
          setTableNotFound(true)
        }
      } else {
        setError('Kunde inte hämta sessioner')
      }
    } catch (err) {
      console.error('Error fetching sessions:', err)
      setError('Kunde inte hämta sessioner')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSessions()
  }, [filter])

  const formatDuration = (seconds) => {
    if (!seconds) return '0s'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins > 0) {
      return `${mins}m ${secs}s`
    }
    return `${secs}s`
  }

  const getDeviceIcon = (device) => {
    switch (device) {
      case 'mobile':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
          </svg>
        )
      case 'tablet':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5h3m-6.75 2.25h10.5a2.25 2.25 0 002.25-2.25v-15a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 4.5v15a2.25 2.25 0 002.25 2.25z" />
          </svg>
        )
      default:
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
          </svg>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              ← Tillbaka
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <EyeIcon className="w-6 h-6 text-white" />
                </div>
                Sessionsuppspelningar
              </h1>
              <p className="text-gray-500 text-sm">Se hur användare interagerar med appen</p>
            </div>
          </div>

          <button
            onClick={fetchSessions}
            disabled={loading}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 font-medium flex items-center gap-2 disabled:opacity-50"
          >
            <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Uppdatera
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Enhet</label>
              <select
                value={filter.device}
                onChange={(e) => setFilter(prev => ({ ...prev, device: e.target.value, page: 1 }))}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="all">Alla enheter</option>
                <option value="desktop">Desktop</option>
                <option value="mobile">Mobil</option>
                <option value="tablet">Surfplatta</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Min längd</label>
              <select
                value={filter.minDuration}
                onChange={(e) => setFilter(prev => ({ ...prev, minDuration: parseInt(e.target.value), page: 1 }))}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="0">Alla</option>
                <option value="30">30+ sekunder</option>
                <option value="60">1+ minut</option>
                <option value="180">3+ minuter</option>
                <option value="300">5+ minuter</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {tableNotFound && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-500 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-amber-800">Databastabeller saknas</p>
                <p className="text-sm text-amber-700 mt-1">
                  Kör migrationen <code className="bg-amber-100 px-1 rounded">20250203_realtime_analytics.sql</code> i Supabase SQL Editor för att aktivera sessionsuppspelningar.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Sessions List */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <EyeIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Inga sessioner hittades</p>
              <p className="text-sm mt-1">Sessioner sparas när användare navigerar på sidan</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {sessions.map((session) => (
                <Link
                  key={session.id}
                  href={`/admin/sessions/${session.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                >
                  {/* Device Icon */}
                  <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                    {getDeviceIcon(session.device_type)}
                  </div>

                  {/* Session Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 truncate">
                        {session.session_id?.slice(0, 12)}...
                      </span>
                      {session.user_id && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                          Inloggad
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span>{session.page_url || 'Flera sidor'}</span>
                      <span>•</span>
                      <span>{session.pages_visited || 1} sidor</span>
                    </div>
                  </div>

                  {/* Duration & Date */}
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-gray-900 font-medium">
                      <ClockIcon className="w-4 h-4 text-gray-400" />
                      {formatDuration(session.duration_seconds)}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(session.created_at).toLocaleDateString('sv-SE', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>

                  {/* Play button */}
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600 hover:bg-blue-200 transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {sessions.length > 0 && (
          <div className="flex items-center justify-between mt-4">
            <button
              onClick={() => setFilter(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={filter.page === 1}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Föregående
            </button>
            <span className="text-sm text-gray-500">Sida {filter.page}</span>
            <button
              onClick={() => setFilter(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={sessions.length < 20}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Nästa →
            </button>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-blue-800">Om sessionsuppspelningar</p>
              <p className="text-sm text-blue-700 mt-1">
                Sessionsuppspelningar visar hur användare navigerar och interagerar med appen.
                Känslig data som lösenord och betalningsinformation maskeras automatiskt.
                Uppspelningar sparas i 30 dagar.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
