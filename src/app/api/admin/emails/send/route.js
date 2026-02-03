import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const resend = new Resend(process.env.RESEND_API_KEY)

// Email template wrapper
function createEmailHtml(content, previewText) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Matvecka</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  ${previewText ? `<div style="display: none; max-height: 0; overflow: hidden;">${previewText}</div>` : ''}

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">🥗 Matvecka</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                Skickat från Matvecka - Din AI-drivna matplanerare
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                <a href="https://matvecka.se" style="color: #10b981; text-decoration: none;">matvecka.se</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function POST(req) {
  try {
    const cookieStore = await cookies()
    const adminAuth = cookieStore.get('admin_session')
    if (!adminAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, type, subject, previewText, content, targetSegment, targetAll } = body

    // Get target user emails using Supabase Admin API
    let userEmails = []
    let userCount = 0

    try {
      if (targetAll) {
        // Get all users from auth.users using admin API
        const { data: { users }, error } = await supabase.auth.admin.listUsers({
          perPage: 1000
        })

        if (!error && users) {
          userEmails = users
            .filter(u => u.email && !u.email.includes('@example.com'))
            .map(u => ({ email: u.email, name: u.user_metadata?.name || u.email.split('@')[0] }))
          userCount = userEmails.length
        }
      } else if (targetSegment) {
        // Get segment and its filters
        const { data: segment } = await supabase
          .from('admin_segments')
          .select('*')
          .eq('id', targetSegment)
          .single()

        if (segment) {
          // For now, get all users for segments too
          // In production, you'd filter based on segment.filters
          const { data: { users }, error } = await supabase.auth.admin.listUsers({
            perPage: 1000
          })

          if (!error && users) {
            userEmails = users
              .filter(u => u.email && !u.email.includes('@example.com'))
              .map(u => ({ email: u.email, name: u.user_metadata?.name || u.email.split('@')[0] }))
            userCount = userEmails.length
          }
        }
      }
    } catch (e) {
      console.error('Failed to get users:', e)
    }

    // Create campaign record first
    const { data: campaign, error: campaignError } = await supabase
      .from('admin_campaigns')
      .insert({
        name,
        type: 'email',
        status: 'sending',
        target_segment: targetSegment || null,
        target_filters: targetAll ? { all: true } : {},
        content: {
          subject,
          previewText,
          html: content
        },
        sent_at: new Date().toISOString(),
        metrics: {
          sent: 0,
          opened: 0,
          clicked: 0,
          converted: 0
        }
      })
      .select()
      .single()

    // Send emails using Resend
    let sentCount = 0
    const emailErrors = []

    if (userEmails.length > 0) {
      // Resend supports batch sending up to 100 emails at a time
      const batches = []
      for (let i = 0; i < userEmails.length; i += 100) {
        batches.push(userEmails.slice(i, i + 100))
      }

      for (const batch of batches) {
        try {
          // Send batch emails
          const emailPromises = batch.map(user =>
            resend.emails.send({
              // Use Resend's test domain until matvecka.se is verified
              from: 'Matvecka <onboarding@resend.dev>',
              to: user.email,
              subject: subject,
              html: createEmailHtml(
                content.replace(/\{\{name\}\}/g, user.name),
                previewText
              )
            })
          )

          const results = await Promise.allSettled(emailPromises)

          for (const result of results) {
            if (result.status === 'fulfilled' && result.value?.data?.id) {
              sentCount++
            } else if (result.status === 'rejected') {
              emailErrors.push(result.reason?.message || 'Unknown error')
            }
          }
        } catch (batchError) {
          console.error('Batch send error:', batchError)
          emailErrors.push(batchError.message)
        }
      }
    }

    // Update campaign with final count
    if (campaign?.id) {
      await supabase
        .from('admin_campaigns')
        .update({
          status: 'sent',
          metrics: {
            sent: sentCount,
            opened: 0,
            clicked: 0,
            converted: 0
          }
        })
        .eq('id', campaign.id)
    }

    return NextResponse.json({
      success: true,
      campaign: {
        ...(campaign || { id: Date.now().toString(), name }),
        metrics: { sent: sentCount, opened: 0, clicked: 0, converted: 0 }
      },
      stats: {
        targetedUsers: userCount,
        emailsSent: sentCount,
        errors: emailErrors.length > 0 ? emailErrors.slice(0, 5) : undefined
      }
    })
  } catch (error) {
    console.error('Failed to send campaign:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
