'use client';
import { useAuth, useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { collection, query, doc } from 'firebase/firestore';
import { useDoc } from '@/firebase';

function OrderItem({ order }: { order: any }) {
  const firestore = useFirestore();
  const subscriptionRef = useMemoFirebase(
    () => (firestore && order.subscriptionId ? doc(firestore, 'subscriptions', order.subscriptionId) : null),
    [firestore, order.subscriptionId]
  );
  const { data: subscription, isLoading } = useDoc(subscriptionRef);

  if (isLoading) {
    return <li className="py-3">Loading order details...</li>;
  }

  return (
    <li className="py-4 flex justify-between items-center">
      <div>
        <p className="font-semibold">{subscription ? subscription.name : `Subscription ID: ${order.subscriptionId}`}</p>
        <p className="text-sm text-muted-foreground">Order Date: {new Date(order.orderDate).toLocaleDateString()}</p>
        <p className="text-sm text-muted-foreground">Status: <span className="capitalize">{order.status}</span></p>
      </div>
      {subscription && <p className="font-semibold">{subscription.price.toFixed(2)} PKR</p>}
    </li>
  );
}

export default function ProfilePage() {
  const { user, isUserLoading, userError } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const firestore = useFirestore();

  const ordersQuery = useMemoFirebase(
    () => (firestore && user ? query(collection(firestore, 'users', user.uid, 'orders')) : null),
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
                <p>You have not placed any orders yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
