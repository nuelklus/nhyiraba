'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { 
  Wrench, 
  Zap, 
  Droplet, 
  Home, 
  Hammer,
  Shield,
  Lightbulb,
  PaintBucket,
  ChevronRight,
  Package
} from 'lucide-react';
import { useCategories, useBrands } from '@/hooks/useProducts';

const getCategoryIcon = (categoryName: string) => {
  const name = categoryName.toLowerCase();
  if (name.includes('power') || name.includes('drill') || name.includes('saw')) return <Zap className="h-5 w-5" />;
  if (name.includes('hand') || name.includes('hammer') || name.includes('wrench')) return <Hammer className="h-5 w-5" />;
  if (name.includes('electrical') || name.includes('light') || name.includes('wire')) return <Lightbulb className="h-5 w-5" />;
  if (name.includes('plumbing') || name.includes('pipe') || name.includes('water')) return <Droplet className="h-5 w-5" />;
  if (name.includes('safety') || name.includes('protect') || name.includes('gear')) return <Shield className="h-5 w-5" />;
  if (name.includes('building') || name.includes('cement') || name.includes('material')) return <Home className="h-5 w-5" />;
  if (name.includes('paint') || name.includes('color') || name.includes('coating')) return <PaintBucket className="h-5 w-5" />;
  return <Package className="h-5 w-5" />;
};

export const HardwareNavigation: React.FC = () => {
  const { categories, loading: categoriesLoading } = useCategories();
  const { brands, loading: brandsLoading } = useBrands();
  const [departments, setDepartments] = useState<any[]>([]);


  useEffect(() => {
    if (!categoriesLoading && categories.length > 0) {
      const parentCategories = categories.filter(cat => !cat.parent);
      
      const paintCategory = categories.find(cat => cat.slug === 'paint');
      
      const departmentsData = parentCategories.map(category => {
        const subCategories = categories
          .filter(cat => cat.parent === category.id)
          .slice(0, 4);
        
        const href = `/products?category=${category.slug}`;
        const subCategoriesHrefs = subCategories.map(subCat => ({
          name: subCat.name,
          href: `/products?category=${subCat.slug}`
        }));
        
        
        return {
          id: category.id,
          title: category.name,
          slug: category.slug,
          icon: getCategoryIcon(category.name),
          description: category.description || `${category.name} and supplies`,
          href: href,
          categories: subCategoriesHrefs,
          featured: []
        };
      });

      setDepartments(departmentsData);
    }
  }, [categories, categoriesLoading]);

  if (categoriesLoading) {
    return (
      <NavigationMenu className="hidden lg:flex">
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger className="text-gray-700 hover:text-brand-pink font-medium bg-transparent">
              Shop by Collection
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className="w-[400px] p-6 bg-white">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    );
  }

  return (
    <NavigationMenu className="hidden lg:flex">
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="text-gray-700 hover:text-brand-pink font-medium bg-transparent">
            Shop by Collection
          </NavigationMenuTrigger>
          <NavigationMenuContent className="left-0 right-auto translate-x-0">
            <div className="grid w-[450px] grid-cols-2 gap-4 p-6 bg-white border border-gray-200 shadow-lg max-h-[400px] overflow-y-scroll">
              {departments.map((department) => (
                <div key={department.id} className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="text-brand-pink">
                      {department.icon}
                    </div>
                    <h4 className="font-semibold text-gray-900">{department.title}</h4>
                  </div>
                  <p className="text-sm text-gray-600">{department.description}</p>
                  
                  <NavigationMenuLink asChild>
                    <Link
                      href={department.href}
                      className="block text-sm font-medium text-brand-pink hover:text-brand-pink hover:bg-pink-50 px-2 py-1 rounded transition-colors"
                    >
                      View All {department.title} →
                    </Link>
                  </NavigationMenuLink>
                  
                  {department.categories.length > 0 && (
                    <div className="space-y-2">
                      {department.categories.map((category: any, index: number) => (
                        <NavigationMenuLink asChild key={`${department.id}-${category.name}-${index}`}>
                          <Link
                            href={category.href}
                            className="block text-sm text-gray-700 hover:text-brand-pink hover:bg-pink-50 px-2 py-1 rounded transition-colors"
                          >
                            {category.name}
                          </Link>
                        </NavigationMenuLink>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              
              {departments.length === 0 && (
                <div className="col-span-3 text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No departments available</p>
                  <p className="text-sm text-gray-400 mt-2">Categories loading: {categoriesLoading ? 'Yes' : 'No'}</p>
                  <p className="text-sm text-gray-400 mt-1">Categories count: {categories.length}</p>
                </div>
              )}
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
        {!brandsLoading && brands.length > 0 && (
          <NavigationMenuItem>
            <NavigationMenuTrigger className="text-gray-700 hover:text-brand-pink font-medium bg-transparent">
              Brands
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className="grid w-[600px] grid-cols-3 gap-4 p-6 bg-white">
                {brands.slice(0, 12).map((brand: any, index: number) => (
                  <NavigationMenuLink asChild key={`brand-${brand.id || index}`}>
                    <Link
                      href={`/products?brand=${brand.slug}`}
                      className="block text-sm text-gray-700 hover:text-brand-pink hover:bg-pink-50 px-3 py-2 rounded transition-colors"
                    >
                      {brand.name}
                    </Link>
                  </NavigationMenuLink>
                ))}
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>
        )}
      </NavigationMenuList>
    </NavigationMenu>
  );
};

export default HardwareNavigation;
