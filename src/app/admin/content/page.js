'use client'

import { useState, useEffect } from 'react'
import { PhotoIcon, MegaphoneIcon, StarIcon } from '@/components/admin/Icons'

export default function AdminContentPage() {
  const [content, setContent] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [needsSetup, setNeedsSetup] = useState(false)
  const [activeTab, setActiveTab] = useState('banner')
  const [editingItem, setEditingItem] = useState(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    fetchContent()
  }, [])

  async function fetchContent() {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/content')
      const data = await response.json()

      if (data.success) {
        setContent(data.content)
        setNeedsSetup(data.needsSetup)
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Kunde inte ladda innehåll')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(item) {
    try {
      const method = item.id ? 'PATCH' : 'POST'
      const response = await fetch('/api/admin/content', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      })

      const data = await response.json()

      if (data.success) {
        if (item.id) {
          setContent(content.map(c => c.id === item.id ? data.item : c))
        } else {
          setContent([...content, data.item])
        }
        setEditingItem(null)
        setShowForm(false)
      } else {
        alert(data.error)
      }
    } catch (err) {
      alert('Kunde inte spara')
    }
  }

  async function handleDelete(id) {
    if (!confirm('Är du säker på att du vill ta bort detta innehåll?')) return

    try {
      const response = await fetch('/api/admin/content', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })

      if (response.ok) {
        setContent(content.filter(c => c.id !== id))
      }
    } catch (err) {
      alert('Kunde inte ta bort')
    }
  }

  async function handleToggleActive(item) {
    await handleSave({ id: item.id, is_active: !item.is_active })
  }

  const filteredContent = content.filter(c => c.type === activeTab)

  const tabs = [
    { id: 'banner', label: 'Banners', Icon: PhotoIcon },
    { id: 'announcement', label: 'Meddelanden', Icon: MegaphoneIcon },
    { id: 'featured', label: 'Utvalda recept', Icon: StarIcon },
  ]

  if (loading) {
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
            Tabellen <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">site_content</code> finns inte ännu.
            Kör följande SQL i Supabase:
          </p>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`CREATE TABLE site_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type VARCHAR(50) NOT NULL, -- 'banner', 'announcement', 'featured'
  title VARCHAR(255) NOT NULL,
  content TEXT,
  link_url VARCHAR(500),
  link_text VARCHAR(100),
  image_url VARCHAR(500),
  background_color VARCHAR(20) DEFAULT '#3b82f6',
  text_color VARCHAR(20) DEFAULT '#ffffff',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_site_content_type ON site_content(type);
CREATE INDEX idx_site_content_active ON site_content(is_active);`}
          </pre>
          <button
            onClick={fetchContent}
            className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            Försök igen
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Innehåll</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Hantera banners, meddelanden och utvalda recept
          </p>
        </div>
        <button
          onClick={() => {
            setEditingItem({ type: activeTab, is_active: true })
            setShowForm(true)
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Lägg till
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map(tab => {
          const TabIcon = tab.Icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <TabIcon className="w-4 h-4" />
            {tab.label}
            <span className={`ml-1 px-2 py-0.5 text-xs rounded-full ${
              activeTab === tab.id
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}>
              {content.filter(c => c.type === tab.id).length}
            </span>
          </button>
          )
        })}
      </div>

      {/* Content List */}
      <div className="space-y-4">
        {filteredContent.length > 0 ? (
          filteredContent.map(item => (
            <ContentCard
              key={item.id}
              item={item}
              onEdit={() => {
                setEditingItem(item)
                setShowForm(true)
              }}
              onDelete={() => handleDelete(item.id)}
              onToggleActive={() => handleToggleActive(item)}
            />
          ))
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              Inga {tabs.find(t => t.id === activeTab)?.label.toLowerCase()} ännu
            </p>
            <button
              onClick={() => {
                setEditingItem({ type: activeTab, is_active: true })
                setShowForm(true)
              }}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Skapa första
            </button>
          </div>
        )}
      </div>

      {/* Edit/Create Form Modal */}
      {showForm && editingItem && (
        <ContentFormModal
          item={editingItem}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false)
            setEditingItem(null)
          }}
        />
      )}
    </div>
  )
}

function ContentCard({ item, onEdit, onDelete, onToggleActive }) {
  const isExpired = item.ends_at && new Date(item.ends_at) < new Date()
  const isScheduled = item.starts_at && new Date(item.starts_at) > new Date()

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden ${
      !item.is_active ? 'opacity-60' : ''
    }`}>
      <div className="flex items-stretch">
        {/* Preview */}
        {item.type === 'banner' && (
          <div
            className="w-48 p-4 flex items-center justify-center"
            style={{ backgroundColor: item.background_color }}
          >
            <span className="text-sm font-medium text-center" style={{ color: item.text_color }}>
              {item.title}
            </span>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">{item.title}</h3>
              {item.content && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                  {item.content}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isExpired && (
                <span className="px-2 py-1 text-xs rounded-full bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400">
                  Utgången
                </span>
              )}
              {isScheduled && (
                <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400">
                  Schemalagd
                </span>
              )}
              <span className={`px-2 py-1 text-xs rounded-full ${
                item.is_active
                  ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}>
                {item.is_active ? 'Aktiv' : 'Inaktiv'}
              </span>
            </div>
          </div>

          {/* Meta info */}
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
            {item.link_url && (
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                {item.link_text || 'Länk'}
              </span>
            )}
            {item.starts_at && (
              <span>Startar: {new Date(item.starts_at).toLocaleDateString('sv-SE')}</span>
            )}
            {item.ends_at && (
              <span>Slutar: {new Date(item.ends_at).toLocaleDateString('sv-SE')}</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col justify-center gap-1 px-4 border-l border-gray-200 dark:border-gray-700">
          <button
            onClick={onToggleActive}
            className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            title={item.is_active ? 'Inaktivera' : 'Aktivera'}
          >
            {item.is_active ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
          <button
            onClick={onEdit}
            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
            title="Redigera"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
            title="Ta bort"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

function ContentFormModal({ item, onSave, onClose }) {
  const [formData, setFormData] = useState({
    type: 'banner',
    title: '',
    content: '',
    link_url: '',
    link_text: '',
    image_url: '',
    background_color: '#3b82f6',
    text_color: '#ffffff',
    is_active: true,
    sort_order: 0,
    starts_at: '',
    ends_at: '',
    ...item
  })

  const isEditing = !!item.id

  function handleSubmit(e) {
    e.preventDefault()
    onSave(formData)
  }

  const typeLabels = {
    banner: 'Banner',
    announcement: 'Meddelande',
    featured: 'Utvalt recept'
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            {isEditing ? 'Redigera' : 'Skapa'} {typeLabels[formData.type]}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Type (only for new items) */}
          {!isEditing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Typ
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              >
                <option value="banner">Banner</option>
                <option value="announcement">Meddelande</option>
                <option value="featured">Utvalt recept</option>
              </select>
            </div>
          )}

          {/* Title */}
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

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Innehåll
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
            />
          </div>

          {/* Link */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Länk URL
              </label>
              <input
                type="url"
                value={formData.link_url}
                onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                placeholder="https://..."
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Länktext
              </label>
              <input
                type="text"
                value={formData.link_text}
                onChange={(e) => setFormData({ ...formData, link_text: e.target.value })}
                placeholder="Läs mer"
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Bild URL
            </label>
            <input
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="https://..."
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
            />
          </div>

          {/* Colors (for banners) */}
          {formData.type === 'banner' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Bakgrundsfärg
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.background_color}
                    onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                    className="w-12 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.background_color}
                    onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                    className="flex-1 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Textfärg
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.text_color}
                    onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                    className="w-12 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.text_color}
                    onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                    className="flex-1 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Preview for banner */}
          {formData.type === 'banner' && formData.title && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Förhandsgranskning
              </label>
              <div
                className="p-4 rounded-lg text-center"
                style={{ backgroundColor: formData.background_color }}
              >
                <p className="font-medium" style={{ color: formData.text_color }}>
                  {formData.title}
                </p>
                {formData.content && (
                  <p className="text-sm mt-1 opacity-90" style={{ color: formData.text_color }}>
                    {formData.content}
                  </p>
                )}
                {formData.link_text && (
                  <span
                    className="inline-block mt-2 text-sm underline"
                    style={{ color: formData.text_color }}
                  >
                    {formData.link_text}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Schedule */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Startdatum (valfritt)
              </label>
              <input
                type="datetime-local"
                value={formData.starts_at ? formData.starts_at.slice(0, 16) : ''}
                onChange={(e) => setFormData({ ...formData, starts_at: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Slutdatum (valfritt)
              </label>
              <input
                type="datetime-local"
                value={formData.ends_at ? formData.ends_at.slice(0, 16) : ''}
                onChange={(e) => setFormData({ ...formData, ends_at: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Sort order and active */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sorteringsordning
              </label>
              <input
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Aktiv</span>
              </label>
            </div>
          </div>

          {/* Actions */}
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
              {isEditing ? 'Spara' : 'Skapa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
