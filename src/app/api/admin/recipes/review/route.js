import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// POST - Review action (approve/reject/needs_revision)
export async function POST(request) {
  try {
    const body = await request.json()
    const { id, action, notes } = body

    if (!id || !action) {
      return NextResponse.json(
        { error: 'ID och åtgärd krävs' },
        { status: 400 }
      )
    }

    const validActions = ['approve', 'reject', 'needs_revision']
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: 'Ogiltig åtgärd' },
        { status: 400 }
      )
    }

    const statusMap = {
      approve: 'approved',
      reject: 'rejected',
      needs_revision: 'needs_revision'
    }

    const { data, error } = await supabase
      .from('recipe_review_queue')
      .update({
        status: statusMap[action],
        reviewer_notes: notes || null,
        reviewed_at: new Date().toISOString(),
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
    console.error('Recipe review error:', error)
    return NextResponse.json(
      { error: 'Kunde inte utföra granskning' },
      { status: 500 }
    )
  }
}
