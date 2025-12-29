'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, addDoc } from 'firebase/firestore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';

const ADMIN_KEY = '36572515';

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.coerce.number().min(0, 'Price must be a positive number'),
  imageUrl: z.string().url('Must be a valid URL'),
  categoryId: z.string().min(1, 'Category ID is required'),
});

function AdminDashboard() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const usersQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'users')) : null),
    [firestore]
  );
  const { data: users, isLoading: isLoadingUsers } = useCollection(usersQuery);

  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      imageUrl: '',
      categoryId: '',
    },
  });

  async function onProductSubmit(values: z.infer<typeof productSchema>) {
    if (!firestore) return;
    try {
      await addDoc(collection(firestore, 'subscriptions'), {
        ...values,
        id: crypto.randomUUID(),
      });
      toast({
        title: 'Product Added',
        description: `${values.name} has been successfully added.`,
      });
      form.reset();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error Adding Product',
        description: error.message || 'An unexpected error occurred.',
      });
    }
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 space-y-8">
       <div className="text-center">
        <h1 className="font-headline text-4xl font-extrabold tracking-tighter sm:text-5xl">
          Admin Dashboard
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          Manage your users and products from here.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Users</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Signup Credit</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoadingUsers ? (
                        <TableRow>
                            <TableCell colSpan={3}>Loading users...</TableCell>
                        </TableRow>
                        ) : (
                        users?.map((user) => (
                            <TableRow key={user.id}>
                            <TableCell>{user.name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>${user.signupCredit?.toFixed(2) || '0.00'}</TableCell>
                            </TableRow>
                        ))
                        )}
                    </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>

        <div>
            <Card>
                <CardHeader>
                <CardTitle>Add New Product</CardTitle>
                </CardHeader>
                <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onProductSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Product Name</FormLabel>
                            <FormControl>
                            <Input placeholder="e.g., Netflix Premium" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                            <Input placeholder="Subscription details" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Price</FormLabel>
                            <FormControl>
                            <Input type="number" step="0.01" placeholder="9.99" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="imageUrl"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Image URL</FormLabel>
                            <FormControl>
                            <Input placeholder="https://example.com/image.png" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="categoryId"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Category ID</FormLabel>
                            <FormControl>
                            <Input placeholder="e.g., entertainment" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <Button type="submit" className="w-full">Add Product</Button>
                    </form>
                </Form>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [key, setKey] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (key === ADMIN_KEY) {
      setIsAuthenticated(true);
      setError('');
      localStorage.setItem('admin-key', key);
    } else {
      setError('Invalid admin key.');
    }
  };
  
  useEffect(() => {
    const storedKey = localStorage.getItem('admin-key');
    if (storedKey === ADMIN_KEY) {
        setIsAuthenticated(true);
    }
  }, [])

  if (!isAuthenticated) {
    return (
        <div className="flex flex-col min-h-screen">
        <SiteHeader />
        <main className="flex-grow flex items-center justify-center">
            <Card className="mx-auto max-w-sm w-full">
            <CardHeader>
                <CardTitle className="text-2xl">Admin Access</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                <Input
                    type="password"
                    placeholder="Enter admin key"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                />
                {error && <p className="text-sm font-medium text-destructive">{error}</p>}
                <Button onClick={handleLogin} className="w-full">
                    Enter
                </Button>
                </div>
            </CardContent>
            </Card>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-grow">
        <AdminDashboard />
      </main>
      <SiteFooter />
    </div>
  );
}
