import { createClient } from '@supabase/supabase-js'
import { PLANS, hasReachedLimit } from './stripe'
import { getPremiumCredits } from './referral'

// Server-side Supabase client with service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/**
 * Get user's subscription and usage data
 */
export async function getUserSubscription(userId) {
  if (!userId) return { plan: 'free', status: 'active', usage: null }

  // Get subscription
  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single()

  // Get current month's usage
  const currentMonth = new Date().toISOString().slice(0, 7) + '-01'
  const { data: usage } = await supabase
    .from('usage_tracking')
    .select('*')
    .eq('user_id', userId)
    .eq('period_start', currentMonth)
    .single()

  // Determine effective plan
  let plan = 'free'
  let status = 'active'
  let premiumCredits = null

  if (subscription) {
    const isPremiumActive =
      subscription.plan === 'premium' &&
      ['active', 'trialing'].includes(subscription.status) &&
      (!subscription.current_period_end || new Date(subscription.current_period_end) > new Date())

    if (isPremiumActive) {
      plan = 'premium'
      status = subscription.status
    }
  }

  // Check premium credits if not already premium via Stripe
  if (plan !== 'premium') {
    premiumCredits = await getPremiumCredits(userId)
    if (premiumCredits.hasCredits) {
      plan = 'premium'
      status = 'credit' // New status type for credit-based premium
    }
  }

  return {
    plan,
    status,
    subscription,
    usage: usage || {
      meal_plans_generated: 0,
      recipes_regenerated: 0,
      favorites_count: 0,
    },
    premiumCredits, // Include credits info in response
  }
}

/**
 * Check if user can perform an action based on their plan limits
 */
export async function canPerformAction(userId, action) {
  const { plan, usage } = await getUserSubscription(userId)

  // Handle family member action separately (count-based, not usage-based)
  if (action === 'add_family_member') {
    return await checkFamilyMemberLimit(userId, plan)
  }

  // Premium-only features
  const premiumOnlyFeatures = ['use_pantry', 'use_leftovers', 'export_nutrition']
  if (premiumOnlyFeatures.includes(action)) {
    if (plan !== 'premium') {
      const featureNames = {
        'use_pantry': 'Skafferiet',
        'use_leftovers': 'Restsförslag',
        'export_nutrition': 'Exportera näringsvärden'
      }
      return {
        allowed: false,
        reason: `${featureNames[action] || action} är endast tillgängligt för Premium-användare`,
        upgradePath: '/pricing'
      }
    }
    return { allowed: true }
  }

  // Template limit check (free: 3, premium: unlimited)
  if (action === 'create_template') {
    return await checkTemplateLimit(userId, plan)
  }

  const actionToLimit = {
    'create_meal_plan': 'mealPlansPerMonth',
    'regenerate_recipe': 'recipeRegensPerMonth',
    'add_favorite': 'maxFavorites',
  }

  const limitType = actionToLimit[action]
  if (!limitType) return { allowed: true }

  const reached = hasReachedLimit(usage, plan, limitType)

  if (reached) {
    const limits = PLANS[plan]?.limits || PLANS.free.limits
    return {
      allowed: false,
      reason: `Du har nått din månadsgräns för ${action === 'create_meal_plan' ? 'veckomenyer' : action === 'regenerate_recipe' ? 'receptbyten' : 'favoriter'}`,
      limit: limits[limitType],
      used: usage[limitType === 'mealPlansPerMonth' ? 'meal_plans_generated' : limitType === 'recipeRegensPerMonth' ? 'recipes_regenerated' : 'favorites_count'],
      upgradePath: plan === 'free' ? '/pricing' : null,
    }
  }

  return { allowed: true }
}

/**
 * Check if user can add more family members
 */
