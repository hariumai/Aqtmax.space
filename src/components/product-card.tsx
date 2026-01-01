'use client';
import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUser, useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, where, limit, getDocs } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Clapperboard, Music, Palette, Tv, ShoppingCart, CreditCard, Radio, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { createNotification } from '@/lib/notifications';

const iconMap: { [key: string]: React.ElementType } = {
  'Netflix Premium': Clapperboard,
  'Spotify Premium': Music,
  'Canva Pro': Palette,
  'Prime Video': Tv,
  default: Clapperboard,
};

type SelectedVariants = { [key: string]: string };

export default function ProductCard({ product }: { product: any }) {
  const ProductIcon = iconMap[product.name] || iconMap.default;
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const [selectedVariants, setSelectedVariants] = useState<SelectedVariants>({});
  const [isAdding, setIsAdding] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);

  const hasVariants = product.variants && product.variants.length > 0;

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

  useMemo(() => {
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
        } else {
            allOptionsSelected = false;
        }
    });

    if (allOptionsSelected) {
        setCurrentPrice(price);
    } else {
        const minPrice = product.variants.reduce((total: number, group: any) => {
            if (group.options && group.options.length > 0) {
                const minOptionPrice = Math.min(...group.options.map((opt: any) => opt.price));
                return total + minOptionPrice;
            }
            return total;
        }, 0);
        setCurrentPrice(minPrice);
    }

  }, [product, hasVariants, selectedVariants]);

  const handleVariantChange = (groupName: string, optionName: string) => {
    setSelectedVariants(prev => ({ ...prev, [groupName]: optionName }));
  };
  
  const handleAddToCart = async (redirect: boolean = false) => {
    if (!user) {
      toast({ variant: "destructive", title: "Not logged in", description: "You need to be logged in to add items to your cart."});
      router.push('/login');
      return;
    }

    if (hasVariants) {
        const allSelected = product.variants.every((group:any) => selectedVariants[group.groupName]);
        if(!allSelected) {
             toast({ variant: "destructive", title: "Options Required", description: "Please select all product options."});
             return;
        }
    }

    if (!firestore || !product || currentPrice === null) return;
    setIsAdding(true);

    try {
        const cartRef = collection(firestore, 'users', user.uid, 'cart');
        const variantName = hasVariants 
            ? product.variants.map((group: any) => selectedVariants[group.groupName]).join(' / ')
            : 'Default';
        
        const itemToAdd = {
            subscriptionId: product.id,
            subscriptionName: product.name,
            variantName: variantName,
            price: currentPrice,
            quantity: 1,
            imageUrl: product.imageUrl || `https://ui-avatars.com/api/?name=${product.name.replace(/\s/g, "+")}&background=random`,
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
            createNotification({
                userId: user.uid,
                message: `"${product.name}" has been added to your cart.`,
                href: '/checkout'
            });
        } else {
            router.push('/checkout');
        }

    } catch(error: any) {
        toast({ variant: "destructive", title: "Error", description: "Could not add item to cart."});
    } finally {
        setIsAdding(false);
    }
  };

  const handleBuyNow = () => handleAddToCart(true);

  const pricePrefix = hasVariants && !product.variants.every((g:any) => selectedVariants[g.groupName]) ? 'From' : '';
  const hasDiscount = product.discountedPrice && product.discountedPrice < product.price && !hasVariants;

  return (
    <Card
      className="flex flex-col h-full overflow-hidden rounded-2xl border-border/10 bg-card/50 backdrop-blur-xl transition-transform duration-300 hover:-translate-y-2 hover:shadow-2xl"
    >
      <CardHeader className="flex-row items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
          <ProductIcon className="h-6 w-6 text-foreground" />
        </div>
        <div>
          <Link href={`/products/${product.id}`}>
            <CardTitle className="text-lg hover:underline">{product.name}</CardTitle>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col space-y-4">
        <div className="text-4xl font-bold">
            {pricePrefix && <span className="text-lg font-normal text-muted-foreground mr-1">{pricePrefix}</span>}
            {hasDiscount && (
                <span className="text-2xl font-normal text-muted-foreground line-through mr-2">{product.price}</span>
            )}
            {currentPrice?.toFixed(2)}
            <span className="text-base font-normal text-muted-foreground"> PKR</span>
        </div>
        <CardDescription className="mt-2 text-sm min-h-[40px] flex-grow">
          {product.description.split('\n')[0]}
        </CardDescription>

        {hasVariants && (
          <div className="space-y-2 flex-grow">
              {product.variants.map((group: any, index: number) => (
                  <div key={`${group.groupName}-${index}`}>
                      <Label className="text-xs text-muted-foreground">{group.groupName}</Label>
                       <Select
                          onValueChange={(value) => handleVariantChange(group.groupName, value)}
                          value={selectedVariants[group.groupName]}
                        >
                          <SelectTrigger className="h-9">
                              <SelectValue placeholder={`Select ${group.groupName}`} />
                          </SelectTrigger>
                          <SelectContent>
                              {group.options?.map((option: any) => (
                                  <SelectItem key={option.optionName} value={option.optionName}>
                                      {option.optionName}
                                  </SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                  </div>
              ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-2 pt-4">
          <Button size="sm" className="w-full" onClick={() => handleAddToCart(false)} disabled={isAdding}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Add to Cart
          </Button>
          <Button size="sm" variant="outline" className="w-full" onClick={handleBuyNow} disabled={isAdding}>
              <CreditCard className="mr-2 h-4 w-4" />
              Buy Now
          </Button>
      </CardFooter>
    </Card>
  );
}
