'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function FamilyPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to settings page with family tab
    router.replace('/settings?tab=family')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">Omdirigerar...</p>
      </div>
    </div>
  )
}
