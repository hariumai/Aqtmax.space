
'use client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Frown } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-8 bg-background p-4 text-center">
      <div className="relative">
        <h1
          className="relative z-10 text-[15vw] font-black leading-none text-foreground md:text-[150px] animate-fade-in"
        >
          404
        </h1>
        <div className="absolute inset-0 -z-10 bg-gradient-to-tr from-primary via-primary to-blue-400 bg-clip-text text-transparent opacity-20 [filter:blur(40px)]"></div>
        <Frown className="absolute left-1/2 top-1/2 z-20 h-1/4 w-1/4 -translate-x-1/2 -translate-y-1/2 text-primary/50 animate-float" />
      </div>
      <div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <h2 className="text-3xl font-extrabold tracking-tight">
          Oops! Page Lost in Cyberspace.
        </h2>
        <p className="max-w-md text-muted-foreground">
          It seems the page you were looking for has taken a detour. Let’s get you back on track.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
        <Button asChild size="lg">
          <Link href="/u/r2/div">Return to Homepage</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/u/r2/div/products">Explore All Products</Link>
        </Button>
      </div>
    </main>
  );
}
