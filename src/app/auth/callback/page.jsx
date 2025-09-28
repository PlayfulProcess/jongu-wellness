'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from "@/components/authProvider/AuthProvider"

export default function AuthCallback() {
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      // Pequeno delay para garantir que tudo está carregado
      const timer = setTimeout(() => {
        router.replace('/')
      }, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [user, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Finalizando login...</p>
      </div>
    </div>
  )
}