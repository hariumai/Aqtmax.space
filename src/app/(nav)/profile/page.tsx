
'use client';
import { useAuth, useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { collection, query, doc, where, updateDoc } from 'firebase/firestore';
import { useDoc } from '@/firebase';
import { Info, AlertTriangle, MessageCircle, ShieldX, Bell, Phone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

function OrderItem({ order, settings }: { order: any; settings: any }) {
  const itemNames = order.items.map((item: any) => item.subscriptionName).join(', ');

  return (
    <AccordionItem value={order.id}>
      <AccordionTrigger className="py-4 w-full">
        <div className="flex justify-between items-center w-full">
          <div>
            <p className="font-semibold text-left">{itemNames}</p>
            <p className="text-sm text-muted-foreground text-left">
              Order Date: {new Date(order.orderDate.toDate()).toLocaleDateString()}
            </p>
          </div>
          <div className="text-right">
            <p className="font-semibold">{order.totalAmount.toFixed(2)} PKR</p>
            <Badge variant={order.status === 'completed' ? 'default' : 'secondary'} className="capitalize mt-1">
              {order.status}
            </Badge>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="bg-muted/50 p-4 rounded-md space-y-4">
          {order.status === 'completed' && order.credentials ? (
            <div className='space-y-4'>
               <h4 className="font-semibold">Subscription Details</h4>
               <div className="text-sm space-y-2">
                 <p><strong>Username/Email:</strong> {order.credentials.username}</p>
                 <p><strong>Password:</strong> {order.credentials.password}</p>
               </div>
               <div className="border-l-4 border-destructive pl-4 py-2 bg-destructive/10 text-red-950 dark:text-red-200">
                  <div className="flex items-center gap-2">
                     <AlertTriangle className="h-5 w-5" />
                     <h5 className="font-semibold">Important Account Rules</h5>
                  </div>
                  <ul className="text-xs list-disc pl-5 mt-2">
                    <li>Do not pin a profile.</li>
                    <li>Do not change any account details (password, email, etc.).</li>
                    <li>Violation will result in a permanent ban and no refund.</li>
                  </ul>
               </div>
               {settings?.whatsappNumber && (
                <div className="border-l-4 border-primary pl-4 py-2 bg-primary/10">
                    <div className="flex items-center gap-2">
                        <Phone className="h-5 w-5 text-primary" />
                        <h5 className="font-semibold text-primary">OTP Verification Support</h5>
                    </div>
                    <p className="text-xs mt-2 text-primary/90">
                        If OTP (One-Time Password) verification is needed for login, please contact our support team on WhatsApp at {settings.whatsappNumber}.
                    </p>
                </div>
               )}
               {order.note && (
                <div className="border-t pt-4 mt-4">
                    <h5 className="font-semibold mb-2 flex items-center gap-2"><Info className="h-4 w-4" /> Note from Admin</h5>
                    <p className="text-sm text-muted-foreground italic">"{order.note}"</p>
                </div>
               )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Your order is currently {order.status}. You will find your subscription details here once the order is completed.
            </p>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

function BannedProfile({ user, banInfo, settings, onSignOut }: { user: any, banInfo: any, settings: any, onSignOut: () => void }) {
    const isTemporary = banInfo.type === 'temporary';
    const expirationDate = isTemporary && banInfo.expiresAt ? new Date(banInfo.expiresAt).toLocaleString() : null;
    const firestore = useFirestore();
    const { toast } = useToast();

    const handleAppealRequest = async () => {
        if (!firestore || !user) return;
        const userRef = doc(firestore, 'users', user.uid);
        try {
            await updateDoc(userRef, { 'ban.appealRequested': true });
            toast({
                title: 'Appeal Requested',
                description: 'Our support team will review your case shortly.',
            });
             if (settings?.whatsappNumber) {
               window.open(`https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}`, '_blank');
             }
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not submit your appeal request.',
            });
        }
    };


    return (
        <Card className="mx-auto max-w-lg w-full text-center">
            <CardHeader>
                <div className="flex justify-center">
                    <ShieldX className="h-16 w-16 text-destructive" />
                </div>
                <CardTitle className="text-2xl mt-4">Account Banned</CardTitle>
                <CardDescription>Your account has been {isTemporary ? 'temporarily' : 'permanently'} banned.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="text-left space-y-2 p-4 border rounded-md bg-muted/50">
                    <p><strong>Reason:</strong> {banInfo.reason || 'No reason provided.'}</p>
                    {isTemporary && expirationDate && (
                         <p><strong>Expires:</strong> {expirationDate}</p>
                    )}
                </div>
                <div className="flex flex-col gap-2">
                   {banInfo.appealRequested ? (
                       <Button disabled>
                           <Bell className="mr-2 h-4 w-4" />
                           Appeal Requested
                       </Button>
                   ) : (
                       <Button onClick={handleAppealRequest}>
                           <MessageCircle className="mr-2 h-4 w-4" />
                           Request Appeal
                       </Button>
                   )}
                   <Button onClick={onSignOut} variant="outline">Sign Out</Button>
                </div>
            </CardContent>
        </Card>
    );
}

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const firestore = useFirestore();

  const userRef = useMemoFirebase(() => (firestore && user ? doc(firestore, 'users', user.uid) : null), [firestore, user]);
  const { data: userData, isLoading: isUserDataLoading } = useDoc(userRef);

  const ordersQuery = useMemoFirebase(
    () => (firestore && user ? query(collection(firestore, 'orders'), where('userId', '==', user.uid)) : null),
    [firestore, user]
  );
  const { data: orders, isLoading: isLoadingOrders } = useCollection(ordersQuery);
  
  const settingsRef = useMemoFirebase(() => (firestore ? doc(firestore, 'settings', 'payment') : null), [firestore]);
  const { data: settingsData } = useDoc(settingsRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || isUserDataLoading || !user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }
  
  const getInitials = (name?: string | null) => {
    if (!name) return '';
    return name.split(' ').map((n) => n[0]).join('');
  }

  const handleSignOut = async () => {
    if (auth) {
      await auth.signOut();
    }
  };
  
  const isBanActive = userData?.ban?.isBanned && 
    (
        userData.ban.type === 'permanent' || 
        (userData.ban.type === 'temporary' && userData.ban.expiresAt && new Date(userData.ban.expiresAt) > new Date())
    );

  return (
    <main className="flex-grow container mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 flex items-center justify-center">
      {isBanActive && userData ? (
          <BannedProfile user={user} banInfo={userData.ban} settings={settingsData} onSignOut={handleSignOut} />
      ) : (
        <div className="space-y-8 w-full">
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
            <CardContent className="flex flex-wrap gap-2">
              <Button onClick={handleSignOut} variant="destructive">
                Sign Out
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>My Orders</CardTitle>
              <CardDescription>
                Here is a list of your recent subscription orders. Click an order to see details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingOrders && <p>Loading orders...</p>}
              {!isLoadingOrders && orders && orders.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                  {orders.map((order) => (
                    <OrderItem key={order.id} order={order} settings={settingsData} />
                  ))}
                </Accordion>
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
      )}
    </main>
  );
}
