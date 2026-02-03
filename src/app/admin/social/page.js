'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  CalendarIcon, ClockIcon, ChartBarIcon, LinkIcon, TrashIcon, PaperAirplaneIcon
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

const PLATFORMS = [
  { id: 'instagram', name: 'Instagram', Icon: InstagramIcon, color: 'bg-pink-500', authUrl: '/api/admin/social/auth/instagram' },
  { id: 'facebook', name: 'Facebook', Icon: FacebookIcon, color: 'bg-blue-600', authUrl: '/api/admin/social/auth/facebook' },
  { id: 'tiktok', name: 'TikTok', Icon: TikTokIcon, color: 'bg-gray-900', authUrl: '/api/admin/social/auth/tiktok' }
]

const STATUS_COLORS = {
  scheduled: 'bg-blue-100 text-blue-700',
  published: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  draft: 'bg-gray-100 text-gray-700'
}

export default function SocialSchedulerPage() {
  const [posts, setPosts] = useState([])
  const [bestTimes, setBestTimes] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showNewPost, setShowNewPost] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState('instagram')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [viewMode, setViewMode] = useState('calendar')
  const [selectedDay, setSelectedDay] = useState(null)
  const [selectedPost, setSelectedPost] = useState(null)
  const [showConnections, setShowConnections] = useState(false)
  const [connections, setConnections] = useState([])

  // Form state
  const [form, setForm] = useState({
    platform: 'instagram',
    caption: '',
    hashtags: '',
    scheduledAt: '',
    scheduledTime: '19:00'
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchPosts()
    fetchBestTimes('instagram')
    fetchConnections()

    // Listen for OAuth popup messages
    const handleMessage = (event) => {
      if (event.data?.type === 'social_auth_success') {
        // Refresh connections when OAuth succeeds
        fetchConnections()
        setShowConnections(false)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/admin/social')
      const data = await res.json()
      if (data.success) {
        setPosts(data.posts || [])
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchBestTimes = async (platform) => {
    try {
      const res = await fetch(`/api/admin/social/best-times?platform=${platform}`)
      const data = await res.json()
      if (data.success) {
        setBestTimes(data)
      }
    } catch (error) {
      console.error('Error fetching best times:', error)
    }
  }

  const fetchConnections = async () => {
    try {
      const res = await fetch('/api/admin/social/connections')
      const data = await res.json()
      if (data.success) {
        setConnections(data.connections || [])
      }
    } catch (error) {
      console.error('Error fetching connections:', error)
    }
  }

  const handlePlatformChange = (platform) => {
    setSelectedPlatform(platform)
    setForm(prev => ({ ...prev, platform }))
    fetchBestTimes(platform)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const scheduledAt = form.scheduledAt && form.scheduledTime
        ? new Date(`${form.scheduledAt}T${form.scheduledTime}`).toISOString()
        : null

      const res = await fetch('/api/admin/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: form.platform,
          caption: form.caption,
          hashtags: form.hashtags ? form.hashtags.split(' ').filter(h => h) : [],
          scheduledAt,
          status: scheduledAt ? 'scheduled' : 'draft'
        })
      })

      const data = await res.json()
      if (data.success) {
        setPosts(prev => [...prev, data.post])
        setShowNewPost(false)
        setForm({
          platform: 'instagram',
          caption: '',
          hashtags: '',
          scheduledAt: '',
          scheduledTime: '19:00'
        })
      }
    } catch (error) {
      console.error('Error creating post:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeletePost = async (id) => {
    if (!confirm('Ta bort detta inlägg?')) return

    try {
      await fetch(`/api/admin/social/${id}`, { method: 'DELETE' })
      setPosts(prev => prev.filter(p => p.id !== id))
      setSelectedPost(null)
      setSelectedDay(null)
    } catch (error) {
      console.error('Error deleting post:', error)
    }
  }

  const handlePublishNow = async (post) => {
    const connection = connections.find(c => c.platform === post.platform && c.status === 'connected')
    if (!connection) {
      alert(`Du måste koppla ditt ${PLATFORMS.find(p => p.id === post.platform)?.name}-konto först`)
      setShowConnections(true)
      return
    }

    try {
      const res = await fetch(`/api/admin/social/${post.id}/publish`, {
        method: 'POST'
      })
      const data = await res.json()
      if (data.success) {
        setPosts(prev => prev.map(p => p.id === post.id ? { ...p, status: 'published', published_at: new Date().toISOString() } : p))
        setSelectedPost(null)
        alert('Inlägget har publicerats!')
      } else {
        alert(data.error || 'Kunde inte publicera inlägget')
      }
    } catch (error) {
      console.error('Error publishing post:', error)
      alert('Ett fel uppstod vid publicering')
    }
  }

  const handleConnect = async (platform) => {
    // Open OAuth popup for the platform
    const width = 600
    const height = 700
    const left = window.screenX + (window.outerWidth - width) / 2
    const top = window.screenY + (window.outerHeight - height) / 2

    const popup = window.open(
      `/api/admin/social/auth/${platform}`,
      `Connect ${platform}`,
      `width=${width},height=${height},left=${left},top=${top}`
    )

    // Listen for OAuth callback
    const checkPopup = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkPopup)
        fetchConnections()
      }
    }, 1000)
  }

  const handleDisconnect = async (platform) => {
    if (!confirm(`Vill du koppla bort ${PLATFORMS.find(p => p.id === platform)?.name}?`)) return

    try {
      const res = await fetch(`/api/admin/social/connections/${platform}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        setConnections(prev => prev.filter(c => c.platform !== platform))
      }
    } catch (error) {
      console.error('Error disconnecting:', error)
    }
  }

  // Calendar helpers
  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()

    const days = []

    for (let i = 0; i < startingDay; i++) {
      const prevDate = new Date(year, month, -startingDay + i + 1)
      days.push({ date: prevDate, isCurrentMonth: false })
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true })
    }

    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false })
    }

    return days
  }

  const getPostsForDate = (date) => {
    return posts.filter(post => {
      if (!post.scheduled_at) return false
      const postDate = new Date(post.scheduled_at)
      return postDate.toDateString() === date.toDateString()
    })
  }

  const days = getDaysInMonth(currentMonth)
  const monthName = currentMonth.toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' })

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() + direction)
      return newDate
    })
  }

  const isToday = (date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const handleDayClick = (day) => {
    const dayPosts = getPostsForDate(day.date)
    if (dayPosts.length > 0) {
      setSelectedDay({ date: day.date, posts: dayPosts })
    } else {
      // Open new post modal with this date pre-selected
      const dateStr = day.date.toISOString().split('T')[0]
      setForm(prev => ({ ...prev, scheduledAt: dateStr }))
      setShowNewPost(true)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="h-96 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              ← Tillbaka
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-green-500 rounded-lg">
                  <CalendarIcon className="w-6 h-6 text-white" />
                </div>
                Social Media Scheduler
              </h1>
              <p className="text-gray-500 text-sm">Planera och schemalägg inlägg</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowConnections(true)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 font-medium flex items-center gap-2"
            >
              <LinkIcon className="w-4 h-4" />
              Konton
              {connections.filter(c => c.status === 'connected').length > 0 && (
                <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                  {connections.filter(c => c.status === 'connected').length}
                </span>
              )}
            </button>
            <div className="flex bg-white rounded-lg border border-gray-200 p-1">
              <button
                type="button"
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  viewMode === 'calendar' ? 'bg-green-500 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <CalendarIcon className="w-4 h-4" />
                Kalender
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  viewMode === 'list' ? 'bg-green-500 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                Lista
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowNewPost(true)}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium"
            >
              + Nytt inlägg
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {viewMode === 'calendar' ? (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Calendar Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <button
                    type="button"
                    onClick={() => navigateMonth(-1)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    ←
                  </button>
                  <h2 className="text-lg font-semibold capitalize">{monthName}</h2>
                  <button
                    type="button"
                    onClick={() => navigateMonth(1)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    →
                  </button>
                </div>

                {/* Day Headers */}
                <div className="grid grid-cols-7 border-b border-gray-200">
                  {['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'].map(day => (
                    <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 bg-gray-50">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7">
                  {days.map((day, index) => {
                    const dayPosts = getPostsForDate(day.date)
                    const hasPosts = dayPosts.length > 0
                    return (
                      <div
                        key={index}
                        onClick={() => handleDayClick(day)}
                        className={`min-h-24 p-2 border-b border-r border-gray-100 cursor-pointer transition-colors
                          ${!day.isCurrentMonth ? 'bg-gray-50' : 'hover:bg-gray-50'}
                          ${isToday(day.date) ? 'bg-green-50 hover:bg-green-100' : ''}
                          ${hasPosts ? 'ring-1 ring-inset ring-green-200' : ''}
                        `}
                      >
                        <div className={`text-sm font-medium mb-1 ${
                          !day.isCurrentMonth ? 'text-gray-400' :
                          isToday(day.date) ? 'text-green-600' : 'text-gray-700'
                        }`}>
                          {day.date.getDate()}
                        </div>
                        <div className="space-y-1">
                          {dayPosts.slice(0, 3).map(post => {
                            const platform = PLATFORMS.find(p => p.id === post.platform)
                            return (
                              <div
                                key={post.id}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedPost(post)
                                }}
                                className={`text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 ${platform?.color || 'bg-gray-500'} text-white`}
                                title={post.caption}
                              >
                                {platform?.Icon && <platform.Icon className="w-4 h-4" />} {new Date(post.scheduled_at).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )
                          })}
                          {dayPosts.length > 3 && (
                            <div className="text-xs text-gray-500 text-center">
                              +{dayPosts.length - 3} till
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              /* List View */
              <div className="bg-white rounded-xl border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="font-semibold text-gray-900">Schemalagda inlägg</h2>
                </div>
                <div className="divide-y divide-gray-100">
                  {posts.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <p>Inga inlägg schemalagda än</p>
                      <button
                        type="button"
                        onClick={() => setShowNewPost(true)}
                        className="mt-2 text-green-600 hover:underline"
                      >
                        Skapa ditt första inlägg
                      </button>
                    </div>
                  ) : (
                    posts.map(post => {
                      const platform = PLATFORMS.find(p => p.id === post.platform)
                      return (
                        <div
                          key={post.id}
                          onClick={() => setSelectedPost(post)}
                          className="p-4 hover:bg-gray-50 flex items-start gap-4 cursor-pointer"
                        >
                          <div className={`w-10 h-10 rounded-lg ${platform?.color || 'bg-gray-500'} flex items-center justify-center text-xl text-white`}>
                            {platform?.Icon && <platform.Icon className="w-4 h-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-900">{platform?.name}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[post.status] || STATUS_COLORS.draft}`}>
                                {post.status === 'scheduled' ? 'Schemalagd' :
                                 post.status === 'published' ? 'Publicerad' :
                                 post.status === 'failed' ? 'Misslyckades' : 'Utkast'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2">{post.caption}</p>
                            {post.scheduled_at && (
                              <p className="text-xs text-gray-400 mt-1">
                                <CalendarIcon className="w-3 h-3 inline mr-1" />{new Date(post.scheduled_at).toLocaleDateString('sv-SE', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeletePost(post.id)
                            }}
                            className="text-red-500 hover:text-red-700 p-2"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Connected Accounts Quick View */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" />
                  Kopplade konton
                </h3>
                <button
                  type="button"
                  onClick={() => setShowConnections(true)}
                  className="text-xs text-green-600 hover:underline"
                >
                  Hantera
                </button>
              </div>
              <div className="space-y-2">
                {PLATFORMS.map(platform => {
                  const connection = connections.find(c => c.platform === platform.id)
                  const isConnected = connection?.status === 'connected'
                  const PlatformIcon = platform.Icon
                  return (
                    <div key={platform.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <PlatformIcon className="w-5 h-5 text-gray-700" />
                        <span className="text-sm font-medium">{platform.name}</span>
                      </div>
                      {isConnected ? (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          Kopplad
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleConnect(platform.id)}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Koppla
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Platform Selection */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Plattform</h3>
              <div className="space-y-2">
                {PLATFORMS.map(platform => {
                  const PlatformIcon = platform.Icon
                  return (
                    <button
                      key={platform.id}
                      type="button"
                      onClick={() => handlePlatformChange(platform.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        selectedPlatform === platform.id
                          ? 'bg-green-50 border-2 border-green-500'
                          : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                      }`}
                    >
                      <PlatformIcon className="w-6 h-6 text-gray-700" />
                      <span className="font-medium">{platform.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Best Posting Times */}
            {bestTimes && (
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <ClockIcon className="w-4 h-4" />
                  Bästa tiderna för {PLATFORMS.find(p => p.id === selectedPlatform)?.name}
                </h3>

                <div className="space-y-4">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-xs text-green-600 font-medium mb-1">Nästa rekommenderade tid</p>
                    <p className="text-lg font-bold text-green-700">
                      {bestTimes.nextRecommendedTime?.time}
                    </p>
                    <p className="text-xs text-green-600">
                      {bestTimes.nextRecommendedTime?.reason}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">
                      {bestTimes.isWeekend ? 'Helgtider' : 'Vardagstider'}
                    </p>
                    <div className="space-y-2">
                      {bestTimes.timesToday?.map((time, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">{time.time}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-500"
                                style={{ width: `${time.score}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-500">{time.score}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <ChartBarIcon className="w-4 h-4" />
                Statistik
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Totalt inlägg</span>
                  <span className="font-medium">{posts.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Schemalagda</span>
                  <span className="font-medium">{posts.filter(p => p.status === 'scheduled').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Publicerade</span>
                  <span className="font-medium">{posts.filter(p => p.status === 'published').length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Day Posts Modal */}
        {selectedDay && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">
                    <CalendarIcon className="w-5 h-5 inline mr-1" />{selectedDay.date.toLocaleDateString('sv-SE', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long'
                    })}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setSelectedDay(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedDay.posts.length} inlägg schemalagda
                </p>
              </div>

              <div className="p-6 space-y-4">
                {selectedDay.posts.map(post => {
                  const platform = PLATFORMS.find(p => p.id === post.platform)
                  return (
                    <div
                      key={post.id}
                      className="p-4 bg-gray-50 rounded-xl"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-lg ${platform?.color || 'bg-gray-500'} flex items-center justify-center text-xl text-white`}>
                          {platform?.Icon && <platform.Icon className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{platform?.name}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(post.scheduled_at).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[post.status]}`}>
                          {post.status === 'scheduled' ? 'Schemalagd' :
                           post.status === 'published' ? 'Publicerad' :
                           post.status === 'failed' ? 'Misslyckades' : 'Utkast'}
                        </span>
                      </div>

                      <p className="text-sm text-gray-700 mb-3">{post.caption}</p>

                      {post.hashtags && post.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {post.hashtags.map((tag, i) => (
                            <span key={i} className="text-xs text-blue-600">
                              {tag.startsWith('#') ? tag : `#${tag}`}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-2">
                        {post.status === 'scheduled' && (
                          <button
                            type="button"
                            onClick={() => handlePublishNow(post)}
                            className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600"
                          >
                            Publicera nu
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPost(post)
                            setSelectedDay(null)
                          }}
                          className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300"
                        >
                          Visa detaljer
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePost(post.id)}
                          className="px-3 py-2 bg-red-100 text-red-600 rounded-lg text-sm font-medium hover:bg-red-200"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}

                <button
                  type="button"
                  onClick={() => {
                    const dateStr = selectedDay.date.toISOString().split('T')[0]
                    setForm(prev => ({ ...prev, scheduledAt: dateStr }))
                    setSelectedDay(null)
                    setShowNewPost(true)
                  }}
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-green-500 hover:text-green-600 transition-colors"
                >
                  + Lägg till inlägg för denna dag
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Post Detail Modal */}
        {selectedPost && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Inläggsdetaljer</h2>
                  <button
                    type="button"
                    onClick={() => setSelectedPost(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {/* Platform & Status */}
                <div className="flex items-center gap-3">
                  {(() => {
                    const platform = PLATFORMS.find(p => p.id === selectedPost.platform)
                    return (
                      <>
                        <div className={`w-12 h-12 rounded-lg ${platform?.color || 'bg-gray-500'} flex items-center justify-center text-2xl text-white`}>
                          {platform?.Icon && <platform.Icon className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{platform?.name}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[selectedPost.status]}`}>
                            {selectedPost.status === 'scheduled' ? 'Schemalagd' :
                             selectedPost.status === 'published' ? 'Publicerad' :
                             selectedPost.status === 'failed' ? 'Misslyckades' : 'Utkast'}
                          </span>
                        </div>
                      </>
                    )
                  })()}
                </div>

                {/* Schedule Info */}
                {selectedPost.scheduled_at && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Schemalagd för</p>
                    <p className="font-medium text-gray-900">
                      {new Date(selectedPost.scheduled_at).toLocaleDateString('sv-SE', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}

                {/* Caption */}
                <div>
                  <p className="text-xs text-gray-500 mb-1">Bildtext</p>
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedPost.caption}</p>
                </div>

                {/* Hashtags */}
                {selectedPost.hashtags && selectedPost.hashtags.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Hashtags</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedPost.hashtags.map((tag, i) => (
                        <span key={i} className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
                          {tag.startsWith('#') ? tag : `#${tag}`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  {selectedPost.status === 'scheduled' && (
                    <button
                      type="button"
                      onClick={() => handlePublishNow(selectedPost)}
                      className="flex-1 px-4 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600"
                    >
                      <PaperAirplaneIcon className="w-4 h-4" /> Publicera nu
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDeletePost(selectedPost.id)}
                    className="px-4 py-3 bg-red-100 text-red-600 rounded-lg font-medium hover:bg-red-200"
                  >
                    <TrashIcon className="w-4 h-4" /> Ta bort
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Connections Modal */}
        {showConnections && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900"><LinkIcon className="w-5 h-5" /> Anslutna konton</h2>
                  <button
                    type="button"
                    onClick={() => setShowConnections(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Koppla dina sociala medier för att publicera direkt
                </p>
              </div>

              <div className="p-6 space-y-4">
                {PLATFORMS.map(platform => {
                  const connection = connections.find(c => c.platform === platform.id)
                  const isConnected = connection?.status === 'connected'
                  const PlatformIcon = platform.Icon

                  return (
                    <div key={platform.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-lg ${platform.color} flex items-center justify-center text-white`}>
                          <PlatformIcon className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{platform.name}</p>
                          {isConnected ? (
                            <p className="text-sm text-green-600 flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                              </svg>
                              Ansluten som @{connection.username || 'användare'}
                            </p>
                          ) : (
                            <p className="text-sm text-gray-500">
                              Ej ansluten
                            </p>
                          )}
                        </div>
                      </div>

                      {isConnected ? (
                        <button
                          type="button"
                          onClick={() => handleDisconnect(platform.id)}
                          className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"
                        >
                          Koppla bort
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleConnect(platform.id)}
                          className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                        >
                          Anslut
                        </button>
                      )}
                    </div>
                  )
                })}

                <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                  <p className="text-sm text-blue-800 font-medium mb-2"><svg className="w-4 h-4 inline" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" /></svg> Tips</p>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Instagram kräver ett Business- eller Creator-konto</li>
                    <li>• Facebook kräver admin-åtkomst till en sida</li>
                    <li>• TikTok kräver ett Creator-konto</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* New Post Modal */}
        {showNewPost && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Nytt inlägg</h2>
                  <button
                    type="button"
                    onClick={() => setShowNewPost(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Platform */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plattform
                  </label>
                  <div className="flex gap-2">
                    {PLATFORMS.map(platform => {
                      const connection = connections.find(c => c.platform === platform.id)
                      const isConnected = connection?.status === 'connected'
                      const PlatformIcon = platform.Icon
                      return (
                        <button
                          key={platform.id}
                          type="button"
                          onClick={() => setForm(prev => ({ ...prev, platform: platform.id }))}
                          className={`flex-1 p-3 rounded-lg border-2 transition-colors relative ${
                            form.platform === platform.id
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <PlatformIcon className="w-6 h-6 mx-auto text-gray-700" />
                          <p className="text-xs mt-1">{platform.name}</p>
                          {isConnected && (
                            <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full"></span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                  {!connections.find(c => c.platform === form.platform && c.status === 'connected') && (
                    <p className="text-xs text-amber-600 mt-2">
                      <svg className="w-4 h-4 inline text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg> Detta konto är inte anslutet. Du kan spara som utkast och publicera senare.
                    </p>
                  )}
                </div>

                {/* Caption */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bildtext
                  </label>
                  <textarea
                    value={form.caption}
                    onChange={(e) => setForm(prev => ({ ...prev, caption: e.target.value }))}
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
                    placeholder="Skriv din bildtext här..."
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">{form.caption.length} tecken</p>
                </div>

                {/* Hashtags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hashtags
                  </label>
                  <input
                    type="text"
                    value={form.hashtags}
                    onChange={(e) => setForm(prev => ({ ...prev, hashtags: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
                    placeholder="#matvecka #matplanering #recept"
                  />
                </div>

                {/* Schedule */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Datum
                    </label>
                    <input
                      type="date"
                      value={form.scheduledAt}
                      onChange={(e) => setForm(prev => ({ ...prev, scheduledAt: e.target.value }))}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tid
                    </label>
                    <select
                      value={form.scheduledTime}
                      onChange={(e) => setForm(prev => ({ ...prev, scheduledTime: e.target.value }))}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
                    >
                      {bestTimes?.timesToday?.map(time => (
                        <option key={time.time} value={time.time}>
                          {time.time} - {time.reason} ({time.score}%)
                        </option>
                      ))}
                      <option value="08:00">08:00</option>
                      <option value="10:00">10:00</option>
                      <option value="12:00">12:00</option>
                      <option value="14:00">14:00</option>
                      <option value="16:00">16:00</option>
                      <option value="18:00">18:00</option>
                      <option value="20:00">20:00</option>
                    </select>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowNewPost(false)}
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Avbryt
                  </button>
                  <button
                    type="submit"
                    disabled={saving || !form.caption}
                    className="flex-1 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium disabled:opacity-50"
                  >
                    {saving ? 'Sparar...' : form.scheduledAt ? 'Schemalägg' : 'Spara som utkast'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
