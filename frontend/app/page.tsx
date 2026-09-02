'use client';

import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { useInitialData } from '@/hooks/useProducts';
import { useCart } from '@/contexts/CartContext';
import {
  Baby,
  Gift,
  Heart,
  ShieldCheck,
  Sparkles,
  Truck,
  Clock,
  ChevronRight,
  Star,
  MapPin,
  Phone,
  CheckCircle,
  Shirt,
} from 'lucide-react';
import { useState, useCallback, useMemo } from 'react';

const HardwareCard = dynamic(() => import('@/components/products/HardwareCard').then(mod => ({ default: mod.HardwareCard })), {
  loading: () => <div className="animate-pulse bg-gray-200 rounded-lg h-64"></div>,
  ssr: true
});

const ProductCardSkeleton = () => (
  <div className="bg-white rounded-[1.5rem] shadow-md overflow-hidden border border-pink-100">
   <div className="relative aspect-[4/3] bg-gray-200">
     <div className="absolute inset-0 flex items-center justify-center">
       <div className="w-16 h-16 bg-gray-300 rounded-full animate-pulse"></div>
     </div>
   </div>
   <div className="p-6">
     <div className="h-6 bg-gray-200 rounded mb-2"></div>
     <div className="h-4 bg-gray-200 rounded mb-4"></div>
     <div className="h-6 bg-gray-200 rounded mb-4"></div>
     <div className="h-10 bg-gray-200 rounded"></div>
   </div>
  </div>
);

