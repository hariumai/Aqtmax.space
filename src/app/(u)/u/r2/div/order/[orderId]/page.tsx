'use client';
import { useRef } from 'react';
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { notFound, useRouter, useParams } from 'next/navigation';
import { AlertTriangle, CheckCircle, FileDown, ImageIcon, Phone, ShoppingCart, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useToast } from '@/hooks/use-toast';
import { type Order } from '@/lib/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

function OrderDetailsSkeleton() {
    return (
        <Card className="w-full max-w-lg mx-auto">
            <CardHeader>
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                    </div>
                     <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default function OrderDetailsPage() {
    const params = useParams();
    const orderId = params.orderId as string;
    const firestore = useFirestore();
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const { toast } = useToast();

    const orderCardRef = useRef<HTMLDivElement>(null);
    const settingsRef = useMemoFirebase(() => (firestore ? doc(firestore, 'settings', 'payment') : null), [firestore]);
    const { data: settings } = useDoc(settingsRef);

    const orderRef = useMemoFirebase(
        () => (firestore && orderId ? doc(firestore, 'orders', orderId) : null),
        [firestore, orderId]
    );
    const { data: order, isLoading: isOrderLoading } = useDoc<Order>(orderRef);
    
    if (isOrderLoading || isUserLoading) {
        return <main className="flex-grow container mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8"><OrderDetailsSkeleton /></main>;
    }
    
    // After loading, if there's no order, it's a 404
    if (!order) {
        return notFound();
    }
    
    // After loading, if the user is not the owner, redirect them
    // This check runs only after we are sure who the user is.
    if (!isUserLoading && user?.uid !== order.userId) {
        router.push('/login');
        return <main className="flex-grow container mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8"><OrderDetailsSkeleton /></main>;
    }

    const handleDownload = async (format: 'png' | 'pdf') => {
        if (!orderCardRef.current) return;

        try {
            const canvas = await html2canvas(orderCardRef.current, {
                useCORS: true,
                backgroundColor: null, 
            });
            const imgData = canvas.toDataURL('image/png');

            if (format === 'png') {
                const link = document.createElement('a');
                link.download = `order-receipt-${order.id}.png`;
                link.href = imgData;
                link.click();
            } else {
                const pdf = new jsPDF({
                    orientation: 'portrait',
                    unit: 'px',
                    format: [canvas.width, canvas.height]
                });
                pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
                pdf.save(`order-receipt-${order.id}.pdf`);
            }
        } catch (error) {
            console.error('Failed to generate receipt:', error);
            toast({
                variant: 'destructive',
                title: 'Download Failed',
                description: 'Could not generate your order receipt. Please try again.'
            });
        }
    };
    
    const isOrderComplete = order.status === 'completed';
    const orderDate = order.orderDate?.toDate ? order.orderDate.toDate() : new Date(order.orderDate);

    return (
        <main className="flex-grow container mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
            <Card className="w-full mx-auto">
                <div ref={orderCardRef} className="bg-card rounded-t-lg">
                    <CardHeader className="text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                            {isOrderComplete ? <CheckCircle className="h-6 w-6 text-primary" /> : <ShoppingCart className="h-6 w-6 text-primary" />}
                        </div>
                        <CardTitle className="text-2xl mt-4">
                            {isOrderComplete ? "Order Complete" : "Order Details"}
                        </CardTitle>
                        <CardDescription>
                            {isOrderComplete ? "Your subscription details are below." : "Your order is pending. We will process it shortly."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2 rounded-lg border p-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Order ID</span>
                                <span className="font-mono text-xs">{order.id}</span>
                            </div>
                             <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Order Date</span>
                                <span>{orderDate instanceof Date && !isNaN(orderDate as any) ? orderDate.toLocaleString() : 'Processing...'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Status</span>
                                <Badge variant={order.status === 'completed' ? 'default' : 'secondary'} className="capitalize">{order.status}</Badge>
                            </div>
                        </div>

                         <div>
                            <h3 className="mb-2 font-semibold">Items</h3>
                            <div className="space-y-2 rounded-lg border p-4 text-sm">
                                {order.items.map(item => (
                                    <div key={item.id} className="flex justify-between items-center">
                                        <div>
                                            <p>{item.subscriptionName}</p>
                                            <p className="text-xs text-muted-foreground">{item.variantName}</p>
                                        </div>
                                        <p className="font-medium">{item.price.toFixed(2)} PKR</p>
                                    </div>
                                ))}
                                <div className="flex justify-between text-base font-bold pt-2 border-t">
                                    <span>Total</span>
                                    <span>{order.totalAmount.toFixed(2)} PKR</span>
                                </div>
                            </div>
                        </div>
                        
                        {isOrderComplete && order.credentials && (
                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="item-1">
                                    <AccordionTrigger>
                                        <h3 className="font-semibold">Your Subscription Details</h3>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className='space-y-4 pt-2'>
                                            <div className="text-sm space-y-2 p-4 rounded-lg border bg-muted/50">
                                                <p><strong>Username/Email:</strong> {order.credentials.username}</p>
                                                <p><strong>Password:</strong> {order.credentials.password}</p>
                                            </div>
                                            <div className="border-l-4 border-destructive pl-4 py-2 bg-destructive/10 text-red-950 dark:text-red-200">
                                                <div className="flex items-center gap-2">
                                                    <AlertTriangle className="h-5 w-5" />
                                                    <h5 className="font-semibold">Important Account Rules</h5>
                                                </div>
                                                <ul className="text-xs list-disc pl-5 mt-2">
                                                    <li>Do not pin a profile.</li>
                                                    <li>Do not change any account details (password, email, etc.).</li>
                                                    <li>Violation will result in a permanent ban and no refund.</li>
                                                </ul>
                                            </div>
                                            {(settings as any)?.whatsappNumber && (
                                            <div className="border-l-4 border-primary pl-4 py-2 bg-primary/10">
                                                <div className="flex items-center gap-2">
                                                    <Phone className="h-5 w-5 text-primary" />
                                                    <h5 className="font-semibold text-primary">OTP Verification Support</h5>
                                                </div>
                                                <p className="text-xs mt-2 text-primary/90">
                                                    If OTP (One-Time Password) verification is needed for login, please contact our support team on WhatsApp at {(settings as any).whatsappNumber}.
                                                </p>
                                            </div>
                                            )}
                                            {order.note && (
                                            <div className="border-t pt-4 mt-4">
                                                <h5 className="font-semibold mb-2 flex items-center gap-2">Note from Admin</h5>
                                                <p className="text-sm text-muted-foreground italic">"{order.note}"</p>
                                            </div>
                                            )}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        )}

                    </CardContent>
                </div>
                <CardContent className="pt-6 space-y-4">
                     <div className="grid grid-cols-2 gap-2">
                        <Button onClick={() => handleDownload('png')} variant="outline">
                            <ImageIcon className="mr-2 h-4 w-4" /> Save as Image
                        </Button>
                        <Button onClick={() => handleDownload('pdf')} variant="outline">
                            <FileDown className="mr-2 h-4 w-4" /> Download PDF
                        </Button>
                    </div>
                     <Button asChild className="w-full" size="lg" variant="secondary">
                        <Link href="/u/r2/div/products">
                            <ShoppingCart className="mr-2 h-4 w-4" /> Continue Shopping
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </main>
    );
}
