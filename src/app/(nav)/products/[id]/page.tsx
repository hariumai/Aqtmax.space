'use client';
import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clapperboard, CreditCard, Lock, Music, Palette, ShoppingCart, Tv } from "lucide-react";
import Link from "next/link";
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc, collection, addDoc, serverTimestamp, writeBatch, getDocs, where, query, limit } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const iconMap: { [key: string]: React.ElementType } = {
  'Netflix Premium': Clapperboard,
  'Spotify Premium': Music,
  'Canva Pro': Palette,
  'Prime Video': Tv,
  default: Clapperboard,
};

type SelectedVariants = { [key: string]: string };

export default function ProductPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();

  const productRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'subscriptions', id) : null),
    [firestore, id]
  );
  const { data: product, isLoading } = useDoc(productRef);

  const [selectedVariants, setSelectedVariants] = useState<SelectedVariants>({});
  const [isAdding, setIsAdding] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);

  useEffect(() => {
    if (product?.variants && product.variants.length > 0) {
      const initialSelections: SelectedVariants = {};
      product.variants.forEach((group: any) => {
        initialSelections[group.groupName] = group.options[0].optionName;
      });
      setSelectedVariants(initialSelections);
    } else {
        setCurrentPrice(product?.discountedPrice ?? product?.price ?? null);
    }
  }, [product]);

  useEffect(() => {
      if (product?.variants && product.variants.length > 0) {
          let price = 0;
          let allOptionsSelected = true;
          product.variants.forEach((group: any) => {
              const selectedOptionName = selectedVariants[group.groupName];
              if (selectedOptionName) {
                  const selectedOption = group.options.find((opt: any) => opt.optionName === selectedOptionName);
                  if (selectedOption) {
                      price += selectedOption.price;
                  }
              } else {
                  allOptionsSelected = false;
              }
          });

          if (allOptionsSelected) {
              setCurrentPrice(price);
          } else {
              // Find the minimum possible price
              const minPrice = product.variants.reduce((total: number, group: any) => {
                  const minOptionPrice = Math.min(...group.options.map((opt: any) => opt.price));
                  return total + minOptionPrice;
              }, 0);
              setCurrentPrice(minPrice);
          }
      }
  }, [selectedVariants, product]);


  const ProductIcon = product ? iconMap[product.name] || iconMap.default : null;

  const handleVariantChange = (groupName: string, optionName: string) => {
    setSelectedVariants(prev => ({ ...prev, [groupName]: optionName }));
  };

  const handleAddToCart = async (redirect: boolean = false) => {
    if (!user) {
      toast({ variant: "destructive", title: "Not logged in", description: "You need to be logged in to add items to your cart."});
      router.push('/login');
      return;
    }
    if (!product || currentPrice === null) return;
    
    const allVariantsSelected = product.variants?.every((group: any) => selectedVariants[group.groupName]) ?? true;

    if (!allVariantsSelected) {
      toast({ variant: "destructive", title: "Options required", description: "Please select an option from each group."});
      return;
    }

    setIsAdding(true);

    try {
        const cartRef = collection(firestore, 'users', user.uid, 'cart');
        const variantName = product.variants
            ?.map((group: any) => selectedVariants[group.groupName])
            .join(' / ') || 'Default';
        
        const itemToAdd = {
            subscriptionId: product.id,
            subscriptionName: product.name,
            variantName: variantName,
            price: currentPrice,
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
            toast({ title: "Item already in cart", description: `${product.name} (${variantName}) is already in your cart.`});
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
                          ? 'Select Options' 
                          : 'Complete Your Order'}
                  </CardTitle>
                  <CardDescription>
                    {product.variants?.length > 0 ? "Choose your desired options." : "Final step to unlock premium access."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {product.variants && product.variants.length > 0 ? (
                      <div className="space-y-4">
                        {product.variants.map((group: any) => (
                           <div key={group.groupName}>
                               <Label className="font-semibold">{group.groupName}</Label>
                               <Select 
                                 value={selectedVariants[group.groupName]}
                                 onValueChange={(value) => handleVariantChange(group.groupName, value)}
                               >
                                 <SelectTrigger>
                                     <SelectValue placeholder={`Select ${group.groupName}`} />
                                 </SelectTrigger>
                                 <SelectContent>
                                     {group.options.map((option: any) => (
                                         <SelectItem key={option.optionName} value={option.optionName}>
                                             {option.optionName} (+{option.price} PKR)
                                         </SelectItem>
                                     ))}
                                 </SelectContent>
                               </Select>
                           </div>
                        ))}
                      </div>
                    ) : null}

                    <div className="text-4xl font-bold pt-4">
                      {currentPrice !== null ? `${currentPrice.toFixed(2)} PKR` : <Skeleton className="h-10 w-48" />}
                    </div>

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
                    <Lock className="h-3 w-3" /> Secure payments with AQT Max Payment Gateway
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

    
