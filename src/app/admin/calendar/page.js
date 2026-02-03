'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  CalendarIcon, SparklesIcon, EnvelopeIcon, MegaphoneIcon, TagIcon,
  PlusIcon, ChevronRightIcon, PencilSquareIcon, TrashIcon, XMarkIcon
} from '@/components/admin/Icons'

export default function AdminCalendarPage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [needsSetup, setNeedsSetup] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [viewMode, setViewMode] = useState('month')

  useEffect(() => {
    fetchEvents()
  }, [currentMonth])

  async function fetchEvents() {
    setLoading(true)
    try {
      const year = currentMonth.getFullYear()
      const month = currentMonth.getMonth() + 1
      const response = await fetch(`/api/admin/calendar?year=${year}&month=${month}`)
      const data = await response.json()
      if (data.success) {
        setEvents(data.events || [])
        setNeedsSetup(data.needsSetup)
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Kunde inte ladda kalendern')
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveEvent(event) {
    try {
      const method = event.id ? 'PATCH' : 'POST'
      const response = await fetch('/api/admin/calendar', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      })
      const data = await response.json()
      if (data.success) {
        setShowForm(false)
        setEditingEvent(null)
        fetchEvents()
      } else {
        alert(data.error)
      }
    } catch (err) {
      alert('Kunde inte spara')
    }
  }

  async function handleDeleteEvent(id) {
    if (!confirm('Är du säker på att du vill ta bort detta?')) return
    try {
      const response = await fetch('/api/admin/calendar', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (response.ok) {
        fetchEvents()
      }
    } catch (err) {
      alert('Kunde inte ta bort')
    }
  }

  function previousMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  function nextMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  function goToToday() {
    setCurrentMonth(new Date())
  }

  const contentTypes = [
    { id: 'recipe_feature', label: 'Utvalda recept', Icon: SparklesIcon, color: 'bg-emerald-500' },
    { id: 'campaign', label: 'Kampanj', Icon: MegaphoneIcon, color: 'bg-purple-500' },
    { id: 'blog', label: 'Blogg', Icon: PencilSquareIcon, color: 'bg-blue-500' },
    { id: 'email', label: 'Email', Icon: EnvelopeIcon, color: 'bg-amber-500' },
    { id: 'social', label: 'Social media', Icon: CalendarIcon, color: 'bg-pink-500' },
    { id: 'promotion', label: 'Kampanjkod', Icon: TagIcon, color: 'bg-red-500' },
  ]

  if (loading && events.length === 0) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (needsSetup) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <h2 className="text-lg font-medium text-yellow-800 dark:text-yellow-200 mb-2">
            Databas behöver konfigureras
          </h2>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-4">
            Kalendertabellerna finns inte ännu. Kör migrationsfilen <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">20250203_content_recipe_management.sql</code> i Supabase.
          </p>
          <button
            onClick={fetchEvents}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            Försök igen
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Innehållskalender</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Planera och schemalägg allt innehåll
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/calendar/campaigns"
            className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Kampanjer
          </Link>
          <Link
            href="/admin/calendar/blog"
            className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Blogg
          </Link>
          <button
            onClick={() => {
              setEditingEvent({
                content_type: 'recipe_feature',
                status: 'draft',
                scheduled_date: selectedDate || new Date().toISOString().split('T')[0]
              })
              setShowForm(true)
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Nytt innehåll
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-6">
        {contentTypes.map(type => (
          <div key={type.id} className="flex items-center gap-2 text-sm">
            <div className={`w-3 h-3 rounded-full ${type.color}`} />
            <span className="text-gray-600 dark:text-gray-400">{type.label}</span>
          </div>
        ))}
      </div>

      {/* Calendar Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <button
              onClick={previousMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronRightIcon className="w-5 h-5 rotate-180 text-gray-600 dark:text-gray-400" />
            </button>
            <h2 className="text-lg font-medium text-gray-900 dark:text-white min-w-[180px] text-center">
              {currentMonth.toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' })}
            </h2>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronRightIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Idag
            </button>
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  viewMode === 'month' ? 'bg-white dark:bg-gray-600 shadow text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                Månad
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                Lista
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        {viewMode === 'month' ? (
          <CalendarGrid
            currentMonth={currentMonth}
            events={events}
            contentTypes={contentTypes}
            onDateClick={(date) => {
              setSelectedDate(date)
              setEditingEvent({
                content_type: 'recipe_feature',
                status: 'draft',
                scheduled_date: date
              })
              setShowForm(true)
            }}
            onEventClick={(event) => {
              setEditingEvent(event)
              setShowForm(true)
            }}
          />
        ) : (
          <EventList
            events={events}
            contentTypes={contentTypes}
            onEdit={(event) => {
              setEditingEvent(event)
              setShowForm(true)
            }}
            onDelete={handleDeleteEvent}
          />
        )}
      </div>

      {/* Upcoming Events Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <UpcomingWidget
          title="Kommande denna vecka"
          events={events.filter(e => {
            const eventDate = new Date(e.scheduled_date)
            const today = new Date()
            const weekEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
            return eventDate >= today && eventDate <= weekEnd
          })}
          contentTypes={contentTypes}
        />
        <UpcomingWidget
          title="Utkast"
          events={events.filter(e => e.status === 'draft')}
          contentTypes={contentTypes}
        />
        <UpcomingWidget
          title="Publicerat denna månad"
          events={events.filter(e => e.status === 'published')}
          contentTypes={contentTypes}
        />
      </div>

      {/* Event Form Modal */}
      {showForm && editingEvent && (
        <EventFormModal
          event={editingEvent}
          contentTypes={contentTypes}
          onSave={handleSaveEvent}
          onClose={() => {
            setShowForm(false)
            setEditingEvent(null)
          }}
        />
      )}
    </div>
  )
}

function CalendarGrid({ currentMonth, events, contentTypes, onDateClick, onEventClick }) {
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startOffset = (firstDay.getDay() + 6) % 7 // Monday = 0
  const daysInMonth = lastDay.getDate()

  const days = []
  const today = new Date().toISOString().split('T')[0]

  // Add empty cells for days before the first of the month
  for (let i = 0; i < startOffset; i++) {
    days.push({ day: null, date: null })
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const dayEvents = events.filter(e => e.scheduled_date === date)
    days.push({ day, date, events: dayEvents })
  }

  const weekDays = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön']

  return (
    <div className="p-4">
      {/* Week day headers */}
      <div className="grid grid-cols-7 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((dayData, index) => (
          <div
            key={index}
            className={`min-h-[100px] p-1 border border-gray-100 dark:border-gray-700 rounded ${
              dayData.day
                ? 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer'
                : 'bg-gray-50 dark:bg-gray-900'
            } ${dayData.date === today ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => dayData.day && onDateClick(dayData.date)}
          >
            {dayData.day && (
              <>
                <div className={`text-sm font-medium mb-1 ${
                  dayData.date === today ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {dayData.day}
                </div>
                <div className="space-y-1">
                  {dayData.events?.slice(0, 3).map(event => {
                    const type = contentTypes.find(t => t.id === event.content_type)
                    return (
                      <div
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          onEventClick(event)
                        }}
                        className={`${type?.color || 'bg-gray-500'} text-white text-xs px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80`}
                      >
                        {event.title}
                      </div>
                    )
                  })}
                  {dayData.events?.length > 3 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      +{dayData.events.length - 3} till
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function EventList({ events, contentTypes, onEdit, onDelete }) {
  const sortedEvents = [...events].sort((a, b) =>
    new Date(a.scheduled_date) - new Date(b.scheduled_date)
  )

  const statusLabels = {
    draft: 'Utkast',
    scheduled: 'Schemalagd',
    published: 'Publicerad',
    cancelled: 'Avbruten'
  }

  const statusColors = {
    draft: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
    scheduled: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400',
    published: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400',
    cancelled: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400'
  }

  return (
    <div className="p-4">
      {sortedEvents.length > 0 ? (
        <div className="space-y-2">
          {sortedEvents.map(event => {
            const type = contentTypes.find(t => t.id === event.content_type)
            const TypeIcon = type?.Icon || CalendarIcon
            return (
              <div
                key={event.id}
                className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
              >
                <div className={`p-2 rounded-lg ${type?.color || 'bg-gray-500'}`}>
                  <TypeIcon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white">{event.title}</h4>
                  <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                    <span>{new Date(event.scheduled_date).toLocaleDateString('sv-SE')}</span>
                    {event.scheduled_time && <span>{event.scheduled_time}</span>}
                    <span>{type?.label}</span>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${statusColors[event.status]}`}>
                  {statusLabels[event.status]}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEdit(event)}
                    className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                  >
                    <PencilSquareIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => onDelete(event.id)}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          Inga händelser denna månad
        </div>
      )}
    </div>
  )
}

function UpcomingWidget({ title, events, contentTypes }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="font-medium text-gray-900 dark:text-white mb-3">{title}</h3>
      {events.length > 0 ? (
        <div className="space-y-2">
          {events.slice(0, 5).map(event => {
            const type = contentTypes.find(t => t.id === event.content_type)
            return (
              <div key={event.id} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${type?.color || 'bg-gray-500'}`} />
                <span className="text-sm text-gray-600 dark:text-gray-400 truncate flex-1">
                  {event.title}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(event.scheduled_date).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">Inga händelser</p>
      )}
    </div>
  )
}

function EventFormModal({ event, contentTypes, onSave, onClose }) {
  const [formData, setFormData] = useState({
    title: '',
    content_type: 'recipe_feature',
    description: '',
    scheduled_date: new Date().toISOString().split('T')[0],
    scheduled_time: '',
    end_date: '',
    status: 'draft',
    tags: [],
    ...event
  })
  const [tagInput, setTagInput] = useState('')

  function addTag() {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...(formData.tags || []), tagInput.trim()] })
      setTagInput('')
    }
  }

  function removeTag(tag) {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) })
  }

  function handleSubmit(e) {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            {event.id ? 'Redigera innehåll' : 'Nytt innehåll'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Titel *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Typ
              </label>
              <select
                value={formData.content_type}
                onChange={(e) => setFormData({ ...formData, content_type: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              >
                {contentTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              >
                <option value="draft">Utkast</option>
                <option value="scheduled">Schemalagd</option>
                <option value="published">Publicerad</option>
                <option value="cancelled">Avbruten</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Beskrivning
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Datum *
              </label>
              <input
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tid
              </label>
              <input
                type="time"
                value={formData.scheduled_time || ''}
                onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Slutdatum (för kampanjer)
            </label>
            <input
              type="date"
              value={formData.end_date || ''}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Taggar
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Lägg till tagg..."
                className="flex-1 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                Lägg till
              </button>
            </div>
            {formData.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded flex items-center gap-1"
                  >
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-slate-900">
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Avbryt
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {event.id ? 'Spara' : 'Skapa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
