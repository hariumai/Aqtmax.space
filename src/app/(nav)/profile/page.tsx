'use client';
import { useAuth, useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { collection, query, doc, where, setDoc } from 'firebase/firestore';
import { useDoc } from '@/firebase';
import { Info, AlertTriangle, MessageCircle, ShieldX, Bell, Phone, User as UserIcon, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { updateProfile } from 'firebase/auth';
import { type Order } from '@/lib/types';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { createNotification } from '@/lib/notifications';

const profileFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  phone: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

function OrderItemRow({ order }: { order: Order }) {
  const itemNames = order.items.map((item: any) => item.subscriptionName).join(', ');

  return (
    <Link href={`/order/details/${order.id}`}>
        <div className="flex justify-between items-center py-4 px-4 hover:bg-muted/50 rounded-lg cursor-pointer">
            <div>
                <p className="font-semibold text-left">{itemNames}</p>
                <p className="text-sm text-muted-foreground text-left">
                {new Date(order.orderDate).toLocaleDateString()}
                </p>
            </div>
            <div className="text-right">
                <p className="font-semibold">{order.totalAmount.toFixed(2)} PKR</p>
                <Badge variant={order.status === 'completed' ? 'default' : 'secondary'} className="capitalize mt-1">
                {order.status}
                </Badge>
            </div>
        </div>
    </Link>
  );
}


function BannedProfile({ user, banInfo, settings, onSignOut }: { user: any, banInfo: any, settings: any, onSignOut: () => void }) {
    const isTemporary = banInfo.type === 'temporary';
    const expirationDate = isTemporary && banInfo.expiresAt ? new Date(banInfo.expiresAt).toLocaleString() : null;
    const firestore = useFirestore();
    const { toast } = useToast();
    const [appealMessage, setAppealMessage] = useState('');
    const MAX_WORDS = 150;
    const wordCount = appealMessage.trim().split(/\s+/).filter(Boolean).length;
    
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        if (banInfo.appealStatus === 'approved' && banInfo.unbanAt) {
            const interval = setInterval(() => {
                const now = new Date();
                const unbanDate = new Date(banInfo.unbanAt);
                const difference = unbanDate.getTime() - now.getTime();
                
                if (difference <= 0) {
                    setTimeLeft('Your account should now be active.');
                    clearInterval(interval);
                    // Optionally, trigger a page reload or state update to unlock the profile
                    window.location.reload();
                    return;
                }

                const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
                const minutes = Math.floor((difference / 1000 / 60) % 60);
                const seconds = Math.floor((difference / 1000) % 60);

                setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [banInfo.appealStatus, banInfo.unbanAt]);

    const handleAppealRequest = async () => {
        if (!firestore || !user) return;
        if (wordCount === 0) {
            toast({
                variant: 'destructive',
                title: 'Appeal Message Required',
                description: 'Please explain why you are appealing.',
            });
            return;
        }

        const userRef = doc(firestore, 'users', user.uid);
        try {
            await setDoc(userRef, { 
                ban: { 
                    appealRequested: true,
                    appealMessage: appealMessage,
                    appealStatus: 'pending',
                } 
            }, { merge: true });
            
            toast({
                title: 'Appeal Submitted',
                description: 'Your appeal is now pending review.'
            });

            await createNotification({
                userId: user.uid,
                message: 'Your appeal has been submitted and is now pending review.',
                href: '/profile'
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
                {banInfo.appealStatus === 'approved' && timeLeft ? (
                    <div className="text-center space-y-2 p-4 border rounded-md bg-green-500/10 text-green-700 dark:text-green-300">
                        <Clock className="h-8 w-8 mx-auto text-green-500" />
                        <h3 className="font-semibold">Appeal Approved!</h3>
                        <p>Your account will be unbanned in:</p>
                        <p className="font-mono text-2xl font-bold">{timeLeft}</p>
                    </div>
                ) : (
                    <div className="text-left space-y-2 p-4 border rounded-md bg-muted/50">
                        <p><strong>Reason:</strong> {banInfo.reason || 'No reason provided.'}</p>
                        {isTemporary && expirationDate && (
                             <p><strong>Expires:</strong> {expirationDate}</p>
                        )}
                         {banInfo.appealDecision && (
                           <p className="border-t pt-2 mt-2"><strong>Admin Note:</strong> {banInfo.appealDecision}</p>
                        )}
                    </div>
                )}
                
                {banInfo.appealStatus !== 'approved' && (
                    <div className="text-sm p-4 border rounded-md bg-primary/10 text-black">
                    If you believe this is a mistake, you can request an appeal. Our team will review your account. For urgent matters, contact us on WhatsApp
                    {settings?.whatsappNumber && ` at ${settings.whatsappNumber}`}.
                    </div>
                )}

                {banInfo.appealStatus !== 'approved' && !banInfo.appealRequested && (
                    <div className="space-y-2 text-left">
                        <Label htmlFor="appeal-message">Your Appeal</Label>
                        <Textarea 
                            id="appeal-message"
                            placeholder="Please explain why you believe this ban is a mistake..."
                            value={appealMessage}
                            onChange={(e) => {
                                const words = e.target.value.trim().split(/\s+/);
                                if (words.length <= MAX_WORDS) {
                                    setAppealMessage(e.target.value);
                                }
                            }}
                            className="min-h-[100px]"
                        />
                        <p className="text-xs text-muted-foreground text-right">{wordCount} / {MAX_WORDS} words</p>
                    </div>
                )}
                
                <div className="flex flex-col gap-2">
                   {banInfo.appealStatus !== 'approved' && (
                       <>
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
                       </>
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
  const { toast } = useToast();

  const userRef = useMemoFirebase(() => (firestore && user ? doc(firestore, 'users', user.uid) : null), [firestore, user]);
  const { data: userData, isLoading: isUserDataLoading } = useDoc(userRef);

  const ordersQuery = useMemoFirebase(
    () => (firestore && user ? query(collection(firestore, 'orders'), where('userId', '==', user.uid)) : null),
    [firestore, user]
  );
  const { data: orders, isLoading: isLoadingOrders } = useCollection<Order>(ordersQuery);
  
  const settingsRef = useMemoFirebase(() => (firestore ? doc(firestore, 'settings', 'payment') : null), [firestore]);
  const { data: settingsData } = useDoc(settingsRef);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: '',
      phone: '',
    },
  });

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (user && userData) {
      form.reset({
        name: user.displayName || '',
        phone: (userData as any).phone || '',
      });
    }
  }, [user, userData, form]);

  async function onSubmit(values: ProfileFormValues) {
    if (!user || !firestore || !userRef) return;
    try {
      await updateProfile(user, { displayName: values.name });
      
      const userDataToSave = {
        name: values.name,
        phone: values.phone,
        email: user.email,
        id: user.uid,
      };

      await setDoc(userRef, userDataToSave, { merge: true });

      await createNotification({
          userId: user.uid,
          message: 'Your profile has been successfully updated.',
          href: '/profile',
      });

      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    }
  }

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
      const userId = auth.currentUser?.uid;
      await auth.signOut();
      if (userId) {
        await createNotification({
          userId: userId,
          message: 'You have been logged out.',
          href: '/login'
        });
      }
    }
  };
  
  const isBanActive = userData?.ban?.isBanned &&
    (
        userData.ban.type === 'permanent' ||
        (userData.ban.type === 'temporary' && userData.ban.expiresAt && new Date(userData.ban.expiresAt) > new Date()) ||
        (userData.ban.appealStatus === 'approved' && userData.ban.unbanAt && new Date(userData.ban.unbanAt) > new Date())
    );

  if (!isUserLoading && user && isBanActive) {
      return (
         <main className="flex-grow container mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 flex items-center justify-center">
            <BannedProfile user={user} banInfo={userData.ban} settings={settingsData} onSignOut={handleSignOut} />
         </main>
      )
  }

  return (
    <main className="flex-grow container mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="space-y-8 w-full">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <UserIcon className="h-8 w-8 text-primary" />
              <CardTitle className="text-2xl">My Profile</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={user.photoURL ?? ''} />
                    <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., +923001234567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <CardDescription>{user.email}</CardDescription>
                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button onClick={handleSignOut} variant="destructive">
                    Sign Out
                  </Button>
                </div>
              </form>
            </Form>
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
               <div className="divide-y divide-border">
                {orders.map((order) => (
                  <OrderItemRow key={order.id} order={order} />
                ))}
              </div>
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
  );
}
