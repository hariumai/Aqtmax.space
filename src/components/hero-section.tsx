'use client';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Badge } from '@/components/ui/badge';
import { Button } from './ui/button';
import { ArrowRight } from 'lucide-react';

const floatingCards = PlaceHolderImages.slice(0, 3);

export default function HeroSection() {
  return (
    <section className="relative w-full overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
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
          <div className="relative flex h-80 items-center justify-center lg:h-auto">
            {floatingCards.map((card, index) => {
              const styles = [
                { transform: 'rotate(-15deg) translate(20%, -10%)', zIndex: 10, animationDelay: '0s' },
                { transform: 'rotate(5deg) translate(0, 0)', zIndex: 20, animationDelay: '0.5s' },
                { transform: 'rotate(20deg) translate(-20%, 10%)', zIndex: 1, animationDelay: '1s' },
              ];
              return (
                <div
                  key={card.id}
                  className="absolute w-48 animate-float rounded-2xl shadow-2xl transition-transform duration-300 hover:scale-105 md:w-64"
                  style={styles[index]}
                  data-ai-hint={card.imageHint}
                >
                  <Image
                    src={card.imageUrl}
                    alt={card.description}
                    width={400}
                    height={250}
                    className="rounded-2xl border-2 border-black/20"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
