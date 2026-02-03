import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

// Default portion multipliers by age group
const AGE_GROUP_MULTIPLIERS = {
  toddler: 0.25,
  child: 0.5,
  teen: 0.75,
  adult: 1.0,
  senior: 0.75
}

// Portion size adjustments
const PORTION_SIZE_ADJUSTMENTS = {
  small: 0.75,
  normal: 1.0,
  large: 1.25
}

// GET - Get single family member
export async function GET(request, { params }) {
  try {
    const { id } = await params
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
    const { data: household } = await supabase
      .from('households')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (!household) {
      return NextResponse.json(
        { error: 'Hushållet hittades inte' },
        { status: 404 }
      )
    }

    // Get the family member (ensuring it belongs to user's household)
    const { data: member, error } = await supabase
      .from('family_members')
      .select('*')
      .eq('id', id)
      .eq('household_id', household.id)
      .single()

    if (error || !member) {
      return NextResponse.json(
        { error: 'Familjemedlemmen hittades inte' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      member
    })
  } catch (error) {
    console.error('Member GET error:', error)
    return NextResponse.json(
      { error: 'Ett fel uppstod' },
      { status: 500 }
    )
  }
}

// PATCH - Update family member
export async function PATCH(request, { params }) {
  try {
    const { id } = await params
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
    const { data: household } = await supabase
      .from('households')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (!household) {
      return NextResponse.json(
        { error: 'Hushållet hittades inte' },
        { status: 404 }
      )
    }

    // Verify member belongs to user's household
    const { data: existingMember } = await supabase
      .from('family_members')
      .select('id')
      .eq('id', id)
      .eq('household_id', household.id)
      .single()

    if (!existingMember) {
      return NextResponse.json(
        { error: 'Familjemedlemmen hittades inte' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const updates = {}

    // Validate and add fields to update
    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim().length === 0) {
        return NextResponse.json(
          { error: 'Ogiltigt namn' },
          { status: 400 }
        )
      }
      updates.name = body.name.trim()
    }

    if (body.age_group !== undefined) {
      const validAgeGroups = ['toddler', 'child', 'teen', 'adult', 'senior']
      if (!validAgeGroups.includes(body.age_group)) {
        return NextResponse.json(
          { error: 'Ogiltig åldersgrupp' },
          { status: 400 }
        )
      }
      updates.age_group = body.age_group
    }

    if (body.portion_size !== undefined) {
      const validPortionSizes = ['small', 'normal', 'large']
      if (!validPortionSizes.includes(body.portion_size)) {
        return NextResponse.json(
          { error: 'Ogiltig portionsstorlek' },
          { status: 400 }
        )
      }
      updates.portion_size = body.portion_size
    }

    // Recalculate portion_multiplier if age_group or portion_size changed
    if (updates.age_group || updates.portion_size) {
      // Get current values for fields not being updated
      const { data: currentMember } = await supabase
        .from('family_members')
        .select('age_group, portion_size')
        .eq('id', id)
        .single()

      const finalAgeGroup = updates.age_group || currentMember.age_group
      const finalPortionSize = updates.portion_size || currentMember.portion_size

      const baseMultiplier = AGE_GROUP_MULTIPLIERS[finalAgeGroup] || 1.0
      const sizeAdjustment = PORTION_SIZE_ADJUSTMENTS[finalPortionSize] || 1.0
      updates.portion_multiplier = parseFloat((baseMultiplier * sizeAdjustment).toFixed(2))
    }

    if (body.dietary_restrictions !== undefined) {
      // Validate dietary restrictions structure
      updates.dietary_restrictions = {
        allergies: Array.isArray(body.dietary_restrictions?.allergies) ? body.dietary_restrictions.allergies : [],
        intolerances: Array.isArray(body.dietary_restrictions?.intolerances) ? body.dietary_restrictions.intolerances : [],
        diet_type: body.dietary_restrictions?.diet_type || 'none',
        dislikes: Array.isArray(body.dietary_restrictions?.dislikes) ? body.dietary_restrictions.dislikes : []
      }
    }

    if (body.sort_order !== undefined) {
      if (typeof body.sort_order !== 'number' || body.sort_order < 0) {
        return NextResponse.json(
          { error: 'Ogiltig sorteringsordning' },
          { status: 400 }
        )
      }
      updates.sort_order = body.sort_order
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'Inga fält att uppdatera' },
        { status: 400 }
      )
    }

    // Update the member
    const { data: member, error } = await supabase
      .from('family_members')
      .update(updates)
      .eq('id', id)
      .eq('household_id', household.id)
      .select()
      .single()

    if (error) {
      console.error('Member update error:', error)
      return NextResponse.json(
        { error: 'Kunde inte uppdatera familjemedlemmen' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      member
    })
  } catch (error) {
    console.error('Member PATCH error:', error)
    return NextResponse.json(
      { error: 'Ett fel uppstod' },
      { status: 500 }
    )
  }
}

// DELETE - Remove family member
export async function DELETE(request, { params }) {
  try {
    const { id } = await params
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
    const { data: household } = await supabase
      .from('households')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (!household) {
      return NextResponse.json(
        { error: 'Hushållet hittades inte' },
        { status: 404 }
      )
    }

    // Delete the member (RLS will ensure it belongs to user's household)
    const { error } = await supabase
      .from('family_members')
      .delete()
      .eq('id', id)
      .eq('household_id', household.id)

    if (error) {
      console.error('Member delete error:', error)
      return NextResponse.json(
        { error: 'Kunde inte ta bort familjemedlemmen' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Familjemedlemmen har tagits bort'
    })
  } catch (error) {
    console.error('Member DELETE error:', error)
    return NextResponse.json(
      { error: 'Ett fel uppstod' },
      { status: 500 }
    )
  }
}
