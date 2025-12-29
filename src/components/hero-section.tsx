'use client';
import { Badge } from '@/components/ui/badge';
import { Button } from './ui/button';
import { ArrowRight, ShoppingCart } from 'lucide-react';
import { Card, CardContent } from './ui/card';

export default function HeroSection() {
  return (
    <section className="relative w-full overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32">
       <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-background"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0,hsl(var(--primary)/0.1),transparent_40%)]"></div>
       </div>

      <div className="container relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1">
          <div className="flex flex-col items-center text-center">
            <Badge variant="outline" className="mb-6 border-primary/30 bg-primary/10 text-primary">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Your Marketplace for Digital Subscriptions
            </Badge>

            <h1 className="font-headline text-4xl font-extrabold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
              Premium Subscriptions,
              <br />
              <span className="relative inline-block">
                <span className="absolute inset-0 -z-10 animate-fade-in [animation-delay:400ms] bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                  Simplified.
                </span>
                <span className="animate-fade-in [animation-delay:200ms]">Simplified.</span>
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground animate-fade-in [animation-delay:600ms]">
              Access your favorite digital services like Netflix, Spotify, and more at unbeatable prices. Instant delivery, 24/7 support.
            </p>

            <div className="mt-8 flex justify-center gap-4 animate-fade-in [animation-delay:800ms]">
              <Button size="lg" asChild>
                <a href="#products">
                  Browse Products <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
            </div>
          </div>
        </div>

        <div className="relative mt-16 md:mt-24 animate-fade-in [animation-delay:1000ms]">
            <Card className="overflow-hidden rounded-2xl border-none bg-gradient-to-br from-primary/10 via-card to-card p-0.5 shadow-2xl shadow-primary/10">
                <CardContent className="p-0">
                    <div className="relative aspect-[16/9] w-full">
                        <video 
                            className="absolute inset-0 h-full w-full object-cover" 
                            src="https://cdn.dribbble.com/userupload/14022838/file/original-044073351980838128328c68380e2270.mp4" 
                            autoPlay 
                            loop 
                            muted 
                            playsInline
                        />
                         <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent"></div>
                    </div>
                </CardContent>
            </Card>
        </div>

      </div>
    </section>
  );
}
