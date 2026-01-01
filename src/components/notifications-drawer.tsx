'use client';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, deleteDoc, doc, query, writeBatch, orderBy } from 'firebase/firestore';
import { Bell, BellOff, Trash } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Skeleton } from './ui/skeleton';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export function NotificationsDrawer() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const notificationsQuery = useMemoFirebase(
    () => (firestore && user ? query(collection(firestore, 'users', user.uid, 'notifications'), orderBy('createdAt', 'desc')) : null),
    [firestore, user]
  );
  const { data: notifications, isLoading } = useCollection(notificationsQuery);
  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  useEffect(() => {
    if (isSheetOpen && firestore && user && notifications && unreadCount > 0) {
      const batch = writeBatch(firestore);
      notifications.filter(n => !n.read).forEach(n => {
        const notifRef = doc(firestore, 'users', user.uid, 'notifications', n.id);
        batch.update(notifRef, { read: true });
      });
      batch.commit().catch(console.error);
    }
  }, [isSheetOpen, firestore, user, notifications, unreadCount]);

  return (
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              {unreadCount}
            </span>
          )}
          <span className="sr-only">Open Notifications</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col pr-0 sm:max-w-lg">
        <SheetHeader className="px-6">
          <SheetTitle>Notifications</SheetTitle>
        </SheetHeader>
        <Separator />
        {isLoading && (
          <div className="flex-1 px-6 space-y-4 pt-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        )}
        {!isLoading && (!notifications || notifications.length === 0) ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center px-6">
            <BellOff className="h-16 w-16 text-muted-foreground" />
            <h3 className="text-xl font-semibold">No notifications yet</h3>
            <p className="text-muted-foreground">Important updates will appear here.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6">
            <ul className="divide-y divide-border -mx-6">
              {notifications?.map(notif => (
                <li key={notif.id}>
                  <SheetClose asChild>
                    <Link href={notif.href || '#'} className="block">
                      <div className="p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start gap-4">
                          {!notif.read && <div className="h-2 w-2 rounded-full bg-primary mt-1.5 flex-shrink-0 animate-pulse"></div>}
                          <div className={cn("flex-1", notif.read && "pl-4")}>
                            <p className="text-sm text-foreground">{notif.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {notif.createdAt ? formatDistanceToNow(notif.createdAt.toDate(), { addSuffix: true }) : ''}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </SheetClose>
                </li>
              ))}
            </ul>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
