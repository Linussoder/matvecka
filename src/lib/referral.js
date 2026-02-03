import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

// Server-side Supabase client with service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Configuration (can be overridden via env vars)
const REFERRER_BONUS_DAYS = parseInt(process.env.REFERRAL_REFERRER_DAYS || '7')
const REFERRED_BONUS_DAYS = parseInt(process.env.REFERRAL_REFERRED_DAYS || '7')
const MAX_REFERRALS_PER_USER = parseInt(process.env.REFERRAL_MAX_PER_USER || '50')
const CREDIT_VALIDITY_DAYS = parseInt(process.env.REFERRAL_CREDIT_VALIDITY_DAYS || '365')

/**
 * Generate a unique 8-character referral code
 */
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // No confusing chars (0, O, I, L, 1)
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/**
 * Get or create a referral code for a user
 */
export async function getOrCreateReferralCode(userId) {
  if (!userId) return null

  // Check for existing code
  const { data: existing } = await supabase
    .from('referral_codes')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (existing) {
    return existing
  }

  // Generate a unique code
  let code
  let isUnique = false
  let attempts = 0

  while (!isUnique && attempts < 10) {
    code = generateCode()
    const { data: conflict } = await supabase
      .from('referral_codes')
      .select('id')
      .eq('code', code)
      .single()

    isUnique = !conflict
    attempts++
  }

  if (!isUnique) {
    throw new Error('Could not generate unique referral code')
  }

  // Insert new code with explicit UUID
  const { data: newCode, error } = await supabase
    .from('referral_codes')
    .insert({ id: randomUUID(), user_id: userId, code })
    .select()
    .single()

  if (error) {
    // Handle race condition where code was created between check and insert
    if (error.code === '23505') {
      const { data: existing } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('user_id', userId)
        .single()
      return existing
    }
    throw error
  }

  // Initialize referral stats (user_id is the primary key)
  await supabase
    .from('referral_stats')
    .upsert({ user_id: userId }, { onConflict: 'user_id', ignoreDuplicates: true })

  return newCode
}

/**
 * Validate a referral code
 * Returns the code data if valid, null otherwise
 */
export async function validateReferralCode(code) {
  if (!code || code.length !== 8) return null

  const { data } = await supabase
    .from('referral_codes')
    .select('id, user_id, code, is_active')
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .single()

  return data
}

/**
 * Record a pending referral during signup
 * Called after user creates account but before email verification
 */
export async function recordPendingReferral(referredUserId, referralCode) {
  if (!referredUserId || !referralCode) {
    return { success: false, error: 'Missing required parameters' }
  }

  // Validate the referral code
  const codeData = await validateReferralCode(referralCode)
  if (!codeData) {
    return { success: false, error: 'Ogiltig värvningskod' }
  }

  // Prevent self-referral
  if (codeData.user_id === referredUserId) {
    return { success: false, error: 'Du kan inte använda din egen värvningskod' }
  }

  // Check if user was already referred
  const { data: existingReferral } = await supabase
    .from('referrals')
    .select('id')
    .eq('referred_id', referredUserId)
    .single()

  if (existingReferral) {
    return { success: false, error: 'Du har redan blivit värvad' }
  }

  // Check referrer's limit
  const { count } = await supabase
    .from('referrals')
    .select('*', { count: 'exact', head: true })
    .eq('referrer_id', codeData.user_id)
    .in('status', ['pending', 'completed'])

  if (count >= MAX_REFERRALS_PER_USER) {
    // Still allow referral but referrer won't get bonus
    console.log(`Referrer ${codeData.user_id} has reached max referrals (${count})`)
  }

  // Create pending referral with explicit UUID
  const { error } = await supabase
    .from('referrals')
    .insert({
      id: randomUUID(),
      referrer_id: codeData.user_id,
      referred_id: referredUserId,
      referral_code_id: codeData.id,
      status: 'pending'
    })

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Du har redan blivit värvad' }
    }
    console.error('Error recording referral:', error)
    throw error
  }

  return { success: true }
}

/**
 * Complete a referral and award bonuses
 * Called after referred user verifies their email
 */
