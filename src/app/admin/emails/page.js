'use client'

import { useState, useEffect } from 'react'
import {
  EnvelopeIcon, DocumentIcon, UserIcon, MegaphoneIcon, ArrowPathIcon,
  ChatBubbleLeftRightIcon, PaperAirplaneIcon
} from '@/components/admin/Icons'

// Template type icon components
const HandWaveIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.05 4.575a1.575 1.575 0 10-3.15 0v3m3.15-3v-1.5a1.575 1.575 0 013.15 0v1.5m-3.15 0l-.075 5.925m3.075-6.975a1.575 1.575 0 013.15 0V8.25m-3.15-3.075v6.225M12 6.75a.75.75 0 00-.75.75v8.25m.75-9a3.75 3.75 0 01-.85 2.375c-.6.75-1.425 1.35-2.15 1.35h-.75m10.5 5.625a1.575 1.575 0 01-3.15 0v-5.625m0 5.625V17.25a1.575 1.575 0 01-1.575 1.575H9.75M10.05 4.575a1.575 1.575 0 00-1.575 1.575v4.35" />
  </svg>
)

const NewspaperIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
  </svg>
)

const GiftIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
  </svg>
)

const HeartIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
  </svg>
)

const templateTypes = [
  { id: 'welcome', name: 'Välkommen', Icon: HandWaveIcon, description: 'Skickas till nya användare' },
  { id: 'newsletter', name: 'Nyhetsbrev', Icon: NewspaperIcon, description: 'Veckovis uppdatering' },
  { id: 'promotional', name: 'Kampanj', Icon: GiftIcon, description: 'Erbjudanden och kampanjer' },
  { id: 'winback', name: 'Win-back', Icon: HeartIcon, description: 'För inaktiva användare' },
  { id: 'transactional', name: 'Transaktionell', Icon: EnvelopeIcon, description: 'Kvitton, bekräftelser' },
]

const emailVariables = [
  { name: '{{name}}', description: 'Användarens namn' },
  { name: '{{email}}', description: 'Användarens email' },
  { name: '{{meal_plans}}', description: 'Antal matplaner' },
  { name: '{{savings}}', description: 'Total besparing' },
  { name: '{{recipes}}', description: 'Antal sparade recept' },
  { name: '{{days_inactive}}', description: 'Dagar inaktiv' },
]

