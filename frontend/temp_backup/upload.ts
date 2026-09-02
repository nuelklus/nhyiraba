'use server'

import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

console.log('🔧 Environment Variables Check:')
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
console.log('SUPABASE_SERVICE_ROLE_KEY length:', process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0)

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables:')
  console.error('- supabaseUrl exists:', !!supabaseUrl)
  console.error('- supabaseServiceKey exists:', !!supabaseServiceKey)
  throw new Error(`Missing Supabase environment variables. URL: ${!!supabaseUrl}, Key: ${!!supabaseServiceKey}`)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function testSupabaseConnection() {
  console.log('🧪 Testing Supabase connection...')
  
  try {
    
    const { data, error } = await supabase.storage.listBuckets()
    console.log('📦 Buckets list:', data)
    console.log('❌ Buckets error:', error)
    
    if (error) {
      console.error('❌ Supabase connection failed:', error)
      return { success: false, error: error.message }
    }

    const productImagesBucket = data?.find(bucket => bucket.name === 'product-images')
    console.log('📁 product-images bucket exists:', !!productImagesBucket)
    
    if (!productImagesBucket) {
      console.error('❌ product-images bucket not found')
      return { success: false, error: 'product-images bucket not found' }
    }
    
    console.log('✅ Supabase connection test successful')
    return { success: true }
    
  } catch (error) {
    console.error('💥 Supabase connection test error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function uploadProductImage(formData: FormData): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  console.log('🚀 Starting uploadProductImage Server Action')
  
  try {
    
    console.log('🧪 Testing Supabase connection before upload...')
    const connectionTest = await testSupabaseConnection()
    if (!connectionTest.success) {
      console.error('❌ Supabase connection test failed:', connectionTest.error)
      return { success: false, error: `Supabase connection failed: ${connectionTest.error}` }
    }
    
    const file = formData.get('image') as File
    
    console.log('📁 File received:', {
      name: file?.name,
      size: file?.size,
      type: file?.type
    })
    
    if (!file) {
      console.error('❌ No image file provided')
      return { success: false, error: 'No image file provided' }
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      console.error('❌ Invalid file type:', file.type)
      return { success: false, error: `Invalid file type: ${file.type}. Only JPEG, PNG, and WebP are allowed.` }
    }

    if (file.size > 5 * 1024 * 1024) {
      console.error('❌ File too large:', file.size, 'bytes (max: 5MB)')
      return { success: false, error: `File too large: ${Math.round(file.size / 1024 / 1024)}MB. Maximum size is 5MB.` }
    }

    console.log('🔧 Checking Supabase configuration...')
    console.log('Supabase URL:', supabaseUrl)
    console.log('Service Key exists:', !!supabaseServiceKey)

    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `product-images/${fileName}`

    console.log('📤 Uploading image to Supabase:', filePath)

    console.log('🌐 Making Supabase API call...')
    console.log('Bucket: product-images')
    console.log('File path:', filePath)
    console.log('File size:', file.size)
    console.log('File type:', file.type)

    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    console.log('📡 Supabase API response:')
    console.log('Data:', data)
    console.log('Error:', error)

    if (error) {
      console.error('❌ Supabase upload error:', error)
      console.error('Error details:', {
        message: error.message,
        name: error.name
      })
      return { success: false, error: `Upload failed: ${error.message}` }
    }

    console.log('✅ Supabase upload successful:', data)

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath)

    console.log('🔗 Public URL generated:', publicUrl)

    return { 
      success: true, 
      imageUrl: publicUrl 
    }

  } catch (error) {
    console.error('💥 Server upload error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}

export async function createProduct(productData: {
  name: string
  price: string
  category: string
  description?: string
  sku?: string
  image_url: string
}) {
  console.log('🚀 Starting createProduct Server Action')
  console.log('📦 Product data:', productData)
  
  try {
    
    const cookieStore = cookies()
    const token = cookieStore.get('access_token')?.value

    console.log('🔐 Checking authentication...')
    console.log('Token exists:', !!token)

    if (!token) {
      console.error('❌ No authentication token found')
      return { success: false, error: 'Authentication required' }
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://your-api-url.com'
    console.log('🌐 Calling backend API:', `${apiUrl}/api/products/create/`)

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
        category: parseInt(productData.category),
        brand: 1, 
        condition: 'new',
        dimensions: 'Standard',
        track_stock: true,
        stock_quantity: 10,
        low_stock_threshold: 5,
        is_active: true,
        is_featured: false,
        is_digital: false,
        image_url: productData.image_url,
        short_description: productData.description || '',
        description: productData.description || '',
        sku: productData.sku || `SKU-${Date.now()}`,
      }),
    })

    console.log('📡 Backend response status:', response.status)
    console.log('📡 Backend response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('❌ Backend error response:', errorData)
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    const result = await response.json()
    console.log('✅ Product created successfully:', result)

    revalidatePath('/')
    revalidatePath('/products')
    
    return { success: true, product: result }

  } catch (error) {
    console.error('💥 Product creation error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create product' 
    }
  }
}

export async function uploadProductComplete(formData: FormData) {
  console.log('🚀 Starting uploadProductComplete Server Action')
  
  try {
    
    console.log('📤 Step 1: Uploading image...')
    const imageResult = await uploadProductImage(formData)
    
    console.log('📸 Image upload result:', imageResult)
    
    if (!imageResult.success || !imageResult.imageUrl) {
      console.error('❌ Image upload failed:', imageResult.error)
      return imageResult
    }

    console.log('📦 Step 2: Creating product...')
    const productData = {
      name: formData.get('name') as string,
      price: formData.get('price') as string,
      category: formData.get('category') as string,
      description: formData.get('description') as string,
      sku: formData.get('sku') as string,
      image_url: imageResult.imageUrl,
    }

    console.log('📋 Product data for creation:', productData)

    const productResult = await createProduct(productData)
    
    console.log('🏭 Product creation result:', productResult)
    
    if (!productResult.success) {
      console.error('❌ Product creation failed:', productResult.error)
      return productResult
    }

    console.log('✅ Complete upload successful!')

    console.log('🔄 Redirecting to products page...')
    redirect('/products?success=Product created successfully')

  } catch (error) {
    console.error('💥 Complete upload error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Upload failed' 
    }
  }
}
