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

    if (isLoading || !rulesPage?.content) {
        return null; // Or a skeleton loader
    }
    
    const rulesList = rulesPage.content
        .split('\n')
        .map(line => line.trim().replace(/^\d+\.\s*/, '')) // Remove numbering
        .filter(line => line.length > 0 && !line.startsWith('[') && !line.toLowerCase().includes('by using the subscription'));


    return (
        <div className="mt-8 border-l-4 border-destructive pl-4 py-2 bg-destructive/10 text-red-950 dark:text-red-200">
            <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                <h5 className="font-semibold">Important Account Rules</h5>
            </div>
            <ul className="text-xs list-disc pl-5 mt-2 space-y-1">
                {rulesList.map((rule, index) => (
                    <li key={index}>{rule}</li>
                ))}
            </ul>
        </div>
    )
}

export default function ProductPage() {
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
  
  const hasVariants = product?.variants && product.variants.length > 0;

  useEffect(() => {
    if (hasVariants) {
      const initialSelections: SelectedVariants = {};
      product.variants.forEach((group: any) => {
        if (group.options && group.options.length > 0) {
          initialSelections[group.groupName] = group.options[0].optionName;
        }
      });
      setSelectedVariants(initialSelections);
    }
  }, [product, hasVariants]);

  useEffect(() => {
    if (!product) return;

    if (!hasVariants) {
      setCurrentPrice(product.discountedPrice ?? product.price);
      return;
    }

    let allOptionsSelected = true;
    let price = 0;
    product.variants.forEach((group: any) => {
        const selectedOptionName = selectedVariants[group.groupName];
        if (selectedOptionName) {
            const selectedOption = group.options?.find((opt: any) => opt.optionName === selectedOptionName);
            if (selectedOption) {
                price += selectedOption.price;
            }
        } else if (group.required) {
            allOptionsSelected = false;
        }
    });

    if (allOptionsSelected) {
        setCurrentPrice(price);
    } else {
        // Calculate a "From" price if not all required options are selected
        const minPrice = product.variants.reduce((total: number, group: any) => {
            if (group.options && group.options.length > 0 && group.required) {
                const minOptionPrice = Math.min(...group.options.map((opt: any) => opt.price));
                return total + minOptionPrice;
            }
            return total;
        }, 0);
        setCurrentPrice(minPrice);
    }
  }, [selectedVariants, product, hasVariants]);


  const ProductIcon = product ? (product.imageUrl ? null : iconMap[product.name] || iconMap.default) : null;

  const handleVariantChange = (groupName: string, optionName: string) => {
    setSelectedVariants(prev => ({ ...prev, [groupName]: optionName }));
  };

  const handleAddToCart = async (redirect: boolean = false) => {
    if (!user) {
      toast({ variant: "destructive", title: "Not logged in", description: "You need to be logged in to add items to your cart."});
      router.push('/login');
      return;
    }
    if (!product || currentPrice === null || quantity < 1) return;
    
    if (hasVariants) {
        const allRequiredSelected = product.variants.every((group:any) => !group.required || selectedVariants[group.groupName]);
        if(!allRequiredSelected) {
             toast({ variant: "destructive", title: "Options Required", description: "Please select all required product options."});
             return;
        }
    }
    
    setIsAdding(true);

    try {
        const cartRef = collection(firestore, 'users', user.uid, 'cart');
        const variantName = hasVariants 
            ? product.variants
                .filter((group: any) => selectedVariants[group.groupName])
                .map((group: any) => selectedVariants[group.groupName])
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
            router.push('/checkout');
        } else {
             createNotification({
                userId: user.uid,
                message: `"${product.name}" was added to your cart.`,
                href: '/checkout'
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
  
  const formattedDescription = product?.description?.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-primary hover:underline">$1</a>').replace(/\n/g, '<br />');

  const pricePrefix = hasVariants && !product.variants.every((g:any) => !g.required || selectedVariants[g.groupName]) ? 'From' : '';
  const hasDiscount = product?.discountedPrice && product.discountedPrice < product.price && !hasVariants;

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
                <li className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-primary" /> Instant Delivery</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-primary" /> 24/7 Support</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-primary" /> Full Warranty</li>
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
                        {product.variants.map((group: any) => (
                           <div key={group.groupName}>
                               <Label className="font-semibold">{group.groupName} {group.required && <span className="text-destructive">*</span>}</Label>
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
                        {pricePrefix && <span className="text-lg font-normal text-muted-foreground mr-1">{pricePrefix}</span>}
                        {hasDiscount && <span className="text-2xl font-normal text-muted-foreground line-through mr-2">{product.price.toFixed(2)}</span>}
                        
                        {currentPrice !== null ? `${(currentPrice * quantity).toFixed(2)} PKR` : <Skeleton className="h-10 w-48" />}
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
                    <Lock className="h-3 w-3" /> Secure payments with AQT Max
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
