'use server'

import { cookies } from 'next/headers'
import { uploadImageToSupabase } from './upload-supabase'
import { validateSupabaseConfig } from '@/config/supabase'

export async function uploadProductFinal(formData: FormData) {
  console.log('🔥🔥🔥 FINAL UPLOAD STARTING (SUPABASE VERSION)')
  
  try {
    
    const name = formData.get('name') as string
    const price = formData.get('price') as string
    const category = formData.get('category') as string
    const brand = formData.get('brand') as string
    const description = formData.get('description') as string
    const sku = formData.get('sku') as string
    const imageFile = formData.get('image') as File
    const imageUrl = formData.get('image_url') as string

    if (!name || !price || !category || !brand) {
      console.error('❌ Missing required form fields')
      return { success: false, error: 'Missing required fields: name, price, category, or brand' }
    }

    console.log('📝 Form data received:', {
      name,
      price,
      category,
      brand,
      description,
      sku,
      hasImage: !!imageFile,
      imageUrl: imageUrl || 'none'
    })

    let finalImageUrl: string | undefined = imageUrl
    if (imageFile && imageFile.size > 0) {
      console.log('🖼️🖼️🖼️ Uploading image...')
      
      try {
        const supabaseConfig = validateSupabaseConfig()
        const uploadResult = await uploadImageToSupabase(imageFile, supabaseConfig)
        
        if (uploadResult.success && uploadResult.publicUrl) {
          finalImageUrl = uploadResult.publicUrl
          console.log('✅ Image uploaded to Supabase:', finalImageUrl)
        } else {
          console.error('❌ Supabase upload failed:', uploadResult.error)
          return { success: false, error: `Image upload failed: ${uploadResult.error}` }
        }
      } catch (supabaseError) {
        console.warn('⚠️ Supabase not configured, using placeholder image')
        console.error('❌ Supabase configuration error:', supabaseError)
        
        // Use a local fallback image when Supabase is not configured
        finalImageUrl = '/images/product-placeholder.png'
        console.log('📷 Using local fallback image:', finalImageUrl)
      }
    }

    console.log('🔐 Getting auth token...')
    const cookieStore = cookies()
    const token = cookieStore.get('access_token')?.value

    console.log('🔐 Token exists:', !!token)

    if (!token) {
      console.error('❌ No authentication token found')
      return { success: false, error: 'Authentication required' }
    }

    const requestData = {
      name: name.trim(),
      price: parseFloat(price),
      category: parseInt(category),
      brand: parseInt(brand), 
      description: description?.trim() || 'No description provided',
      short_description: description?.trim() || 'No description provided',
      sku: sku?.trim() || `SKU-${Date.now()}`, 
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      condition: 'new',
      weight: 1.0,
      dimensions: '10x10x10', 
      image_url: finalImageUrl, 
      track_stock: true,
      stock_quantity: 10,
      low_stock_threshold: 5,
      is_active: true,
      is_featured: false,
      is_digital: false,
      meta_title: name,
      meta_description: description?.trim() || 'No description provided'
    }

    console.log('📦 Product payload:', requestData)

    console.log('🌐 Calling backend API...')
    
    // Create FormData for backend
    const backendFormData = new FormData()
    backendFormData.append('name', requestData.name)
    backendFormData.append('price', requestData.price.toString())
    backendFormData.append('category', requestData.category.toString())
    backendFormData.append('brand', requestData.brand.toString())
    backendFormData.append('description', requestData.description)
    backendFormData.append('short_description', requestData.short_description)
    backendFormData.append('sku', requestData.sku)
    backendFormData.append('slug', requestData.slug)
    backendFormData.append('condition', requestData.condition)
    backendFormData.append('weight', requestData.weight.toString())
    backendFormData.append('dimensions', requestData.dimensions)
    backendFormData.append('track_stock', requestData.track_stock.toString())
    backendFormData.append('stock_quantity', requestData.stock_quantity.toString())
    backendFormData.append('low_stock_threshold', requestData.low_stock_threshold.toString())
    backendFormData.append('is_active', requestData.is_active.toString())
    backendFormData.append('is_featured', requestData.is_featured.toString())
    backendFormData.append('is_digital', requestData.is_digital.toString())
    backendFormData.append('meta_title', requestData.meta_title)
    backendFormData.append('meta_description', requestData.meta_description)
    
    // Re-attach the image file for backend processing
    if (imageFile && imageFile.size > 0) {
      backendFormData.append('image', imageFile)
    }

    console.log('🔍 FRONTEND DEBUG: Sending FormData to backend')
    console.log('📁 FormData entries:')
    for (let [key, value] of backendFormData.entries()) {
      if (value instanceof File) {
        console.log(`   ${key}: File(${value.name}, ${value.size} bytes, ${value.type})`)
      } else {
        console.log(`   ${key}: ${value}`)
      }
    }
    console.log('🔐 Authorization: Bearer [token]')
    console.log('🌐 URL:', `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/products/create/`)

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/products/create/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type - let browser set it for FormData
      },
      body: backendFormData,
    })

    console.log('📡 API response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Backend API error:', response.status, errorText)
      console.error('❌ Request data that failed:', JSON.stringify(requestData, null, 2))
      
      try {
        const errorData = JSON.parse(errorText)
        console.error('❌ Error details:', errorData)
        return { 
          success: false, 
          error: `Backend error (${response.status}): ${errorData.detail || errorData.message || errorText}` 
        }
      } catch {
        return { success: false, error: `Backend error (${response.status}): ${errorText}` }
      }
    }

    const result = await response.json()
    console.log('✅ Product created successfully with Supabase image:', result)

    return {
      success: true,
      message: 'Product created successfully with Supabase image!',
      data: result
    }

  } catch (error) {
    console.error('💥 Upload error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Upload failed' 
    }
  }
}
