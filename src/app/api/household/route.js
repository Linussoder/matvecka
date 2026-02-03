import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { getUserSubscription } from '@/lib/subscription'

// GET - Get user's household with all family members
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

    // Get household with family members
    const { data: household, error: householdError } = await supabase
      .from('households')
      .select(`
        id,
        name,
        created_at,
        updated_at,
        family_members (
          id,
          name,
          age_group,
          portion_size,
          portion_multiplier,
          dietary_restrictions,
          sort_order,
          created_at
        )
      `)
      .eq('owner_id', user.id)
      .single()

    if (householdError && householdError.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is fine for new users
      console.error('Household fetch error:', householdError)
      return NextResponse.json(
        { error: 'Kunde inte hämta hushållet' },
        { status: 500 }
      )
    }

    // Calculate totals if household exists
    let totalPortions = 0
    let combinedRestrictions = {
      allergies: [],
      intolerances: [],
      dislikes: [],
      diet_type: 'none'
    }

    if (household?.family_members?.length > 0) {
      const members = household.family_members

      // Sort members by sort_order
      members.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))

      // Calculate total portions
      totalPortions = members.reduce((sum, m) => sum + (parseFloat(m.portion_multiplier) || 1), 0)

      // Combine restrictions
      const allAllergies = new Set()
      const allIntolerances = new Set()
      const allDislikes = new Set()
      let strictestDiet = 'none'
      const dietPriority = { vegan: 3, vegetarian: 2, pescatarian: 1, none: 0 }

      members.forEach(member => {
        const r = member.dietary_restrictions || {}
        r.allergies?.forEach(a => allAllergies.add(a))
        r.intolerances?.forEach(i => allIntolerances.add(i))
        r.dislikes?.forEach(d => allDislikes.add(d))

        const memberDiet = r.diet_type || 'none'
        if ((dietPriority[memberDiet] || 0) > (dietPriority[strictestDiet] || 0)) {
          strictestDiet = memberDiet
        }
      })

      combinedRestrictions = {
        allergies: [...allAllergies],
        intolerances: [...allIntolerances],
        dislikes: [...allDislikes],
        diet_type: strictestDiet
      }
    }

    return NextResponse.json({
      success: true,
      household: household || null,
      totalPortions,
      combinedRestrictions,
      memberCount: household?.family_members?.length || 0
    })
  } catch (error) {
    console.error('Household GET error:', error)
    return NextResponse.json(
      { error: 'Ett fel uppstod' },
      { status: 500 }
    )
  }
}

// POST - Create household for user (if none exists)
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

    // Check if user is premium (family profiles is premium-only)
    const { plan } = await getUserSubscription(user.id)
    if (plan !== 'premium') {
      return NextResponse.json(
        { error: 'Familjeprofiler är endast tillgängligt för Premium-användare', requiresPremium: true },
        { status: 403 }
      )
    }

    // Check if household already exists
    const { data: existing } = await supabase
      .from('households')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Du har redan ett hushåll', householdId: existing.id },
        { status: 409 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const name = body.name || 'Mitt hushåll'

    // Create household
    const { data: household, error } = await supabase
      .from('households')
      .insert({
        owner_id: user.id,
        name
      })
      .select()
      .single()

    if (error) {
      console.error('Household create error:', error)
      return NextResponse.json(
        { error: 'Kunde inte skapa hushållet' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      household
    }, { status: 201 })
  } catch (error) {
    console.error('Household POST error:', error)
    return NextResponse.json(
      { error: 'Ett fel uppstod' },
      { status: 500 }
    )
  }
}

// PATCH - Update household name
export async function PATCH(request) {
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

    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Namn krävs' },
        { status: 400 }
      )
    }

    const { data: household, error } = await supabase
      .from('households')
      .update({ name: name.trim() })
      .eq('owner_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Household update error:', error)
      return NextResponse.json(
        { error: 'Kunde inte uppdatera hushållet' },
        { status: 500 }
      )
    }

    if (!household) {
      return NextResponse.json(
        { error: 'Hushållet hittades inte' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      household
    })
  } catch (error) {
    console.error('Household PATCH error:', error)
    return NextResponse.json(
      { error: 'Ett fel uppstod' },
      { status: 500 }
    )
  }
}

// DELETE - Delete household (and all family members via cascade)
export async function DELETE(request) {
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

    const { error } = await supabase
      .from('households')
      .delete()
      .eq('owner_id', user.id)

    if (error) {
      console.error('Household delete error:', error)
      return NextResponse.json(
        { error: 'Kunde inte ta bort hushållet' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Hushållet har tagits bort'
    })
  } catch (error) {
    console.error('Household DELETE error:', error)
    return NextResponse.json(
      { error: 'Ett fel uppstod' },
      { status: 500 }
    )
  }
}
