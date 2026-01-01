'use client';
import { Card } from '@/components/ui/card';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Clapperboard, Music, Palette, Tv } from 'lucide-react';
import Link from 'next/link';

const iconMap: { [key: string]: React.ElementType } = {
  Entertainment: Clapperboard,
  Music: Music,
  Productivity: Palette,
  Streaming: Tv,
  default: Clapperboard,
};

export default function CategoriesPage() {
  const firestore = useFirestore();
  const categoriesQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'categories')) : null),
    [firestore]
  );
  const { data: categories, isLoading } = useCollection(categoriesQuery);

  return (
    <main className="flex-grow container mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="font-headline text-4xl font-extrabold tracking-tighter sm:text-5xl">
          All Categories
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          Find exactly what you need from our curated categories.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:gap-6">
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-6 text-center">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-2xl bg-muted animate-pulse" />
              </div>
              <div className="mt-6 h-6 w-3/4 mx-auto rounded bg-muted animate-pulse" />
            </Card>
          ))}
        {!isLoading && categories?.map((category) => {
          const Icon = iconMap[category.name] || iconMap.default;
          return (
            <Link href={`/u/r2/div/category/${category.id}`} key={category.id}>
              <div
                className="group relative rounded-2xl border border-border/10 bg-card/50 p-6 text-center transition-all duration-300 hover:bg-card/70 hover:scale-105 hover:shadow-2xl backdrop-blur-xl"
              >
                <div className="flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-8 w-8" />
                  </div>
                </div>
                <h3 className="mt-6 font-semibold">{category.name}</h3>
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
