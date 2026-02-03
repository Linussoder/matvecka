import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

// Admin client for database operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Helper to create user Supabase client
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

// Generate a unique share token
function generateShareToken() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
  let token = ''
  for (let i = 0; i < 8; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}

// POST - Create a share link
export async function POST(request) {
  try {
    const supabase = await getSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Du måste vara inloggad' },
        { status: 401 }
      )
    }

    const { type, recipeData, mealPlanId, mealPlanData, expiresDays } = await request.json()

    // Generate unique token
    let shareToken = generateShareToken()
    let attempts = 0
    const maxAttempts = 10

    if (type === 'recipe') {
      if (!recipeData) {
        return NextResponse.json(
          { error: 'Receptdata saknas' },
          { status: 400 }
        )
      }

      // Ensure token is unique
      while (attempts < maxAttempts) {
        const { data: existing } = await supabaseAdmin
          .from('recipe_shares')
          .select('id')
          .eq('share_token', shareToken)
          .single()

        if (!existing) break
        shareToken = generateShareToken()
        attempts++
      }

      // Calculate expiry
      const expiresAt = expiresDays
        ? new Date(Date.now() + expiresDays * 24 * 60 * 60 * 1000).toISOString()
        : null

      // Create recipe share
      const { data, error } = await supabaseAdmin
        .from('recipe_shares')
        .insert({
          share_token: shareToken,
          user_id: user.id,
          recipe_data: recipeData,
          expires_at: expiresAt,
          is_active: true
        })
        .select()
        .single()

      if (error) {
        console.error('Create recipe share error:', error)
        return NextResponse.json(
          { error: `Kunde inte skapa delningslänk: ${error.message}` },
          { status: 500 }
        )
      }

      const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '')
      const shareUrl = `${baseUrl}/share/recipe/${data.share_token}`

      return NextResponse.json({
        success: true,
        shareToken: data.share_token,
        shareUrl
      })
    }

    if (type === 'meal_plan') {
      if (!mealPlanId || !mealPlanData) {
        return NextResponse.json(
          { error: 'Matplandata saknas' },
          { status: 400 }
        )
      }

      // Ensure token is unique
      while (attempts < maxAttempts) {
        const { data: existing } = await supabaseAdmin
          .from('meal_plan_shares')
          .select('id')
          .eq('share_token', shareToken)
          .single()

        if (!existing) break
        shareToken = generateShareToken()
        attempts++
      }

      // Calculate expiry
      const expiresAt = expiresDays
        ? new Date(Date.now() + expiresDays * 24 * 60 * 60 * 1000).toISOString()
        : null

      // Create meal plan share
      const { data, error } = await supabaseAdmin
        .from('meal_plan_shares')
        .insert({
          share_token: shareToken,
          user_id: user.id,
          meal_plan_id: mealPlanId,
          meal_plan_data: mealPlanData,
          include_shopping_list: true,
          expires_at: expiresAt,
          is_active: true
        })
        .select()
        .single()

      if (error) {
        console.error('Create meal plan share error:', error)
        return NextResponse.json(
          { error: `Kunde inte skapa delningslänk: ${error.message}` },
          { status: 500 }
        )
      }

      const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '')
      const shareUrl = `${baseUrl}/share/meal-plan/${data.share_token}`

      return NextResponse.json({
        success: true,
        shareToken: data.share_token,
        shareUrl
      })
    }

    return NextResponse.json(
      { error: 'Ogiltig delningstyp' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Share error:', error)
    return NextResponse.json(
      { error: `Något gick fel: ${error.message}` },
      { status: 500 }
    )
  }
}

// GET - Get user's shares
export async function GET() {
  try {
    const supabase = await getSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Du måste vara inloggad' },
        { status: 401 }
      )
    }

    // Get user's recipe shares
    const { data: recipeShares } = await supabaseAdmin
      .from('recipe_shares')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Get user's meal plan shares
    const { data: mealPlanShares } = await supabaseAdmin
      .from('meal_plan_shares')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    return NextResponse.json({
      recipeShares: recipeShares || [],
      mealPlanShares: mealPlanShares || []
    })
  } catch (error) {
    console.error('Get shares error:', error)
    return NextResponse.json(
      { error: 'Något gick fel' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a share
export async function DELETE(request) {
  try {
    const supabase = await getSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Du måste vara inloggad' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const shareId = searchParams.get('id')
    const type = searchParams.get('type')

    if (!shareId || !type) {
      return NextResponse.json(
        { error: 'ID och typ krävs' },
        { status: 400 }
      )
    }

    const table = type === 'recipe' ? 'recipe_shares' : 'meal_plan_shares'

    const { error } = await supabaseAdmin
      .from(table)
      .delete()
      .eq('id', shareId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Delete share error:', error)
      return NextResponse.json(
        { error: 'Kunde inte ta bort delning' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete share error:', error)
    return NextResponse.json(
      { error: 'Något gick fel' },
      { status: 500 }
    )
  }
}