export default function EmailsPage() {
  const [templates, setTemplates] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('templates')
  const [showEditor, setShowEditor] = useState(false)
  const [segments, setSegments] = useState([])
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState(null)

  const [automations, setAutomations] = useState([
    { id: 1, name: 'Välkomstmail', trigger: 'Vid registrering', enabled: true, sent: 124 },
    { id: 2, name: 'Win-back', trigger: '30 dagar inaktiv', enabled: false, sent: 0 },
    { id: 3, name: 'Förnya prenumeration', trigger: '7 dagar före utgång', enabled: false, sent: 0 },
    { id: 4, name: 'Veckosammanfattning', trigger: 'Varje söndag', enabled: false, sent: 0 },
  ])

  const [editor, setEditor] = useState({
    name: '',
    type: 'newsletter',
    subject: '',
    previewText: '',
    content: '',
    targetSegment: '',
    targetAll: false
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const [templatesRes, campaignsRes, segmentsRes] = await Promise.all([
        fetch('/api/admin/emails/templates'),
        fetch('/api/admin/emails/campaigns'),
        fetch('/api/admin/segments')
      ])

      const templatesData = await templatesRes.json()
      const campaignsData = await campaignsRes.json()
      const segmentsData = await segmentsRes.json()

      if (templatesData.error) throw new Error(templatesData.error)
      if (campaignsData.error) throw new Error(campaignsData.error)

      setTemplates(templatesData.templates || [])
      setCampaigns(campaignsData.campaigns || [])
      setSegments(segmentsData.segments || [])
    } catch (err) {
      console.error('Failed to load data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveTemplate() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/emails/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editor.name,
          type: editor.type,
          subject: editor.subject,
          html_content: editor.content
        })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      if (data.success) {
        setTemplates(prev => [data.template, ...prev])
        setShowEditor(false)
        resetEditor()
        setSuccessMessage('Mall sparad!')
        setTimeout(() => setSuccessMessage(null), 3000)
      }
    } catch (err) {
      console.error('Failed to save template:', err)
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleSendCampaign() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editor.name,
          type: editor.type,
          subject: editor.subject,
          previewText: editor.previewText,
          content: editor.content,
          targetSegment: editor.targetSegment || null,
          targetAll: editor.targetAll
        })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      if (data.success) {
        setCampaigns(prev => [data.campaign, ...prev])
        setShowEditor(false)
        resetEditor()
        setSuccessMessage('Kampanj skickad!')
        setTimeout(() => setSuccessMessage(null), 3000)
      }
    } catch (err) {
      console.error('Failed to send campaign:', err)
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  function resetEditor() {
    setEditor({
      name: '',
      type: 'newsletter',
      subject: '',
      previewText: '',
      content: '',
      targetSegment: '',
      targetAll: false
    })
  }

  function useTemplate(template) {
    setEditor({
      name: template.name + ' - Kopia',
      type: template.type,
      subject: template.subject,
      previewText: '',
      content: template.html_content || '',
      targetSegment: '',
      targetAll: false
    })
    setShowEditor(true)
  }

  function insertVariable(variable) {
    setEditor(prev => ({
      ...prev,
      content: prev.content + variable
    }))
  }

  function toggleAutomation(id) {
    setAutomations(prev => prev.map(auto =>
      auto.id === id ? { ...auto, enabled: !auto.enabled } : auto
    ))
  }

  // Calculate stats from campaigns - handle nested data structure
  const stats = {
    sent: campaigns.reduce((sum, c) => sum + (c.metrics?.sent || 0), 0),
    opened: campaigns.reduce((sum, c) => sum + (c.metrics?.opened || 0), 0),
    clicked: campaigns.reduce((sum, c) => sum + (c.metrics?.clicked || 0), 0),
    templates: templates.length
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <EnvelopeIcon className="w-6 h-6 text-white" />
            </div>
            Email Marketing Hub
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Skapa och skicka nyhetsbrev och kampanjer
          </p>
        </div>
        <button
          onClick={() => setShowEditor(true)}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Ny kampanj
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">×</button>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl text-green-700 dark:text-green-400">
          {successMessage}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Totalt skickade</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.sent}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Öppnade</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-500">{stats.opened}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {stats.sent > 0 ? ((stats.opened / stats.sent) * 100).toFixed(1) : 0}% öppningsgrad
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Klickade</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-500">{stats.clicked}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {stats.opened > 0 ? ((stats.clicked / stats.opened) * 100).toFixed(1) : 0}% CTR
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Mallar</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-500">{stats.templates}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'templates'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Mallar
        </button>
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'campaigns'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Kampanjer
        </button>
        <button
          onClick={() => setActiveTab('automations')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'automations'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Automatiseringar
        </button>
      </div>

      {/* Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setShowEditor(false); resetEditor() }}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Skapa email</h2>
              <button
                onClick={() => { setShowEditor(false); resetEditor() }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 grid grid-cols-3 gap-6">
              {/* Left: Editor */}
              <div className="col-span-2 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kampanjnamn</label>
                    <input
                      type="text"
                      value={editor.name}
                      onChange={(e) => setEditor({ ...editor, name: e.target.value })}
                      placeholder="T.ex. 'Julkampanj 2024'"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Typ</label>
                    <select
                      value={editor.type}
                      onChange={(e) => setEditor({ ...editor, type: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {templateTypes.map(type => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ämnesrad</label>
                  <input
                    type="text"
                    value={editor.subject}
                    onChange={(e) => setEditor({ ...editor, subject: e.target.value })}
                    placeholder="Veckans bästa erbjudanden"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Förhandstext</label>
                  <input
                    type="text"
                    value={editor.previewText}
                    onChange={(e) => setEditor({ ...editor, previewText: e.target.value })}
                    placeholder="Visas i inboxen efter ämnesraden"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Innehåll</label>
                  <textarea
                    value={editor.content}
                    onChange={(e) => setEditor({ ...editor, content: e.target.value })}
                    placeholder="Skriv ditt email-innehåll här. Du kan använda variabler som {{name}}."
                    rows={12}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Målgrupp</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editor.targetAll}
                        onChange={(e) => setEditor({ ...editor, targetAll: e.target.checked, targetSegment: '' })}
                        className="rounded text-blue-600"
                      />
                      <span className="text-gray-700 dark:text-gray-300">Alla användare</span>
                    </label>
                    {!editor.targetAll && (
                      <select
                        value={editor.targetSegment}
                        onChange={(e) => setEditor({ ...editor, targetSegment: e.target.value })}
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
              </div>

              {/* Right: Variables & Preview */}
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">Variabler</h3>
                  <div className="space-y-2">
                    {emailVariables.map(v => (
                      <button
                        key={v.name}
                        type="button"
                        onClick={() => insertVariable(v.name)}
                        className="w-full text-left p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                      >
                        <code className="text-sm text-blue-600 dark:text-blue-400">{v.name}</code>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{v.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">Förhandsgranskning</h3>
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{editor.subject || 'Ämnesrad...'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{editor.previewText || 'Förhandstext...'}</p>
                    <hr className="my-3 border-gray-200 dark:border-gray-700" />
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {editor.content || 'Innehåll visas här...'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setShowEditor(false); resetEditor() }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Avbryt
              </button>
              <button
                type="button"
                onClick={handleSaveTemplate}
                disabled={saving || !editor.name || !editor.subject}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Sparar...' : 'Spara som mall'}
              </button>
              <button
                type="button"
                onClick={handleSendCampaign}
                disabled={saving || !editor.name || !editor.subject || !editor.content || (!editor.targetAll && !editor.targetSegment)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Skickar...' : 'Skicka kampanj'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="p-12 text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500 dark:text-gray-400">Laddar...</p>
        </div>
      ) : activeTab === 'templates' ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white">Email-mallar</h2>
          </div>

          {templates.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center">
                <DocumentIcon className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400">Inga mallar skapade ännu</p>
              <button
                type="button"
                onClick={() => setShowEditor(true)}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                Skapa din första mall
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4 p-4">
              {templates.map(template => {
                const templateType = templateTypes.find(t => t.id === template.type)
                const TypeIcon = templateType?.Icon || EnvelopeIcon
                return (
                  <div key={template.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-shadow">
                    <div className="flex items-center gap-2 mb-2">
                      <TypeIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                      <h3 className="font-medium text-gray-900 dark:text-white">{template.name}</h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{template.subject}</p>
                    <button
                      type="button"
                      onClick={() => useTemplate(template)}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Använd mall
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : activeTab === 'campaigns' ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white">Skickade kampanjer</h2>
          </div>

          {campaigns.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center">
                <PaperAirplaneIcon className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400">Inga kampanjer skickade ännu</p>
              <button
                type="button"
                onClick={() => setShowEditor(true)}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                Skapa din första kampanj
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {campaigns.map(campaign => (
                <div key={campaign.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{campaign.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {campaign.content?.subject || campaign.subject || 'Ingen ämnesrad'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {campaign.sent_at ? new Date(campaign.sent_at).toLocaleDateString('sv-SE') : 'Ej skickad'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-900 dark:text-white">
                        {campaign.metrics?.sent || 0} skickade
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {campaign.metrics?.opened || 0} öppnade • {campaign.metrics?.clicked || 0} klickade
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-6">Email-automatiseringar</h2>

          <div className="space-y-4">
            {automations.map((auto) => (
              <div key={auto.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">{auto.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{auto.trigger}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500 dark:text-gray-400">{auto.sent} skickade</span>
                  <button
                    type="button"
                    onClick={() => toggleAutomation(auto.id)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      auto.enabled ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        auto.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-6 text-sm text-gray-500 dark:text-gray-400 text-center">
            Automatiseringar kräver email-integration (Resend, SendGrid, etc.)
          </p>
        </div>
      )}
    </div>
  )
}
