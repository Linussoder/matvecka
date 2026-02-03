'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  PencilSquareIcon, PlusIcon, TrashIcon, XMarkIcon,
  CalendarIcon, ChevronRightIcon, EyeIcon
} from '@/components/admin/Icons'

export default function AdminBlogPage() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [needsSetup, setNeedsSetup] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingPost, setEditingPost] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchPosts()
  }, [filter])

  async function fetchPosts() {
    setLoading(true)
    try {
      const url = filter === 'all'
        ? '/api/admin/calendar/blog'
        : `/api/admin/calendar/blog?status=${filter}`
      const response = await fetch(url)
      const data = await response.json()
      if (data.success) {
        setPosts(data.posts || [])
        setNeedsSetup(data.needsSetup)
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Kunde inte ladda bloggposter')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(post) {
    try {
      const method = post.id ? 'PATCH' : 'POST'
      const response = await fetch('/api/admin/calendar/blog', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(post),
      })
      const data = await response.json()
      if (data.success) {
        setShowForm(false)
        setEditingPost(null)
        fetchPosts()
      } else {
        alert(data.error)
      }
    } catch (err) {
      alert('Kunde inte spara')
    }
  }

  async function handleDelete(id) {
    if (!confirm('Är du säker på att du vill ta bort detta inlägg?')) return
    try {
      const response = await fetch('/api/admin/calendar/blog', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (response.ok) {
        fetchPosts()
      }
    } catch (err) {
      alert('Kunde inte ta bort')
    }
  }

  async function handlePublish(id) {
    try {
      const response = await fetch('/api/admin/calendar/blog', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status: 'published',
          published_at: new Date().toISOString()
        }),
      })
      if (response.ok) {
        fetchPosts()
      }
    } catch (err) {
      alert('Kunde inte publicera')
    }
  }

  const statusLabels = {
    draft: 'Utkast',
    scheduled: 'Schemalagd',
    published: 'Publicerad',
    archived: 'Arkiverad'
  }

  const statusColors = {
    draft: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
    scheduled: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400',
    published: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400',
    archived: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400'
  }

  const categoryLabels = {
    tips: 'Tips',
    recipes: 'Recept',
    news: 'Nyheter',
    guides: 'Guider',
    announcements: 'Meddelanden'
  }

  if (loading && posts.length === 0) {
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
            Bloggtabellen finns inte ännu. Kör migrationsfilen i Supabase.
          </p>
          <button
            onClick={fetchPosts}
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
        <span className="text-gray-900 dark:text-white">Blogg</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bloggposter</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Hantera och schemalägg blogginnehåll
          </p>
        </div>
        <button
          onClick={() => {
            setEditingPost({
              status: 'draft',
              category: 'tips'
            })
            setShowForm(true)
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Nytt inlägg
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        {['all', 'draft', 'scheduled', 'published', 'archived'].map(status => (
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

      {/* Posts List */}
      <div className="space-y-4">
        {posts.length > 0 ? (
          posts.map(post => (
            <div
              key={post.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div className="flex items-stretch">
                {post.featured_image_url && (
                  <div
                    className="w-48 bg-cover bg-center"
                    style={{ backgroundImage: `url(${post.featured_image_url})` }}
                  />
                )}
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{post.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 text-xs rounded-full ${statusColors[post.status]}`}>
                          {statusLabels[post.status]}
                        </span>
                        {post.category && (
                          <span className="px-2 py-0.5 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full">
                            {categoryLabels[post.category]}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {post.excerpt && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {post.excerpt}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    {post.author && <span>Av {post.author}</span>}
                    {post.read_time_minutes && <span>{post.read_time_minutes} min läsning</span>}
                    {post.published_at && (
                      <span>Publicerad {new Date(post.published_at).toLocaleDateString('sv-SE')}</span>
                    )}
                    {post.scheduled_at && post.status === 'scheduled' && (
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="w-3 h-3" />
                        Schemalagd {new Date(post.scheduled_at).toLocaleDateString('sv-SE')}
                      </span>
                    )}
                    {post.view_count > 0 && (
                      <span className="flex items-center gap-1">
                        <EyeIcon className="w-3 h-3" />
                        {post.view_count} visningar
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col justify-center gap-1 px-4 border-l border-gray-200 dark:border-gray-700">
                  {post.status === 'draft' && (
                    <button
                      onClick={() => handlePublish(post.id)}
                      className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded transition-colors"
                      title="Publicera"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setEditingPost(post)
                      setShowForm(true)
                    }}
                    className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                    title="Redigera"
                  >
                    <PencilSquareIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                    title="Ta bort"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
            <PencilSquareIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Inga bloggposter ännu</p>
          </div>
        )}
      </div>

      {/* Blog Post Form Modal */}
      {showForm && editingPost && (
        <BlogPostFormModal
          post={editingPost}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false)
            setEditingPost(null)
          }}
        />
      )}
    </div>
  )
}

function BlogPostFormModal({ post, onSave, onClose }) {
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featured_image_url: '',
    author: '',
    category: 'tips',
    tags: [],
    status: 'draft',
    scheduled_at: '',
    seo_title: '',
    seo_description: '',
    read_time_minutes: null,
    ...post
  })
  const [tagInput, setTagInput] = useState('')

  function generateSlug(title) {
    return title.toLowerCase()
      .replace(/å/g, 'a').replace(/ä/g, 'a').replace(/ö/g, 'o')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  function estimateReadTime(content) {
    const wordsPerMinute = 200
    const wordCount = content.split(/\s+/).length
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute))
  }

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
    const dataToSave = {
      ...formData,
      slug: formData.slug || generateSlug(formData.title),
      read_time_minutes: formData.content ? estimateReadTime(formData.content) : null
    }
    onSave(dataToSave)
  }

  const categories = [
    { id: 'tips', label: 'Tips' },
    { id: 'recipes', label: 'Recept' },
    { id: 'news', label: 'Nyheter' },
    { id: 'guides', label: 'Guider' },
    { id: 'announcements', label: 'Meddelanden' },
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            {post.id ? 'Redigera inlägg' : 'Nytt inlägg'}
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
              onChange={(e) => setFormData({
                ...formData,
                title: e.target.value,
                slug: formData.slug || generateSlug(e.target.value)
              })}
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
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
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Författare
              </label>
              <input
                type="text"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Kategori
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
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
                <option value="archived">Arkiverad</option>
              </select>
            </div>
          </div>

          {formData.status === 'scheduled' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Publiceras
              </label>
              <input
                type="datetime-local"
                value={formData.scheduled_at ? formData.scheduled_at.slice(0, 16) : ''}
                onChange={(e) => setFormData({
                  ...formData,
                  scheduled_at: e.target.value ? new Date(e.target.value).toISOString() : ''
                })}
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Utdrag
            </label>
            <textarea
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              placeholder="Kort sammanfattning som visas i listor..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Innehåll
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={10}
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white font-mono text-sm"
              placeholder="Skriv innehållet här (stöder Markdown)..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Utvald bild URL
            </label>
            <input
              type="url"
              value={formData.featured_image_url}
              onChange={(e) => setFormData({ ...formData, featured_image_url: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              placeholder="https://..."
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

          {/* SEO Section */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">SEO</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                  SEO-titel
                </label>
                <input
                  type="text"
                  value={formData.seo_title}
                  onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  placeholder={formData.title}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Meta-beskrivning
                </label>
                <textarea
                  value={formData.seo_description}
                  onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  placeholder={formData.excerpt}
                />
              </div>
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
              {post.id ? 'Spara' : 'Skapa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
