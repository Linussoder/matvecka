import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// GET - Fetch all ingredient substitutions
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const active = searchParams.get('active')

    let query = supabase
      .from('ingredient_substitutions')
      .select('*')
      .order('original_ingredient', { ascending: true })

    if (category) {
      query = query.eq('category', category)
    }

    if (active === 'true') {
      query = query.eq('is_active', true)
    }

    const { data, error } = await query

    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST205') {
        return NextResponse.json({
          success: true,
          substitutions: [],
          needsSetup: true
        })
      }
      throw error
    }

    return NextResponse.json({
      success: true,
      substitutions: data || []
    })
  } catch (error) {
    console.error('Substitutions fetch error:', error)
    return NextResponse.json(
      { error: 'Kunde inte hämta ersättningar' },
      { status: 500 }
    )
  }
}

// POST - Create new substitution
export async function POST(request) {
  try {
    const body = await request.json()
    const {
      original_ingredient,
      substitute_ingredient,
      category,
      substitution_ratio,
      notes,
      nutrition_impact,
      is_active,
      priority
    } = body

    if (!original_ingredient || !substitute_ingredient) {
      return NextResponse.json(
        { error: 'Original och ersättning krävs' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('ingredient_substitutions')
      .insert({
        original_ingredient,
        substitute_ingredient,
        category: category || null,
        substitution_ratio: substitution_ratio || 1.0,
        notes: notes || null,
        nutrition_impact: nutrition_impact || null,
        is_active: is_active ?? true,
        priority: priority || 0
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Denna ersättning finns redan' },
          { status: 400 }
        )
      }
      throw error
    }

    return NextResponse.json({
      success: true,
      substitution: data
    })
  } catch (error) {
    console.error('Substitution create error:', error)
    return NextResponse.json(
      { error: 'Kunde inte skapa ersättning' },
      { status: 500 }
    )
  }
}

// PATCH - Update substitution
export async function PATCH(request) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID krävs' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('ingredient_substitutions')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      substitution: data
    })
  } catch (error) {
    console.error('Substitution update error:', error)
    return NextResponse.json(
      { error: 'Kunde inte uppdatera ersättning' },
      { status: 500 }
    )
  }
}

// DELETE - Remove substitution
export async function DELETE(request) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'ID krävs' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('ingredient_substitutions')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Substitution delete error:', error)
    return NextResponse.json(
      { error: 'Kunde inte ta bort ersättning' },
      { status: 500 }
    )
  }
}
