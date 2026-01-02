'use client';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, writeBatch, query, orderBy, doc, where, Timestamp } from 'firebase/firestore';
import { Bell, BellOff, Trash, Smartphone, Monitor } from 'lucide-react';
import DelayedLink from './delayed-link';
import { useEffect, useState, useMemo } from 'react';
import { Skeleton } from './ui/skeleton';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

function parseUserAgent(userAgent: string) {
    let browserName = 'Unknown Browser';
    let osName = 'Unknown OS';

    // OS Detection
    if (userAgent.indexOf("Win") != -1) osName = "Windows";
    if (userAgent.indexOf("Mac") != -1) osName = "macOS";
    if (userAgent.indexOf("Linux") != -1) osName = "Linux";
    if (userAgent.indexOf("Android") != -1) osName = "Android";
    if (userAgent.indexOf("like Mac") != -1) osName = "iOS";

    // Browser Detection
    if (userAgent.indexOf("Chrome") != -1) browserName = "Chrome";
    else if (userAgent.indexOf("Safari") != -1 && userAgent.indexOf("Chrome") == -1) browserName = "Safari";
    else if (userAgent.indexOf("Firefox") != -1) browserName = "Firefox";
    else if (userAgent.indexOf("MSIE") != -1 || userAgent.indexOf("Trident/") != -1) browserName = "Internet Explorer";

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

    return { browserName, osName, isMobile };
}


export function NotificationsDrawer() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const thirtyDaysAgoTimestamp = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return Timestamp.fromDate(d);
  }, []);

  const notificationsQuery = useMemoFirebase(
    () => (firestore && user ? query(
        collection(firestore, 'users', user.uid, 'notifications'), 
        where('createdAt', '>=', thirtyDaysAgoTimestamp),
        orderBy('createdAt', 'desc')
    ) : null),
    [firestore, user, thirtyDaysAgoTimestamp]
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

  const handleClearAll = async () => {
    if (!firestore || !user || !notifications || notifications.length === 0) return;
    
    const batch = writeBatch(firestore);
    notifications.forEach(n => {
        const notifRef = doc(firestore, 'users', user.uid, 'notifications', n.id);
        batch.delete(notifRef);
    });
    await batch.commit().catch(console.error);
  }

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
      <SheetContent side="bottom" className="w-full h-auto max-h-[80vh] rounded-t-2xl p-0 flex flex-col bg-background/95 backdrop-blur-xl">
        <SheetHeader className="p-6 pb-4">
          <SheetTitle>Notifications</SheetTitle>
          <SheetDescription>Your recent account updates and alerts.</SheetDescription>
        </SheetHeader>
        <Separator />
        {isLoading && (
          <div className="flex-1 px-6 space-y-4 py-4">
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
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center p-6 h-48">
            <BellOff className="h-16 w-16 text-muted-foreground" />
            <h3 className="text-xl font-semibold">No notifications yet</h3>
            <p className="text-muted-foreground">Important updates will appear here.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <ul className="divide-y divide-border">
              {notifications?.map(notif => {
                  const agentInfo = notif.browser ? parseUserAgent(notif.browser) : null;
                  const DeviceIcon = agentInfo?.isMobile ? Smartphone : Monitor;
                  return (
                    <li key={notif.id}>
                      <SheetClose asChild>
                        <DelayedLink href={notif.href || '#'} className="block">
                          <div className="p-4 hover:bg-muted/50 transition-colors">
                            <div className="flex items-start gap-4">
                              {!notif.read && <div className="h-2 w-2 rounded-full bg-primary mt-1.5 flex-shrink-0 animate-pulse"></div>}
                              <div className={cn("flex-1", notif.read && "pl-4")}>
                                <p className="text-sm text-foreground">{notif.message}</p>
                                <div className='flex items-center gap-4 text-xs text-muted-foreground mt-1'>
                                    <p>
                                    {notif.createdAt ? formatDistanceToNow(notif.createdAt.toDate(), { addSuffix: true }) : ''}
                                    </p>
                                    {agentInfo && (
                                        <div className="flex items-center gap-1">
                                            <DeviceIcon className="h-3 w-3" />
                                            <span>{agentInfo.browserName} on {agentInfo.osName}</span>
                                        </div>
                                    )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </DelayedLink>
                      </SheetClose>
                    </li>
                  );
              })}
            </ul>
          </div>
        )}
        {notifications && notifications.length > 0 && (
            <>
                <Separator />
                <div className="p-4">
                    <Button variant="ghost" className="w-full text-destructive hover:text-destructive" onClick={handleClearAll}>
                        <Trash className="mr-2 h-4 w-4" /> Clear All Notifications
                    </Button>
                </div>
            </>
        )}
      </SheetContent>
    </Sheet>
  );
}
