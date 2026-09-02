'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';

export default function DebugHomepage() {
  const [apiData, setApiData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('=== DEBUG HOMEPAGE MOUNTED ===');

    apiClient.getFeaturedProducts()
      .then(data => {
        const firstProduct = (data?.[0] ?? null) as Record<string, any> | null;

        console.log('✅ API SUCCESS - Raw data:', data);
        console.log('✅ First product:', firstProduct);
        console.log('✅ Image fields in first product:', {
          image_url: firstProduct?.image_url,
          primary_image: firstProduct?.primary_image,
          images: firstProduct?.images
        });
        setApiData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('❌ API ERROR:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading API data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">❌ API Error</div>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Debug Homepage</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">API Data Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">Loading:</span> {loading ? 'Yes' : 'No'}
            </div>
            <div>
              <span className="font-medium">Error:</span> {error || 'None'}
            </div>
            <div>
              <span className="font-medium">Products Count:</span> {apiData?.length || 0}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Raw API Data (First Product)</h2>
          {apiData && apiData.length > 0 ? (
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
              {JSON.stringify(apiData[0] as Record<string, any>, null, 2)}
            </pre>
          ) : (
            <p className="text-gray-500">No products found</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Product Cards Test</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {apiData?.slice(0, 3).map((product: any, index: number) => {
              const productData = product as Record<string, any>;

              return (
                <div key={productData.id ?? index} className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">{productData.name}</h3>
                  <p className="text-gray-600 mb-2">{productData.short_description}</p>
                  <p className="text-lg font-bold">GHS {productData.price}</p>

                  <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
                    <div><strong>image_url:</strong> {productData.image_url || 'NULL'}</div>
                    <div><strong>primary_image:</strong> {productData.primary_image ? 'EXISTS' : 'NULL'}</div>
                    {productData.primary_image && (
                      <div><strong>primary_image.image:</strong> {productData.primary_image.image}</div>
                    )}
                  </div>
                </div>
              );
            }) || (
              <p className="text-gray-500">No products to display</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
