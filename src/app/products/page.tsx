'use client';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Clapperboard, Music, Palette, Tv } from 'lucide-react';
import Link from 'next/link';

const iconMap: { [key: string]: React.ElementType } = {
  'Netflix Premium': Clapperboard,
  'Spotify Premium': Music,
  'Canva Pro': Palette,
  'Prime Video': Tv,
  default: Clapperboard,
};

export default function ProductsPage() {
  const firestore = useFirestore();
  const productsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'subscriptions')) : null),
    [firestore]
  );
  const { data: products, isLoading } = useCollection(productsQuery);

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-grow container mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="font-headline text-4xl font-extrabold tracking-tighter sm:text-5xl">
            All Subscriptions
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Browse our full catalog of premium digital subscriptions.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
          {!isLoading && products?.map((product) => {
            const Icon = iconMap[product.name] || iconMap.default;
            return (
              <Link key={product.id} href={`/products/${product.id}`}>
                <Card
                  className="flex flex-col h-full overflow-hidden rounded-2xl border-border/10 bg-card/50 backdrop-blur-xl transition-transform duration-300 hover:-translate-y-2 hover:shadow-2xl"
                >
                  <CardHeader className="flex-row items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                      <Icon className="h-6 w-6 text-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <div className="text-4xl font-bold">
                       {product.variants?.length > 0 ? 'From ' : ''}{product.price}
                      <span className="text-base font-normal text-muted-foreground"> PKR/ month</span>
                    </div>
                    <CardDescription className="mt-2">
                      Full access, no restrictions. Billed monthly.
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
