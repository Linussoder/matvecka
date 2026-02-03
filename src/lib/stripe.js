import Stripe from 'stripe'

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
})

// Pricing configuration
export const PLANS = {
  free: {
    name: 'Gratis',
    price: 0,
    limits: {
      mealPlansPerMonth: 3,
      recipeRegensPerMonth: 5,
      maxFavorites: 20,
      maxDaysPerPlan: 7,
      maxFamilyMembers: 0, // Family profiles not available
    },
    features: [
      '3 veckomenyer per månad',
      '5 receptbyten per månad',
      '20 favoritrecept',
      'Alla butiker',
      'Full receptkatalog',
    ],
  },
  premium: {
    name: 'Premium',
    priceMonthly: 59,
    priceYearly: 499,
    stripePriceIdMonthly: process.env.STRIPE_PRICE_ID_MONTHLY,
    stripePriceIdYearly: process.env.STRIPE_PRICE_ID_YEARLY,
    trialDays: 7,
    limits: {
      mealPlansPerMonth: Infinity,
      recipeRegensPerMonth: Infinity,
      maxFavorites: Infinity,
      maxDaysPerPlan: 14,
      maxFamilyMembers: 10, // Up to 10 family members
    },
    features: [
      'Obegränsade veckomenyer',
      'Obegränsade receptbyten',
      'Obegränsade favoriter',
      'Upp till 14 dagars planering',
      'Familjeprofiler (upp till 10 personer)',
      'PDF-export',
      'Näringsspårning',
      'Receptimport från URL',
      'Smart skafferi',
      'Prioriterad AI',
      'E-postsupport',
    ],
  },
}

// Check if a user has reached their limit
export function hasReachedLimit(usage, plan, limitType) {
  const limits = PLANS[plan]?.limits || PLANS.free.limits
  const limit = limits[limitType]

  if (limit === Infinity) return false

  switch (limitType) {
    case 'mealPlansPerMonth':
      return (usage?.meal_plans_generated || 0) >= limit
    case 'recipeRegensPerMonth':
      return (usage?.recipes_regenerated || 0) >= limit
    case 'maxFavorites':
      return (usage?.favorites_count || 0) >= limit
    default:
      return false
  }
}

// Get remaining usage
export function getRemainingUsage(usage, plan) {
  const limits = PLANS[plan]?.limits || PLANS.free.limits

  return {
    mealPlans: limits.mealPlansPerMonth === Infinity
      ? 'Obegränsat'
      : Math.max(0, limits.mealPlansPerMonth - (usage?.meal_plans_generated || 0)),
    recipeRegens: limits.recipeRegensPerMonth === Infinity
      ? 'Obegränsat'
      : Math.max(0, limits.recipeRegensPerMonth - (usage?.recipes_regenerated || 0)),
    favorites: limits.maxFavorites === Infinity
      ? 'Obegränsat'
      : Math.max(0, limits.maxFavorites - (usage?.favorites_count || 0)),
  }
}
