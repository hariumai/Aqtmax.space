'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, doc, setDoc, getDocs, writeBatch, orderBy } from 'firebase/firestore';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Trash } from 'lucide-react';

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.coerce.number().min(0, 'Price must be a positive number'),
  imageUrl: z.string().url('Must be a valid URL'),
  categoryId: z.string().min(1, 'Category ID is required'),
});

const legalPageSchema = z.object({
    id: z.string(),
    title: z.string().min(1, 'Title is required'),
    content: z.string().min(1, 'Content is required'),
})

const legalPagesSchema = z.object({
    pages: z.array(legalPageSchema)
})

const menuItemSchema = z.object({
    id: z.string().optional(),
    label: z.string().min(1, "Label is required"),
    href: z.string().min(1, "Link is required"),
    order: z.number(),
});

const menuItemsSchema = z.object({
    items: z.array(menuItemSchema),
});


export default function AdminDashboard() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const usersQuery = useMemoFirebase(
    () => (firestore && user ? query(collection(firestore, 'users')) : null),
    [firestore, user]
  );
  const { data: users, isLoading: isLoadingUsers } = useCollection(usersQuery);

  // Products
  const productForm = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: '', description: '', price: 0, imageUrl: '', categoryId: '' },
  });

  async function onProductSubmit(values: z.infer<typeof productSchema>) {
    if (!firestore) return;
    try {
      const newId = doc(collection(firestore, 'subscriptions')).id;
      await setDoc(doc(firestore, 'subscriptions', newId), { ...values, id: newId });
      toast({ title: 'Product Added', description: `${values.name} has been successfully added.` });
      productForm.reset();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error Adding Product', description: error.message || 'An unexpected error occurred.' });
    }
  }

  // Legal Pages
  const legalPagesForm = useForm<z.infer<typeof legalPagesSchema>>({
    resolver: zodResolver(legalPagesSchema),
  });
  
  useEffect(() => {
    async function fetchLegalPages() {
      if (!firestore) return;
      const pagesQuery = query(collection(firestore, 'legalPages'), orderBy('title'));
      const pagesSnapshot = await getDocs(pagesQuery);
      const pages = pagesSnapshot.docs.map(d => ({ ...d.data(), id: d.id })) as z.infer<typeof legalPageSchema>[];
      if (pages.length > 0) {
        legalPagesForm.reset({ pages });
      } else {
        legalPagesForm.reset({ pages: [
            { id: 'terms', title: 'Terms of Service', content: ''},
            { id: 'privacy', title: 'Privacy Policy', content: ''},
            { id: 'refund', title: 'Refund Policy', content: ''},
        ]});
      }
    }
    if (firestore) {
      fetchLegalPages();
    }
  }, [firestore, legalPagesForm]);

  async function onLegalPagesSubmit(values: z.infer<typeof legalPagesSchema>) {
    if (!firestore) return;
    try {
      const batch = writeBatch(firestore);
      values.pages.forEach(page => {
        const docRef = doc(firestore, 'legalPages', page.id);
        batch.set(docRef, { title: page.title, content: page.content }, { merge: true });
      });
      await batch.commit();
      toast({ title: 'Legal Pages Updated', description: 'Your legal pages have been saved.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error Updating Pages', description: error.message || 'An unexpected error occurred.' });
    }
  }

  const { fields: legalFields } = useFieldArray({
      control: legalPagesForm.control,
      name: "pages",
  });

  // Menu Items
  const menuItemsForm = useForm<z.infer<typeof menuItemsSchema>>({
    resolver: zodResolver(menuItemsSchema),
    defaultValues: { items: [] },
  });

  const { fields: menuFields, append: appendMenuItem, remove: removeMenuItem } = useFieldArray({
    control: menuItemsForm.control,
    name: "items"
  });

  useEffect(() => {
    async function fetchMenuItems() {
        if (!firestore) return;
        const menuItemsQuery = query(collection(firestore, 'menuItems'), orderBy('order'));
        const menuItemsSnapshot = await getDocs(menuItemsQuery);
        const items = menuItemsSnapshot.docs.map(d => ({ ...d.data(), id: d.id })) as z.infer<typeof menuItemSchema>[];
        menuItemsForm.reset({ items });
    }
    if (firestore) {
      fetchMenuItems();
    }
  }, [firestore, menuItemsForm]);

  async function onMenuItemsSubmit(values: z.infer<typeof menuItemsSchema>) {
    if (!firestore) return;
    try {
        const batch = writeBatch(firestore);
        values.items.forEach((item, index) => {
            const id = item.id || doc(collection(firestore, 'menuItems')).id;
            const docRef = doc(firestore, 'menuItems', id);
            batch.set(docRef, { ...item, id, order: index });
        });
        await batch.commit();
        toast({ title: 'Menu Items Updated', description: 'Your navigation menu has been saved.' });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error Updating Menu', description: error.message || 'An unexpected error occurred.' });
    }
  }


  return (
    <div className="container mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 space-y-8">
      <div className="text-center">
        <h1 className="font-headline text-4xl font-extrabold tracking-tighter sm:text-5xl">Admin Dashboard</h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">Manage your application from a single dashboard.</p>
      </div>

      <Tabs defaultValue="users">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="legal">Legal Pages</TabsTrigger>
          <TabsTrigger value="menu">Menu Items</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader><CardTitle>Users</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Signup Credit</TableHead></TableRow></TableHeader>
                <TableBody>
                  {isLoadingUsers ? (
                    <TableRow><TableCell colSpan={3}>Loading users...</TableCell></TableRow>
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
        </TabsContent>

        <TabsContent value="products" className="mt-6">
          <Card>
            <CardHeader><CardTitle>Add New Product</CardTitle></CardHeader>
            <CardContent>
              <Form {...productForm}>
                <form onSubmit={productForm.handleSubmit(onProductSubmit)} className="space-y-4">
                  <FormField control={productForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Product Name</FormLabel><FormControl><Input placeholder="e.g., Netflix Premium" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={productForm.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Input placeholder="Subscription details" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={productForm.control} name="price" render={({ field }) => (<FormItem><FormLabel>Price</FormLabel><FormControl><Input type="number" step="0.01" placeholder="9.99" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={productForm.control} name="imageUrl" render={({ field }) => (<FormItem><FormLabel>Image URL</FormLabel><FormControl><Input placeholder="https://example.com/image.png" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={productForm.control} name="categoryId" render={({ field }) => (<FormItem><FormLabel>Category ID</FormLabel><FormControl><Input placeholder="e.g., entertainment" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <Button type="submit" className="w-full">Add Product</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="legal" className="mt-6">
            <Card>
                <CardHeader>
                    <CardTitle>Manage Legal Pages</CardTitle>
                    <CardDescription>Update the content for your terms, privacy, and refund pages.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...legalPagesForm}>
                        <form onSubmit={legalPagesForm.handleSubmit(onLegalPagesSubmit)} className="space-y-6">
                            {legalFields.map((field, index) => (
                                <div key={field.id} className="space-y-2 p-4 border rounded-lg">
                                     <h3 className="font-semibold text-lg">{field.title}</h3>
                                     <FormField
                                        control={legalPagesForm.control}
                                        name={`pages.${index}.content`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="sr-only">Content</FormLabel>
                                                <FormControl>
                                                    <Textarea placeholder={`Enter content for ${field.title}...`} {...field} className="min-h-[200px]" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            ))}
                            <Button type="submit">Save Legal Pages</Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </TabsContent>
        
        <TabsContent value="menu" className="mt-6">
            <Card>
                <CardHeader>
                    <CardTitle>Manage Menu Items</CardTitle>
                    <CardDescription>Add, remove, and reorder your navigation links.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Form {...menuItemsForm}>
                        <form onSubmit={menuItemsForm.handleSubmit(onMenuItemsSubmit)} className="space-y-6">
                            <div className="space-y-4">
                                {menuFields.map((field, index) => (
                                    <div key={field.id} className="flex items-center gap-4 p-4 border rounded-lg">
                                        <div className="grid grid-cols-2 gap-4 flex-grow">
                                            <FormField
                                                control={menuItemsForm.control}
                                                name={`items.${index}.label`}
                                                render={({ field }) => (
                                                    <FormItem><FormLabel>Label</FormLabel><FormControl><Input placeholder="Home" {...field} /></FormControl><FormMessage /></FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={menuItemsForm.control}
                                                name={`items.${index}.href`}
                                                render={({ field }) => (
                                                    <FormItem><FormLabel>Link</FormLabel><FormControl><Input placeholder="/" {...field} /></FormControl><FormMessage /></FormItem>
                                                )}
                                            />
                                        </div>
                                        <Button type="button" variant="destructive" size="icon" onClick={() => removeMenuItem(index)}>
                                            <Trash className="h-4 w-4" />
                                            <span className="sr-only">Remove Item</span>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-4">
                                <Button type="button" variant="outline" onClick={() => appendMenuItem({ label: '', href: '', order: menuFields.length })}>
                                    Add Menu Item
                                </Button>
                                <Button type="submit">Save Menu</Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
