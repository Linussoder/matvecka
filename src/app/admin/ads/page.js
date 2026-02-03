'use client'

import { useState, useEffect } from 'react'
import {
  PhotoIcon, SparklesIcon, ClockIcon, TrashIcon, ArrowPathIcon,
  FolderIcon, DocumentPlusIcon
} from '@/components/admin/Icons'

// Platform-specific icons as inline SVGs for brand recognition
const InstagramIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
)

const FacebookIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
)

const TikTokIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
  </svg>
)

const platforms = [
  { id: 'instagram', name: 'Instagram', Icon: InstagramIcon, formats: ['square', 'portrait', 'story'] },
  { id: 'facebook', name: 'Facebook', Icon: FacebookIcon, formats: ['square', 'landscape', 'story'] },
  { id: 'tiktok', name: 'TikTok', Icon: TikTokIcon, formats: ['portrait'] },
]

const targetAudiences = [
  { id: 'families', name: 'Svenska familjer med barn', description: 'Fokus på barnvänlig mat och tidsbesparingar' },
  { id: 'health', name: 'Hälsomedvetna vuxna', description: 'Fokus på näring och hälsosamma val' },
  { id: 'budget', name: 'Prismedvetna', description: 'Fokus på besparingar och bra deals' },
  { id: 'foodies', name: 'Matentusiaster', description: 'Fokus på nya recept och matkreativitet' },
  { id: 'busy', name: 'Upptagna yrkespersoner', description: 'Fokus på snabbhet och enkelhet' },
]

const campaignTypes = [
  { id: 'premium', name: 'Premium-lansering', description: 'Marknadsför Premium-prenumeration' },
  { id: 'features', name: 'Nya funktioner', description: 'Visa upp nya app-funktioner' },
  { id: 'seasonal', name: 'Säsongskampanj', description: 'Jul, påsk, midsommar etc.' },
  { id: 'deals', name: 'Veckans deals', description: 'Visa aktuella erbjudanden' },
  { id: 'recipes', name: 'Recept-highlight', description: 'Lyft fram populära recept' },
]

const tones = [
  { id: 'friendly', name: 'Vänlig & avslappnad' },
  { id: 'professional', name: 'Professionell' },
  { id: 'fun', name: 'Lekfull & kul' },
  { id: 'urgent', name: 'Brådskande & actiondriven' },
]

