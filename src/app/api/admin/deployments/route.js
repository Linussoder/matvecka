import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// GET - Fetch deployments from Vercel API
export async function GET() {
  try {
    const vercelToken = process.env.VERCEL_TOKEN
    const projectId = process.env.VERCEL_PROJECT_ID

    // Check if Vercel is configured
    if (!vercelToken || !projectId) {
      // Fall back to local deployment log
      const { data: logs, error } = await supabase
        .from('deployment_log')
        .select('*')
        .order('deployed_at', { ascending: false })
        .limit(50)

      if (error && (error.code === '42P01' || error.code === 'PGRST205')) {
        return NextResponse.json({
          success: true,
          deployments: [],
          needsSetup: true,
          message: 'Set VERCEL_TOKEN and VERCEL_PROJECT_ID environment variables for live deployment data'
        })
      }

      return NextResponse.json({
        success: true,
        deployments: logs || [],
        source: 'local'
      })
    }

    // Fetch from Vercel API
    const response = await fetch(
      `https://api.vercel.com/v6/deployments?projectId=${projectId}&limit=20`,
      {
        headers: {
          Authorization: `Bearer ${vercelToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Vercel API error: ${response.status}`)
    }

    const data = await response.json()

    // Transform Vercel deployment format
    const deployments = (data.deployments || []).map(d => ({
      id: d.uid,
      commit_sha: d.meta?.githubCommitSha || d.meta?.gitCommitSha || 'N/A',
      commit_message: d.meta?.githubCommitMessage || d.meta?.gitCommitMessage || 'No message',
      branch: d.meta?.githubCommitRef || d.meta?.gitCommitRef || 'main',
      environment: d.target || 'preview',
      deployed_at: new Date(d.created).toISOString(),
      deployed_by: d.creator?.username || d.creator?.email || 'Unknown',
      status: d.state || d.readyState,
      url: d.url ? `https://${d.url}` : null,
      vercel_deployment_id: d.uid
    }))

    return NextResponse.json({
      success: true,
      deployments,
      source: 'vercel'
    })
  } catch (error) {
    console.error('Deployments fetch error:', error)
    return NextResponse.json(
      { error: 'Kunde inte hämta deployments' },
      { status: 500 }
    )
  }
}
