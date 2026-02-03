import { createClient } from '@supabase/supabase-js'

// Create admin client for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/**
 * Validate a promo code
 * @param {string} code - The promo code to validate
 * @param {string|null} userId - Optional user ID for per-user validation
 * @returns {Promise<{valid: boolean, error?: string, promo?: object}>}
 */
export async function validatePromoCode(code, userId = null) {
  if (!code || code.trim().length === 0) {
    return { valid: false, error: 'Ange en kampanjkod' }
  }

  const normalizedCode = code.trim().toUpperCase()

  // Use the database function for validation
  const { data, error } = await supabaseAdmin.rpc('validate_promo_code', {
    p_code: normalizedCode,
    p_user_id: userId
  })

  if (error) {
    console.error('Promo validation error:', error)
    return { valid: false, error: 'Kunde inte validera koden' }
  }

  if (!data || data.length === 0 || !data[0].is_valid) {
    return { valid: false, error: data?.[0]?.error_message || 'Ogiltig kampanjkod' }
  }

  const promo = data[0]
  return {
    valid: true,
    promo: {
      id: promo.promo_code_id,
      discountType: promo.discount_type,
      discountValue: promo.discount_value,
      description: promo.description,
      displayValue: formatDiscount(promo.discount_type, promo.discount_value)
    }
  }
}

/**
 * Redeem a promo code for a user
 * @param {string} code - The promo code
 * @param {string} userId - The user ID
 * @param {string|null} subscriptionId - Optional Stripe subscription ID
 * @returns {Promise<{success: boolean, error?: string, redemption?: object}>}
 */
export async function redeemPromoCode(code, userId, subscriptionId = null) {
  if (!code || !userId) {
    return { success: false, error: 'Saknar obligatoriska parametrar' }
  }

  const normalizedCode = code.trim().toUpperCase()

  // Use the database function for redemption
  const { data, error } = await supabaseAdmin.rpc('redeem_promo_code', {
    p_code: normalizedCode,
    p_user_id: userId,
    p_subscription_id: subscriptionId
  })

  if (error) {
    console.error('Promo redemption error:', error)
    return { success: false, error: 'Kunde inte lösa in koden' }
  }

  if (!data || data.length === 0 || !data[0].success) {
    return { success: false, error: data?.[0]?.error_message || 'Kunde inte lösa in koden' }
  }

  const result = data[0]
  return {
    success: true,
    redemption: {
      id: result.redemption_id,
      discountType: result.discount_type,
      discountValue: result.discount_value,
      premiumCreditId: result.premium_credit_id,
      displayValue: formatDiscount(result.discount_type, result.discount_value)
    }
  }
}

/**
 * Get all promo codes (admin only)
 * @returns {Promise<{codes: array, error?: string}>}
 */
export async function getAllPromoCodes() {
  const { data, error } = await supabaseAdmin
    .from('promo_codes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching promo codes:', error)
    return { codes: [], error: error.message }
  }

  return { codes: data || [] }
}

/**
 * Create a new promo code (admin only)
 * @param {object} promoData - The promo code data
 * @param {string} adminUserId - Optional admin's user ID
 * @returns {Promise<{success: boolean, promo?: object, error?: string}>}
 */
