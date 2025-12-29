import { Clapperboard, Music, Palette, Tv } from 'lucide-react';
import { Button } from './ui/button';

const categories = [
  { name: 'Entertainment', icon: Clapperboard },
  { name: 'Music', icon: Music },
  { name: 'Productivity', icon: Palette },
  { name: 'Streaming', icon: Tv },
];

export default function CategorySection() {
  return (
    <section id="categories" className="py-16 md:py-24">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">
            Browse by Category
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Find exactly what you need from our curated categories.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4 lg:gap-6">
          {categories.map((category) => (
            <div
              key={category.name}
              className="group relative rounded-3xl border border-border/10 bg-card/50 p-6 text-center transition-all duration-300 hover:bg-card/70 hover:scale-105 hover:shadow-2xl"
            >
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                  <category.icon className="h-8 w-8" />
                </div>
              </div>
              <h3 className="mt-6 font-semibold">{category.name}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
