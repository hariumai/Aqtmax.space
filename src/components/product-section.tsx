'use client';
import Link from 'next/link';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle } from './ui/card';
import { ArrowRight } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, limit } from 'firebase/firestore';
import ProductCard from './product-card';


export default function ProductSection() {
  const firestore = useFirestore();
  const productsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'subscriptions'), limit(4)) : null),
    [firestore]
  );
  const { data: products, isLoading } = useCollection(productsQuery);

  return (
    <section id="products" className="py-16 md:py-24 bg-background">
       <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-secondary/30 to-transparent"></div>
      <div className="container relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">
            Our Top Subscriptions
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Hand-picked for the best value and quality.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {isLoading &&
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
          {!isLoading && products?.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        <div className="mt-12 text-center">
          <Button asChild variant="outline">
            <Link href="/products">
              View All Products <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
