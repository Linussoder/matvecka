import { createClient } from '@supabase/supabase-js'

// Create a separate client for realtime subscriptions
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let realtimeClient = null

function getRealtimeClient() {
  if (!realtimeClient && supabaseUrl && supabaseAnonKey) {
    realtimeClient = createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })
  }
  return realtimeClient
}

/**
 * Subscribe to real-time analytics events
 * @param {Function} onEvent - Callback when new event arrives
 * @returns {Object} - Subscription object with unsubscribe method
 */
export function subscribeToAnalytics(onEvent) {
  const client = getRealtimeClient()
  if (!client) {
    console.warn('Supabase realtime client not initialized')
    return { unsubscribe: () => {} }
  }

  const channel = client
    .channel('admin-analytics-realtime')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'analytics_events' },
      (payload) => {
        onEvent({
          type: 'analytics_event',
          event: payload.new.event_type,
          data: payload.new.event_data,
          userId: payload.new.user_id,
          timestamp: payload.new.created_at
        })
      }
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'meal_plans' },
      (payload) => {
        onEvent({
          type: 'meal_plan_created',
          data: payload.new,
          userId: payload.new.user_id,
          timestamp: payload.new.created_at
        })
      }
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'user_subscriptions' },
      (payload) => {
        if (payload.new.plan === 'premium') {
          onEvent({
            type: 'premium_upgrade',
            data: payload.new,
            userId: payload.new.user_id,
            timestamp: payload.new.created_at
          })
        }
      }
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'user_subscriptions' },
      (payload) => {
        if (payload.new.status === 'cancelled' && payload.old.status !== 'cancelled') {
          onEvent({
            type: 'subscription_cancelled',
            data: payload.new,
            userId: payload.new.user_id,
            timestamp: new Date().toISOString()
          })
        }
      }
    )
    .subscribe()

  return {
    unsubscribe: () => {
      client.removeChannel(channel)
    }
  }
}

/**
 * Subscribe to user activity for the activity feed
 * @param {Function} onActivity - Callback for each activity
 * @param {Object} options - Filter options
 * @returns {Object} - Subscription with unsubscribe method
 */
export function subscribeToActivityFeed(onActivity, options = {}) {
  const client = getRealtimeClient()
  if (!client) {
    console.warn('Supabase realtime client not initialized')
    return { unsubscribe: () => {} }
  }

  const channel = client
    .channel('admin-activity-feed')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'analytics_events' },
      (payload) => {
        const event = payload.new

        // Filter by event types if specified
        if (options.eventTypes && !options.eventTypes.includes(event.event_type)) {
          return
        }

        onActivity({
          id: event.id,
          type: event.event_type,
          data: event.event_data,
          userId: event.user_id,
          sessionId: event.session_id,
          pageUrl: event.page_url,
          timestamp: event.created_at
        })
      }
    )
    .subscribe()

  return {
    unsubscribe: () => {
      client.removeChannel(channel)
    }
  }
}

/**
 * Get a unique session ID for tracking
 * @returns {string}
 */
export function getSessionId() {
  if (typeof window === 'undefined') return null

  let sessionId = sessionStorage.getItem('analytics_session_id')
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    sessionStorage.setItem('analytics_session_id', sessionId)
  }
  return sessionId
}

/**
 * Format event for display in activity feed
 * @param {Object} event
 * @returns {Object}
 */
export function formatActivityEvent(event) {
  const eventLabels = {
    user_signup: { label: 'Ny registrering', icon: 'UserPlusIcon', color: 'emerald' },
    user_login: { label: 'Inloggning', icon: 'ArrowRightOnRectangleIcon', color: 'blue' },
    meal_plan_created: { label: 'Ny matplan', icon: 'ClipboardDocumentListIcon', color: 'violet' },
    recipe_favorited: { label: 'Recept sparat', icon: 'HeartIcon', color: 'pink' },
    recipe_made: { label: 'Recept tillagat', icon: 'CheckCircleIcon', color: 'green' },
    premium_upgrade: { label: 'Premium-uppgradering', icon: 'SparklesIcon', color: 'amber' },
    referral_completed: { label: 'Värvning slutförd', icon: 'UserGroupIcon', color: 'cyan' },
    page_view: { label: 'Sidvisning', icon: 'EyeIcon', color: 'slate' },
    subscription_cancelled: { label: 'Prenumeration avslutad', icon: 'XCircleIcon', color: 'red' }
  }

  const info = eventLabels[event.type] || { label: event.type, icon: 'BoltIcon', color: 'slate' }

  return {
    ...event,
    label: info.label,
    icon: info.icon,
    color: info.color,
    timeAgo: getTimeAgo(new Date(event.timestamp))
  }
}

/**
 * Get human-readable time ago string
 * @param {Date} date
 * @returns {string}
 */
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000)

  if (seconds < 5) return 'Just nu'
  if (seconds < 60) return `${seconds} sekunder sedan`

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} minut${minutes === 1 ? '' : 'er'} sedan`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} timm${hours === 1 ? 'e' : 'ar'} sedan`

  const days = Math.floor(hours / 24)
  return `${days} dag${days === 1 ? '' : 'ar'} sedan`
}
