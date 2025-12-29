'use client';
import { useAuth, useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { collection, query, where } from 'firebase/firestore';

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
    await auth?.signOut();
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
                    <li key={order.id} className="py-3">
                       <p>Order ID: {order.id}</p>
                       <p>Date: {new Date(order.orderDate).toLocaleDateString()}</p>
                       <p>Status: {order.status}</p>
                       <p>Subscription ID: {order.subscriptionId}</p>
                    </li>
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
