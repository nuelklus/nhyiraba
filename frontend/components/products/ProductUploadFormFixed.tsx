'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Upload, X, Loader2 } from 'lucide-react'
import { uploadProductFinal } from '@/app/actions/upload-final'
import { getCategories, getBrands } from '@/app/actions/get-data'
import { useRouter } from 'next/navigation'

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(100, 'Name too long'),
  price: z.string().min(1, 'Price is required').refine((val) => {
    const num = parseFloat(val)
    return !isNaN(num) && num > 0
  }, 'Price must be a valid positive number'),
  category: z.string().min(1, 'Category is required'),
  brand: z.string().min(1, 'Brand is required'),
  description: z.string().optional(),
  sku: z.string().optional(),
})

export default function ProductUploadFormFixed() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [uploadStatus, setUploadStatus] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [brands, setBrands] = useState<any[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const router = useRouter()

  useEffect(() => {
    console.log('🔄 ProductUploadFormFixed: Component mounted, fetching data...')
    const fetchData = async () => {
      try {
        console.log('📡 Calling getCategories and getBrands...')
        const [categoriesResult, brandsResult] = await Promise.all([
          getCategories(),
          getBrands()
        ])

        console.log('📦 Categories result:', categoriesResult)
        console.log('📦 Brands result:', brandsResult)

        if (categoriesResult.success) {
          setCategories(categoriesResult.data)
          console.log('✅ Categories loaded:', categoriesResult.data.length)
        } else {
          console.error('❌ Categories failed:', categoriesResult.error)
        }
        
        if (brandsResult.success) {
          setBrands(brandsResult.data)
          console.log('✅ Brands loaded:', brandsResult.data.length)
        } else {
          console.error('❌ Brands failed:', brandsResult.error)
        }
      } catch (error) {
        console.error('💥 Error fetching data:', error)
      } finally {
        setIsLoadingData(false)
        console.log('🏁 Data fetching completed')
      }
    }

    fetchData()
  }, [])

  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      price: '',
      category: '',
      brand: '',
      description: '',
      sku: '',
    },
  })

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      console.log('📁 File selected:', file.name, file.type, file.size)
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        console.error('❌ Invalid file type:', file.type)
        setUploadStatus('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.')
        return
      }
      
      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024
      if (file.size > maxSize) {
        console.error('❌ File too large:', file.size)
        setUploadStatus('File too large. Maximum size is 5MB.')
        return
      }
      
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        try {
          const result = reader.result as string
          if (result && result.startsWith('data:image/')) {
            setPreviewUrl(result)
            console.log('✅ File preview generated successfully')
          } else {
            console.error('❌ Invalid file result')
            setUploadStatus('Invalid image file')
          }
        } catch (error) {
          console.error('❌ Error reading file:', error)
          setUploadStatus('Error reading file')
        }
      }
      reader.onerror = () => {
        console.error('❌ FileReader error')
        setUploadStatus('Error reading file')
      }
      reader.readAsDataURL(file)
    }
  }

  const clearFile = () => {
    setSelectedFile(null)
    setPreviewUrl('')
    setUploadStatus('')
  }

  const onSubmit = async (values: z.infer<typeof productSchema>) => {
    console.log('🔥🔥🔥 FIXED UPLOAD FORM STARTING')
    setIsSubmitting(true)
    setUploadStatus('')

    try {
      const formData = new FormData()
      if (selectedFile) {
        formData.append('image', selectedFile)
      }
      formData.append('name', values.name)
      formData.append('price', values.price)
      formData.append('category', values.category)
      formData.append('brand', values.brand)
      formData.append('description', values.description || '')
      formData.append('sku', values.sku || '')

      console.log('📤 Calling FINAL Server Action...')

      const result = await uploadProductFinal(formData)

      console.log('📡 FINAL Server Action result:', result)

      if (!result.success) {
        form.setError('root', { message: result.error || 'Upload failed' })
        return
      }

      console.log('✅ FINAL upload successful!')
      setUploadStatus('Product created successfully! Redirecting...')

      form.reset()
      clearFile()

      setTimeout(() => {
        router.push('/products?success=Product created successfully')
      }, 2000)

    } catch (error) {
      console.error('💥 FIXED upload error:', error)
      form.setError('root', { message: 'Upload failed. Please try again.' })
    } finally {
      setIsSubmitting(false)
      console.log('🏁 FIXED form submission completed')
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Product (WITH IMAGE UPLOAD)</CardTitle>
          <CardDescription>
            Add a new product to your inventory with image support.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter product name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (GHS)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingData}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={isLoadingData ? "Loading categories..." : "Select a category"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingData}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={isLoadingData ? "Loading brands..." : "Select a brand"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {brands.map((brand) => (
                          <SelectItem key={brand.id} value={brand.id.toString()}>
                            {brand.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter product description" 
                        className="resize-none" 
                        rows={4}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Auto-generated if empty" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {}
              <div className="space-y-2">
                <Label>Product Image</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  {previewUrl ? (
                    <div className="space-y-4">
                      <img 
                        src={previewUrl} 
                        alt="Preview" 
                        className="max-h-48 mx-auto rounded-lg"
                      />
                      <div className="text-sm text-blue-600">
                        📤 Image will be uploaded to Supabase when you create the product
                      </div>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={clearFile}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Remove Image
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Upload className="w-12 h-12 mx-auto text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, GIF, WebP up to 5MB
                        </p>
                      </div>
                      <Input 
                        type="file" 
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="max-w-xs mx-auto"
                      />
                    </div>
                  )}
                </div>
              </div>

              {form.formState.errors.root && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-700">
                    {form.formState.errors.root.message}
                  </p>
                </div>
              )}

              {uploadStatus && (
                <div className={`p-4 rounded-lg ${
                  uploadStatus.includes('failed') ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'
                }`}>
                  <p className={`text-sm ${
                    uploadStatus.includes('failed') ? 'text-red-700' : 'text-green-700'
                  }`}>
                    {uploadStatus}
                  </p>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Product...
                  </>
                ) : (
                  '🖼️ Create Product with Image'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
