'use server'

import { createClient } from '@supabase/supabase-js'
import { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_SUPABASE_BUCKET } from '@/lib/env'

interface SupabaseConfig {
  url: string
  anonKey: string
}

export async function uploadImageToSupabase(
  file: File
) {
  console.log('🚀 Supabase upload starting...')
  
  try {
    const url = NEXT_PUBLIC_SUPABASE_URL
    const anonKey = NEXT_PUBLIC_SUPABASE_ANON_KEY
    const bucketName = NEXT_PUBLIC_SUPABASE_BUCKET
    
    if (!file || !url || !anonKey) {
      console.error('❌ Missing required parameters')
      return { 
        success: false, 
        error: 'File, Supabase URL, and Anon Key are required' 
      }
    }

    console.log('📁 File info:', {
      name: file.name,
      size: file.size,
      type: file.type
    })

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      console.error('❌ Invalid file type:', file.type)
      return { 
        success: false, 
        error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' 
      }
    }

    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      console.error('❌ File too large:', file.size)
      return { 
        success: false, 
        error: 'File too large. Maximum size is 5MB.' 
      }
    }

    console.log('✅ File validation passed')

    const supabase = createClient(url, anonKey)

    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${fileName}`

    console.log('📤 Uploading to Supabase Storage:', bucketName, filePath)

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      })

    if (error) {
      console.error('❌ Supabase upload error:', error)
      return { 
        success: false, 
        error: `Upload failed: ${error.message}` 
      }
    }

    console.log('✅ File uploaded to Supabase:', data)

    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath)

    console.log('🔗 Generated public URL:', publicUrl)

    return {
      success: true,
      filePath: data.path,
      publicUrl: publicUrl,
      fileName: fileName,
      message: 'Image uploaded to Supabase successfully!'
    }

  } catch (error) {
    console.error('💥 Supabase upload error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Supabase upload failed' 
    }
  }
}

export async function testSupabaseConnection() {
  console.log('🔗 Testing Supabase connection...')
  
  try {
    const url = NEXT_PUBLIC_SUPABASE_URL
    const anonKey = NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!url || !anonKey) {
      return { 
        success: false, 
        error: 'Supabase URL and Anon Key are required' 
      }
    }

    const supabase = createClient(url, anonKey)

    const { data, error } = await supabase.storage.listBuckets()

    if (error) {
      console.error('❌ Supabase connection failed:', error)
      return { 
        success: false, 
        error: `Connection failed: ${error.message}` 
      }
    }

    console.log('✅ Supabase connection successful')
    console.log('📦 Available buckets:', data?.map(b => b.name))

    return {
      success: true,
      message: 'Supabase connection successful',
      buckets: data?.map(b => b.name) || []
    }

  } catch (error) {
    console.error('💥 Supabase connection error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Connection failed' 
    }
  }
}
