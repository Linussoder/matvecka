import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// GET - Get user's favorite recipes
export async function GET() {
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: favorites, error } = await supabase
      .from('favorite_recipes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({
      success: true,
      favorites: favorites || []
    })

  } catch (error) {
    console.error('Favorites fetch error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// POST - Save a recipe as favorite
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { recipe } = body

    if (!recipe || !recipe.name) {
      return NextResponse.json(
        { error: 'Recipe data is required' },
        { status: 400 }
      )
    }

    // Check if table exists, if not store in user metadata or a simpler way
    // For now, we'll store favorites in a simple way
    const { data: existing, error: checkError } = await supabase
      .from('favorite_recipes')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', recipe.name)
      .single()

    if (existing) {
      return NextResponse.json({
        success: true,
        message: 'Already saved',
        favorite: existing
      })
    }

    const { data: favorite, error } = await supabase
      .from('favorite_recipes')
      .insert({
        user_id: user.id,
        name: recipe.name,
        description: recipe.description,
        prep_time: recipe.prepTime,
        servings: recipe.servings,
        difficulty: recipe.difficulty,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        source: 'leftovers'
      })
      .select()
      .single()

    if (error) {
      // If table doesn't exist, give a helpful message
      if (error.code === '42P01') {
        return NextResponse.json(
          { error: 'Favoriter är inte aktiverade. Kör databasmigreringen.' },
          { status: 500 }
        )
      }
      throw error
    }

    return NextResponse.json({
      success: true,
      favorite
    })

  } catch (error) {
    console.error('Save favorite error:', error)
    return NextResponse.json(
      { error: error.message || 'Kunde inte spara receptet' },
      { status: 500 }
    )
  }
}
