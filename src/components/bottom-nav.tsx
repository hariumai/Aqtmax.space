'use client';
import { useUser } from '@/firebase';
import { cn } from '@/lib/utils';
import { Home, LayoutGrid, Menu, Shapes, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from './ui/button';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/products', label: 'Products', icon: LayoutGrid },
  { href: '/categories', label: 'Categories', icon: Shapes },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useUser();

  const getHref = (href: string) => {
    if (href === '/profile') {
      return user ? '/profile' : '/login';
    }
    return href;
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 z-50 w-full h-16 bg-background/80 border-t border-border/10 backdrop-blur-lg">
      <div className="grid h-full max-w-lg grid-cols-2 mx-auto font-medium">
        <Link
          href="/"
          className="inline-flex flex-col items-center justify-center px-5 hover:bg-muted/50 group"
        >
          <Home
            className={cn(
              'w-5 h-5 mb-1 text-muted-foreground group-hover:text-primary',
              pathname === '/' && 'text-primary'
            )}
          />
          <span
            className={cn(
              'text-xs text-muted-foreground group-hover:text-primary',
              pathname === '/' && 'text-primary'
            )}
          >
            Home
          </span>
        </Link>
        <Sheet>
          <SheetTrigger asChild>
            <div
              className="inline-flex flex-col items-center justify-center px-5 hover:bg-muted/50 group cursor-pointer"
            >
              <Menu
                className={'w-5 h-5 mb-1 text-muted-foreground group-hover:text-primary'}
              />
              <span
                className={'text-xs text-muted-foreground group-hover:text-primary'}
              >
                Menu
              </span>
            </div>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl">
            <SheetHeader className="mb-6">
                <SheetTitle className="text-center">Menu</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-2">
                {navItems.map((item) => {
                    if (item.href === '/') return null;
                    return (
                        <Button asChild key={item.label} variant="ghost" className="justify-start gap-3">
                            <Link href={item.href}>
                                <item.icon className="h-5 w-5 text-muted-foreground" />
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        </Button>
                    );
                })}
                <Button asChild variant="ghost" className="justify-start gap-3">
                    <Link href={getHref('/profile')}>
                        <User className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">Account</span>
                    </Link>
                </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