export default function HomePage() {
  const { isAuthenticated, user, logout } = useAuth();
  const { data, loading, error, refetch } = useInitialData();
  const { addToCart } = useCart();
  const [retryCount, setRetryCount] = useState(0);

  const handleQuickAdd = useCallback((productId: string, quantity: number) => {
   if (data?.featured_products) {
     const product = data.featured_products.find((p: any) => p.id.toString() === productId);
     if (product) {
       addToCart(product, quantity);
     }
   }
  }, [data, addToCart]);

  const handleRetry = useCallback(() => {
   setRetryCount(prev => prev + 1);
   refetch();
  }, [refetch]);

  const transformedProducts = useMemo(() => {
   if (!data?.featured_products) return [];

   return data.featured_products.map((product: any, index: number) => {
     let imageUrl = product.image_url || product.image || '/images/no-image-available.svg';

     if (imageUrl && imageUrl.startsWith('/')) {
       const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000';
       imageUrl = `${baseUrl}${imageUrl}`;
     }

     if (!imageUrl) {
       imageUrl = '/images/no-image-available.svg';
     }

     const categoryName = product.category?.name || product.category || 'Baby Essentials';
     const brandName = product.brand?.name || product.brand || 'Trendy Kiddos';
     const productPrice = Number(product.price ?? product.original_price ?? 0);
     const stockStatusValue = product.stock_status?.status || product.stockStatus || 'in_stock';
     const stableId = String(product.id ?? product.slug ?? `product-${index}`);

     return {
       id: stableId,
       name: product.name || 'Premium Baby Essential',
       slug: product.slug || 'premium-baby-essential',
       description: product.short_description || product.description || 'Thoughtful essentials for growing families.',
       price: Number.isFinite(productPrice) ? productPrice : 0,
       currency: 'GHS' as const,
       image: imageUrl,
       category: categoryName,
       brand: brandName,
       rating: 4.8,
       reviewCount: 12,
       technicalSpecs: [
         { label: 'Age', value: '0-24 months', type: 'other' as const },
         { label: 'Material', value: 'Safe & gentle', type: 'material' as const },
       ],
       stockStatus: stockStatusValue === 'in_stock' ? 'in_stock' as const :
         stockStatusValue === 'low_stock' ? 'low_stock' as const : 'out_of_stock' as const,
       warehouse: {
         id: '1',
         name: 'Tema Warehouse',
         location: 'Tema',
         phone: '+233 24 123 4567'
       },
       sku: product.sku || 'TK-STD',
     };
   });
  }, [data]);

  const categoryCards = [
   { name: 'Baby Food', icon: Heart, count: '160+', color: 'bg-pink-100 text-brand-pink' },
   { name: 'Skin & Care', icon: Sparkles, count: '210+', color: 'bg-yellow-100 text-brand-yellow' },
   { name: 'Clothing', icon: Shirt, count: '340+', color: 'bg-green-100 text-brand-green' },
   { name: 'Nursery', icon: Gift, count: '180+', color: 'bg-rose-100 text-brand-pink' },
  ];

  const trustPoints = [
   { title: 'Safe ingredients', description: 'Carefully curated for every stage.', icon: ShieldCheck, tint: 'bg-emerald-50 text-emerald-700' },
   { title: 'Quick delivery', description: 'Fast service across Ghana.', icon: Truck, tint: 'bg-pink-50 text-brand-pink' },
   { title: 'Parent approved', description: 'Loved by families every day.', icon: Baby, tint: 'bg-amber-50 text-amber-700' },
  ];

  const careHighlights = [
   {
     title: 'Gently curated essentials',
     description: 'From feeding to bedtime, every product is chosen for comfort, safety and everyday ease.',
     icon: Heart,
     tint: 'bg-pink-50 text-brand-pink',
   },
   {
     title: 'Trusted quality standards',
     description: 'Thoughtful formulas and premium materials selected for growing families and busy routines.',
     icon: ShieldCheck,
     tint: 'bg-emerald-50 text-brand-green',
   },
   {
     title: 'Designed around family life',
     description: 'Practical favorites, soft textures and modern essentials that fit beautifully into daily life.',
     icon: Sparkles,
     tint: 'bg-amber-50 text-brand-yellow',
   },
  ];

  return (
   <div className="min-h-screen bg-brand-cream text-brand-charcoal">
     <Header />

     <section className="relative overflow-hidden border-b border-pink-100 bg-[#fff9f8] py-16 md:py-20">
       <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(241,39,123,0.12),_transparent_25%),radial-gradient(circle_at_bottom_right,_rgba(115,199,111,0.15),_transparent_22%)]" />
       <div className="container relative mx-auto px-4">
         <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
           <div>
             <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-pink-200 bg-white px-4 py-2 text-sm font-medium text-brand-charcoal shadow-sm">
               <span className="flex h-2.5 w-2.5 rounded-full bg-brand-pink" />
               Premium essentials for growing families
             </div>

             <h1 className="max-w-xl text-4xl font-black leading-[0.96] tracking-[-0.06em] text-brand-charcoal md:text-5xl lg:text-[4rem]">
               Beautiful care for every growing stage.
             </h1>

             <p className="mt-6 max-w-xl text-lg leading-8 text-slate-700">
               Discover premium baby food, gentle skincare, soft clothing and nursery picks designed to make everyday parenting easier, safer and more joyful.
             </p>

             <div className="mt-8 flex flex-col gap-4 sm:flex-row">
               <Link href="/products">
                 <Button size="lg" className="rounded-full bg-brand-pink px-6 text-base font-semibold text-white shadow-[0_12px_24px_rgba(241,39,123,0.2)] transition-transform hover:-translate-y-0.5 hover:bg-brand-pink/90">
                   Shop baby essentials
                   <ChevronRight className="ml-2 h-4 w-4" />
                 </Button>
               </Link>
               <Link href="/products?category=baby-food">
                 <Button size="lg" variant="outline" className="rounded-full border-slate-200 bg-white px-6 text-base font-semibold text-brand-charcoal transition-colors hover:bg-brand-green/10 hover:text-brand-charcoal">
                   Explore new arrivals
                 </Button>
               </Link>
             </div>

             <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-700">
               {trustPoints.map(({ title, icon: Icon, tint }) => (
                 <div key={title} className={`inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-sm ${tint}`}>
                   <Icon className="h-4 w-4" />
                   {title}
                 </div>
               ))}
             </div>
           </div>

           <div className="relative">
             <div className="absolute -left-6 top-5 h-24 w-24 rounded-full bg-brand-yellow/25 blur-2xl" />
             <div className="absolute -bottom-4 right-4 h-28 w-28 rounded-full bg-brand-green/20 blur-2xl" />

             <div className="relative overflow-hidden rounded-[2rem] border border-pink-100 bg-white/85 p-5 shadow-[0_30px_80px_rgba(17,24,39,0.08)] backdrop-blur-sm">
               <div className="grid grid-cols-2 gap-4">
                 <div className="rounded-[1.5rem] border border-pink-100 bg-gradient-to-br from-pink-50 to-rose-100 p-5">
                   <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                     <Baby className="h-6 w-6 text-brand-pink" />
                   </div>
                   <div className="text-sm text-slate-600">Trusted care</div>
                   <div className="mt-2 text-3xl font-black text-brand-charcoal">1,800+</div>
                   <div className="text-xs text-slate-500">happy parents</div>
                 </div>

                 <div className="mt-8 rounded-[1.5rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-lime-100 p-5">
                   <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                     <Heart className="h-6 w-6 text-brand-green" />
                   </div>
                   <div className="text-sm text-slate-600">Loved by families</div>
                   <div className="mt-2 text-3xl font-black text-brand-charcoal">4.9/5</div>
                   <div className="text-xs text-slate-500">average rating</div>
                 </div>

                 <div className="col-span-2 rounded-[1.5rem] border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50 p-5">
                   <div className="flex items-start justify-between gap-3">
                     <div>
                       <div className="text-sm text-slate-600">Parent favourites</div>
                       <div className="mt-2 text-2xl font-black text-brand-charcoal">Bundle & save</div>
                     </div>
                     <div className="rounded-full bg-brand-yellow px-3 py-1 text-xs font-bold text-brand-charcoal">15% OFF</div>
                   </div>

                   <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs text-slate-600">
                     <div className="rounded-xl bg-white px-2 py-3 shadow-sm">
                       <Sparkles className="mx-auto mb-2 h-5 w-5 text-brand-pink" />
                       Skin care
                     </div>
                     <div className="rounded-xl bg-white px-2 py-3 shadow-sm">
                       <Gift className="mx-auto mb-2 h-5 w-5 text-brand-green" />
                       Gifts
                     </div>
                     <div className="rounded-xl bg-white px-2 py-3 shadow-sm">
                       <Shirt className="mx-auto mb-2 h-5 w-5 text-brand-yellow" />
                       Fashion
                     </div>
                   </div>
                 </div>
               </div>
             </div>
           </div>
         </div>
       </div>
     </section>

     <section className="py-20 bg-white">
       <div className="container mx-auto px-4">
         <div className="mb-12 text-center">
           <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-pink">Why parents choose us</p>
           <h2 className="mt-3 text-3xl lg:text-4xl font-black text-brand-charcoal">Care that feels personal, practical and premium</h2>
         </div>

         <div className="grid gap-6 md:grid-cols-3">
           {careHighlights.map(({ title, description, icon: Icon, tint }) => (
             <div key={title} className="group rounded-[1.75rem] border border-pink-100 bg-[#fffaf9] p-7 shadow-[0_16px_40px_rgba(15,23,42,0.04)] transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(15,23,42,0.07)]">
               <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${tint}`}>
                 <Icon className="h-6 w-6" />
               </div>
               <h3 className="text-xl font-bold text-brand-charcoal">{title}</h3>
               <p className="mt-3 text-base leading-7 text-slate-600">{description}</p>
             </div>
           ))}
         </div>
       </div>
     </section>

     <section className="py-16 bg-white">
       <div className="container mx-auto px-4">
         <div className="mb-12 text-center">
           <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-pink">Best sellers</p>
           <h2 className="mt-3 text-3xl lg:text-4xl font-black text-brand-charcoal">Essentials for every growing stage</h2>
         </div>

         <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
           {loading ? (
             Array.from({ length: 3 }).map((_, index) => (
               <ProductCardSkeleton key={index} />
             ))
           ) : error ? (
             <div className="col-span-full text-center py-12">
               <div className="text-red-600 mb-4">
                 <div className="text-lg font-semibold mb-2">Unable to Load Products</div>
                 <div className="text-sm">{error}</div>
               </div>
               <div className="flex justify-center gap-4">
                 <Button onClick={handleRetry} className="bg-brand-pink hover:bg-brand-pink/90 text-white rounded-full">
                   <Clock className="mr-2 h-4 w-4" />
                   Try Again
                 </Button>
                 <Button variant="outline" onClick={() => refetch()} className="rounded-full border-brand-green">
                   Dismiss
                 </Button>
               </div>
               {retryCount > 2 && (
                 <div className="mt-4 text-sm text-gray-500">
                   Showing sample products while we connect to the server...
                 </div>
               )}
             </div>
           ) : transformedProducts.length > 0 ? (
             <>
               {transformedProducts.map((product, index) => (
                 <HardwareCard
                   key={product.id}
                   product={product}
                   onQuickAdd={handleQuickAdd}
                   priority={index < 6}
                 />
               ))}
               {retryCount > 0 && (
                 <div className="col-span-full text-center py-4">
                   <Badge className="bg-brand-green/10 text-brand-charcoal border-brand-green">
                     ✓ Products loaded successfully
                   </Badge>
                 </div>
               )}
             </>
           ) : (
             <div className="col-span-full text-center py-12">
               <div className="text-gray-500 mb-4">No products available</div>
               <Button onClick={handleRetry} className="rounded-full">Refresh</Button>
             </div>
           )}
         </div>

         <div className="text-center">
           <Link href="/products" prefetch={true}>
             <Button size="lg" variant="outline" className="border-brand-pink text-brand-charcoal hover:bg-brand-pink hover:text-white hover:border-brand-pink rounded-full font-semibold">
               View all essentials
               <ChevronRight className="ml-2 h-5 w-5" />
             </Button>
           </Link>
         </div>
       </div>
     </section>

     <section className="py-16 bg-[#fffdfc]">
       <div className="container mx-auto px-4">
         <div className="mb-12 text-center">
           <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-green">Shop by collection</p>
           <h2 className="mt-3 text-3xl lg:text-4xl font-black text-brand-charcoal">Everything your little one needs</h2>
         </div>

         <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
           {categoryCards.map((category) => (
             <Link key={category.name} href={`/products?category=${category.name.toLowerCase().replace(/\s+/g, '-')}`}>
               <div className="group rounded-[1.5rem] border border-pink-100 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
                 <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${category.color}`}>
                   <category.icon className="h-6 w-6" />
                 </div>
                 <h3 className="text-xl font-bold text-brand-charcoal">{category.name}</h3>
                 <p className="mt-2 text-sm text-gray-600">{category.count} curated products</p>
                 <div className="mt-4 inline-flex items-center text-sm font-semibold text-brand-pink">
                   Explore now <ChevronRight className="ml-1 h-4 w-4" />
                 </div>
               </div>
             </Link>
           ))}
         </div>
       </div>
     </section>

     <section className="bg-brand-charcoal py-12">
       <div className="container mx-auto px-4">
         <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
           <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
             <div className="mb-2 text-3xl font-black text-brand-yellow">1,800+</div>
             <div className="text-sm text-gray-300">Happy families</div>
           </div>
           <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
             <div className="mb-2 text-3xl font-black text-brand-yellow">250+</div>
             <div className="text-sm text-gray-300">Premium items</div>
           </div>
           <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
             <div className="mb-2 text-3xl font-black text-brand-yellow">4.9/5</div>
             <div className="text-sm text-gray-300">Customer love</div>
           </div>
           <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
             <div className="mb-2 text-3xl font-black text-brand-yellow">24/7</div>
             <div className="text-sm text-gray-300">Support</div>
           </div>
         </div>
       </div>
     </section>

     <footer className="bg-[#1b1b1d] py-12 text-white">
       <div className="container mx-auto px-4">
         <div className="grid gap-8 md:grid-cols-4">
           <div>
             <div className="mb-6 flex items-center gap-3">
               <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-pink via-brand-rose to-brand-pink shadow-lg shadow-pink-200/20">
                 <span className="text-2xl font-black text-white">T</span>
               </div>
               <div>
                 <h3 className="text-2xl font-black tracking-[-0.05em] text-white">Trendy Kiddos</h3>
                 <p className="text-sm font-semibold text-brand-yellow">Mother &amp; Baby essentials</p>
               </div>
             </div>
             <p className="leading-relaxed text-gray-400">
               Premium baby care, soft fashion and thoughtful essentials for modern families.
             </p>
             <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-gray-300">
               <div className="flex items-center gap-2">
                 <span className="h-2 w-2 rounded-full bg-brand-yellow"></span>
                 Verified products
               </div>
               <div className="flex items-center gap-2">
                 <span className="h-2 w-2 rounded-full bg-brand-green"></span>
                 Safe & gentle
               </div>
             </div>
           </div>

           <div>
             <h4 className="mb-4 text-lg font-semibold">Quick Links</h4>
             <ul className="space-y-2 text-gray-400">
               <li><Link href="/products" className="transition-colors hover:text-brand-yellow">Shop all</Link></li>
               <li><Link href="/products?category=baby-food" className="transition-colors hover:text-brand-yellow">Baby food</Link></li>
               <li><Link href="/products?category=clothing" className="transition-colors hover:text-brand-yellow">Clothing</Link></li>
             </ul>
           </div>

           <div>
             <h4 className="mb-4 text-lg font-semibold">Customer Care</h4>
             <ul className="space-y-2 text-gray-400">
               <li><Link href="/login" className="transition-colors hover:text-brand-yellow">Sign in</Link></li>
               <li><Link href="/register" className="transition-colors hover:text-brand-yellow">Create account</Link></li>
               <li><Link href="/orders" className="transition-colors hover:text-brand-yellow">Order tracking</Link></li>
             </ul>
           </div>

           <div>
             <h4 className="mb-4 text-lg font-semibold">Contact</h4>
             <div className="space-y-3 text-gray-400">
               <div className="flex items-center gap-2">
                 <MapPin className="h-4 w-4 text-brand-yellow" />
                 <span>Tema, Greater Accra, Ghana</span>
               </div>
               <div className="flex items-center gap-2">
                 <Phone className="h-4 w-4 text-brand-yellow" />
                 <span>+233 24 123 4567</span>
               </div>
               <div className="flex items-center gap-2">
                 <Clock className="h-4 w-4 text-brand-yellow" />
                 <span>Mon-Fri: 8AM-6PM</span>
               </div>
             </div>
           </div>
         </div>

         <div className="mt-8 border-t border-gray-800 pt-8 text-center text-gray-400">
           <p>&copy; 2024 Trendy Kiddos. All rights reserved.</p>
         </div>
       </div>
     </footer>
   </div>
  );
}
