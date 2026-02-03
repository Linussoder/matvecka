import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

// Helper to create Supabase client
async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    }
  )
}

// GET - Fetch user profile
export async function GET() {
  const supabase = await getSupabase()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const session = { user }

  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', session.user.id)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows found, which is okay for new users
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Calculate age from birth_date
  let age = null
  if (profile?.birth_date) {
    const birthDate = new Date(profile.birth_date)
    const today = new Date()
    age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
  }

  // Calculate BMR and TDEE if we have the data
  let bmr = null
  let tdee = null
  let dailyCalorieTarget = null

  if (profile?.weight_kg && profile?.height_cm && age && profile?.gender) {
    // Mifflin-St Jeor equation
    if (profile.gender === 'male') {
      bmr = Math.round((10 * profile.weight_kg) + (6.25 * profile.height_cm) - (5 * age) + 5)
    } else {
      bmr = Math.round((10 * profile.weight_kg) + (6.25 * profile.height_cm) - (5 * age) - 161)
    }

    // Activity multiplier
    const multipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    }
    const multiplier = multipliers[profile.activity_level] || 1.55
    tdee = Math.round(bmr * multiplier)

    // Adjust for health goal
    switch (profile.health_goal) {
      case 'lose_weight':
        dailyCalorieTarget = Math.round(tdee * 0.8) // 20% deficit
        break
      case 'gain_muscle':
        dailyCalorieTarget = Math.round(tdee * 1.1) // 10% surplus
        break
      default:
        dailyCalorieTarget = tdee
    }
  }

  return NextResponse.json({
    profile: profile || {},
    calculated: {
      age,
      bmr,
      tdee,
      dailyCalorieTarget
    }
  })
}

// POST - Create or update user profile
export async function POST(request) {
  const supabase = await getSupabase()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const session = { user }

  const body = await request.json()

  // Sanitize and validate the data
  const profileData = {
    user_id: session.user.id,
    full_name: body.full_name || null,
    phone_number: body.phone_number || null,
    preferred_city: body.preferred_city || 'Stockholm',

    // Body & Health
    weight_kg: body.weight_kg ? parseFloat(body.weight_kg) : null,
    height_cm: body.height_cm ? parseInt(body.height_cm) : null,
    birth_date: body.birth_date || null,
    gender: body.gender || null,
    activity_level: body.activity_level || 'moderate',
    health_goal: body.health_goal || 'maintain',

    // Dietary restrictions
    allergies: body.allergies || [],
    intolerances: body.intolerances || [],
    diet_type: body.diet_type || 'none',
    dislikes: body.dislikes || [],

    // Kitchen & Cooking
    kitchen_equipment: body.kitchen_equipment || [],
    cooking_skill: body.cooking_skill || 'beginner',
    weekday_cooking_time: body.weekday_cooking_time ? parseInt(body.weekday_cooking_time) : 30,
    weekend_cooking_time: body.weekend_cooking_time ? parseInt(body.weekend_cooking_time) : 60,

    // Meal planning defaults
    default_servings: body.default_servings ? parseInt(body.default_servings) : 4,
    max_budget_per_serving: body.max_budget_per_serving ? parseInt(body.max_budget_per_serving) : 50,

    // Notifications
    email_notifications: body.email_notifications !== false,
    push_notifications: body.push_notifications !== false,
    meal_prep_reminders: body.meal_prep_reminders !== false,
    weekly_summary: body.weekly_summary !== false,

    // App preferences
    dark_mode: body.dark_mode === true,
    language: body.language || 'sv',
    units: body.units || 'metric',

    // Onboarding
    onboarding_completed: body.onboarding_completed === true,
    onboarding_completed_at: body.onboarding_completed_at || null,
    favorite_stores: body.favorite_stores || [],

    updated_at: new Date().toISOString()
  }

  // Upsert (insert or update)
  const { data, error } = await supabase
    .from('user_profiles')
    .upsert(profileData, {
      onConflict: 'user_id',
      ignoreDuplicates: false
    })
    .select()
    .single()

  if (error) {
    console.error('Profile save error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, profile: data })
}

// DELETE - Delete user account and all data (GDPR)
export async function DELETE(request) {
  const supabase = await getSupabase()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  if (action === 'export') {
    // Export all user data (GDPR compliance)
    // First get household to query family members
    const { data: household } = await supabase
      .from('households')
      .select('*')
      .eq('owner_id', user.id)
      .single()

    const [
      { data: profile },
      { data: mealPlans },
      { data: favorites },
      { data: familyMembers }
    ] = await Promise.all([
      supabase.from('user_profiles').select('*').eq('user_id', user.id).single(),
      supabase.from('meal_plans').select('*').eq('user_id', user.id),
      supabase.from('favorites').select('*').eq('user_id', user.id),
      household
        ? supabase.from('family_members').select('*').eq('household_id', household.id)
        : Promise.resolve({ data: [] })
    ])

    return NextResponse.json({
      exportedAt: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      },
      profile,
      mealPlans,
      favorites,
      household,
      familyMembers
    })
  }

  if (action === 'delete') {
    // Delete all user data
    // Note: RLS policies and CASCADE constraints will handle related data
    const { error: profileError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('user_id', user.id)

    if (profileError) {
      console.error('Profile delete error:', profileError)
    }

    // Sign out the user after deletion
    await supabase.auth.signOut()

    return NextResponse.json({ success: true, message: 'Account data deleted' })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
