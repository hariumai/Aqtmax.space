'use client';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { CreditCard, Lock } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function CheckoutPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const cartQuery = useMemoFirebase(
        () => (firestore && user ? query(collection(firestore, 'users', user.uid, 'cart')) : null),
        [firestore, user]
    );
    const { data: cartItems, isLoading } = useCollection(cartQuery);

    const subtotal = cartItems?.reduce((acc, item) => acc + item.price * item.quantity, 0) ?? 0;
    const tax = subtotal * 0.05; // Example 5% tax
    const total = subtotal + tax;
    
    if (!isLoading && !cartItems?.length) {
        router.replace('/');
        return null;
    }

    const handleConfirmPurchase = () => {
        // Here you would integrate with a payment gateway like Stripe
        alert('Purchase confirmed! (This is a placeholder)');
        // Clear cart, create order, etc.
    }

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-grow container mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
            <h1 className="font-headline text-4xl font-extrabold tracking-tighter sm:text-5xl">Checkout</h1>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                Review your order and complete your purchase.
            </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            <div>
                <Card>
                    <CardHeader>
                        <CardTitle>Order Summary</CardTitle>
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
            <div>
                <Card className="rounded-2xl border-border/10 bg-card/50 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle>Payment Details</CardTitle>
                        <CardDescription>
                            Enter your payment information to complete the purchase.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>{subtotal.toFixed(2)} PKR</span>
                            </div>
                             <div className="flex justify-between">
                                <span>Tax (5%)</span>
                                <span>{tax.toFixed(2)} PKR</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                                <span>Total</span>
                                <span>{total.toFixed(2)} PKR</span>
                            </div>
                        </div>
                        <Button size="lg" className="w-full" onClick={handleConfirmPurchase}>
                            <CreditCard className="mr-2 h-5 w-5" />
                            Confirm Purchase
                        </Button>
                         <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-2">
                            <Lock className="h-3 w-3" /> Secure payments with SubLime Payment Gateway
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
