'use client';
import { Badge } from '@/components/ui/badge';
import { Button } from './ui/button';
import { ArrowRight, ShoppingCart } from 'lucide-react';
import DelayedLink from './delayed-link';

const floatingItems = [
    { id: 1, style: { top: '10%', left: '5%', animationDelay: '0s' } },
    { id: 2, style: { top: '20%', left: '80%', animationDelay: '1s' } },
    { id: 3, style: { top: '70%', left: '15%', animationDelay: '2s' } },
    { id: 4, style: { top: '80%', left: '90%', animationDelay: '0.5s' } },
];

export default function HeroSection() {

  return (
    <section className="relative w-full overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32">
       <div className="absolute inset-0 z-0 opacity-50">
          <div className="absolute inset-0 bg-background"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0,hsl(var(--primary)/0.1),transparent_40%)]"></div>
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background to-transparent"></div>
          {floatingItems.map((item) => (
            <div
                key={item.id}
                className="absolute w-32 h-32 bg-primary/10 rounded-full filter blur-3xl animate-float"
                style={item.style}
            />
          ))}
       </div>

      <div className="container relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1">
          <div className="flex flex-col items-center text-center">
            <Badge variant="outline" className="mb-6 border-primary/30 bg-primary/10 text-primary backdrop-blur-sm">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Your Marketplace for Digital Subscriptions
            </Badge>

            <h1 className="font-headline text-4xl font-extrabold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
              Premium Subscriptions,
              <br />
              <span className="relative inline-block">
                <span className="absolute inset-x-0 bottom-0 h-1/2 bg-primary/20 [filter:blur(40px)]"></span>
                <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                    Simplified.
                </span>
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              Access your favorite digital services like Netflix, Spotify, and more at unbeatable prices. Instant delivery, 24/7 support.
            </p>

            <div className="mt-8 flex flex-col items-center gap-4">
               <Button size="lg" asChild>
                <DelayedLink href="/u/r2/div/products">
                    Browse Products <ArrowRight className="ml-2 h-5 w-5" />
                </DelayedLink>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <DelayedLink href="/u/r2/div/categories">
                    View Categories
                </DelayedLink>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
