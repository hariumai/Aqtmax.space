'use client';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCollection, useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, doc, addDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { CreditCard, Lock, Upload, Wallet, X } from 'lucide-react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useState, use, useMemo, ChangeEvent, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Label } from '@/components/ui/label';

const checkoutSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
});

export default function CheckoutPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    
    const [useCredits, setUseCredits] = useState(false);
    const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const userRef = useMemoFirebase(() => (firestore && user ? doc(firestore, 'users', user.uid) : null), [firestore, user]);
    const { data: userData } = useDoc(userRef);

    const settingsRef = useMemoFirebase(() => (firestore ? doc(firestore, 'settings', 'payment') : null), [firestore]);
    const { data: paymentSettings } = useDoc(settingsRef);

    const cartQuery = useMemoFirebase(
        () => (firestore && user ? query(collection(firestore, 'users', user.uid, 'cart')) : null),
        [firestore, user]
    );
    const { data: cartItems, isLoading } = useCollection(cartQuery);

    useEffect(() => {
        if (!isLoading && cartItems?.length === 0) {
            router.replace('/');
        }
    }, [isLoading, cartItems, router]);


    const subtotal = useMemo(() => cartItems?.reduce((acc, item) => acc + item.price * item.quantity, 0) ?? 0, [cartItems]);
    const availableCredits = userData?.storeCredit ?? 0;
    const creditsToUse = useCredits ? Math.min(subtotal, availableCredits) : 0;
    const total = subtotal - creditsToUse;

    const form = useForm<z.infer<typeof checkoutSchema>>({
        resolver: zodResolver(checkoutSchema),
        defaultValues: {
            name: user?.displayName ?? '',
            email: user?.email ?? '',
            phone: '',
        },
    });

    // Sync form with user data when it loads
    useEffect(() => {
        if (user) {
            form.reset({
                name: user.displayName ?? '',
                email: user.email ?? '',
                phone: '',
            });
        }
    }, [user, form]);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setScreenshotFile(e.target.files[0]);
        }
    };

    async function onSubmit(values: z.infer<typeof checkoutSchema>) {
        if (!firestore || !user || !cartItems || cartItems.length === 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'Something went wrong. Please try again.' });
            return;
        }

        if (total > 0 && !screenshotFile) {
            toast({ variant: 'destructive', title: 'Screenshot Required', description: 'Please upload a payment screenshot to proceed.' });
            return;
        }
        
        setIsSubmitting(true);

        try {
            let screenshotUrl = '';
            if (screenshotFile && total > 0) {
                const storage = getStorage();
                const storageRef = ref(storage, `payment_screenshots/${user.uid}/${Date.now()}_${screenshotFile.name}`);
                const uploadResult = await uploadBytes(storageRef, screenshotFile);
                screenshotUrl = await getDownloadURL(uploadResult.ref);
            }

            const newOrderRef = doc(collection(firestore, 'orders'));
            const batch = writeBatch(firestore);

            batch.set(newOrderRef, {
                id: newOrderRef.id,
                userId: user.uid,
                items: cartItems,
                customerName: values.name,
                customerEmail: values.email,
                customerPhone: values.phone,
                subtotal: subtotal,
                creditUsed: creditsToUse,
                totalAmount: total,
                paymentScreenshotUrl: screenshotUrl,
                orderDate: serverTimestamp(),
                status: 'pending',
            });

            if (creditsToUse > 0) {
                const userDocRef = doc(firestore, 'users', user.uid);
                batch.update(userDocRef, { storeCredit: availableCredits - creditsToUse });
            }
            
            // Clear the cart
            cartItems.forEach(item => {
                const cartItemRef = doc(firestore, 'users', user.uid, 'cart', item.id);
                batch.delete(cartItemRef);
            });

            await batch.commit();
            
            toast({ title: 'Order Placed!', description: 'Your order is pending verification. We will process it shortly.' });
            router.push('/profile');

        } catch (error: any) => {
            console.error('Order placement error:', error);
            toast({ variant: 'destructive', title: 'Order Failed', description: error.message || 'Could not place your order.' });
        } finally {
            setIsSubmitting(false);
        }
    }
    
    if (isLoading || !cartItems || cartItems.length === 0) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-grow container mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
            <h1 className="font-headline text-4xl font-extrabold tracking-tighter sm:text-5xl">Checkout</h1>
        </div>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
                <div className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>1. Your Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="Your full name" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="Your email" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input placeholder="Your phone number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>2. Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isLoading && <p>Loading your cart...</p>}
                            <div className="space-y-4">
                                {cartItems?.map(item => (
                                    <div key={item.id} className="flex items-center gap-4">
                                        <div className="relative h-16 w-16 overflow-hidden rounded-md">
                                             <Image src={item.imageUrl} alt={item.subscriptionName} fill className="object-cover" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-semibold">{item.subscriptionName}</p>
                                            <p className="text-sm text-muted-foreground">{item.variantName}</p>
                                        </div>
                                        <p className="font-semibold">{item.price.toFixed(2)} PKR</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="space-y-8">
                     <Card className="rounded-2xl border-border/10 bg-card/50 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle>3. Payment</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span>{subtotal.toFixed(2)} PKR</span>
                                </div>
                                {availableCredits > 0 && (
                                    <>
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="use-credits" className="flex items-center gap-2">
                                                <Wallet className="h-4 w-4" />
                                                <span>Use Store Credits</span>
                                            </Label>
                                            <Switch id="use-credits" checked={useCredits} onCheckedChange={setUseCredits} />
                                        </div>
                                         {useCredits && (
                                            <div className="flex justify-between text-primary">
                                                <span>Credits Applied</span>
                                                <span>-{creditsToUse.toFixed(2)} PKR</span>
                                            </div>
                                        )}
                                    </>
                                )}
                                <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                                    <span>Total to Pay</span>
                                    <span>{total.toFixed(2)} PKR</span>
                                </div>
                            </div>
                            
                            {total > 0 && paymentSettings && (
                                <Card className="bg-muted/50">
                                    <CardHeader>
                                        <CardTitle className="text-base">Bank Transfer Details</CardTitle>
                                        <CardDescription className="text-xs">Please transfer the total amount to the account below and upload a screenshot.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-1 text-sm">
                                        <p><strong>Bank:</strong> {paymentSettings.bankName}</p>
                                        <p><strong>Account Name:</strong> {paymentSettings.accountHolderName}</p>
                                        <p><strong>Account Number:</strong> {paymentSettings.accountNumber}</p>
                                    </CardContent>
                                </Card>
                            )}
                            
                            {total > 0 && (
                                <div>
                                    <Label htmlFor="screenshot-upload" className="mb-2 block">Upload Payment Screenshot</Label>
                                    <div className="relative">
                                        <Input id="screenshot-upload" type="file" accept="image/*" onChange={handleFileChange} className="pr-20" />
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                                            {screenshotFile ? <X className="h-5 w-5 text-muted-foreground cursor-pointer" onClick={() => setScreenshotFile(null)} /> : <Upload className="h-5 w-5 text-muted-foreground" />}
                                        </div>
                                    </div>
                                    {screenshotFile && <p className="text-xs text-muted-foreground mt-1 truncate">Selected: {screenshotFile.name}</p>}
                                </div>
                            )}

                            <Button size="lg" type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <CreditCard className="mr-2 h-5 w-5 animate-pulse" />
                                        Placing Order...
                                    </>
                                ) : (
                                    <>
                                        <CreditCard className="mr-2 h-5 w-5" />
                                        {total > 0 ? 'Place Order' : 'Redeem with Credits'}
                                    </>
                                )}
                            </Button>
                             <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-2">
                                <Lock className="h-3 w-3" /> Secure payments with SubLime Payment Gateway
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </form>
        </Form>
      </main>
      <SiteFooter />
    </div>
  );
}
