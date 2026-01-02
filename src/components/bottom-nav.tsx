'use client';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { cn } from '@/lib/utils';
import { Gem, Home, LayoutGrid, Menu, Shapes, User, ArrowRight, Sun, Moon, Phone, MoreHorizontal } from 'lucide-react';
import { usePathname } from 'next/navigation';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
  SheetClose,
} from '@/components/ui/sheet';
import { Button } from './ui/button';
import { collection, query, orderBy } from 'firebase/firestore';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import DelayedLink from './delayed-link';
import Link from 'next/link';

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useUser();
  const firestore = useFirestore();
  const { theme, setTheme } = useTheme();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const menuItemsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'menuItems'), orderBy('order')) : null),
    [firestore]
  );
  const { data: menuItems } = useCollection(menuItemsQuery);

  const IconMap: { [key: string]: React.ElementType } = {
    'Home': Home,
    'Products': LayoutGrid,
    'Categories': Shapes,
    'Support': Phone,
    'Account': User,
    'Menu': Menu
  };

  const defaultNavItems = [
    { id: 'home', href: '/u/r2/div', label: 'Home', icon: Home, order: 1 },
    { id: 'products', href: '/u/r2/div/products', label: 'Products', icon: LayoutGrid, order: 2 },
    { id: 'categories', href: '/u/r2/div/categories', label: 'Categories', icon: Shapes, order: 3 },
  ];

  const navItems = menuItems && menuItems.length > 0
    ? menuItems.map(item => ({...item, icon: IconMap[item.label] || Home }))
    : defaultNavItems;
  navItems.sort((a,b) => (a.order ?? 99) - (b.order ?? 99));

  // Manually add Account item
  const accountItem = { id: 'account', href: user ? '/u/r2/div/profile' : '/login', label: 'Account', icon: User, order: 4 };

  // Show first 3 items from config.
  const mainNavItems = navItems.slice(0, 3);
  // Place Account link after the main items.
  mainNavItems.push(accountItem);

  // Everything else goes in the overflow.
  const overflowNavItems = navItems.slice(3);


  const getHref = (href: string) => {
    if (href === '/profile') {
      return user ? '/u/r2/div/profile' : '/login';
    }
    return href;
  };
  
  if (pathname.startsWith('/admin') || !isMounted) {
    return null;
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 z-50 w-full h-16 bg-background/80 border-t border-border backdrop-blur-lg">
      <div className="grid h-full max-w-lg grid-cols-5 mx-auto font-medium">
        {mainNavItems.map(item => {
             const Icon = item.icon || Home;
             const itemPath = getHref(item.href);
             return (
             <DelayedLink
             key={item.id}
             href={itemPath}
             className="inline-flex flex-col items-center justify-center px-5 hover:bg-muted/50 group"
           >
             <Icon
               className={cn(
                 'w-5 h-5 mb-1 text-muted-foreground transition-colors group-hover:text-primary',
                 pathname === itemPath && 'text-primary'
               )}
             />
             <span
               className={cn(
                 'text-xs text-muted-foreground transition-colors group-hover:text-primary',
                 pathname === itemPath && 'text-primary'
               )}
             >
               {item.label}
             </span>
           </DelayedLink>
        )})}
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
                <button
                    type="button"
                    className="inline-flex flex-col items-center justify-center px-5 hover:bg-muted/50 group"
                >
                    <MoreHorizontal className="w-5 h-5 mb-1 text-muted-foreground transition-colors group-hover:text-primary" />
                    <span className="text-xs text-muted-foreground transition-colors group-hover:text-primary">More</span>
                </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="w-full h-auto rounded-t-2xl p-0 bg-background/95 backdrop-blur-xl">
                  <SheetHeader className="sr-only">
                    <SheetTitle>Menu</SheetTitle>
                    <SheetDescription>Main navigation menu for the application.</SheetDescription>
                  </SheetHeader>
                 <div className="flex flex-col gap-6 p-6">
                        <div className="flex justify-between items-center">
                           <SheetClose asChild>
                            <DelayedLink href="/u/r2/div" className="flex items-center gap-2">
                                <Gem className="h-6 w-6 text-primary" />
                                <span className="text-xl font-bold tracking-tighter">AQT Max</span>
                            </DelayedLink>
                           </SheetClose>
                        </div>
                        <nav className="flex flex-col gap-4">
                        {overflowNavItems.map(link => (
                           <SheetClose asChild key={link.id}>
                            <DelayedLink href={link.href} className="text-lg font-medium text-foreground hover:text-primary transition-colors">
                                {link.label}
                            </DelayedLink>
                           </SheetClose>
                        ))}
                        </nav>
                        
                        <Button
                            variant="outline"
                            size="lg"
                            className="w-full justify-center"
                            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                        >
                            <Sun className="h-6 w-6 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                            <Moon className="absolute h-6 w-6 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                            <span className="ml-2">
                                {theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                            </span>
                        </Button>
                        
                        {!user && (
                          <div className="flex flex-col gap-2 border-t pt-6 mt-2">
                              <SheetClose asChild>
                                <Button asChild size="lg">
                                    <DelayedLink href="/signup">Get Started <ArrowRight className="ml-2 h-4 w-4" /></DelayedLink>
                                </Button>
                              </SheetClose>
                              <SheetClose asChild>
                                <Button asChild variant="ghost">
                                    <DelayedLink href="/login">Sign In</DelayedLink>
                                </Button>
                              </SheetClose>
                          </div>
                        )}
                    </div>
            </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