async function checkFamilyMemberLimit(userId, plan) {
  const limits = PLANS[plan]?.limits || PLANS.free.limits
  const maxMembers = limits.maxFamilyMembers

  // Free plan doesn't have access to family profiles
  if (maxMembers === 0) {
    return {
      allowed: false,
      reason: 'Familjeprofiler är endast tillgängligt för Premium-användare',
      limit: 0,
      used: 0,
      upgradePath: '/pricing',
    }
  }

  // Get current family member count
  const { data: household } = await supabase
    .from('households')
    .select('id')
    .eq('owner_id', userId)
    .single()

  if (!household) {
    // No household yet, can add first member
    return { allowed: true }
  }

  const { count } = await supabase
    .from('family_members')
    .select('*', { count: 'exact', head: true })
    .eq('household_id', household.id)

  const currentCount = count || 0

  if (currentCount >= maxMembers) {
    return {
      allowed: false,
      reason: `Du har nått maxgränsen på ${maxMembers} familjemedlemmar`,
      limit: maxMembers,
      used: currentCount,
      upgradePath: null, // Already premium
    }
  }

  return { allowed: true }
}

/**
 * Check if user can create more templates
 */
async function checkTemplateLimit(userId, plan) {
  // Premium users have unlimited templates
  if (plan === 'premium') {
    return { allowed: true }
  }

  // Free users limited to 3 templates
  const maxTemplates = 3

  const { count } = await supabase
    .from('meal_plan_templates')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  const currentCount = count || 0

  if (currentCount >= maxTemplates) {
    return {
      allowed: false,
      reason: `Du har nått maxgränsen på ${maxTemplates} mallar. Uppgradera till Premium för obegränsat antal.`,
      limit: maxTemplates,
      used: currentCount,
      upgradePath: '/pricing'
    }
  }

  return { allowed: true }
}

/**
 * Increment usage counter
 */
export async function incrementUsage(userId, action) {
  const currentMonth = new Date().toISOString().slice(0, 7) + '-01'

  const columnMap = {
    'create_meal_plan': 'meal_plans_generated',
    'regenerate_recipe': 'recipes_regenerated',
    'add_favorite': 'favorites_count',
  }

  const column = columnMap[action]
  if (!column) return

  // Upsert usage record
  const { data: existing } = await supabase
    .from('usage_tracking')
    .select('*')
    .eq('user_id', userId)
    .eq('period_start', currentMonth)
    .single()

  if (existing) {
    await supabase
      .from('usage_tracking')
      .update({ [column]: existing[column] + 1 })
      .eq('id', existing.id)
  } else {
    await supabase
      .from('usage_tracking')
      .insert({
        user_id: userId,
        period_start: currentMonth,
        [column]: 1,
      })
  }
}

/**
 * Create or update subscription record from Stripe webhook
 */
export async function upsertSubscription(userId, stripeData) {
  const {
    customerId,
    subscriptionId,
    status,
    plan,
    currentPeriodStart,
    currentPeriodEnd,
    cancelAtPeriodEnd,
    trialEnd,
  } = stripeData

  const { data, error } = await supabase
    .from('user_subscriptions')
    .upsert({
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      status,
      plan,
      current_period_start: currentPeriodStart,
      current_period_end: currentPeriodEnd,
      cancel_at_period_end: cancelAtPeriodEnd,
      trial_end: trialEnd,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    })

  if (error) {
    console.error('Error upserting subscription:', error)
    throw error
  }

  return data
}

/**
 * Get Stripe customer ID for a user, create if doesn't exist
 */
export async function getOrCreateStripeCustomer(userId, email) {
  // Check existing subscription record
  const { data: existing } = await supabase
    .from('user_subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .single()

  if (existing?.stripe_customer_id) {
    return existing.stripe_customer_id
  }

  // Import stripe here to avoid circular dependency
  const { stripe } = await import('./stripe')

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    metadata: {
      user_id: userId,
    },
  })

  // Save customer ID
  await supabase
    .from('user_subscriptions')
    .upsert({
      user_id: userId,
      stripe_customer_id: customer.id,
      plan: 'free',
      status: 'active',
    }, {
      onConflict: 'user_id',
    })

  return customer.id
}