export async function createPromoCode(promoData, adminUserId = null) {
  const {
    code,
    description,
    discountType,
    discountValue,
    maxUses,
    maxUsesPerUser = 1,
    validFrom,
    validUntil,
    newUsersOnly = false,
    minPlanMonths = 1
  } = promoData

  // Validate required fields
  if (!code || !discountType || discountValue === undefined) {
    return { success: false, error: 'Saknar obligatoriska fält' }
  }

  // Normalize code
  const normalizedCode = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')

  if (normalizedCode.length < 3 || normalizedCode.length > 20) {
    return { success: false, error: 'Koden måste vara 3-20 tecken' }
  }

  // Validate discount value
  if (discountType === 'percentage' && (discountValue < 1 || discountValue > 100)) {
    return { success: false, error: 'Procent måste vara 1-100' }
  }

  if (discountType === 'fixed_amount' && discountValue < 1) {
    return { success: false, error: 'Belopp måste vara minst 1 kr' }
  }

  if (discountType === 'free_days' && discountValue < 1) {
    return { success: false, error: 'Antal dagar måste vara minst 1' }
  }

  const { data, error } = await supabaseAdmin
    .from('promo_codes')
    .insert({
      code: normalizedCode,
      description,
      discount_type: discountType,
      discount_value: discountValue,
      max_uses: maxUses || null,
      max_uses_per_user: maxUsesPerUser,
      valid_from: validFrom || new Date().toISOString(),
      valid_until: validUntil || null,
      new_users_only: newUsersOnly,
      min_plan_months: minPlanMonths,
      created_by: adminUserId,
      is_active: true
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating promo code:', error)
    if (error.code === '23505') {
      return { success: false, error: 'Koden finns redan' }
    }
    return { success: false, error: error.message }
  }

  return { success: true, promo: data }
}

/**
 * Update a promo code (admin only)
 * @param {string} promoId - The promo code ID
 * @param {object} updates - The fields to update
 * @returns {Promise<{success: boolean, promo?: object, error?: string}>}
 */
export async function updatePromoCode(promoId, updates) {
  const allowedFields = [
    'description',
    'max_uses',
    'max_uses_per_user',
    'valid_until',
    'is_active',
    'new_users_only',
    'min_plan_months'
  ]

  const sanitizedUpdates = {}
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      sanitizedUpdates[field] = updates[field]
    }
  }

  const { data, error } = await supabaseAdmin
    .from('promo_codes')
    .update(sanitizedUpdates)
    .eq('id', promoId)
    .select()
    .single()

  if (error) {
    console.error('Error updating promo code:', error)
    return { success: false, error: error.message }
  }

  return { success: true, promo: data }
}

/**
 * Delete a promo code (admin only)
 * @param {string} promoId - The promo code ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deletePromoCode(promoId) {
  const { error } = await supabaseAdmin
    .from('promo_codes')
    .delete()
    .eq('id', promoId)

  if (error) {
    console.error('Error deleting promo code:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Get promo code statistics
 * @param {string} promoId - Optional specific promo code ID
 * @returns {Promise<{stats: object, error?: string}>}
 */
export async function getPromoStats(promoId = null) {
  // Get all promo codes for counting
  const { data: codes, error: codesError } = await supabaseAdmin
    .from('promo_codes')
    .select('id, is_active')

  if (codesError) {
    console.error('Error fetching promo codes:', codesError)
    return { stats: null, error: codesError.message }
  }

  // Get redemptions
  let query = supabaseAdmin.from('promo_redemptions').select(`
    id,
    discount_applied,
    discount_type,
    redeemed_at,
    promo_codes (code, description)
  `)

  if (promoId) {
    query = query.eq('promo_code_id', promoId)
  }

  const { data, error } = await query.order('redeemed_at', { ascending: false })

  if (error) {
    console.error('Error fetching promo stats:', error)
    return { stats: null, error: error.message }
  }

  // Calculate totals
  const totalCodes = codes?.length || 0
  const activeCodes = codes?.filter(c => c.is_active).length || 0
  const totalRedemptions = data?.length || 0
  const totalFreeDaysGiven = data
    ?.filter(r => r.discount_type === 'free_days')
    .reduce((sum, r) => sum + r.discount_applied, 0) || 0

  return {
    stats: {
      totalCodes,
      activeCodes,
      totalRedemptions,
      totalFreeDaysGiven,
      redemptions: data || []
    }
  }
}

/**
 * Get user's redemption history
 * @param {string} userId - The user ID
 * @returns {Promise<{redemptions: array, error?: string}>}
 */
export async function getUserRedemptions(userId) {
  const { data, error } = await supabaseAdmin
    .from('promo_redemptions')
    .select(`
      id,
      discount_applied,
      discount_type,
      redeemed_at,
      promo_codes (code, description)
    `)
    .eq('user_id', userId)
    .order('redeemed_at', { ascending: false })

  if (error) {
    console.error('Error fetching user redemptions:', error)
    return { redemptions: [], error: error.message }
  }

  return { redemptions: data || [] }
}

/**
 * Format discount for display
 * @param {string} type - Discount type
 * @param {number} value - Discount value
 * @returns {string}
 */
export function formatDiscount(type, value) {
  switch (type) {
    case 'percentage':
      return `${value}% rabatt`
    case 'fixed_amount':
      return `${value} kr rabatt`
    case 'free_days':
      return `${value} gratis Premium-dagar`
    case 'trial_extension':
      return `${value} extra provdagar`
    default:
      return `${value}`
  }
}

/**
 * Generate a random promo code
 * @param {number} length - Code length (default 8)
 * @returns {string}
 */
export function generatePromoCode(length = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // No confusing chars
  let code = ''
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}
