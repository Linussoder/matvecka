import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { getUserSubscription } from '@/lib/subscription'
import { PLANS } from '@/lib/stripe'

// Default portion multipliers by age group
const AGE_GROUP_MULTIPLIERS = {
  toddler: 0.25,  // 1-3 years
  child: 0.5,     // 4-12 years
  teen: 0.75,     // 13-17 years
  adult: 1.0,     // 18-64 years
  senior: 0.75    // 65+ years
}

// Portion size adjustments
const PORTION_SIZE_ADJUSTMENTS = {
  small: 0.75,
  normal: 1.0,
  large: 1.25
}

// GET - List all family members
export async function GET(request) {
  try {
    const cookieStore = await cookies()

    const supabase = createServerClient(
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

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Du måste vara inloggad' },
        { status: 401 }
      )
    }

    // Get user's household
    const { data: household, error: householdError } = await supabase
      .from('households')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (householdError || !household) {
      return NextResponse.json({
        success: true,
        members: [],
        message: 'Inget hushåll hittat'
      })
    }

    // Get family members
    const { data: members, error } = await supabase
      .from('family_members')
      .select('*')
      .eq('household_id', household.id)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Members fetch error:', error)
      return NextResponse.json(
        { error: 'Kunde inte hämta familjemedlemmar' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      members: members || []
    })
  } catch (error) {
    console.error('Members GET error:', error)
    return NextResponse.json(
      { error: 'Ett fel uppstod' },
      { status: 500 }
    )
  }
}

// POST - Add new family member
export async function POST(request) {
  try {
    const cookieStore = await cookies()

    const supabase = createServerClient(
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

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Du måste vara inloggad' },
        { status: 401 }
      )
    }

    // Check if user is premium
    const { plan } = await getUserSubscription(user.id)
    if (plan !== 'premium') {
      return NextResponse.json(
        { error: 'Familjeprofiler är endast tillgängligt för Premium-användare', requiresPremium: true },
        { status: 403 }
      )
    }

    // Get user's household (create if doesn't exist)
    let { data: household, error: householdError } = await supabase
      .from('households')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (householdError && householdError.code === 'PGRST116') {
      // No household exists, create one
      const { data: newHousehold, error: createError } = await supabase
        .from('households')
        .insert({ owner_id: user.id, name: 'Mitt hushåll' })
        .select()
        .single()

      if (createError) {
        console.error('Household create error:', createError)
        return NextResponse.json(
          { error: 'Kunde inte skapa hushållet' },
          { status: 500 }
        )
      }
      household = newHousehold
    } else if (householdError) {
      console.error('Household fetch error:', householdError)
      return NextResponse.json(
        { error: 'Kunde inte hämta hushållet' },
        { status: 500 }
      )
    }

    // Check member limit
    const { count: memberCount } = await supabase
      .from('family_members')
      .select('*', { count: 'exact', head: true })
      .eq('household_id', household.id)

    const maxMembers = PLANS[plan]?.limits?.maxFamilyMembers || 10
    if (memberCount >= maxMembers) {
      return NextResponse.json(
        { error: `Du kan max ha ${maxMembers} familjemedlemmar` },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { name, age_group, portion_size, dietary_restrictions } = body

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Namn krävs' },
        { status: 400 }
      )
    }

    const validAgeGroups = ['toddler', 'child', 'teen', 'adult', 'senior']
    if (!age_group || !validAgeGroups.includes(age_group)) {
      return NextResponse.json(
        { error: 'Ogiltig åldersgrupp' },
        { status: 400 }
      )
    }

    const validPortionSizes = ['small', 'normal', 'large']
    const finalPortionSize = validPortionSizes.includes(portion_size) ? portion_size : 'normal'

    // Calculate portion multiplier
    const baseMultiplier = AGE_GROUP_MULTIPLIERS[age_group] || 1.0
    const sizeAdjustment = PORTION_SIZE_ADJUSTMENTS[finalPortionSize] || 1.0
    const portion_multiplier = parseFloat((baseMultiplier * sizeAdjustment).toFixed(2))

    // Validate dietary restrictions structure
    const validRestrictions = {
      allergies: Array.isArray(dietary_restrictions?.allergies) ? dietary_restrictions.allergies : [],
      intolerances: Array.isArray(dietary_restrictions?.intolerances) ? dietary_restrictions.intolerances : [],
      diet_type: dietary_restrictions?.diet_type || 'none',
      dislikes: Array.isArray(dietary_restrictions?.dislikes) ? dietary_restrictions.dislikes : []
    }

    // Get current max sort_order
    const { data: maxSortOrder } = await supabase
      .from('family_members')
      .select('sort_order')
      .eq('household_id', household.id)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single()

    const sort_order = (maxSortOrder?.sort_order ?? -1) + 1

    // Create family member
    const { data: member, error } = await supabase
      .from('family_members')
      .insert({
        household_id: household.id,
        name: name.trim(),
        age_group,
        portion_size: finalPortionSize,
        portion_multiplier,
        dietary_restrictions: validRestrictions,
        sort_order
      })
      .select()
      .single()

    if (error) {
      console.error('Member create error:', error)
      return NextResponse.json(
        { error: 'Kunde inte lägga till familjemedlem' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      member
    }, { status: 201 })
  } catch (error) {
    console.error('Members POST error:', error)
    return NextResponse.json(
      { error: 'Ett fel uppstod' },
      { status: 500 }
    )
  }
}
