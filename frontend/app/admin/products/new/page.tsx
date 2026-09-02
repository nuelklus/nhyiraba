'use client';

import React, { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { adminApi } from '@/lib/admin-api';
import Cookies from 'js-cookie';
import {
  ArrowLeft,
  Upload,
  Save,
  X,
  Plus,
  Trash2,
  Image as ImageIcon
} from 'lucide-react';

function AddProductContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '', 
    price: '',
    stock: '',
    threshold: '',
    category: '',
    brand: '',
    tags: '',
    images: [] as string[],
    specifications: {} as Record<string, string>
  });

  const [newSpec, setNewSpec] = useState({ key: '', value: '' });
  const [newImage, setNewImage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Categories state
  const [categories, setCategories] = useState<{id: number, name: string, slug: string}[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState('');
  
  // Brands state
  const [brands, setBrands] = useState<{id: number, name: string, slug: string}[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [brandsError, setBrandsError] = useState('');

  // Fetch categories from database
  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      setCategoriesError('');
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/products/categories/`);
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      setCategoriesError('Failed to load categories');
      // Fallback to hardcoded categories if API fails
      setCategories([
        { id: 7, name: 'Power Tools', slug: 'power-tools' },
        { id: 8, name: 'Hand Tools', slug: 'hand-tools' },
        { id: 9, name: 'Electrical', slug: 'electrical' },
        { id: 10, name: 'Plumbing', slug: 'plumbing' },
        { id: 11, name: 'Building Materials', slug: 'building-materials' },
        { id: 12, name: 'Safety Equipment', slug: 'safety-equipment' },
        { id: 13, name: 'Tools', slug: 'tools' },
        { id: 14, name: 'Painting', slug: 'painting' },
        { id: 17, name: 'Fasteners', slug: 'fasteners' }
      ]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  // Fetch brands from database
  const fetchBrands = async () => {
    try {
      setBrandsLoading(true);
      setBrandsError('');
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/products/brands/`);
      if (!response.ok) {
        throw new Error('Failed to fetch brands');
      }
      
      const data = await response.json();
      setBrands(data);
    } catch (error) {
      setBrandsError('Failed to load brands');
      // Fallback to hardcoded brands if API fails
      setBrands([
        { id: 9, name: 'DeWalt', slug: 'dewalt' },
        { id: 10, name: 'Bosch', slug: 'bosch' },
        { id: 11, name: 'Makita', slug: 'makita' },
        { id: 12, name: 'Stanley', slug: 'stanley' },
        { id: 13, name: '3M', slug: '3m' },
        { id: 14, name: 'Hilti', slug: 'hilti' }
      ]);
    } finally {
      setBrandsLoading(false);
    }
  };

  // Load categories and brands on component mount
  React.useEffect(() => {
    fetchCategories();
    fetchBrands();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getSKUPreview = (): string => {
    if (!formData.name && !formData.category) return 'Will be generated...';
    
    const categoryPrefixes: Record<string, string> = {
      '7': 'PT',  
      '8': 'HT',  
      '9': 'EL',  
      '10': 'PL', 
      '11': 'BM', 
      '12': 'SE', 
      '13': 'TL', 
      '14': 'PA', 
    };
    
    const prefix = categoryPrefixes[formData.category] || 'PRD';
    const namePart = formData.name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 6);
    
    return namePart ? `${prefix}-${namePart}-XXXX` : `${prefix}-XXXX`;
  };

  const handleAddSpecification = () => {
    if (newSpec.key && newSpec.value) {
      setFormData(prev => ({
        ...prev,
        specifications: {
          ...prev.specifications,
          [newSpec.key]: newSpec.value
        }
      }));
      setNewSpec({ key: '', value: '' });
    }
  };

  const handleRemoveSpecification = (key: string) => {
    setFormData(prev => ({
      ...prev,
      specifications: Object.fromEntries(
        Object.entries(prev.specifications).filter(([k]) => k !== key)
      )
    }));
  };

  const handleAddImage = () => {
    if (newImage) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, newImage]
      }));
      setNewImage('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.');
      return;
    }

    const maxSize = 5 * 1024 * 1024; 
    if (file.size > maxSize) {
      alert('File too large. Maximum size is 5MB.');
      return;
    }

    // Store the file locally - will be uploaded with product creation
    setSelectedFile(file);
    
    // Create a preview URL for display
    const previewUrl = URL.createObjectURL(file);
    setFormData(prev => ({
      ...prev,
      images: [previewUrl]
    }));
    
    console.log('📁 File selected for Supabase upload:', file.name);
    console.log('📏 File size:', (file.size / 1024).toFixed(1), 'KB');
    console.log('🖼️ File type:', file.type);
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const productData = {
        name: formData.name,
        slug: slug, 
        description: formData.description,
        short_description: formData.description.substring(0, 200), 
        
        price: formData.price,
        category: formData.category ? parseInt(formData.category) : null, 
        brand: formData.brand ? parseInt(formData.brand) : 9, 
        stock_quantity: parseInt(formData.stock) || 0,
        low_stock_threshold: parseInt(formData.threshold) || 5,
        image_url: formData.images[0] || null, 
        is_active: true,
        is_featured: false,
        track_stock: true,
        condition: 'new',
        weight: '',
        dimensions: 'Standard', 
        barcode: '',
        cost_price: '',
        is_digital: false,
        
        specifications: Object.entries(formData.specifications).map(([key, value]) => ({
          label: key,
          value: value,
          spec_type: 'technical'
        }))
      };

      // Create FormData for backend
      const backendFormData = new FormData()
      backendFormData.append('name', productData.name)
      backendFormData.append('slug', productData.slug)
      backendFormData.append('description', productData.description)
      backendFormData.append('short_description', productData.short_description)
      backendFormData.append('price', productData.price.toString())
      backendFormData.append('category', productData.category?.toString() || '1')
      backendFormData.append('brand', productData.brand?.toString() || '1')
      backendFormData.append('stock_quantity', productData.stock_quantity.toString())
      backendFormData.append('low_stock_threshold', productData.low_stock_threshold.toString())
      
      // Only add image_url if we don't have a file (blob URLs are invalid)
      if (!selectedFile && productData.image_url) {
        backendFormData.append('image_url', productData.image_url)
      }
      
      backendFormData.append('is_active', productData.is_active.toString())
      backendFormData.append('is_featured', productData.is_featured.toString())
      backendFormData.append('track_stock', productData.track_stock.toString())
      backendFormData.append('condition', productData.condition)
      backendFormData.append('weight', productData.weight || '')
      backendFormData.append('dimensions', productData.dimensions)
      backendFormData.append('barcode', productData.barcode || '')
      backendFormData.append('cost_price', productData.cost_price || '')
      backendFormData.append('is_digital', productData.is_digital.toString())
      
      // Add the image file for Supabase upload
      if (selectedFile) {
        backendFormData.append('image', selectedFile)
      }


      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/products/create/`, {
        method: 'POST',
        headers: {
          // Don't set Content-Type - let browser set it for FormData
          ...(Cookies.get('access_token') && { 'Authorization': `Bearer ${Cookies.get('access_token')}` }),
        },
        body: backendFormData,
        credentials: 'include',
      });

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      

      if (!response.ok) {
        let error;
        if (contentType && contentType.includes('application/json')) {
          error = await response.json();
          console.error('Backend error (JSON):', error);
          throw new Error(error.error || error.detail || JSON.stringify(error) || 'Failed to create product');
        } else {
          const errorText = await response.text();
          console.error('Backend error (HTML/Text):', errorText);
          throw new Error(`Backend error (${response.status}): ${errorText.substring(0, 200)}...`);
        }
      }

      let createdProduct;
      if (contentType && contentType.includes('application/json')) {
        createdProduct = await response.json();
      } else {
        const responseText = await response.text();
        console.error('Non-JSON response:', responseText);
        throw new Error('Backend returned non-JSON response');
      }
      console.log('Product created successfully:', createdProduct);
      console.log('Generated SKU:', createdProduct.sku);

      alert(`Product created successfully!\nGenerated SKU: ${createdProduct.sku}`);

      // Use window.location for fresh page load to show new product immediately
      window.location.href = '/admin/products';
      
    } catch (error: any) {
      console.error('Error creating product:', error);
      alert(error.message || 'Failed to create product');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-8">You don't have permission to access this page.</p>
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/admin/products">
                <Button variant="outline" className="mr-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Products
                </Button>
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Add New Product</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <form onSubmit={handleSubmit} className="space-y-6">
            {}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter product name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SKU (Auto-generated by Backend)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={getSKUPreview()}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-blue-50 text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Will be generated by backend"
                      />
                      <div className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm whitespace-nowrap">
                        🤖 Backend
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      SKU will be automatically generated when you create the product
                    </p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price (GHS) *
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stock Quantity *
                    </label>
                    <input
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={handleInputChange}
                      required
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Low Stock Threshold
                    </label>
                    <input
                      type="number"
                      name="threshold"
                      value={formData.threshold}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                      disabled={categoriesLoading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                      <option value="">
                        {categoriesLoading ? 'Loading categories...' : 'Select a category'}
                      </option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {categoriesError && (
                      <p className="mt-1 text-sm text-red-600">
                        {categoriesError}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Brand *
                    </label>
                    <select
                      name="brand"
                      value={formData.brand}
                      onChange={handleInputChange}
                      required
                      disabled={brandsLoading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                      <option value="">
                        {brandsLoading ? 'Loading brands...' : 'Select a brand'}
                      </option>
                      {brands.map((brand) => (
                        <option key={brand.id} value={brand.id}>
                          {brand.name}
                        </option>
                      ))}
                    </select>
                    {brandsError && (
                      <p className="mt-1 text-sm text-red-600">
                        {brandsError}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    placeholder="e.g., power tools, drill, cordless"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Product Images</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {}
                  <div className="flex flex-col space-y-4">
                    <div className="flex space-x-2">
                      <input
                        type="url"
                        value={newImage}
                        onChange={(e) => setNewImage(e.target.value)}
                        placeholder="Enter image URL"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <Button type="button" onClick={handleAddImage}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add
                      </Button>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-gray-500">OR</div>
                      <Button 
                        type="button" 
                        onClick={triggerFileUpload}
                        disabled={isUploading}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {isUploading ? 'Uploading...' : 'Upload Image'}
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>
                  </div>
                  
                  {}
                  {formData.images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {formData.images.map((image, index) => (
                        <div key={index} className="relative group">
                          <div className="w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                            <img
                              src={image}
                              alt={`Product image ${index + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23f3f4f6"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" font-family="sans-serif" font-size="14" fill="%236b7280"%3EPreview%3C/text%3E%3C/svg%3E';
                              }}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {}
                  {formData.images.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                      <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No images added</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Add images by entering URLs or uploading files
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Specifications</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newSpec.key}
                      onChange={(e) => setNewSpec(prev => ({ ...prev, key: e.target.value }))}
                      placeholder="Specification name"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={newSpec.value}
                      onChange={(e) => setNewSpec(prev => ({ ...prev, value: e.target.value }))}
                      placeholder="Specification value"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Button type="button" onClick={handleAddSpecification}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>
                  
                  {Object.entries(formData.specifications).length > 0 && (
                    <div className="space-y-2">
                      {Object.entries(formData.specifications).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <span className="font-medium text-gray-900">{key}:</span>
                            <span className="ml-2 text-gray-600">{value}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveSpecification(key)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {}
            <div className="flex justify-end space-x-4">
              <Link href="/admin/products">
                <Button variant="outline">Cancel</Button>
              </Link>
              <Button type="submit" disabled={isSubmitting}>
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Creating...' : 'Create Product'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function AddProductPage() {
  return (
    <ProtectedRoute>
      <AddProductContent />
    </ProtectedRoute>
  );
}
