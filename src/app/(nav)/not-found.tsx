'use client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Link2Off } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="flex-grow flex items-center justify-center p-4">
        <div className="flex flex-col items-center text-center max-w-md w-full animate-fade-in">
            <div className="relative mb-8">
                <span className="absolute -z-10 text-[200px] font-extrabold text-primary/10 -top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    404
                </span>
                <Link2Off className="h-24 w-24 text-primary animate-float" />
            </div>
            
            <h1 className="text-4xl font-extrabold tracking-tight mb-4">
                Page Not Found
            </h1>
            <p className="text-muted-foreground mb-8">
                Oops! The page you’re looking for seems to have gotten lost in the digital void.
            </p>
            <div className="flex justify-center gap-4">
                <Button asChild size="lg">
                    <Link href="/">Return Home</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                    <Link href="/products">Browse Products</Link>
                </Button>
            </div>
        </div>
    </main>
  );
}
    