import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Search } from 'lucide-react'
import SiteHeader from '@/components/site-header'
import SiteFooter from '@/components/site-footer'

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen">
        <SiteHeader />
        <main className="flex-grow flex items-center justify-center text-center">
            <div className="space-y-4">
                <Search className="inline-block h-16 w-16 text-muted-foreground" />
                <h1 className="text-6xl font-black text-primary">404</h1>
                <h2 className="text-3xl font-bold tracking-tighter">Page Not Found</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                    Oops! The page you are looking for does not exist. It might have been moved or deleted.
                </p>
                <div className="flex justify-center gap-4">
                    <Button asChild>
                        <Link href="/">Return Home</Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href="/products">Browse Products</Link>
                    </Button>
                </div>
            </div>
        </main>
        <SiteFooter />
    </div>
  )
}
