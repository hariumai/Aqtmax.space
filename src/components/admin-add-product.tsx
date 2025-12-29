
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { doc, collection, setDoc } from 'firebase/firestore';

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.coerce.number().min(0, 'Price must be a positive number'),
  imageUrl: z.string().url('Must be a valid URL'),
  categoryId: z.string().min(1, 'Category ID is required'),
});

export default function AdminAddProduct() {
  const firestore = useFirestore();
  const { toast } = useToast();

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Product</CardTitle>
        <CardDescription>Fill out the form below to add a new subscription product.</CardDescription>
      </CardHeader>
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
  );
}
