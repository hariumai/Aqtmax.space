'use client';
import { useAuth, useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { collection, query, doc, where } from 'firebase/firestore';
import { useDoc } from '@/firebase';
import { Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

function OrderItem({ order }: { order: any }) {
  const itemNames = order.items.map((item: any) => item.subscriptionName).join(', ');

  return (
    <li className="py-4 flex justify-between items-center">
      <div>
        <p className="font-semibold">{itemNames}</p>
        <p className="text-sm text-muted-foreground">Order Date: {new Date(order.orderDate.toDate()).toLocaleDateString()}</p>
        <Badge variant={order.status === 'completed' ? 'default' : 'secondary'} className="capitalize mt-1">{order.status}</Badge>
      </div>
      <div className="text-right">
        <p className="font-semibold">{order.totalAmount.toFixed(2)} PKR</p>
        {order.creditUsed > 0 && <p className="text-xs text-primary">-{order.creditUsed.toFixed(2)} credits</p>}
      </div>
    </li>
  );
}

export default function ProfilePage() {
  const { user, isUserLoading, userError } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const firestore = useFirestore();

  const userRef = useMemoFirebase(() => (firestore && user ? doc(firestore, 'users', user.uid) : null), [firestore, user]);
  const { data: userData } = useDoc(userRef);

  const ordersQuery = useMemoFirebase(
    () => (firestore && user ? query(collection(firestore, 'orders'), where('userId', '==', user.uid)) : null),
    [firestore, user]
  );
  const { data: orders, isLoading: isLoadingOrders } = useCollection(ordersQuery);

  if (isUserLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    router.replace('/login');
    return null;
  }
  
  const getInitials = (name?: string | null) => {
    if (!name) return '';
    return name.split(' ').map((n) => n[0]).join('');
  }

  const handleSignOut = async () => {
    if (auth) {
      await auth.signOut();
    }
    router.push('/');
  };

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-grow container mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={user.photoURL ?? ''} />
                    <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-2xl">{user.displayName || 'User'}</CardTitle>
                    <CardDescription>{user.email}</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button onClick={handleSignOut} variant="destructive">
                Sign Out
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>My Orders</CardTitle>
              <CardDescription>
                Here is a list of your recent subscription orders.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingOrders && <p>Loading orders...</p>}
              {!isLoadingOrders && orders && orders.length > 0 ? (
                <ul className="divide-y divide-border">
                  {orders.map((order) => (
                    <OrderItem key={order.id} order={order} />
                  ))}
                </ul>
              ) : (
                <div className="text-center py-8">
                    <p className="text-muted-foreground">You have not placed any orders yet.</p>
                    <Button asChild variant="link" className="mt-2">
                        <Link href="/products">Start Shopping</Link>
                    </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
