
'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCollection, useFirestore, useUser, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, doc, addDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { CreditCard, Lock, Upload, Wallet, X, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
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
import { useState, useMemo, ChangeEvent, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { type Order } from '@/lib/types';
import { Switch } from '@/components/ui/switch';

const checkoutSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
});

function OrderSuccess({ order }: { order: Order }) {
    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
                   <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
                <CardTitle className="text-2xl mt-4">Order Placed Successfully!</CardTitle>
                <CardDescription>Your order is pending verification. We will process it shortly.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2 rounded-lg border p-4">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Order ID</span>
                        <span className="font-mono text-xs">{order.id}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Status</span>
                        <span className="font-medium capitalize">{order.status}</span>
                    </div>
                     <div className="flex justify-between text-sm font-bold pt-2 border-t">
                        <span>Total Paid</span>
                        <span>{order.totalAmount.toFixed(2)} PKR</span>
                    </div>
                </div>
                <Button asChild className="w-full" size="lg">
                    <Link href="/profile">View My Orders</Link>
                </Button>
            </CardContent>
        </Card>
    )
}

export default function CheckoutPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    
    const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderComplete, setOrderComplete] = useState<Order | null>(null);

    const settingsRef = useMemoFirebase(() => (firestore ? doc(firestore, 'settings', 'payment') : null), [firestore]);
    const { data: paymentSettings } = useDoc(settingsRef);

    const cartQuery = useMemoFirebase(
        () => (firestore && user ? query(collection(firestore, 'users', user.uid, 'cart')) : null),
        [firestore, user]
    );
    const { data: cartItems, isLoading } = useCollection(cartQuery);

    useEffect(() => {
        if (!isLoading && cartItems?.length === 0 && !orderComplete) {
            router.replace('/');
        }
    }, [isLoading, cartItems, router, orderComplete]);

    const total = useMemo(() => cartItems?.reduce((acc, item) => acc + item.price * item.quantity, 0) ?? 0, [cartItems]);
    
    const form = useForm<z.infer<typeof checkoutSchema>>({
        resolver: zodResolver(checkoutSchema),
        defaultValues: {
            name: user?.displayName ?? '',
            email: user?.email ?? '',
            phone: '',
        },
    });

    useEffect(() => {
        if (user) {
            form.reset({
                name: user.displayName ?? '',
                email: user.email ?? '',
                phone: form.getValues().phone || '',
            });
        }
    }, [user, form]);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const MAX_SIZE_MB = 8;
            if (file.size > MAX_SIZE_MB * 1024 * 1024) {
                toast({
                    variant: 'destructive',
                    title: 'File Too Large',
                    description: `The selected file exceeds the ${MAX_SIZE_MB}MB size limit.`,
                });
                setScreenshotFile(null);
                e.target.value = '';
                return;
            }
            setScreenshotFile(file);
        }
    };
    
    async function handleFileUpload(file: File): Promise<string> {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', { method: 'POST', body: formData });

      if (!res.ok) {
        let msg = 'Upload failed';
        try {
          const data = await res.json();
          msg = data.error || msg;
        } catch {
          msg = await res.text() || msg;
        }
        throw new Error(msg);
      }

      const data = await res.json();
      return data.proofId; // Returns the MongoDB document ID
    }

    async function onSubmit(values: z.infer<typeof checkoutSchema>) {
      if (!firestore || !user || !cartItems?.length) return;

      setIsSubmitting(true);
      let paymentProofId: string | null = null;

      try {
        if (screenshotFile && total > 0) {
          paymentProofId = await handleFileUpload(screenshotFile);
          console.log('Uploaded payment proof ID:', paymentProofId);
        }

        const newOrderRef = doc(collection(firestore, 'orders'));
        const batch = writeBatch(firestore);

        const newOrderData: Order = {
          id: newOrderRef.id,
          userId: user.uid,
          items: cartItems,
          customerName: values.name,
          customerEmail: values.email,
          customerPhone: values.phone,
          subtotal: total,
          totalAmount: total,
          paymentScreenshotUrl: paymentProofId, // Saving the document ID
          orderDate: new Date(),
          status: 'pending',
        };

        batch.set(newOrderRef, { ...newOrderData, orderDate: serverTimestamp() });

        cartItems.forEach(item => {
          const cartItemRef = doc(firestore, 'users', user.uid, 'cart', item.id);
          batch.delete(cartItemRef);
        });

        await batch.commit();
        setOrderComplete(newOrderData);

      } catch (err: any) {
        console.error('Order placement error:', err);
        toast({
          variant: 'destructive',
          title: 'Order Failed',
          description: err.message || 'Could not place your order.',
          duration: 20000,
        });
      } finally {
        setIsSubmitting(false);
      }
    }
    
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }
  
    return (
        <main className="flex-grow container mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
            {orderComplete ? (
                <OrderSuccess order={orderComplete} />
            ) : (
            <>
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
                                            <span>{total.toFixed(2)} PKR</span>
                                        </div>
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

                                    <Button size="lg" type="submit" className="w-full" disabled={isSubmitting || (total > 0 && !screenshotFile)}>
                                        {isSubmitting ? (
                                            <>
                                                <CreditCard className="mr-2 h-5 w-5 animate-pulse" />
                                                Placing Order...
                                            </>
                                        ) : (
                                            <>
                                                <CreditCard className="mr-2 h-5 w-5" />
                                                Place Order
                                            </>
                                        )}
                                    </Button>
                                    <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-2">
                                        <Lock className="h-3 w-3" /> Secure payments
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </form>
                </Form>
            </>
        )}
        </main>
    );
}
