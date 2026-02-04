'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CohortsRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/admin/analytics?tab=cohorts')
  }, [router])
  return (
    <div className="p-6 flex items-center justify-center min-h-[50vh]">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">Omdirigerar till Kohorter...</p>
      </div>
    </div>
  )
}
