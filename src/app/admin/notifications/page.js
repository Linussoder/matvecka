'use client'

import { useState, useEffect } from 'react'
import {
  BellIcon, CalendarIcon, PaperAirplaneIcon, EyeIcon, CursorArrowRaysIcon
} from '@/components/admin/Icons'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [segments, setSegments] = useState([])

  const [form, setForm] = useState({
    title: '',
    body: '',
    actionUrl: '',
    targetSegment: '',
    targetAll: false,
    scheduledAt: ''
  })

  useEffect(() => {
    loadNotifications()
    loadSegments()
  }, [])

  async function loadNotifications() {
    try {
      const res = await fetch('/api/admin/notifications')
      const data = await res.json()
      if (data.success) {
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error('Failed to load notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadSegments() {
    try {
      const res = await fetch('/api/admin/segments')
      const data = await res.json()
      if (data.success) {
        setSegments(data.segments || [])
      }
    } catch (error) {
      console.error('Failed to load segments:', error)
    }
  }

  async function handleCreate() {
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (data.success) {
        setNotifications(prev => [data.notification, ...prev])
        setShowCreate(false)
        setForm({ title: '', body: '', actionUrl: '', targetSegment: '', targetAll: false, scheduledAt: '' })
      }
    } catch (error) {
      console.error('Failed to create notification:', error)
    }
  }

  async function handleSend(id) {
    try {
      await fetch(`/api/admin/notifications/${id}/send`, { method: 'POST' })
      loadNotifications()
    } catch (error) {
      console.error('Failed to send notification:', error)
    }
  }

  const statusColors = {
    draft: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    sent: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-amber-500 rounded-lg">
              <BellIcon className="w-6 h-6 text-white" />
            </div>
            Push Notification Center
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Skapa och skicka push-notiser till användare
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Ny notis
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Totalt skickade</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {notifications.filter(n => n.status === 'sent').reduce((sum, n) => sum + (n.sent_count || 0), 0)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Öppnade</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {notifications.filter(n => n.status === 'sent').reduce((sum, n) => sum + (n.opened_count || 0), 0)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Klickade</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {notifications.filter(n => n.status === 'sent').reduce((sum, n) => sum + (n.clicked_count || 0), 0)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Schemalagda</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {notifications.filter(n => n.status === 'scheduled').length}
          </p>
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Skapa push-notis</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Titel</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Veckans erbjudanden är här!"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Meddelande</label>
                <textarea
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  placeholder="Kolla in veckans bästa erbjudanden och planera din meny!"
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Länk (valfritt)</label>
                <input
                  type="url"
                  value={form.actionUrl}
                  onChange={(e) => setForm({ ...form, actionUrl: e.target.value })}
                  placeholder="https://matvecka.se/products/flyers"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Målgrupp</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.targetAll}
                      onChange={(e) => setForm({ ...form, targetAll: e.target.checked, targetSegment: '' })}
                      className="rounded text-blue-600"
                    />
                    <span className="text-gray-700 dark:text-gray-300">Alla användare</span>
                  </label>
                  {!form.targetAll && (
                    <select
                      value={form.targetSegment}
                      onChange={(e) => setForm({ ...form, targetSegment: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Välj segment...</option>
                      {segments.map(seg => (
                        <option key={seg.id} value={seg.id}>{seg.name} ({seg.user_count} användare)</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Schemalägg (valfritt)</label>
                <input
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Preview */}
            <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-900 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Förhandsvisning</p>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold">M</div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{form.title || 'Titel här'}</p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">{form.body || 'Meddelande här'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Avbryt
              </button>
              <button
                onClick={handleCreate}
                disabled={!form.title || !form.body}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {form.scheduledAt ? 'Schemalägg' : 'Spara som utkast'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">Alla notiser</h2>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center">
              <BellIcon className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400">Inga push-notiser ännu</p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              Skapa din första notis →
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {notifications.map(notif => (
              <div key={notif.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">{notif.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[notif.status]}`}>
                        {notif.status === 'draft' ? 'Utkast' :
                         notif.status === 'scheduled' ? 'Schemalagd' :
                         notif.status === 'sent' ? 'Skickad' : 'Misslyckad'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{notif.body}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      {notif.status === 'sent' && (
                        <>
                          <span className="flex items-center gap-1"><PaperAirplaneIcon className="w-3 h-3" /> {notif.sent_count || 0}</span>
                          <span className="flex items-center gap-1"><EyeIcon className="w-3 h-3" /> {notif.opened_count || 0}</span>
                          <span className="flex items-center gap-1"><CursorArrowRaysIcon className="w-3 h-3" /> {notif.clicked_count || 0}</span>
                        </>
                      )}
                      {notif.scheduled_at && (
                        <span className="flex items-center gap-1"><CalendarIcon className="w-3 h-3" /> {new Date(notif.scheduled_at).toLocaleString('sv-SE')}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {notif.status === 'draft' && (
                      <button
                        onClick={() => handleSend(notif.id)}
                        className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
                      >
                        Skicka nu
                      </button>
                    )}
                    <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
