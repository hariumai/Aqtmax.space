
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, doc, updateDoc, orderBy, runTransaction, deleteDoc } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from './ui/button';
import { CheckCircle, Clock, ExternalLink, Pencil, Trash } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from './ui/badge';
import Link from 'next/link';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from './ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useState } from 'react';
import { type Order } from '@/lib/types';
import { ScrollArea } from './ui/scroll-area';
import { Textarea } from './ui/textarea';


const completeOrderSchema = z.object({
    username: z.string().min(1, "Username/Email is required."),
    password: z.string().min(1, "Password is required."),
    note: z.string().optional(),
});

function CompleteOrderForm({ order, onFinished }: { order: Order; onFinished: (data: z.infer<typeof completeOrderSchema>) => void; }) {
    const { toast } = useToast();
    const form = useForm<z.infer<typeof completeOrderSchema>>({
        resolver: zodResolver(completeOrderSchema),
        defaultValues: {
            username: '',
            password: '',
            note: '',
        },
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onFinished)} className="space-y-4">
                 <FormField control={form.control} name="username" render={({ field }) => (
                    <FormItem><FormLabel>Subscription Username/Email</FormLabel><FormControl><Input placeholder="user@service.com" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem><FormLabel>Subscription Password</FormLabel><FormControl><Input placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="note" render={({ field }) => (
                    <FormItem><FormLabel>Note for Customer (Optional)</FormLabel><FormControl><Textarea placeholder="e.g., Your subscription is valid for 30 days." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <DialogFooter className="pt-4">
                    <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
                    <Button type="submit">Complete Order</Button>
                </DialogFooter>
            </form>
        </Form>
    );
}

const orderSchema = z.object({
  id: z.string(),
  customerName: z.string().min(1, "Name is required"),
  customerEmail: z.string().email("Invalid email"),
  status: z.enum(['pending', 'completed', 'cancelled']),
  credentials: z.object({
    username: z.string().optional(),
    password: z.string().optional(),
  }).optional(),
  note: z.string().optional(),
});

function EditOrderForm({ order, onFinished }: { order: Order; onFinished: () => void; }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const form = useForm<z.infer<typeof orderSchema>>({
        resolver: zodResolver(orderSchema),
        defaultValues: {
            id: order.id,
            customerName: order.customerName,
            customerEmail: order.customerEmail,
            status: order.status,
            credentials: {
                username: order.credentials?.username || '',
                password: order.credentials?.password || '',
            },
            note: order.note || '',
        },
    });

    async function onSubmit(values: z.infer<typeof orderSchema>) {
        if (!firestore) return;
        try {
            const docRef = doc(firestore, 'orders', values.id);
            await updateDoc(docRef, {
                customerName: values.customerName,
                customerEmail: values.customerEmail,
                status: values.status,
                credentials: values.credentials,
                note: values.note,
            });
            toast({ title: "Order Updated", description: "The order details have been saved." });
            onFinished();
        } catch (e: any) {
            toast({ variant: "destructive", title: "Error updating order", description: e.message });
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <ScrollArea className="h-[60vh] pr-6">
                    <div className="space-y-6">
                        <FormField control={form.control} name="customerName" render={({ field }) => (
                            <FormItem><FormLabel>Customer Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="customerEmail" render={({ field }) => (
                            <FormItem><FormLabel>Customer Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="status" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Status</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <div className="space-y-2 pt-4 border-t">
                            <h4 className="font-medium">Subscription Credentials</h4>
                             <FormField control={form.control} name="credentials.username" render={({ field }) => (
                                <FormItem><FormLabel>Username/Email</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name="credentials.password" render={({ field }) => (
                                <FormItem><FormLabel>Password</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                         <div className="space-y-2 pt-4 border-t">
                            <h4 className="font-medium">Note to Customer</h4>
                             <FormField control={form.control} name="note" render={({ field }) => (
                                <FormItem><FormLabel>Note</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                    </div>
                </ScrollArea>
                <DialogFooter className="pt-6">
                    <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
                    <Button type="submit">Save Changes</Button>
                </DialogFooter>
            </form>
        </Form>
    );
}


export default function AdminOrders() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const ordersQuery = useMemoFirebase(
    () => (firestore && user ? query(collection(firestore, 'orders'), orderBy('orderDate', 'desc')) : null),
    [firestore, user]
  );
  const { data: orders, isLoading: isLoadingOrders } = useCollection<Order>(ordersQuery);

  const handleCompleteOrder = async (order: Order, completionData: z.infer<typeof completeOrderSchema>) => {
    if (!firestore) return;
    try {
        await runTransaction(firestore, async (transaction) => {
            const orderRef = doc(firestore, 'orders', order.id);
            const userRef = doc(firestore, 'users', order.userId);

            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists()) {
                throw new Error("User not found!");
            }

            const currentCredit = userDoc.data().storeCredit || 0;
            const newCredit = currentCredit + order.totalAmount;

            transaction.update(userRef, { storeCredit: newCredit });
            transaction.update(orderRef, { 
                status: 'completed',
                credentials: {
                    username: completionData.username,
                    password: completionData.password
                },
                note: completionData.note || null,
            });
        });

        toast({
            title: 'Order Completed',
            description: `The order has been marked as complete and ${order.totalAmount.toFixed(2)} PKR credit has been added to the user's account.`,
        });
        setIsCompleteDialogOpen(false);
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Error Updating Order',
            description: error.message || 'An unexpected error occurred.',
        });
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
      if (!firestore) return;
      try {
          await deleteDoc(doc(firestore, 'orders', orderId));
          toast({ title: 'Order Deleted', description: 'The order has been successfully deleted.' });
      } catch (e: any) {
          toast({ variant: 'destructive', title: 'Error deleting order', description: e.message });
      }
  };

  const openCompleteDialog = (order: Order) => {
    setSelectedOrder(order);
    setIsCompleteDialogOpen(true);
  }

  const handleEditClick = (order: Order) => {
      setSelectedOrder(order);
      setIsEditDialogOpen(true);
  };

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle>Orders</CardTitle>
        <CardDescription>
            View and manage all customer orders.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Screenshot</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingOrders ? (
              <TableRow>
                <TableCell colSpan={6}>Loading orders...</TableCell>
              </TableRow>
            ) : (
              orders?.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <div>{order.customerName}</div>
                    <div className="text-xs text-muted-foreground">{order.customerEmail}</div>
                  </TableCell>
                  <TableCell>{new Date(order.orderDate?.toDate()).toLocaleString()}</TableCell>
                  <TableCell>{order.totalAmount.toFixed(2)} PKR</TableCell>
                  <TableCell>
                    {order.paymentScreenshotUrl ? (
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/api/proof/${order.paymentScreenshotUrl}`} target="_blank">
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                    ) : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={order.status === 'completed' ? 'default' : 'secondary'} className="capitalize">
                      {order.status === 'completed' ? <CheckCircle className="mr-1 h-3 w-3" /> : <Clock className="mr-1 h-3 w-3" />}
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {order.status === 'pending' && (
                        <Button size="sm" onClick={() => openCompleteDialog(order)}>
                            Complete Order
                        </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => handleEditClick(order)}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                <Trash className="h-4 w-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>This will permanently delete this order. This action cannot be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteOrder(order.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            )}
            {!isLoadingOrders && orders?.length === 0 && (
                <TableRow>
                    <TableCell colSpan={6} className="text-center">No orders found.</TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Complete Order</DialogTitle>
                <DialogDescription>
                    Enter the subscription credentials and an optional note for the customer.
                </DialogDescription>
            </DialogHeader>
            {selectedOrder && (
                <CompleteOrderForm
                    order={selectedOrder}
                    onFinished={(data) => handleCompleteOrder(selectedOrder, data)}
                />
            )}
        </DialogContent>
    </Dialog>

    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Edit Order</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
                <EditOrderForm
                    order={selectedOrder}
                    onFinished={() => setIsEditDialogOpen(false)}
                />
            )}
        </DialogContent>
    </Dialog>
    </>
  );
}
