
'use client';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, writeBatch } from 'firebase/firestore';
import { useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

export default function NotificationsPage() {
    const { user } = useUser();
    const firestore = useFirestore();

    const notificationsQuery = useMemoFirebase(
        () => (firestore && user ? query(collection(firestore, 'users', user.uid, 'notifications'), orderBy('createdAt', 'desc')) : null),
        [firestore, user]
    );
    const { data: notifications, isLoading } = useCollection(notificationsQuery);

    useEffect(() => {
        if (firestore && user && notifications) {
            const unread = notifications.filter(n => !n.read);
            if (unread.length > 0) {
                const batch = writeBatch(firestore);
                unread.forEach(n => {
                    const notifRef = doc(firestore, 'users', user.uid, 'notifications', n.id);
                    batch.update(notifRef, { read: true });
                });
                batch.commit().catch(console.error);
            }
        }
    }, [firestore, user, notifications]);

    return (
        <main className="flex-grow container mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4 mb-8">
                <Bell className="h-8 w-8 text-primary" />
                <h1 className="font-headline text-4xl font-extrabold tracking-tighter">
                    Notifications
                </h1>
            </div>

            <Card className="p-0">
                {isLoading && (
                    <div className="space-y-2 p-4">
                        {Array.from({length: 3}).map((_, i) => (
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
                {!isLoading && notifications && notifications.length > 0 && (
                    <ul className="divide-y divide-border">
                        {notifications.map(notif => (
                            <li key={notif.id}>
                                <Link href={notif.href || '#'}>
                                    <div className={cn(
                                        "p-4 hover:bg-muted/50 block transition-colors",
                                        !notif.read && "bg-primary/5"
                                    )}>
                                        <div className="flex items-start gap-4">
                                            {!notif.read && <div className="h-2 w-2 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>}
                                            <div className={cn("flex-1", notif.read && "pl-4")}>
                                                <p className="text-sm text-foreground">{notif.message}</p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {notif.createdAt ? formatDistanceToNow(notif.createdAt.toDate(), { addSuffix: true }) : ''}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
                 {!isLoading && (!notifications || notifications.length === 0) && (
                    <div className="flex flex-col items-center justify-center gap-4 p-12 text-center">
                        <BellOff className="h-16 w-16 text-muted-foreground" />
                        <h3 className="text-xl font-semibold">No notifications yet</h3>
                        <p className="text-muted-foreground">Important updates will appear here.</p>
                    </div>
                )}
            </Card>
        </main>
    );
}
