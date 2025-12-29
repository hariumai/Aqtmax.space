'use client';
import { use } from 'react';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCollection, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { Clapperboard, Music, Palette, Tv } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

const iconMap: { [key: string]: React.ElementType } = {
  'Netflix Premium': Clapperboard,
  'Spotify Premium': Music,
  'Canva Pro': Palette,
  'Prime Video': Tv,
  default: Clapperboard,
};

const categoryIconMap: { [key: string]: React.ElementType } = {
    Entertainment: Clapperboard,
    Music: Music,
    Productivity: Palette,
    Streaming: Tv,
    default: Clapperboard,
};

export default function CategoryPage({ params }: { params: { id: string } }) {
  const { id } = use(Promise.resolve(params));
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
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-grow container mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {isLoadingCategory && <CategoryPageSkeleton />}
        {!isLoadingCategory && category && (
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
                {CategoryIcon && <CategoryIcon className="h-12 w-12 text-primary" />}
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
          {!isLoadingProducts && products?.map((product) => {
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
                      ${product.price}
                      <span className="text-base font-normal text-muted-foreground">/ month</span>
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
        {!isLoadingProducts && products?.length === 0 && (
            <div className="text-center col-span-full">
                <p className="text-muted-foreground">No products found in this category.</p>
                <Button asChild variant="link" className="mt-4">
                    <Link href="/products">View all products</Link>
                </Button>
            </div>
        )}
      </main>
      <SiteFooter />
    </div>
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
