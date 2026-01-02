'use client';
import { Card } from '@/components/ui/card';
import { useCollection, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { Clapperboard, Music, Palette, Tv } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/product-card';
import DelayedLink from '@/components/delayed-link';

const categoryIconMap: { [key: string]: React.ElementType } = {
    Entertainment: Clapperboard,
    Music: Music,
    Productivity: Palette,
    Streaming: Tv,
    default: Clapperboard,
};

export default function CategoryPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const firestore = useFirestore();
  
  const categoryRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'categories', id) : null),
    [firestore, id]
  );
  const { data: category, isLoading: isLoadingCategory } = useDoc(categoryRef);

  const productsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'subscriptions'), where('categoryId', '==', id)) : null),
    [firestore, id]
  );
  const { data: products, isLoading: isLoadingProducts } = useCollection(productsQuery);

  const CategoryIcon = category ? categoryIconMap[category.name] || categoryIconMap.default : null;

  return (
    <main className="flex-grow container mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      {isLoadingCategory && <CategoryPageSkeleton />}
      {!isLoadingCategory && category && (
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
              {CategoryIcon && <CategoryIcon className="h-12 w-12 text-primary animate-float" />}
          </div>
          <h1 className="font-headline text-4xl font-extrabold tracking-tighter sm:text-5xl">
            {category.name}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Browse subscriptions in the {category.name} category.
          </p>
        </div>
      )}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoadingProducts &&
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="flex flex-col h-full overflow-hidden rounded-2xl p-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-muted animate-pulse" />
                <div className="h-6 w-3/4 rounded bg-muted animate-pulse" />
              </div>
              <div className="mt-4 h-8 w-1/2 rounded bg-muted animate-pulse" />
              <div className="mt-2 h-4 w-full rounded bg-muted animate-pulse" />
            </Card>
          ))}
        {!isLoadingProducts && products?.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      {!isLoadingProducts && products?.length === 0 && (
          <div className="text-center col-span-full">
              <p className="text-muted-foreground">No products found in this category.</p>
              <Button asChild variant="link" className="mt-4">
                  <DelayedLink href="/u/r2/div/products">View all products</DelayedLink>
              </Button>
          </div>
      )}
    </main>
  );
}

function CategoryPageSkeleton() {
    return (
        <>
            <div className="text-center mb-12">
                <div className="flex justify-center mb-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                </div>
                <Skeleton className="h-12 w-1/2 mx-auto" />
                <Skeleton className="h-6 w-3/4 mx-auto mt-4" />
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i} className="flex flex-col h-full overflow-hidden rounded-2xl p-4">
                        <div className="flex items-center gap-4">
                        <Skeleton className="h-12 w-12 rounded-xl" />
                        <Skeleton className="h-6 w-3/4" />
                        </div>
                        <Skeleton className="mt-4 h-8 w-1/2" />
                        <Skeleton className="mt-2 h-4 w-full" />
                    </Card>
                ))}
            </div>
      </>
    )
}
