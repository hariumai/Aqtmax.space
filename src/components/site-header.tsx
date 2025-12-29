import { Gem } from 'lucide-react';
import Link from 'next/link';

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-center px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Gem className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold tracking-tighter text-foreground">
            SubLime
          </span>
        </Link>
        <nav className="flex items-center gap-4">
          {/* Future nav links can go here */}
        </nav>
      </div>
    </header>
  );
}
