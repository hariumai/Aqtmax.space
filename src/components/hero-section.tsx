'use client';
import { Badge } from '@/components/ui/badge';
import { Button } from './ui/button';
import { ArrowRight } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative w-full overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12">
          <div className="z-10 flex flex-col justify-center text-center lg:text-left">
            <div className="flex justify-center lg:justify-start gap-2 mb-4">
              <Badge variant="outline" className="border-primary/50 text-primary">Cheapest Provider</Badge>
              <Badge variant="outline">2025</Badge>
            </div>
            <h1 className="font-headline text-4xl font-extrabold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
              Premium Subscriptions,
              <br />
              <span className="text-primary">Simplified.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-md text-lg text-muted-foreground lg:mx-0">
              Access your favorite digital services like Netflix, Spotify, and more at unbeatable prices. Instant delivery, 24/7 support.
            </p>
            <div className="mt-8 flex justify-center gap-4 lg:justify-start">
              <Button size="lg">
                Browse Products <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
