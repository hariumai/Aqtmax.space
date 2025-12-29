'use client';
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clapperboard, CreditCard, Lock, Music, Palette, Tv } from "lucide-react";
import Link from "next/link";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

const iconMap: { [key: string]: React.ElementType } = {
  'Netflix Premium': Clapperboard,
  'Spotify Premium': Music,
  'Canva Pro': Palette,
  'Prime Video': Tv,
  default: Clapperboard,
};

export default function ProductPage({ params }: { params: { id: string } }) {
  const firestore = useFirestore();
  const productRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'subscriptions', params.id) : null),
    [firestore, params.id]
  );
  const { data: product, isLoading } = useDoc(productRef);
  
  const ProductIcon = product ? iconMap[product.name] || iconMap.default : null;

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-grow container mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        {isLoading && <ProductPageSkeleton />}
        {!isLoading && product && ProductIcon && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="flex flex-col justify-center">
                <ProductIcon className="h-16 w-16 text-primary mb-4" />
                <h1 className="font-headline text-4xl font-extrabold tracking-tighter sm:text-5xl">
                  {product.name}
                </h1>
                <p className="mt-4 text-3xl font-bold text-primary">${product.price}<span className="text-lg text-muted-foreground">/month</span></p>
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
                    <CardTitle>Complete Your Order</CardTitle>
                    <CardDescription>
                      Final step to unlock your premium access.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="rounded-xl bg-muted/50 p-4">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{product.name}</span>
                          <span className="font-bold">${product.price}</span>
                        </div>
                        <div className="flex justify-between items-center mt-2 text-muted-foreground text-sm">
                          <span>Tax</span>
                          <span>$0.00</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center border-t border-border/50 pt-4">
                        <span className="text-lg font-bold">Total</span>
                        <span className="text-lg font-bold">${product.price}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex-col items-stretch gap-4">
                    <Button size="lg" className="w-full">
                      <CreditCard className="mr-2 h-5 w-5" />
                      Proceed to Checkout
                    </Button>
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
              <Skeleton className="h-16 w-full" />
              <div className="flex justify-between items-center border-t pt-4">
                <Skeleton className="h-7 w-1/4" />
                <Skeleton className="h-7 w-1/4" />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex-col items-stretch gap-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-4 w-1/2 mx-auto" />
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
