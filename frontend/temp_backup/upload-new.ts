'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

export async function uploadProductNew(formData: FormData) {
  console.log('🆕🆕🆕 BRAND NEW UPLOAD FUNCTION STARTING')
  console.log('📝 FormData received:', formData)
  
  try {
    console.log('🔍 Starting fresh try block...')

    console.log('📋 Extracting form data...')
    const name = formData.get('name') as string
    const price = formData.get('price') as string
    const category = formData.get('category') as string
    const description = formData.get('description') as string
    const sku = formData.get('sku') as string
    const file = formData.get('image') as File

    console.log('📋 Product data:', { name, price, category, description, sku })
    console.log('📁 File info:', { name: file?.name, size: file?.size, type: file?.type })

    if (!name) {
      console.error('❌ No product name provided')
      return { success: false, error: 'Product name is required' }
    }

    if (!price) {
      console.error('❌ No price provided')
      return { success: false, error: 'Price is required' }
    }

    console.log('✅ Basic validation passed')

    const productData = {
      name,
      price,
      category,
      description,
      sku,
      image_url: '',
    }

    console.log('🔐 Getting auth token...')
    const cookieStore = cookies()
    const token = cookieStore.get('access_token')?.value

    console.log('🔐 Authentication check:')
    console.log('Token exists:', !!token)
    console.log('Token length:', token?.length || 0)

    if (!token) {
      console.error('❌ No authentication token found')
      return { success: false, error: 'Authentication required' }
    }

    console.log('🌐 About to call backend API...')
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://your-api-url.com'
    console.log('🔗 API URL:', `${apiUrl}/api/products/create/`)
    console.log('🎯 Product data to send:', {
      name: productData.name,
      price: productData.price,
      category: parseInt(productData.category) || 1,
      brand: 1
    })

    console.log('📡 Making fetch request...')
    console.log('🔗 Using API URL:', apiUrl)
    
    const response = await fetch(`${apiUrl}/api/products/create/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: productData.name,
        slug: productData.name.toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/\s+/g, '-'),
        price: productData.price,
        category: 7, 
        brand: 18, 
        condition: 'new',
        dimensions: 'Standard',
        track_stock: true,
        stock_quantity: 10,
        low_stock_threshold: 5,
        is_active: true,
        is_featured: false,
        is_digital: false,
        image_url: productData.image_url,
        short_description: productData.description || 'Great product for your needs',
        description: productData.description || 'Great product for your needs',
        sku: productData.sku || `SKU-${Date.now()}`,
      }),
    })

    console.log('📡 Fetch completed, checking response...')
    console.log('📡 Backend response status:', response.status)

    if (!response.ok) {
      let errorData: any = {}
      try {
        errorData = await response.json()
      } catch (e) {
        errorData = { error: 'Unable to parse error response' }
      }
      console.error('❌ Backend error response:', errorData)
      throw new Error(errorData.detail || errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    const result = await response.json()
    console.log('✅ Product created successfully:', result)

    revalidatePath('/')
    revalidatePath('/products')
    
    console.log('🔄 Redirecting to products page...')
    redirect('/products?success=Product created successfully')

  } catch (error) {
    console.error('💥💥💥 BRAND NEW Upload error:', error)
    console.error('💥 Error type:', typeof error)
    console.error('💥 Error message:', error instanceof Error ? error.message : 'No message')
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Upload failed' 
    }
  }
}
