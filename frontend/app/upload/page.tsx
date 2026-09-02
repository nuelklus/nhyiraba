'use client'

import ProductUploadFormFixed from '../../components/products/ProductUploadFormFixed'
import { Header } from '@/components/layout/Header'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Shield, AlertTriangle } from 'lucide-react'

export default function UploadPage() {
  const { isAuthenticated, user, isLoading } = useAuth()
  const router = useRouter()

  const isAdmin = user?.role === 'ADMIN'

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/upload')
    }
  }, [isAuthenticated, isLoading, router])

  useEffect(() => {
    if (user) {
      console.log('User info:', user)
      console.log('User role:', user.role)
      console.log('Is admin?', isAdmin)
    }
  }, [user, isAdmin])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto text-center">
            <div className="w-16 h-16 bg-brand-yellow/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-yellow"></div>
            </div>
            <h1 className="text-2xl font-bold text-brand-charcoal mb-2">Loading...</h1>
            <p className="text-gray-600">
              Checking authentication...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto text-center">
            <div className="w-16 h-16 bg-brand-yellow/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-brand-yellow" />
            </div>
            <h1 className="text-2xl font-bold text-brand-charcoal mb-2">Authentication Required</h1>
            <p className="text-gray-600 mb-4">
              You need to be logged in to upload products.
            </p>
            <div className="text-sm text-gray-500">
              Redirecting to login page...
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-brand-charcoal mb-2">Upload New Product</h1>
          <p className="text-xl text-gray-600">
            Add a new baby essentials product to your storefront.
          </p>
        </div>

        {!isAdmin && (
          <div className="mb-6 p-6 bg-brand-yellow/10 border border-brand-yellow/30 rounded-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-brand-yellow/20 rounded-full flex items-center justify-center">
                <Shield className="h-6 w-6 text-brand-yellow" />
              </div>
              <div>
                <p className="text-lg font-semibold text-brand-charcoal">
                  Admin Access Required
                </p>
                <p className="text-gray-600">
                  Only administrators can upload products. Contact your system administrator if you need access.
                </p>
              </div>
            </div>
          </div>
        )}

        {isAdmin && <ProductUploadFormFixed />}
      </div>
    </div>
  )
}
