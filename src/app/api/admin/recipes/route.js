import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// GET - Fetch recipes in review queue
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending'
    const source = searchParams.get('source')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    let query = supabase
      .from('recipe_review_queue')
      .select('*', { count: 'exact' })
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (source) {
      query = query.eq('source', source)
    }

    const { data, error, count } = await query

    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST205') {
        return NextResponse.json({
          success: true,
          recipes: [],
          needsSetup: true
        })
      }
      throw error
    }

    return NextResponse.json({
      success: true,
      recipes: data || [],
      total: count,
      page,
      totalPages: Math.ceil((count || 0) / limit)
    })
  } catch (error) {
    console.error('Recipe queue fetch error:', error)
    return NextResponse.json(
      { error: 'Kunde inte hämta recept' },
      { status: 500 }
    )
  }
}

// POST - Add recipe to review queue
export async function POST(request) {
  try {
    const body = await request.json()
    const { recipe_data, source, meal_plan_recipe_id, flags } = body

    if (!recipe_data) {
      return NextResponse.json(
        { error: 'Receptdata krävs' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('recipe_review_queue')
      .insert({
        recipe_data,
        source: source || 'ai_generated',
        meal_plan_recipe_id: meal_plan_recipe_id || null,
        flags: flags || [],
        status: 'pending'
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      recipe: data
    })
  } catch (error) {
    console.error('Recipe queue create error:', error)
    return NextResponse.json(
      { error: 'Kunde inte lägga till recept' },
      { status: 500 }
    )
  }
}

// PATCH - Update recipe in queue
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
      .from('recipe_review_queue')
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
      recipe: data
    })
  } catch (error) {
    console.error('Recipe queue update error:', error)
    return NextResponse.json(
      { error: 'Kunde inte uppdatera recept' },
      { status: 500 }
    )
  }
}

// DELETE - Remove recipe from queue
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
      .from('recipe_review_queue')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Recipe queue delete error:', error)
    return NextResponse.json(
      { error: 'Kunde inte ta bort recept' },
      { status: 500 }
    )
  }
}
