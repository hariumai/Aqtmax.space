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

const mainNavItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/products', label: 'Products', icon: LayoutGrid },
  { href: '/categories', label: 'Categories', icon: Shapes },
];

const menuSheetItems = [
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
      <div className="grid h-full max-w-lg grid-cols-4 mx-auto font-medium">
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
      </div>
    </div>
  );
}
