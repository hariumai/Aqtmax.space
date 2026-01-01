'use client';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, deleteDoc, doc, query, updateDoc } from 'firebase/firestore';
import { ShoppingCart, Trash2, Plus, Minus } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export function CartDrawer() {
  const { user } = useUser();
  const firestore = useFirestore();

  const cartQuery = useMemoFirebase(
    () => (firestore && user ? query(collection(firestore, 'users', user.uid, 'cart')) : null),
    [firestore, user]
  );
  const { data: cartItems, isLoading } = useCollection(cartQuery);

  const subtotal = cartItems?.reduce((acc, item) => acc + item.price * item.quantity, 0) ?? 0;

  const handleRemoveItem = async (itemId: string) => {
    if (!firestore || !user) return;
    const itemRef = doc(firestore, 'users', user.uid, 'cart', itemId);
    await deleteDoc(itemRef);
  };

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (!firestore || !user || newQuantity < 1) return;
    const itemRef = doc(firestore, 'users', user.uid, 'cart', itemId);
    await updateDoc(itemRef, { quantity: newQuantity });
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {cartItems && cartItems.length > 0 && (
            <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
            </span>
          )}
          <span className="sr-only">Open Cart</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col pr-0 sm:max-w-lg">
        <SheetHeader className="px-6">
          <SheetTitle>Shopping Cart ({cartItems?.reduce((acc, item) => acc + item.quantity, 0) || 0})</SheetTitle>
        </SheetHeader>
        <Separator />
        {isLoading && <div className="flex-1 flex items-center justify-center">Loading cart...</div>}
        {!isLoading && (!cartItems || cartItems.length === 0) ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <ShoppingCart className="h-16 w-16 text-muted-foreground" />
            <h3 className="text-xl font-semibold">Your cart is empty</h3>
            <p className="text-muted-foreground">Add items to your cart to see them here.</p>
            <SheetClose asChild>
                <Button asChild>
                    <Link href="/products">Continue Shopping</Link>
                </Button>
            </SheetClose>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6">
                <div className="flex flex-col gap-4">
                    {cartItems?.map(item => (
                        <div key={item.id} className="flex items-start gap-4">
                            <div className="relative h-20 w-20 overflow-hidden rounded-md">
                                <Image src={item.imageUrl || `https://ui-avatars.com/api/?name=${item.subscriptionName.replace(/\s/g, "+")}&background=random`} alt={item.subscriptionName} fill className="object-cover" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-semibold">{item.subscriptionName}</h4>
                                <p className="text-sm text-muted-foreground">{item.variantName}</p>
                                <p className="text-sm font-medium">{(item.price * item.quantity).toFixed(2)} PKR</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleQuantityChange(item.id, item.quantity - 1)}><Minus className="h-3 w-3" /></Button>
                                  <span>{item.quantity}</span>
                                  <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleQuantityChange(item.id, item.quantity + 1)}><Plus className="h-3 w-3" /></Button>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
            <Separator />
            <SheetFooter className="p-6">
              <div className="w-full space-y-4">
                <div className="flex justify-between font-semibold">
                  <span>Subtotal</span>
                  <span>{subtotal.toFixed(2)} PKR</span>
                </div>
                <SheetClose asChild>
                  <Button asChild size="lg" className="w-full">
                    <Link href="/checkout">Proceed to Checkout</Link>
                  </Button>
                </SheetClose>
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
