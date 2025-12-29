'use client';
import { useState, use } from 'react';
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clapperboard, CreditCard, Lock, Music, Palette, ShoppingCart, Tv } from "lucide-react";
import Link from "next/link";
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc, collection, addDoc, serverTimestamp, writeBatch, getDocs, where, query, limit } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

const iconMap: { [key: string]: React.ElementType } = {
  'Netflix Premium': Clapperboard,
  'Spotify Premium': Music,
  'Canva Pro': Palette,
  'Prime Video': Tv,
  default: Clapperboard,
};

export default function ProductPage({ params }: { params: { id: string } }) {
  const { id } = use(params);
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();

  const productRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'subscriptions', id) : null),
    [firestore, id]
  );
  const { data: product, isLoading } = useDoc(productRef);

  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [isAdding, setIsAdding] = useState(false);
  
  const ProductIcon = product ? iconMap[product.name] || iconMap.default : null;

  const handleAddToCart = async (redirect: boolean = false) => {
    if (!user) {
      toast({ variant: "destructive", title: "Not logged in", description: "You need to be logged in to add items to your cart."});
      router.push('/login');
      return;
    }
    if (!selectedVariant && product?.variants?.length > 0) {
      toast({ variant: "destructive", title: "No variant selected", description: "Please select a plan to continue."});
      return;
    }
    if (!firestore || !product) return;
    setIsAdding(true);

    try {
        const cartRef = collection(firestore, 'users', user.uid, 'cart');
        
        // Check if item already exists
        const itemToAdd = {
            subscriptionId: product.id,
            subscriptionName: product.name,
            variantName: selectedVariant?.name || 'Default',
            price: selectedVariant?.price || product.discountedPrice || product.price,
            quantity: 1,
            imageUrl: product.imageUrl,
        };
        
        const q = query(
            cartRef, 
            where('subscriptionId', '==', itemToAdd.subscriptionId), 
            where('variantName', '==', itemToAdd.variantName),
            limit(1)
        );

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            await addDoc(cartRef, {
                ...itemToAdd,
                createdAt: serverTimestamp(),
            });
        } else {
            // In a real app, you might want to update the quantity.
            // For now, we'll just inform the user.
            toast({ title: "Item already in cart", description: `${product.name} is already in your cart.`});
        }

        if (!redirect) {
            toast({ title: "Added to Cart", description: `${product.name} has been added to your cart.`});
        } else {
            router.push('/checkout');
        }

    } catch(error: any) {
        toast({ variant: "destructive", title: "Error", description: "Could not add item to cart."});
    } finally {
        setIsAdding(false);
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart(true);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-grow container mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        {isLoading && <ProductPageSkeleton />}
        {!isLoading && product && ProductIcon && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="flex flex-col justify-center">
                <ProductIcon className="h-16 w-16 text-primary mb-4 animate-float" />
                <h1 className="font-headline text-4xl font-extrabold tracking-tighter sm:text-5xl">
                  {product.name}
                </h1>
                <p className="mt-4 text-muted-foreground">
                  {product.description}
                </p>
                <ul className="mt-6 space-y-2 text-muted-foreground">
                  <li className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-primary" /> Instant Delivery</li>
                  <li className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-primary" /> 24/7 Support</li>
                  <li className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-primary" /> Full Warranty</li>
                </ul>
              </div>
              <div>
                <Card className="rounded-2xl border-border/10 bg-card/50 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle>
                        {product.variants && product.variants.length > 0 
                            ? 'Select a Plan' 
                            : 'Complete Your Order'}
                    </CardTitle>
                    <CardDescription>
                      {product.variants?.length > 0 ? "Choose your desired subscription duration." : "Final step to unlock premium access."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {product.variants && product.variants.length > 0 ? (
                        <RadioGroup onValueChange={(value) => setSelectedVariant(product.variants.find((v:any) => v.name === value))}>
                            <div className="space-y-2">
                                {product.variants.map((variant: any) => (
                                    <Label key={variant.name} htmlFor={variant.name} className="flex items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary">
                                        <span>{variant.name}</span>
                                        <span className="font-bold">{variant.price} PKR</span>
                                        <RadioGroupItem value={variant.name} id={variant.name} className="sr-only" />
                                    </Label>
                                ))}
                            </div>
                        </RadioGroup>
                      ) : (
                        <div className="rounded-xl bg-muted/50 p-4">
                            <div className="flex justify-between items-center">
                            <span className="font-medium">{product.name}</span>
                            <span className="font-bold">{product.discountedPrice || product.price} PKR</span>
                            </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex-col items-stretch gap-4">
                    <div className="flex flex-col gap-2">
                        <Button size="lg" className="w-full" onClick={() => handleAddToCart(false)} disabled={isAdding}>
                            <ShoppingCart className="mr-2 h-5 w-5" />
                            Add to Cart
                        </Button>
                         <Button size="lg" variant="outline" className="w-full" onClick={handleBuyNow} disabled={isAdding}>
                            <CreditCard className="mr-2 h-5 w-5" />
                            Buy Now
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-2">
                      <Lock className="h-3 w-3" /> Secure payments with SubLime Payment Gateway
                    </p>
                  </CardFooter>
                </Card>
              </div>
            </div>
            <div className="text-center mt-16">
              <Link href="/#products" className="text-sm text-primary hover:underline">
                &larr; Back to all products
              </Link>
            </div>
          </>
        )}
        {!isLoading && !product && (
           <div className="text-center">
            <h1 className="text-2xl font-bold">Product not found</h1>
            <Link href="/" className="text-sm text-primary hover:underline mt-4 inline-block">
                &larr; Back to homepage
            </Link>
           </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function ProductPageSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
      <div className="flex flex-col justify-center">
        <Skeleton className="h-16 w-16 rounded-lg mb-4" />
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-8 w-1/4 mt-4" />
        <Skeleton className="h-5 w-full mt-4" />
        <Skeleton className="h-5 w-5/6 mt-2" />
        <div className="mt-6 space-y-2">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-5 w-1/3" />
        </div>
      </div>
      <div>
        <Card className="rounded-2xl">
          <CardHeader>
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </CardContent>
          <CardFooter className="flex-col items-stretch gap-4">
            <div className="flex flex-col gap-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
            <Skeleton className="h-4 w-1/2 mx-auto" />
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
