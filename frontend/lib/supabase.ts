import { createClient } from '@supabase/supabase-js'
import { apiClient } from './api'

const supabaseUrl = 'https://your-project.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'demo-key'

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface ProductUploadData {
  name: string
  price: number
  category: string
  image_url: string
  description?: string
  sku?: string
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '') 
    .replace(/\s+/g, '-') 
    .replace(/-+/g, '-') 
    .trim()
}

export async function uploadProductImage(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${Math.random()}.${fileExt}`
  const filePath = `product-images/${fileName}`


  const { data, error } = await supabase.storage
    .from('product-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`)
  }


  const { data: { publicUrl } } = supabase.storage
    .from('product-images')
    .getPublicUrl(filePath)

  return publicUrl
}

export async function saveProductToDatabase(productData: ProductUploadData) {
  
  const slug = generateSlug(productData.name)

  const categoryId = 1 
  const brandId = 1 

  const apiProductData = {
    name: productData.name,
    slug: slug,
    sku: productData.sku || `${slug.toUpperCase()}-001`,
    short_description: productData.description || productData.name,
    description: productData.description,
    price: productData.price.toString(),
    category: categoryId,
    brand: brandId,
    condition: 'new',
    weight: '1.0',
    dimensions: '10x10x10',
    track_stock: true,
    stock_quantity: 100,
    low_stock_threshold: 10,
    is_active: true,
    is_featured: false,
    is_digital: false,
    image_url: productData.image_url
  }

  try {
    const response = await apiClient.createProduct(apiProductData)
    return response
  } catch (error) {
    console.error('Database save error:', error)
    throw error
  }
}
