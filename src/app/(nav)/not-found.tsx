'use client';
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Frown } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function NotFound() {
  return (
    <main className="flex-grow flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center shadow-2xl animate-fade-in">
             <CardHeader>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                    <Frown className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-3xl font-extrabold tracking-tight">404 - Page Not Found</CardTitle>
                <CardDescription className="pt-2">
                    Oops! The page you are looking for does not exist. It might have been moved or deleted.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                    Let&apos;s get you back on track.
                </p>
            </CardContent>
            <CardFooter className="flex justify-center gap-4">
                <Button asChild>
                    <Link href="/">Return Home</Link>
                </Button>
                <Button asChild variant="outline">
                    <Link href="/products">Browse Products</Link>
                </Button>
            </CardFooter>
        </Card>
    </main>
  )
}
