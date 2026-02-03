import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET() {
  try {
    const cookieStore = await cookies()
    const adminAuth = cookieStore.get('admin_session')
    if (!adminAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: templates, error } = await supabase
      .from('email_templates')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ success: true, templates: [] })
    }

    return NextResponse.json({ success: true, templates })
  } catch (error) {
    console.error('Failed to fetch templates:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const cookieStore = await cookies()
    const adminAuth = cookieStore.get('admin_session')
    if (!adminAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, type, subject, previewText, content, html_content } = body
    const htmlContent = html_content || content || ''

    const { data: template, error } = await supabase
      .from('email_templates')
      .insert({
        name,
        type,
        subject,
        html_content: htmlContent,
        text_content: htmlContent.replace(/<[^>]*>/g, ''),
        variables: ['{{name}}', '{{email}}']
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({
        success: true,
        template: {
          id: Date.now().toString(),
          name,
          type,
          subject,
          created_at: new Date().toISOString()
        }
      })
    }

    return NextResponse.json({ success: true, template })
  } catch (error) {
    console.error('Failed to create template:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
