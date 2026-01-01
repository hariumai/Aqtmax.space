'use client';
import { useState, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, and, or } from 'firebase/firestore';
import ProductCard from '@/components/product-card';
import { ProductFilters, ViewMode } from '@/components/product-filters';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export default function ProductsPage() {
  const firestore = useFirestore();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;

    let q = query(collection(firestore, 'subscriptions'));
    
    // Client-side filtering will be applied after fetching
    return q;
  }, [firestore]);
  
  const { data: allProducts, isLoading } = useCollection(productsQuery);

  const filteredProducts = useMemo(() => {
    if (!allProducts) return [];

    return allProducts.filter(product => {
      const isInCategory = selectedCategories.length === 0 || selectedCategories.includes(product.categoryId);
      
      const hasVariants = product.variantMatrix && product.variantMatrix.length > 0;
      let price = product.price;

      if (hasVariants) {
        const lowestPrice = product.variantMatrix
            ?.filter((c: any) => c.inStock)
            .reduce((min: number, c: any) => (c.price < min ? c.price : min), Infinity);
         price = lowestPrice === Infinity ? product.price : lowestPrice;
      }

      const isInPriceRange = price >= priceRange[0] && price <= priceRange[1];

      return isInCategory && isInPriceRange;
    });
  }, [allProducts, selectedCategories, priceRange]);


  const handleFilterChange = (filters: { categories?: string[], price?: [number, number] }) => {
    if (filters.categories !== undefined) {
      setSelectedCategories(filters.categories);
    }
    if (filters.price !== undefined) {
      setPriceRange(filters.price);
    }
  };

  return (
    <main className="flex-grow container mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center mb-8">
        <h1 className="font-headline text-4xl font-extrabold tracking-tighter sm:text-5xl">
          All Subscriptions
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          Browse our full catalog of premium digital subscriptions.
        </p>
      </div>

      <ProductFilters 
        onFilterChange={handleFilterChange}
        onViewChange={setViewMode}
        initialPriceRange={priceRange}
      />
      
      <div className={cn(
          "mt-8 grid gap-4 md:gap-6",
          viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'
      )}>
        {isLoading &&
          Array.from({ length: 8 }).map((_, i) => (
             <Skeleton key={i} className="h-96 w-full" />
          ))}
        {!isLoading && filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} viewMode={viewMode} />
        ))}
         {!isLoading && filteredProducts.length === 0 && (
          <div className="col-span-full text-center py-16">
            <p className="text-lg text-muted-foreground">No products match your filters.</p>
          </div>
        )}
      </div>
    </main>
  );
}
