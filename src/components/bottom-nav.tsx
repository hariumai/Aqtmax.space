'use client';
import { useUser } from '@/firebase';
import { cn } from '@/lib/utils';
import { Gem, Home, LayoutGrid, Menu, Shapes, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from './ui/button';

const mainNavItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/products', label: 'Products', icon: LayoutGrid },
  { href: '/categories', label: 'Categories', icon: Shapes },
];

const menuSheetItems = [
    ...mainNavItems,
    { href: "/#how-it-works", label: "How It Works" },
]


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
      <div className="grid h-full max-w-lg grid-cols-5 mx-auto font-medium">
        {mainNavItems.map(item => (
             <Link
             key={item.label}
             href={item.href}
             className="inline-flex flex-col items-center justify-center px-5 hover:bg-muted/50 group"
           >
             <item.icon
               className={cn(
                 'w-5 h-5 mb-1 text-muted-foreground group-hover:text-primary',
                 pathname === item.href && 'text-primary'
               )}
             />
             <span
               className={cn(
                 'text-xs text-muted-foreground group-hover:text-primary',
                 pathname === item.href && 'text-primary'
               )}
             >
               {item.label}
             </span>
           </Link>
        ))}
        <Link
            href={getHref('/profile')}
            className="inline-flex flex-col items-center justify-center px-5 hover:bg-muted/50 group"
        >
            <User
            className={cn(
                'w-5 h-5 mb-1 text-muted-foreground group-hover:text-primary',
                (pathname === '/profile' || pathname === '/login') && 'text-primary'
            )}
            />
            <span
            className={cn(
                'text-xs text-muted-foreground group-hover:text-primary',
                (pathname === '/profile' || pathname === '/login') && 'text-primary'
            )}
            >
            Account
            </span>
        </Link>
        <Sheet>
            <SheetTrigger asChild>
                <button
                    type="button"
                    className="inline-flex flex-col items-center justify-center px-5 hover:bg-muted/50 group"
                >
                    <Menu className="w-5 h-5 mb-1 text-muted-foreground group-hover:text-primary" />
                    <span className="text-xs text-muted-foreground group-hover:text-primary">Menu</span>
                </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="w-full h-auto rounded-t-2xl">
                 <div className="flex flex-col gap-6 p-6">
                        <Link href="/" className="flex items-center gap-2">
                            <Gem className="h-6 w-6 text-primary" />
                            <span className="text-xl font-bold tracking-tighter">SubLime</span>
                        </Link>
                        <nav className="flex flex-col gap-4">
                        {menuSheetItems.map(link => (
                            <Link key={link.href} href={link.href} className="text-lg font-medium text-foreground hover:text-primary">
                                {link.label}
                            </Link>
                        ))}
                        </nav>
                        {!user && (
                          <div className="flex flex-col gap-2 border-t pt-6">
                              <Button asChild>
                                  <Link href="/signup">Sign Up</Link>
                              </Button>
                              <Button asChild variant="ghost">
                                  <Link href="/login">Sign In</Link>
                              </Button>
                          </div>
                        )}
                    </div>
            </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
