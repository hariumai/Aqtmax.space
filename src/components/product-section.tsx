import Link from 'next/link';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Clapperboard, Music, Palette, Tv, ArrowRight } from 'lucide-react';

const products = [
  {
    id: 'netflix',
    name: 'Netflix Premium',
    price: '$4.99',
    duration: '/ month',
    icon: Clapperboard,
  },
  {
    id: 'spotify',
    name: 'Spotify Premium',
    price: '$3.99',
    duration: '/ month',
    icon: Music,
  },
  {
    id: 'canva',
    name: 'Canva Pro',
    price: '$5.99',
    duration: '/ month',
    icon: Palette,
  },
  {
    id: 'prime-video',
    name: 'Prime Video',
    price: '$2.99',
    duration: '/ month',
    icon: Tv,
  },
];

export default function ProductSection() {
  return (
    <section id="products" className="py-16 md:py-24 bg-card/20">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">
            Our Top Subscriptions
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Hand-picked for the best value and quality.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <Link key={product.id} href={`/products/${product.id}`}>
              <Card
                className="flex flex-col h-full overflow-hidden rounded-3xl border-border/10 bg-card/50 backdrop-blur-lg transition-transform duration-300 hover:-translate-y-2 hover:shadow-2xl"
              >
                <CardHeader className="flex-row items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                    <product.icon className="h-6 w-6 text-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="text-4xl font-bold">
                    {product.price}
                    <span className="text-base font-normal text-muted-foreground">{product.duration}</span>
                  </div>
                  <CardDescription className="mt-2">
                    Full access, no restrictions. Billed monthly.
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
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
