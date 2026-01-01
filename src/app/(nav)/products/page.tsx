'use client';
import { Card } from '@/components/ui/card';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import ProductCard from '@/components/product-card';

export default function ProductsPage() {
  const firestore = useFirestore();
  const productsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'subscriptions')) : null),
    [firestore]
  );
  const { data: products, isLoading } = useCollection(productsQuery);

  return (
    <main className="flex-grow container mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="font-headline text-4xl font-extrabold tracking-tighter sm:text-5xl">
          All Subscriptions
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          Browse our full catalog of premium digital subscriptions.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {isLoading &&
          Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="flex flex-col h-full overflow-hidden rounded-2xl p-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-muted animate-pulse" />
                <div className="h-6 w-3/4 rounded bg-muted animate-pulse" />
              </div>
              <div className="mt-4 h-8 w-1/2 rounded bg-muted animate-pulse" />
              <div className="mt-2 h-4 w-full rounded bg-muted animate-pulse" />
            </Card>
          ))}
        {!isLoading && products?.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </main>
  );
}
