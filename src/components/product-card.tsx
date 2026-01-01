'use client';
import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUser, useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, where, limit, getDocs, writeBatch, doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Clapperboard, Music, Palette, Tv, ShoppingCart, CreditCard, Minus, Plus } from 'lucide-react';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { createNotification } from '@/lib/notifications';
import { Input } from './ui/input';

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
  const [quantity, setQuantity] = useState(1);
  
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [inStock, setInStock] = useState(true);

  const hasVariants = product.variantGroups && product.variantGroups.length > 0;

  useEffect(() => {
    if (hasVariants) {
      const initialSelections: SelectedVariants = {};
      product.variantGroups.forEach((group: any) => {
        initialSelections[group.name] = group.options[0].name;
      });
      setSelectedVariants(initialSelections);
    } else {
        setCurrentPrice(product.price);
        setInStock(true);
    }
  }, [product, hasVariants]);

  useEffect(() => {
    if (!hasVariants) {
        setCurrentPrice(product.price);
        setInStock(true);
        return;
    }
    
    if (Object.keys(selectedVariants).length > 0) {
        const matchingCombination = product.variantMatrix?.find((combo: any) => 
            Object.keys(selectedVariants).every(key => combo.options[key] === selectedVariants[key])
        );

        if (matchingCombination) {
            setCurrentPrice(matchingCombination.price);
            setInStock(matchingCombination.inStock);
        } else {
            setCurrentPrice(null);
            setInStock(false);
        }
    } else {
         const lowestPrice = product.variantMatrix
        ?.filter((c: any) => c.inStock)
        .reduce((min: number, c: any) => (c.price < min ? c.price : min), Infinity);
      
      setCurrentPrice(lowestPrice === Infinity ? null : lowestPrice);
      setInStock(true);
    }

  }, [product, hasVariants, selectedVariants]);

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
    
    if (!inStock || currentPrice === null) {
      toast({ variant: "destructive", title: "Unavailable", description: "This product combination is out of stock."});
      return;
    }

    if (hasVariants) {
        const allRequiredSelected = product.variantGroups.every((group:any) => selectedVariants[group.name]);
        if(!allRequiredSelected) {
             toast({ variant: "destructive", title: "Options Required", description: "Please select all required product options."});
             return;
        }
    }

    if (!firestore || !product || quantity < 1) return;
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

  const handleBuyNow = () => handleAddToCart(true);
  const handleQuantityChange = (amount: number) => {
    setQuantity(prev => Math.max(1, prev + amount));
  }

  const pricePrefix = hasVariants && !product.variantGroups.every((g:any) => selectedVariants[g.name]) ? 'From' : '';

  return (
    <Card
      className="flex flex-col h-full overflow-hidden rounded-2xl border-border/10 bg-card/50 backdrop-blur-xl transition-transform duration-300 hover:-translate-y-2 hover:shadow-2xl"
    >
      <CardHeader className="flex-row items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover rounded-xl" />
          ) : (
            <ProductIcon className="h-6 w-6 text-foreground" />
          )}
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
            {currentPrice?.toFixed(2)}
            <span className="text-base font-normal text-muted-foreground"> PKR</span>
        </div>
        {product.description && (
            <CardDescription className="mt-2 text-sm min-h-[40px] flex-grow">
            {product.description.split('\n')[0]}
            </CardDescription>
        )}


        {hasVariants && (
          <div className="space-y-2 flex-grow">
              {product.variantGroups.map((group: any, index: number) => {
                  const options = getAvailableOptions(group.name);
                  return (
                  <div key={`${group.name}-${index}`}>
                      <Label className="text-xs text-muted-foreground">{group.name}</Label>
                       <Select
                          onValueChange={(value) => handleVariantChange(group.name, value)}
                          value={selectedVariants[group.name]}
                        >
                          <SelectTrigger className="h-9">
                              <SelectValue placeholder={`Select ${group.name}`} />
                          </SelectTrigger>
                          <SelectContent>
                              {options.map((option: any) => (
                                  <SelectItem key={option.name} value={option.name} disabled={!option.isAvailable}>
                                      {option.name}
                                  </SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                  </div>
              )})}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-2 pt-4">
          <div className="flex items-center gap-2 w-full">
            <Button variant="outline" size="icon" onClick={() => handleQuantityChange(-1)}><Minus className="h-4 w-4" /></Button>
            <Input type="number" value={quantity} onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} className="w-full text-center" />
            <Button variant="outline" size="icon" onClick={() => handleQuantityChange(1)}><Plus className="h-4 w-4" /></Button>
          </div>
          <Button size="sm" className="w-full" onClick={() => handleAddToCart(false)} disabled={isAdding || !inStock}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              {inStock ? 'Add to Cart' : 'Out of Stock'}
          </Button>
          <Button size="sm" variant="outline" className="w-full" onClick={handleBuyNow} disabled={isAdding || !inStock}>
              <CreditCard className="mr-2 h-4 w-4" />
              Buy Now
          </Button>
      </CardFooter>
    </Card>
  );
}
