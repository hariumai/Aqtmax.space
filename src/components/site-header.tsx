'use client';
import { Gem, LogOut, ShoppingCart, Bell } from 'lucide-react';
import Link from 'next/link';
import { Button } from './ui/button';
import { useAuth, useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { collection, query, orderBy, where } from 'firebase/firestore';
import { CartDrawer } from './cart-drawer';
import { NotificationsDrawer } from './notifications-drawer';

export default function SiteHeader() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const firestore = useFirestore();

  const menuItemsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'menuItems'), orderBy('order')) : null),
    [firestore]
  );
  const { data: navLinks } = useCollection(menuItemsQuery);

  

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleSignOut = async () => {
    if (auth) {
      await auth.signOut();
    }
    router.push('/');
  };

  const getInitials = (name?: string | null) => {
    if (!name) return '';
    return name.split(' ').map((n) => n[0]).join('');
  }

  return (
    <header className={cn(
      "fixed top-0 z-50 w-full transition-all duration-300 ease-in-out",
      scrolled ? 'border-b border-border/10 bg-background/80 backdrop-blur-lg' : 'bg-transparent'
    )}>
      <div className="container mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-start flex-1">
            <nav className="hidden items-center gap-6 md:flex">
                {navLinks?.map(link => (
                    <Link key={link.id} href={link.href} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                        {link.label}
                    </Link>
                ))}
            </nav>
        </div>
        
        <div className="flex items-center justify-center">
            <Link href="/" className="flex items-center gap-2">
            <Gem className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold tracking-tighter text-foreground">
                AQT Max
            </span>
            </Link>
        </div>

        <div className="flex items-center justify-end flex-1 gap-2">
          {isUserLoading ? (
            <div className="h-10 w-24 animate-pulse rounded-md bg-muted" />
          ) : user ? (
            <>
            <CartDrawer />
            <NotificationsDrawer />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10 border-2 border-primary/50">
                    <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? 'User'} />
                    <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/profile')}>
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Button asChild variant="ghost">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Get Started</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
