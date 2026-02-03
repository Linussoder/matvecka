import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// GET - Fetch all seasonal recipes
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const season = searchParams.get('season')
    const month = searchParams.get('month')
    const featured = searchParams.get('featured')

    let query = supabase
      .from('recipe_seasons')
      .select('*')
      .order('recipe_name', { ascending: true })

    if (season) {
      query = query.contains('seasons', [season])
    }

    if (month) {
      query = query.contains('months', [parseInt(month)])
    }

    if (featured === 'true') {
      query = query.eq('is_featured', true)
    }

    const { data, error } = await query

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
      recipes: data || []
    })
  } catch (error) {
    console.error('Seasonal recipes fetch error:', error)
    return NextResponse.json(
      { error: 'Kunde inte hämta säsongsrecept' },
      { status: 500 }
    )
  }
}

// POST - Create new seasonal recipe
export async function POST(request) {
  try {
    const body = await request.json()
    const {
      recipe_hash,
      recipe_name,
      recipe_data,
      seasons,
      months,
      seasonal_tags,
      availability_score,
      is_featured
    } = body

    if (!recipe_name) {
      return NextResponse.json(
        { error: 'Receptnamn krävs' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('recipe_seasons')
      .insert({
        recipe_hash: recipe_hash || recipe_name.toLowerCase().replace(/\s+/g, '-'),
        recipe_name,
        recipe_data: recipe_data || null,
        seasons: seasons || [],
        months: months || [],
        seasonal_tags: seasonal_tags || [],
        availability_score: availability_score || 50,
        is_featured: is_featured || false
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Detta recept finns redan' },
          { status: 400 }
        )
      }
      throw error
    }

    return NextResponse.json({
      success: true,
      recipe: data
    })
  } catch (error) {
    console.error('Seasonal recipe create error:', error)
    return NextResponse.json(
      { error: 'Kunde inte skapa säsongsrecept' },
      { status: 500 }
    )
  }
}

// PATCH - Update seasonal recipe
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
      .from('recipe_seasons')
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
    console.error('Seasonal recipe update error:', error)
    return NextResponse.json(
      { error: 'Kunde inte uppdatera säsongsrecept' },
      { status: 500 }
    )
  }
}

// DELETE - Remove seasonal recipe
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
      .from('recipe_seasons')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Seasonal recipe delete error:', error)
    return NextResponse.json(
      { error: 'Kunde inte ta bort säsongsrecept' },
      { status: 500 }
    )
  }
}
