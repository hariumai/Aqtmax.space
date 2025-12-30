'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, doc, updateDoc, orderBy, runTransaction } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from './ui/button';
import { CheckCircle, Clock, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from './ui/badge';
import Link from 'next/link';

export default function AdminOrders() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const ordersQuery = useMemoFirebase(
    () => (firestore && user ? query(collection(firestore, 'orders'), orderBy('orderDate', 'desc')) : null),
    [firestore, user]
  );
  const { data: orders, isLoading: isLoadingOrders } = useCollection(ordersQuery);

  const handleCompleteOrder = async (order: any) => {
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
            transaction.update(orderRef, { status: 'completed' });
        });

        toast({
            title: 'Order Completed',
            description: `The order has been marked as complete and ${order.totalAmount.toFixed(2)} PKR credit has been added to the user's account.`,
        });
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Error Updating Order',
            description: error.message || 'An unexpected error occurred.',
        });
    }
  };

  return (
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
                        <Button size="sm" onClick={() => handleCompleteOrder(order)}>
                            Complete Order
                        </Button>
                    )}
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
  );
}
