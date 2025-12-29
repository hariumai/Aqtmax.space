'use client';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, where, limit, getDocs } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Clapperboard, Music, Palette, Tv, ShoppingCart, CreditCard } from 'lucide-react';
import Link from 'next/link';

const iconMap: { [key: string]: React.ElementType } = {
  'Netflix Premium': Clapperboard,
  'Spotify Premium': Music,
  'Canva Pro': Palette,
  'Prime Video': Tv,
  default: Clapperboard,
};

export default function ProductCard({ product }: { product: any }) {
  const ProductIcon = iconMap[product.name] || iconMap.default;
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const [selectedVariant, setSelectedVariant] = useState<any>(
    product.variants?.length > 0 ? product.variants[0] : null
  );
  const [isAdding, setIsAdding] = useState(false);

  const displayPrice = selectedVariant?.variantPrice ?? (product.discountedPrice ?? product.price);
  const hasDiscount = product.discountedPrice && product.discountedPrice < product.price && !selectedVariant;
  const pricePrefix = product.variants?.length > 0 && !selectedVariant ? 'From' : '';
  
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
        
        const itemToAdd = {
            subscriptionId: product.id,
            subscriptionName: product.name,
            variantName: selectedVariant?.variantName || 'Default',
            price: selectedVariant?.variantPrice || product.discountedPrice || product.price,
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

  const handleBuyNow = () => handleAddToCart(true);

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
      <CardContent className="flex-grow space-y-4">
        <div className="text-4xl font-bold">
            {pricePrefix && <span className="text-lg font-normal text-muted-foreground mr-1">{pricePrefix}</span>}
            {hasDiscount && (
                <span className="text-2xl font-normal text-muted-foreground line-through mr-2">{product.price}</span>
            )}
            {displayPrice}
            <span className="text-base font-normal text-muted-foreground"> PKR</span>
        </div>
        <CardDescription className="mt-2 text-sm min-h-[40px]">
          {product.description}
        </CardDescription>

        {product.variants && product.variants.length > 0 && (
          <RadioGroup 
            value={selectedVariant?.variantName}
            onValueChange={(value) => setSelectedVariant(product.variants.find((v:any) => v.variantName === value))}
          >
              <div className="space-y-2">
                  {product.variants.map((variant: any) => (
                      <Label key={variant.variantName} htmlFor={`${product.id}-${variant.variantName}`} className="flex items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary">
                          <span>{variant.variantName}</span>
                          <span className="font-bold">{variant.variantPrice} PKR</span>
                          <RadioGroupItem value={variant.variantName} id={`${product.id}-${variant.variantName}`} className="sr-only" />
                      </Label>
                  ))}
              </div>
          </RadioGroup>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
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
