'use client'

import { useState, useEffect } from 'react'
import {
  LanguageIcon, PlusIcon, PencilSquareIcon, TrashIcon, XMarkIcon,
  CheckIcon, GlobeAltIcon
} from '@/components/admin/Icons'

export default function AdminTranslationsPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [languages, setLanguages] = useState([])
  const [keys, setKeys] = useState([])
  const [translations, setTranslations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [needsSetup, setNeedsSetup] = useState(false)

  // Forms
  const [showKeyForm, setShowKeyForm] = useState(false)
  const [editingKey, setEditingKey] = useState(null)
  const [selectedKey, setSelectedKey] = useState(null)
  const [selectedLanguage, setSelectedLanguage] = useState('en')

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchData()
  }, [activeTab])

  async function fetchData() {
    setLoading(true)
    setError(null)
    try {
      // Fetch languages
      const langResponse = await fetch('/api/admin/translations/languages')
      const langData = await langResponse.json()
      if (langData.success) {
        setLanguages(langData.languages || [])
        setNeedsSetup(langData.needsSetup)
      }

      // Fetch keys
      const keysResponse = await fetch('/api/admin/translations/keys')
      const keysData = await keysResponse.json()
      if (keysData.success) {
        setKeys(keysData.keys || [])
      }

      // Fetch translations for selected language
      if (selectedLanguage) {
        const transResponse = await fetch(`/api/admin/translations?language=${selectedLanguage}`)
        const transData = await transResponse.json()
        if (transData.success) {
          setTranslations(transData.translations || [])
        }
      }
    } catch (err) {
      setError('Kunde inte ladda data')
    } finally {
      setLoading(false)
    }
  }

  async function handleToggleLanguage(code, isActive) {
    try {
      const response = await fetch('/api/admin/translations/languages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, is_active: isActive }),
      })
      if (response.ok) {
        fetchData()
      }
    } catch (err) {
      alert('Kunde inte uppdatera språk')
    }
  }

  async function handleSaveKey(key) {
    try {
      const method = key.id ? 'PATCH' : 'POST'
      const response = await fetch('/api/admin/translations/keys', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(key),
      })
      const data = await response.json()
      if (data.success) {
        setShowKeyForm(false)
        setEditingKey(null)
        fetchData()
      } else {
        alert(data.error)
      }
    } catch (err) {
      alert('Kunde inte spara')
    }
  }

  async function handleDeleteKey(id) {
    if (!confirm('Är du säker? Detta tar bort nyckeln och alla översättningar.')) return
    try {
      const response = await fetch('/api/admin/translations/keys', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (response.ok) {
        fetchData()
      }
    } catch (err) {
      alert('Kunde inte ta bort')
    }
  }

  async function handleSaveTranslation(keyId, languageCode, value, status) {
    try {
      const response = await fetch('/api/admin/translations/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          translation_key_id: keyId,
          language_code: languageCode,
          translated_value: value,
          status: status || 'draft'
        }),
      })
      const data = await response.json()
      if (data.success) {
        fetchData()
      } else {
        alert(data.error)
      }
    } catch (err) {
      alert('Kunde inte spara översättning')
    }
  }

  const tabs = [
    { id: 'overview', label: 'Översikt' },
    { id: 'keys', label: 'Nycklar' },
    { id: 'translate', label: 'Översätt' },
  ]

  const categories = ['ui', 'recipe', 'email', 'blog', 'marketing', 'error']

  if (loading && languages.length === 0) {
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
            Översättningstabellerna finns inte ännu. Kör migrationsfilen i Supabase.
          </p>
          <button
            onClick={fetchData}
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Översättningar</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Hantera flerspråkigt innehåll
          </p>
        </div>
        {activeTab === 'keys' && (
          <button
            onClick={() => {
              setEditingKey({ category: 'ui' })
              setShowKeyForm(true)
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Ny nyckel
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab
          languages={languages}
          keys={keys}
          onToggleLanguage={handleToggleLanguage}
        />
      )}

      {activeTab === 'keys' && (
        <KeysTab
          keys={keys}
          categoryFilter={categoryFilter}
          onCategoryChange={setCategoryFilter}
          onEdit={(key) => {
            setEditingKey(key)
            setShowKeyForm(true)
          }}
          onDelete={handleDeleteKey}
        />
      )}

      {activeTab === 'translate' && (
        <TranslateTab
          keys={keys}
          languages={languages.filter(l => l.is_active && !l.is_default)}
          translations={translations}
          selectedLanguage={selectedLanguage}
          onLanguageChange={(code) => {
            setSelectedLanguage(code)
            fetchData()
          }}
          onSave={handleSaveTranslation}
        />
      )}

      {/* Key Form Modal */}
      {showKeyForm && editingKey && (
        <KeyFormModal
          item={editingKey}
          categories={categories}
          onSave={handleSaveKey}
          onClose={() => {
            setShowKeyForm(false)
            setEditingKey(null)
          }}
        />
      )}
    </div>
  )
}

function OverviewTab({ languages, keys, onToggleLanguage }) {
  const defaultLang = languages.find(l => l.is_default)
  const activeLangs = languages.filter(l => l.is_active && !l.is_default)

  return (
    <div className="space-y-6">
      {/* Language Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {languages.map(lang => (
          <div
            key={lang.code}
            className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 ${
              !lang.is_active ? 'opacity-60' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  lang.is_default ? 'bg-emerald-100 dark:bg-emerald-900/50' : 'bg-slate-100 dark:bg-slate-700'
                }`}>
                  <span className="text-lg font-semibold">{lang.code.toUpperCase()}</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">{lang.native_name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{lang.name}</p>
                </div>
              </div>
              {lang.is_default ? (
                <span className="px-2 py-1 text-xs bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 rounded-full">
                  Standard
                </span>
              ) : (
                <button
                  onClick={() => onToggleLanguage(lang.code, !lang.is_active)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    lang.is_active ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    lang.is_active ? 'left-7' : 'left-1'
                  }`} />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all"
                  style={{ width: `${lang.translation_progress || 0}%` }}
                />
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {lang.translation_progress || 0}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{keys.length}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Totalt nycklar</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{activeLangs.length}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Aktiva språk</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {keys.length * activeLangs.length}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Totalt översättningar behövs</div>
        </div>
      </div>
    </div>
  )
}

function KeysTab({ keys, categoryFilter, onCategoryChange, onEdit, onDelete }) {
  const categories = ['all', 'ui', 'recipe', 'email', 'blog', 'marketing', 'error']
  const categoryLabels = {
    all: 'Alla',
    ui: 'Gränssnitt',
    recipe: 'Recept',
    email: 'Email',
    blog: 'Blogg',
    marketing: 'Marknadsföring',
    error: 'Felmeddelanden'
  }

  const filteredKeys = categoryFilter === 'all'
    ? keys
    : keys.filter(k => k.category === categoryFilter)

  return (
    <div>
      {/* Category Filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => onCategoryChange(cat)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              categoryFilter === cat
                ? 'bg-slate-700 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {categoryLabels[cat]}
          </button>
        ))}
      </div>

      {/* Keys List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-900">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nyckel</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Kategori</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Standardvärde</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Åtgärder</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredKeys.length > 0 ? (
              filteredKeys.map(key => (
                <tr key={key.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                  <td className="px-4 py-3">
                    <code className="text-sm bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                      {key.key}
                    </code>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {categoryLabels[key.category] || key.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-900 dark:text-white truncate max-w-xs block">
                      {key.default_value}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onEdit(key)}
                      className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                    >
                      <PencilSquareIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(key.id)}
                      className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded ml-1"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  Inga nycklar i denna kategori
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TranslateTab({ keys, languages, translations, selectedLanguage, onLanguageChange, onSave }) {
  const [editingTranslation, setEditingTranslation] = useState(null)
  const [translationValue, setTranslationValue] = useState('')

  function getTranslation(keyId) {
    return translations.find(t => t.translation_key_id === keyId)
  }

  function startEditing(key) {
    const existing = getTranslation(key.id)
    setEditingTranslation(key.id)
    setTranslationValue(existing?.translated_value || '')
  }

  function saveTranslation(keyId) {
    onSave(keyId, selectedLanguage, translationValue, 'draft')
    setEditingTranslation(null)
    setTranslationValue('')
  }

  if (languages.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
        <GlobeAltIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500 dark:text-gray-400">
          Aktivera minst ett språk utöver standardspråket för att börja översätta
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Language Selector */}
      <div className="flex gap-2 mb-4">
        {languages.map(lang => (
          <button
            key={lang.code}
            onClick={() => onLanguageChange(lang.code)}
            className={`px-4 py-2 text-sm rounded-lg transition-colors flex items-center gap-2 ${
              selectedLanguage === lang.code
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <span className="font-medium">{lang.code.toUpperCase()}</span>
            <span>{lang.native_name}</span>
          </button>
        ))}
      </div>

      {/* Translation Editor */}
      <div className="space-y-2">
        {keys.map(key => {
          const translation = getTranslation(key.id)
          const isEditing = editingTranslation === key.id

          return (
            <div
              key={key.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <code className="text-sm bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                    {key.key}
                  </code>
                  {key.context && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{key.context}</p>
                  )}
                </div>
                {translation && (
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    translation.status === 'approved'
                      ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400'
                      : translation.status === 'pending_review'
                      ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                    {translation.status === 'approved' ? 'Godkänd' :
                     translation.status === 'pending_review' ? 'Väntar' : 'Utkast'}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Svenska (original)</label>
                  <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded text-sm text-gray-700 dark:text-gray-300">
                    {key.default_value}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {languages.find(l => l.code === selectedLanguage)?.native_name}
                  </label>
                  {isEditing ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={translationValue}
                        onChange={(e) => setTranslationValue(e.target.value)}
                        className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-white"
                        autoFocus
                      />
                      <button
                        onClick={() => saveTranslation(key.id)}
                        className="p-2 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        <CheckIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingTranslation(null)}
                        className="p-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => startEditing(key)}
                      className={`p-2 rounded text-sm cursor-pointer transition-colors ${
                        translation
                          ? 'bg-slate-50 dark:bg-slate-900 text-gray-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                          : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-dashed border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/30'
                      }`}
                    >
                      {translation?.translated_value || 'Klicka för att översätta...'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function KeyFormModal({ item, categories, onSave, onClose }) {
  const [formData, setFormData] = useState({
    key: '',
    context: '',
    category: 'ui',
    default_value: '',
    max_length: null,
    is_plural: false,
    ...item
  })

  function handleSubmit(e) {
    e.preventDefault()
    onSave(formData)
  }

  const categoryLabels = {
    ui: 'Gränssnitt',
    recipe: 'Recept',
    email: 'Email',
    blog: 'Blogg',
    marketing: 'Marknadsföring',
    error: 'Felmeddelanden'
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            {item.id ? 'Redigera nyckel' : 'Ny nyckel'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nyckel *
            </label>
            <input
              type="text"
              value={formData.key}
              onChange={(e) => setFormData({ ...formData, key: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white font-mono"
              placeholder="t.ex. homepage.welcome_message"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Kategori
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{categoryLabels[cat]}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Standardvärde (Svenska) *
            </label>
            <textarea
              value={formData.default_value}
              onChange={(e) => setFormData({ ...formData, default_value: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Kontext/beskrivning
            </label>
            <input
              type="text"
              value={formData.context}
              onChange={(e) => setFormData({ ...formData, context: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              placeholder="Var och hur används denna text?"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Max längd
              </label>
              <input
                type="number"
                value={formData.max_length || ''}
                onChange={(e) => setFormData({ ...formData, max_length: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                placeholder="Valfritt"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_plural}
                  onChange={(e) => setFormData({ ...formData, is_plural: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Plural/singular</span>
              </label>
            </div>
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
              {item.id ? 'Spara' : 'Skapa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
