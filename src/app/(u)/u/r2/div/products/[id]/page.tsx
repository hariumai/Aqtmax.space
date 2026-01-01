'use client';
import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clapperboard, CreditCard, Lock, Music, Palette, ShoppingCart, Tv, Plus, Minus, AlertTriangle } from "lucide-react";
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc, collection, addDoc, serverTimestamp, writeBatch, getDocs, where, query, limit, updateDoc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useParams, useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createNotification } from '@/lib/notifications';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

const iconMap: { [key: string]: React.ElementType } = {
  'Netflix Premium': Clapperboard,
  'Spotify Premium': Music,
  'Canva Pro': Palette,
  'Prime Video': Tv,
  default: Clapperboard,
};

type SelectedVariants = { [key: string]: string };

function RulesSection() {
    const firestore = useFirestore();
    const rulesRef = useMemoFirebase(() => (firestore ? doc(firestore, 'legalPages/rules') : null), [firestore]);
    const { data: rulesPage, isLoading } = useDoc(rulesRef);

    if (isLoading) {
        return (
             <div className="mt-8 space-y-2">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
            </div>
        )
    }

    if (!rulesPage?.content) {
        return null;
    }
    
    return (
        <div className="mt-8 text-sm text-red-500 dark:text-red-400" dangerouslySetInnerHTML={{ __html: rulesPage.content.replace(/\n/g, '<br />') }} />
    )
}

