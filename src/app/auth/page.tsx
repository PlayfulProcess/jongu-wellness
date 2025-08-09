'use client'

import { AuthForm } from '@/components/AuthForm'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function AuthContent() {
  const searchParams = useSearchParams()
  const returnTo = searchParams.get('returnTo')

  return <AuthForm returnTo={returnTo} />
}

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Suspense fallback={<div>Loading...</div>}>
        <AuthContent />
      </Suspense>
    </div>
  )
}