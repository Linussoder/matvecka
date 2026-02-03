'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  MegaphoneIcon, PlusIcon, PencilSquareIcon, TrashIcon, XMarkIcon,
  CalendarIcon, TagIcon, ChevronRightIcon
} from '@/components/admin/Icons'

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [needsSetup, setNeedsSetup] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchCampaigns()
  }, [filter])

  async function fetchCampaigns() {
    setLoading(true)
    try {
      const url = filter === 'all'
        ? '/api/admin/calendar/campaigns'
        : `/api/admin/calendar/campaigns?status=${filter}`
      const response = await fetch(url)
      const data = await response.json()
      if (data.success) {
        setCampaigns(data.campaigns || [])
        setNeedsSetup(data.needsSetup)
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Kunde inte ladda kampanjer')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(campaign) {
    try {
      const method = campaign.id ? 'PATCH' : 'POST'
      const response = await fetch('/api/admin/calendar/campaigns', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaign),
      })
      const data = await response.json()
      if (data.success) {
        setShowForm(false)
        setEditingCampaign(null)
        fetchCampaigns()
      } else {
        alert(data.error)
      }
    } catch (err) {
      alert('Kunde inte spara')
    }
  }

  async function handleDelete(id) {
    if (!confirm('Är du säker på att du vill ta bort denna kampanj?')) return
    try {
      const response = await fetch('/api/admin/calendar/campaigns', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (response.ok) {
        fetchCampaigns()
      }
    } catch (err) {
      alert('Kunde inte ta bort')
    }
  }

  async function handleStatusChange(id, newStatus) {
    try {
      const response = await fetch('/api/admin/calendar/campaigns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      })
      if (response.ok) {
        fetchCampaigns()
      }
    } catch (err) {
      alert('Kunde inte uppdatera status')
    }
  }

  const statusLabels = {
    draft: 'Utkast',
    active: 'Aktiv',
    completed: 'Avslutad',
    cancelled: 'Avbruten'
  }

  const statusColors = {
    draft: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
    active: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400',
    completed: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400',
    cancelled: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400'
  }

  if (loading && campaigns.length === 0) {
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
            Kampanjtabellen finns inte ännu. Kör migrationsfilen i Supabase.
          </p>
          <button
            onClick={fetchCampaigns}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            Försök igen
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
        <Link href="/admin/calendar" className="hover:text-gray-700 dark:hover:text-gray-200">
          Innehållskalender
        </Link>
        <ChevronRightIcon className="w-4 h-4" />
        <span className="text-gray-900 dark:text-white">Kampanjer</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Säsongskampanjer</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Hantera tematiska kampanjer och säsongsaktiviteter
          </p>
        </div>
        <button
          onClick={() => {
            setEditingCampaign({
              status: 'draft',
              start_date: new Date().toISOString().split('T')[0],
              end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            })
            setShowForm(true)
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Ny kampanj
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        {['all', 'draft', 'active', 'completed', 'cancelled'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filter === status
                ? 'bg-slate-700 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {status === 'all' ? 'Alla' : statusLabels[status]}
          </button>
        ))}
      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {campaigns.length > 0 ? (
          campaigns.map(campaign => (
            <div
              key={campaign.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              {campaign.banner_image_url && (
                <div
                  className="h-32 bg-cover bg-center"
                  style={{ backgroundImage: `url(${campaign.banner_image_url})` }}
                />
              )}
              {!campaign.banner_image_url && campaign.color_scheme?.primary && (
                <div
                  className="h-32 flex items-center justify-center"
                  style={{ backgroundColor: campaign.color_scheme.primary }}
                >
                  <MegaphoneIcon className="w-12 h-12 text-white/50" />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{campaign.name}</h3>
                    {campaign.theme && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">#{campaign.theme}</span>
                    )}
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${statusColors[campaign.status]}`}>
                    {statusLabels[campaign.status]}
                  </span>
                </div>
                {campaign.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {campaign.description}
                  </p>
                )}
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-3">
                  <span className="flex items-center gap-1">
                    <CalendarIcon className="w-4 h-4" />
                    {new Date(campaign.start_date).toLocaleDateString('sv-SE')} - {new Date(campaign.end_date).toLocaleDateString('sv-SE')}
                  </span>
                </div>
                {campaign.promotion_codes?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {campaign.promotion_codes.map(code => (
                      <span key={code} className="px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-400 rounded">
                        <TagIcon className="w-3 h-3 inline mr-1" />{code}
                      </span>
                    ))}
                  </div>
                )}
                {campaign.metrics && (
                  <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400 mb-3">
                    <span>{campaign.metrics.views || 0} visningar</span>
                    <span>{campaign.metrics.conversions || 0} konverteringar</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex gap-1">
                    {campaign.status === 'draft' && (
                      <button
                        onClick={() => handleStatusChange(campaign.id, 'active')}
                        className="px-3 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                      >
                        Aktivera
                      </button>
                    )}
                    {campaign.status === 'active' && (
                      <button
                        onClick={() => handleStatusChange(campaign.id, 'completed')}
                        className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        Avsluta
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingCampaign(campaign)
                        setShowForm(true)
                      }}
                      className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                    >
                      <PencilSquareIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(campaign.id)}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
            <MegaphoneIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Inga kampanjer ännu</p>
          </div>
        )}
      </div>

      {/* Campaign Form Modal */}
      {showForm && editingCampaign && (
        <CampaignFormModal
          campaign={editingCampaign}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false)
            setEditingCampaign(null)
          }}
        />
      )}
    </div>
  )
}

function CampaignFormModal({ campaign, onSave, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    theme: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    status: 'draft',
    banner_image_url: '',
    color_scheme: { primary: '#3b82f6', secondary: '#10b981' },
    promotion_codes: [],
    ...campaign
  })
  const [codeInput, setCodeInput] = useState('')

  function generateSlug(name) {
    return name.toLowerCase()
      .replace(/å/g, 'a').replace(/ä/g, 'a').replace(/ö/g, 'o')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  function addCode() {
    if (codeInput.trim() && !formData.promotion_codes?.includes(codeInput.trim().toUpperCase())) {
      setFormData({
        ...formData,
        promotion_codes: [...(formData.promotion_codes || []), codeInput.trim().toUpperCase()]
      })
      setCodeInput('')
    }
  }

  function removeCode(code) {
    setFormData({
      ...formData,
      promotion_codes: formData.promotion_codes.filter(c => c !== code)
    })
  }

  function handleSubmit(e) {
    e.preventDefault()
    const dataToSave = {
      ...formData,
      slug: formData.slug || generateSlug(formData.name)
    }
    onSave(dataToSave)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            {campaign.id ? 'Redigera kampanj' : 'Ny kampanj'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Kampanjnamn *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({
                ...formData,
                name: e.target.value,
                slug: formData.slug || generateSlug(e.target.value)
              })}
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              placeholder="t.ex. Julkampanjen 2025"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                URL-slug
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                placeholder="jul-2025"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tema
              </label>
              <input
                type="text"
                value={formData.theme}
                onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                placeholder="t.ex. christmas, summer_bbq"
              />
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
                Startdatum *
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Slutdatum *
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Banner-bild URL
            </label>
            <input
              type="url"
              value={formData.banner_image_url}
              onChange={(e) => setFormData({ ...formData, banner_image_url: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Primärfärg
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.color_scheme?.primary || '#3b82f6'}
                  onChange={(e) => setFormData({
                    ...formData,
                    color_scheme: { ...formData.color_scheme, primary: e.target.value }
                  })}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.color_scheme?.primary || '#3b82f6'}
                  onChange={(e) => setFormData({
                    ...formData,
                    color_scheme: { ...formData.color_scheme, primary: e.target.value }
                  })}
                  className="flex-1 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sekundärfärg
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.color_scheme?.secondary || '#10b981'}
                  onChange={(e) => setFormData({
                    ...formData,
                    color_scheme: { ...formData.color_scheme, secondary: e.target.value }
                  })}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.color_scheme?.secondary || '#10b981'}
                  onChange={(e) => setFormData({
                    ...formData,
                    color_scheme: { ...formData.color_scheme, secondary: e.target.value }
                  })}
                  className="flex-1 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Kampanjkoder
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCode())}
                placeholder="Lägg till kod..."
                className="flex-1 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              />
              <button
                type="button"
                onClick={addCode}
                className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                Lägg till
              </button>
            </div>
            {formData.promotion_codes?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.promotion_codes.map(code => (
                  <span
                    key={code}
                    className="px-2 py-1 text-sm bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-400 rounded flex items-center gap-1"
                  >
                    {code}
                    <button type="button" onClick={() => removeCode(code)} className="hover:text-purple-900">
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
              {campaign.id ? 'Spara' : 'Skapa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