export default function ProductPage({ params: paramsProp }: { params: { id: string } }) {
  const params = useParams();
  const id = params.id as string;
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();

  const productRef = useMemoFirebase(
    () => (firestore && id ? doc(firestore, 'subscriptions', id) : null),
    [firestore, id]
  );
  const { data: product, isLoading } = useDoc(productRef);

  const [selectedVariants, setSelectedVariants] = useState<SelectedVariants>({});
  const [isAdding, setIsAdding] = useState(false);
  const [quantity, setQuantity] = useState(1);
  
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [inStock, setInStock] = useState(true);

  const hasVariants = product?.variantGroups && product.variantGroups.length > 0;

  useEffect(() => {
    if (product && hasVariants) {
      const initialSelections: SelectedVariants = {};
      product.variantGroups.forEach((group: any) => {
        initialSelections[group.name] = group.options[0].name;
      });
      setSelectedVariants(initialSelections);
    }
  }, [product, hasVariants]);

  useEffect(() => {
    if (!product) return;

    if (!hasVariants) {
      setCurrentPrice(product.price);
      setInStock(true); // Assuming base product is always in stock
      return;
    }

    // Check if all variant groups have a selection
    const allOptionsSelected = product.variantGroups.every(
      (group: any) => selectedVariants[group.name]
    );

    if (allOptionsSelected) {
      const matchingCombination = product.variantMatrix?.find((combo: any) => {
        return Object.keys(selectedVariants).every(key => {
          return combo.options[key] === selectedVariants[key];
        });
      });

      if (matchingCombination) {
        setCurrentPrice(matchingCombination.price);
        setInStock(matchingCombination.inStock);
      } else {
        // This combination is not defined in the matrix
        setCurrentPrice(null);
        setInStock(false);
      }
    } else {
      // Not all options are selected yet, find the lowest price of available options
      const lowestPrice = product.variantMatrix
        ?.filter((c: any) => c.inStock)
        .reduce((min: number, c: any) => (c.price < min ? c.price : min), Infinity);
      
      setCurrentPrice(lowestPrice === Infinity ? null : lowestPrice);
      setInStock(true); // Don't show out of stock for the whole product yet
    }
  }, [selectedVariants, product, hasVariants]);


  const ProductIcon = product ? (product.imageUrl ? null : iconMap[product.name] || iconMap.default) : null;

  const handleVariantChange = (groupName: string, optionName: string) => {
    setSelectedVariants(prev => ({ ...prev, [groupName]: optionName }));
  };

  const getAvailableOptions = (groupName: string) => {
    if (!product || !hasVariants) return [];
  
    const otherSelections = { ...selectedVariants };
    delete otherSelections[groupName];
  
    const availableOptions = new Set<string>();
    
    product.variantMatrix.forEach((combo: any) => {
      const isMatch = Object.keys(otherSelections).every(key => combo.options[key] === otherSelections[key]);
      if (isMatch && combo.inStock) {
        availableOptions.add(combo.options[groupName]);
      }
    });

    const allOptionsForGroup = product.variantGroups.find((g:any) => g.name === groupName)?.options || [];

    return allOptionsForGroup.map((opt: any) => ({
      ...opt,
      isAvailable: availableOptions.has(opt.name)
    }));
  };

  const handleAddToCart = async (redirect: boolean = false) => {
    if (!user) {
      toast({ variant: "destructive", title: "Not logged in", description: "You need to be logged in to add items to your cart."});
      router.push('/login');
      return;
    }
    if (!product || currentPrice === null || quantity < 1 || !inStock) {
        toast({ variant: "destructive", title: "Unavailable", description: "This product combination is currently out of stock."});
        return;
    }
    
    setIsAdding(true);

    try {
        const cartRef = collection(firestore, 'users', user.uid, 'cart');
        const variantName = hasVariants 
            ? product.variantGroups
                .map((group: any) => selectedVariants[group.name])
                .join(' / ')
            : 'Default';
        
        const q = query(
            cartRef, 
            where('subscriptionId', '==', product.id), 
            where('variantName', '==', variantName),
            limit(1)
        );

        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            await addDoc(cartRef, {
                subscriptionId: product.id,
                subscriptionName: product.name,
                variantName: variantName,
                price: currentPrice,
                quantity: quantity,
                imageUrl: product.imageUrl || `https://ui-avatars.com/api/?name=${product.name.replace(/\s/g, "+")}&background=random`,
                createdAt: serverTimestamp(),
            });
            toast({ title: "Added to Cart", description: `${quantity} x "${product.name}" has been added.`});
        } else {
            const existingDoc = querySnapshot.docs[0];
            const newQuantity = existingDoc.data().quantity + quantity;
            await updateDoc(existingDoc.ref, { quantity: newQuantity });
            toast({ title: "Cart Updated", description: `Quantity for "${product.name}" is now ${newQuantity}.`});
        }

        if (redirect) {
            router.push('/u/r2/div/checkout');
        } else {
             createNotification({
                userId: user.uid,
                message: `"${product.name}" was added to your cart.`,
                href: '/u/r2/div/checkout'
            });
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

  const handleQuantityChange = (amount: number) => {
    setQuantity(prev => Math.max(1, prev + amount));
  };
  
  const formattedDescription = product?.description
    ?.replace(/\(cl\)(.*?)\(cl\)/g, '<span class="text-red-500 dark:text-red-400 font-semibold">$1</span>')
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-primary hover:underline">$1</a>')
    .replace(/\n/g, '<br />');

  const pricePrefix = hasVariants && !product.variantGroups.every((g:any) => selectedVariants[g.name]) ? 'From' : '';

  return (
    <main className="flex-grow container mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      {isLoading && <ProductPageSkeleton />}
      {!isLoading && product && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="flex flex-col justify-center">
              {product.imageUrl ? (
                 <img src={product.imageUrl} alt={product.name} className="w-full h-auto object-cover rounded-2xl mb-4" />
              ) : ProductIcon ? (
                <ProductIcon className="h-16 w-16 text-primary mb-4 animate-float" />
              ) : null}
              <h1 className="font-headline text-4xl font-extrabold tracking-tighter sm:text-5xl">
                {product.name}
              </h1>
              {formattedDescription && <div className="mt-4 text-muted-foreground prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: formattedDescription || '' }} />}
              <ul className="mt-6 space-y-2 text-muted-foreground">
                <li className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-primary" /> Credentials delivered to your account, email, or WhatsApp within 24 hours.</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-primary" /> Around-the-clock customer support, available 24/7.</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-primary" /> Full warranty protection, provided all terms and rules are followed.</li>
              </ul>
              <RulesSection />
            </div>
            <div>
              <Card className="rounded-2xl border-border/10 bg-card/50 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle>
                      {hasVariants ? 'Select Options' : 'Complete Your Order'}
                  </CardTitle>
                  {hasVariants && (
                  <CardDescription>
                    Choose your desired options to see the final price.
                  </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {hasVariants ? (
                      <div className="space-y-4">
                        {product.variantGroups.map((group: any) => {
                          const options = getAvailableOptions(group.name);
                          return (
                           <div key={group.name}>
                               <Label className="font-semibold">{group.name}</Label>
                               <Select 
                                 value={selectedVariants[group.name]}
                                 onValueChange={(value) => handleVariantChange(group.name, value)}
                               >
                                 <SelectTrigger>
                                     <SelectValue placeholder={`Select ${group.name}`} />
                                 </SelectTrigger>
                                 <SelectContent>
                                     {options.map((option: any) => (
                                         <SelectItem key={option.name} value={option.name} disabled={!option.isAvailable}>
                                             {option.name} {!option.isAvailable && '(Out of stock)'}
                                         </SelectItem>
                                     ))}
                                 </SelectContent>
                               </Select>
                           </div>
                          );
                        })}
                      </div>
                    ) : null}

                    <div className="text-4xl font-bold pt-4">
                        {pricePrefix && <span className="text-lg font-normal text-muted-foreground mr-1">{pricePrefix}</span>}
                        
                        {currentPrice !== null ? `${(currentPrice * quantity).toFixed(2)} PKR` : <Skeleton className="h-10 w-48" />}
                        {!inStock && <p className="text-sm text-destructive font-semibold">Out of Stock</p>}
                    </div>
                    
                    <div className="space-y-2">
                        <Label>Quantity</Label>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" onClick={() => handleQuantityChange(-1)}><Minus className="h-4 w-4" /></Button>
                            <Input type="number" value={quantity} onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} className="w-20 text-center" />
                            <Button variant="outline" size="icon" onClick={() => handleQuantityChange(1)}><Plus className="h-4 w-4" /></Button>
                        </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex-col items-stretch gap-4">
                  <div className="flex flex-col gap-2">
                      <Button size="lg" className="w-full" onClick={() => handleAddToCart(false)} disabled={isAdding || !inStock}>
                          <ShoppingCart className="mr-2 h-5 w-5" />
                          Add to Cart
                      </Button>
                       <Button size="lg" variant="outline" className="w-full" onClick={handleBuyNow} disabled={isAdding || !inStock}>
                          <CreditCard className="mr-2 h-5 w-5" />
                          Buy Now
                      </Button>
                  </div>
                  <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-2">
                    <Lock className="h-3 w-3" /> Secure payments with AQT Max
                  </p>
                </CardFooter>
              </Card>
            </div>
          </div>
          <div className="text-center mt-16">
            <Link href="/u/r2/div/#products" className="text-sm text-primary hover:underline">
              &larr; Back to all products
            </Link>
          </div>
        </>
      )}
      {!isLoading && !product && (
         <div className="text-center">
          <h1 className="text-2xl font-bold">Product not found</h1>
          <Link href="/u/r2/div" className="text-sm text-primary hover:underline mt-4 inline-block">
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
        <Skeleton className="h-64 w-full rounded-lg mb-4" />
        <Skeleton className="h-12 w-3/4" />
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