export default function AdsPage() {
  const [selectedPlatforms, setSelectedPlatforms] = useState(['instagram'])
  const [audience, setAudience] = useState('families')
  const [campaignType, setCampaignType] = useState('premium')
  const [tone, setTone] = useState('friendly')
  const [customPrompt, setCustomPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [generatedContent, setGeneratedContent] = useState(null)
  const [savedAds, setSavedAds] = useState([])
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [activeTab, setActiveTab] = useState('create') // 'create' or 'saved'

  // Load saved ads on mount
  useEffect(() => {
    loadSavedAds()
  }, [])

  async function loadSavedAds() {
    try {
      const res = await fetch('/api/admin/ads')
      const data = await res.json()
      if (data.success) {
        setSavedAds(data.assets || [])
      }
    } catch (err) {
      console.error('Failed to load saved ads:', err)
    }
  }

  async function handleGenerate() {
    setGenerating(true)
    setError(null)
    setSuccessMessage(null)
    try {
      const res = await fetch('/api/admin/ads/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platforms: selectedPlatforms,
          audience,
          campaignType,
          tone,
          customPrompt
        })
      })
      const data = await res.json()
      if (data.success) {
        setGeneratedContent(data.content)
        setSuccessMessage('Innehåll genererat!')
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        setError(data.error || 'Något gick fel vid generering')
      }
    } catch (err) {
      console.error('Generation failed:', err)
      setError('Kunde inte generera innehåll. Försök igen.')
    } finally {
      setGenerating(false)
    }
  }

  async function handleSave() {
    if (!generatedContent) return

    setSaving(true)
    setError(null)
    try {
      const name = `${campaignTypes.find(c => c.id === campaignType)?.name || 'Kampanj'} - ${new Date().toLocaleDateString('sv-SE')}`

      const res = await fetch('/api/admin/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          platform: selectedPlatforms[0],
          content: generatedContent
        })
      })
      const data = await res.json()
      if (data.success) {
        setSuccessMessage('Innehåll sparat!')
        loadSavedAds() // Reload saved ads
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        setError(data.error || 'Kunde inte spara')
      }
    } catch (err) {
      console.error('Save failed:', err)
      setError('Kunde inte spara innehåll')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Är du säker på att du vill ta bort detta innehåll?')) return

    try {
      const res = await fetch(`/api/admin/ads?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setSavedAds(prev => prev.filter(ad => ad.id !== id))
        setSuccessMessage('Borttaget!')
        setTimeout(() => setSuccessMessage(null), 3000)
      }
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  function loadSavedAd(ad) {
    setGeneratedContent({
      caption: ad.content,
      hashtags: ad.metadata?.hashtags || [],
      alternatives: ad.metadata?.alternatives || [],
      imagePrompts: ad.metadata?.imagePrompts || [],
      ctas: ad.metadata?.ctas || [],
      bestPostTime: ad.metadata?.bestPostTime
    })
    setActiveTab('create')
  }

  function togglePlatform(platformId) {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    )
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
    setSuccessMessage('Kopierat!')
    setTimeout(() => setSuccessMessage(null), 2000)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
            <PhotoIcon className="w-6 h-6 text-white" />
          </div>
          AI Ad Studio
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Skapa annonser, sociala media-inlägg och marknadsföringsmaterial med AI
        </p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
          <button onClick={() => setError(null)} className="ml-auto">×</button>
        </div>
      )}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl text-green-700 dark:text-green-400 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {successMessage}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('create')}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            activeTab === 'create'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Skapa nytt
        </button>
        <button
          onClick={() => setActiveTab('saved')}
          className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'saved'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Sparat innehåll
          {savedAds.length > 0 && (
            <span className="px-2 py-0.5 text-xs bg-white/20 rounded-full">{savedAds.length}</span>
          )}
        </button>
      </div>

      {activeTab === 'create' ? (
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Configuration */}
          <div className="space-y-6">
            {/* Platform Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">1. Välj plattformar</h2>
              <div className="grid grid-cols-3 gap-3">
                {platforms.map(platform => {
                  const Icon = platform.Icon
                  return (
                    <button
                      key={platform.id}
                      onClick={() => togglePlatform(platform.id)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        selectedPlatforms.includes(platform.id)
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <Icon className="w-6 h-6 mx-auto mb-1 text-gray-700 dark:text-gray-300" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{platform.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Target Audience */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">2. Målgrupp</h2>
              <div className="space-y-2">
                {targetAudiences.map(aud => (
                  <label
                    key={aud.id}
                    className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      audience === aud.id
                        ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="audience"
                      value={aud.id}
                      checked={audience === aud.id}
                      onChange={(e) => setAudience(e.target.value)}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{aud.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{aud.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Campaign Type */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">3. Kampanjtyp</h2>
              <select
                value={campaignType}
                onChange={(e) => setCampaignType(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {campaignTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name} - {type.description}</option>
                ))}
              </select>
            </div>

            {/* Tone */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">4. Tonalitet</h2>
              <div className="flex flex-wrap gap-2">
                {tones.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTone(t.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      tone === t.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Prompt */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">5. Extra instruktioner (valfritt)</h2>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="T.ex. 'Fokusera på att det är gratis att testa' eller 'Nämn midsommar'"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 resize-none h-24"
              />
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={generating || selectedPlatforms.length === 0}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Genererar innehåll...
                </>
              ) : (
                <>
                  <SparklesIcon className="w-5 h-5" />
                  Generera marknadsföringsmaterial
                </>
              )}
            </button>
          </div>

          {/* Right: Generated Content */}
          <div className="space-y-6">
            {generatedContent ? (
              <>
                {/* Generated Captions */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-gray-900 dark:text-white">Genererade texter</h2>
                    <button
                      onClick={() => copyToClipboard(generatedContent.caption)}
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Kopiera
                    </button>
                  </div>

                  {/* Main Caption */}
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4">
                    <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{generatedContent.caption}</p>
                  </div>

                  {/* Hashtags */}
                  <div className="flex flex-wrap gap-2">
                    {generatedContent.hashtags?.map((tag, i) => (
                      <button
                        key={i}
                        onClick={() => copyToClipboard(tag.startsWith('#') ? tag : `#${tag}`)}
                        className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                      >
                        {tag.startsWith('#') ? tag : `#${tag}`}
                      </button>
                    ))}
                  </div>

                  {/* Best time to post */}
                  {generatedContent.bestPostTime && (
                    <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      <ClockIcon className="w-4 h-4" /> Bästa tid att posta: {generatedContent.bestPostTime}
                    </p>
                  )}
                </div>

                {/* Alt Versions */}
                {generatedContent.alternatives?.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                    <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Alternativa versioner</h2>
                    <div className="space-y-3">
                      {generatedContent.alternatives.map((alt, i) => (
                        <div key={i} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                          <p className="text-sm text-gray-700 dark:text-gray-300">{alt}</p>
                          <button
                            onClick={() => copyToClipboard(alt)}
                            className="text-xs text-blue-600 hover:text-blue-700 mt-2"
                          >
                            Kopiera
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Image Prompts */}
                {generatedContent.imagePrompts?.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                    <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Bildförslag (för AI-bildgenerering)</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      Kopiera dessa prompts till DALL-E, Midjourney eller annan bildgenerator
                    </p>
                    <div className="space-y-3">
                      {generatedContent.imagePrompts.map((prompt, i) => (
                        <div key={i} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                          <p className="text-sm text-gray-700 dark:text-gray-300 font-mono">{prompt}</p>
                          <button
                            onClick={() => copyToClipboard(prompt)}
                            className="text-xs text-blue-600 hover:text-blue-700 mt-2 flex items-center gap-1"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Kopiera prompt
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Call to Action Suggestions */}
                {generatedContent.ctas?.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                    <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Call to Action</h2>
                    <div className="flex flex-wrap gap-2">
                      {generatedContent.ctas.map((cta, i) => (
                        <button
                          key={i}
                          onClick={() => copyToClipboard(cta)}
                          className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-sm font-medium hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                        >
                          {cta}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      <DocumentPlusIcon className="w-5 h-5" />
                    )}
                    Spara innehåll
                  </button>
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <ArrowPathIcon className="w-5 h-5" />
                    Generera ny version
                  </button>
                </div>
              </>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-12 border border-gray-200 dark:border-gray-700 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center">
                  <PhotoIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Redo att skapa innehåll
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Konfigurera dina inställningar och klicka på generera för att skapa marknadsföringsmaterial
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Saved Content Tab */
        <div className="space-y-6">
          {savedAds.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-12 border border-gray-200 dark:border-gray-700 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center">
                <FolderIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Inget sparat innehåll
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Generera och spara innehåll för att se det här
              </p>
              <button
                onClick={() => setActiveTab('create')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Skapa innehåll
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedAds.map(ad => {
                const platform = platforms.find(p => p.id === ad.platform)
                const PlatformIcon = platform?.Icon || PhotoIcon
                return (
                  <div
                    key={ad.id}
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <PlatformIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{ad.platform}</span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(ad.created_at).toLocaleDateString('sv-SE')}
                      </span>
                    </div>

                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-4 mb-4">
                      {ad.content}
                    </p>

                    {ad.metadata?.hashtags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {ad.metadata.hashtags.slice(0, 3).map((tag, i) => (
                          <span key={i} className="text-xs text-blue-600 dark:text-blue-400">
                            {tag.startsWith('#') ? tag : `#${tag}`}
                          </span>
                        ))}
                        {ad.metadata.hashtags.length > 3 && (
                          <span className="text-xs text-gray-400">+{ad.metadata.hashtags.length - 3}</span>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => loadSavedAd(ad)}
                        className="flex-1 py-2 text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                      >
                        Visa
                      </button>
                      <button
                        onClick={() => copyToClipboard(ad.content)}
                        className="flex-1 py-2 text-sm bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      >
                        Kopiera
                      </button>
                      <button
                        onClick={() => handleDelete(ad.id)}
                        className="py-2 px-3 text-sm bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