export async function completeReferral(referredUserId) {
  if (!referredUserId) {
    return { success: false, error: 'Missing user ID' }
  }

  // Find pending referral
  const { data: referral } = await supabase
    .from('referrals')
    .select('*, referral_codes(user_id)')
    .eq('referred_id', referredUserId)
    .eq('status', 'pending')
    .single()

  if (!referral) {
    // No pending referral - this is normal for users who didn't use a code
    return { success: false, error: 'No pending referral found' }
  }

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + CREDIT_VALIDITY_DAYS)
  const expiresAtISO = expiresAt.toISOString()

  // Check referrer's limit before awarding
  const { count: referrerCount } = await supabase
    .from('referrals')
    .select('*', { count: 'exact', head: true })
    .eq('referrer_id', referral.referrer_id)
    .eq('status', 'completed')

  const referrerCanReceiveBonus = referrerCount < MAX_REFERRALS_PER_USER

  // Award credits to referred user (welcome bonus)
  const { error: referredCreditError } = await supabase
    .from('premium_credits')
    .insert({
      id: randomUUID(),
      user_id: referredUserId,
      days_amount: REFERRED_BONUS_DAYS,
      source: 'referred_welcome',
      source_reference_id: referral.id,
      expires_at: expiresAtISO
    })

  if (referredCreditError) {
    console.error('Error awarding referred credit:', referredCreditError)
    throw referredCreditError
  }

  // Award credits to referrer (if under limit)
  if (referrerCanReceiveBonus) {
    const { error: referrerCreditError } = await supabase
      .from('premium_credits')
      .insert({
        id: randomUUID(),
        user_id: referral.referrer_id,
        days_amount: REFERRER_BONUS_DAYS,
        source: 'referral_bonus',
        source_reference_id: referral.id,
        expires_at: expiresAtISO
      })

    if (referrerCreditError) {
      console.error('Error awarding referrer credit:', referrerCreditError)
      // Don't throw - referred user already got their credit
    }
  }

  // Update referral status
  await supabase
    .from('referrals')
    .update({
      status: 'completed',
      referrer_rewarded: referrerCanReceiveBonus,
      referred_rewarded: true,
      completed_at: new Date().toISOString()
    })
    .eq('id', referral.id)

  // Update referrer's stats
  await updateReferralStats(referral.referrer_id)

  return {
    success: true,
    referrerBonus: referrerCanReceiveBonus ? REFERRER_BONUS_DAYS : 0,
    referredBonus: REFERRED_BONUS_DAYS
  }
}

/**
 * Update cached referral statistics for a user
 */
async function updateReferralStats(userId) {
  const { data: stats } = await supabase
    .rpc('calculate_referral_stats', { p_user_id: userId })
    .single()

  if (stats) {
    await supabase
      .from('referral_stats')
      .upsert({
        user_id: userId,
        total_invited: stats.total_invited || 0,
        total_converted: stats.total_converted || 0,
        total_days_earned: stats.total_days_earned || 0,
        last_referral_at: stats.last_referral_at,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
  }
}

/**
 * Get user's premium credits
 */
export async function getPremiumCredits(userId) {
  if (!userId) return { hasCredits: false, totalDays: 0, credits: [] }

  const { data: credits } = await supabase
    .from('premium_credits')
    .select('*')
    .eq('user_id', userId)
    .eq('consumed', false)
    .gt('expires_at', new Date().toISOString())
    .order('expires_at', { ascending: true })

  if (!credits || credits.length === 0) {
    return { hasCredits: false, totalDays: 0, credits: [] }
  }

  // Calculate remaining days across all credits
  const totalDays = credits.reduce((sum, credit) => {
    const remaining = Math.max(0,
      Math.ceil((new Date(credit.expires_at) - new Date()) / (1000 * 60 * 60 * 24))
    )
    return sum + remaining
  }, 0)

  return { hasCredits: true, totalDays, credits }
}

/**
 * Get referral statistics and code for a user
 */
export async function getReferralStats(userId) {
  if (!userId) return null

  const [codeResult, statsResult, referralsResult, creditsResult] = await Promise.all([
    supabase.from('referral_codes').select('code, is_active').eq('user_id', userId).single(),
    supabase.from('referral_stats').select('*').eq('user_id', userId).single(),
    supabase
      .from('referrals')
      .select('id, status, created_at, completed_at')
      .eq('referrer_id', userId)
      .order('created_at', { ascending: false })
      .limit(10),
    getPremiumCredits(userId)
  ])

  return {
    referralCode: codeResult.data?.code || null,
    isCodeActive: codeResult.data?.is_active ?? true,
    stats: statsResult.data || {
      total_invited: 0,
      total_converted: 0,
      total_days_earned: 0,
      last_referral_at: null
    },
    recentReferrals: referralsResult.data || [],
    premiumCredits: creditsResult,
    config: {
      referrerBonusDays: REFERRER_BONUS_DAYS,
      referredBonusDays: REFERRED_BONUS_DAYS,
      maxReferrals: MAX_REFERRALS_PER_USER
    }
  }
}

/**
 * Check if a user was referred (has a referral record)
 */
export async function wasUserReferred(userId) {
  const { data } = await supabase
    .from('referrals')
    .select('id, status')
    .eq('referred_id', userId)
    .single()

  return data ? { wasReferred: true, status: data.status } : { wasReferred: false }
}
