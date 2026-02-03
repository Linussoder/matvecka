import { getSessionId } from './supabase-realtime'

/**
 * Track an analytics event
 * @param {string} eventType - Type of event (e.g., 'page_view', 'meal_plan_created')
 * @param {Object} eventData - Additional data for the event
 */
export async function trackEvent(eventType, eventData = {}) {
  if (typeof window === 'undefined') return

  try {
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: eventType,
        event_data: eventData,
        page_url: window.location.pathname,
        session_id: getSessionId()
      })
    })
  } catch (error) {
    console.error('Failed to track event:', error)
  }
}

/**
 * Track a page view
 * @param {string} pageName - Name of the page
 */
export function trackPageView(pageName) {
  trackEvent('page_view', {
    page: pageName || window.location.pathname,
    referrer: document.referrer || null,
    title: document.title
  })
}

/**
 * Track user signup
 * @param {string} userId
 * @param {Object} metadata
 */
export function trackSignup(userId, metadata = {}) {
  trackEvent('user_signup', {
    user_id: userId,
    ...metadata
  })
}

/**
 * Track user login
 * @param {string} userId
 */
export function trackLogin(userId) {
  trackEvent('user_login', {
    user_id: userId
  })
}

/**
 * Track meal plan creation
 * @param {Object} mealPlan
 */
export function trackMealPlanCreated(mealPlan) {
  trackEvent('meal_plan_created', {
    days: mealPlan.days || 7,
    servings: mealPlan.servings || 4,
    preferences: mealPlan.preferences || {}
  })
}

/**
 * Track recipe favorited
 * @param {string} recipeId
 * @param {string} recipeName
 */
export function trackRecipeFavorited(recipeId, recipeName) {
  trackEvent('recipe_favorited', {
    recipe_id: recipeId,
    recipe_name: recipeName
  })
}

/**
 * Track recipe marked as made
 * @param {string} recipeId
 * @param {string} recipeName
 */
export function trackRecipeMade(recipeId, recipeName) {
  trackEvent('recipe_made', {
    recipe_id: recipeId,
    recipe_name: recipeName
  })
}

/**
 * Track premium upgrade
 * @param {string} plan
 * @param {string} billingCycle - 'monthly' or 'annual'
 */
export function trackPremiumUpgrade(plan, billingCycle) {
  trackEvent('premium_upgrade', {
    plan,
    billing_cycle: billingCycle
  })
}

/**
 * Track button click
 * @param {string} buttonName
 * @param {Object} metadata
 */
export function trackButtonClick(buttonName, metadata = {}) {
  trackEvent('button_click', {
    button: buttonName,
    ...metadata
  })
}

/**
 * Track search
 * @param {string} query
 * @param {number} resultCount
 */
export function trackSearch(query, resultCount) {
  trackEvent('search', {
    query,
    result_count: resultCount
  })
}

/**
 * Track error
 * @param {string} errorType
 * @param {string} message
 */
export function trackError(errorType, message) {
  trackEvent('error', {
    type: errorType,
    message
  })
}

// Event type constants for consistency
export const EVENT_TYPES = {
  PAGE_VIEW: 'page_view',
  USER_SIGNUP: 'user_signup',
  USER_LOGIN: 'user_login',
  MEAL_PLAN_CREATED: 'meal_plan_created',
  RECIPE_FAVORITED: 'recipe_favorited',
  RECIPE_MADE: 'recipe_made',
  PREMIUM_UPGRADE: 'premium_upgrade',
  REFERRAL_COMPLETED: 'referral_completed',
  BUTTON_CLICK: 'button_click',
  SEARCH: 'search',
  ERROR: 'error'
}
