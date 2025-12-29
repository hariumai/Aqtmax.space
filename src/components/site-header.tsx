import { Gem } from 'lucide-react';
import Link from 'next/link';
import { Button } from './ui/button';

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/10 bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Gem className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold tracking-tighter text-foreground">
            SubLime
          </span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/#products" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Products
          </Link>
          <Link href="/#categories" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Categories
          </Link>
          <Link href="/#how-it-works" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            How It Works
          </Link>
        </nav>
        <div className="flex items-center gap-4">
            <Button variant="ghost">Sign In</Button>
            <Button>Sign Up</Button>
        </div>
      </div>
    </header>
  );
}
