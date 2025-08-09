'use client'

import { AuthForm } from '@/components/AuthForm'
import { useSearchParams } from 'next/navigation'

export default function AuthPage() {
  const searchParams = useSearchParams()
  const returnTo = searchParams.get('returnTo')

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <AuthForm returnTo={returnTo} />
    </div>
  )
}