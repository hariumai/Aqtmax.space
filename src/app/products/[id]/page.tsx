import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clapperboard, CreditCard, Lock, Music, Palette, Tv } from "lucide-react";
import Link from "next/link";

const productDetails: { [key: string]: any } = {
  netflix: { name: 'Netflix Premium', icon: Clapperboard, price: '$4.99' },
  spotify: { name: 'Spotify Premium', icon: Music, price: '$3.99' },
  canva: { name: 'Canva Pro', icon: Palette, price: '$5.99' },
  'prime-video': { name: 'Prime Video', icon: Tv, price: '$2.99' },
};

export default function ProductPage({ params }: { params: { id: string } }) {
  const product = productDetails[params.id] || { name: 'Product Not Found', icon: () => null, price: 'N/A' };
  const ProductIcon = product.icon;

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-grow container mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="flex flex-col justify-center">
            <ProductIcon className="h-16 w-16 text-primary mb-4" />
            <h1 className="font-headline text-4xl font-extrabold tracking-tighter sm:text-5xl">
              {product.name}
            </h1>
            <p className="mt-4 text-3xl font-bold text-primary">{product.price}<span className="text-lg text-muted-foreground">/month</span></p>
            <p className="mt-4 text-muted-foreground">
              You are purchasing a full month of access. Your credentials will be delivered instantly after payment confirmation.
            </p>
            <ul className="mt-6 space-y-2 text-muted-foreground">
              <li className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-primary" /> Instant Delivery</li>
              <li className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-primary" /> 24/7 Support</li>
              <li className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-primary" /> Full Warranty</li>
            </ul>
          </div>
          <div>
            <Card className="rounded-3xl border-border/10 bg-card/50 backdrop-blur-lg">
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
                      <span className="font-bold">{product.price}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2 text-muted-foreground text-sm">
                      <span>Tax</span>
                      <span>$0.00</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center border-t border-border/50 pt-4">
                    <span className="text-lg font-bold">Total</span>
                    <span className="text-lg font-bold">{product.price}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex-col items-stretch gap-4">
                <Button size="lg" className="w-full">
                  <CreditCard className="mr-2 h-5 w-5" />
                  Proceed to Checkout
                </Button>
                <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-2">
                  <Lock className="h-3 w-3" /> Secure payment via Stripe.
                </p>
              </CardFooter>
            </Card>
          </div>
        </div>
        <div className="text-center mt-16">
          <Link href="/" className="text-sm text-primary hover:underline">
            &larr; Back to all products
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
