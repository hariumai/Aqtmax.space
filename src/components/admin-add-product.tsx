
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { doc, collection, setDoc } from 'firebase/firestore';
import { PlusCircle, Trash } from 'lucide-react';
import { Textarea } from './ui/textarea';

const variantSchema = z.object({
  name: z.string().min(1, 'Variant name is required'),
  price: z.coerce.number().min(0, 'Price must be a positive number'),
});

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.coerce.number().min(0, 'Base price must be a positive number'),
  discountedPrice: z.coerce.number().optional().transform(val => val || null),
  imageUrl: z.string().url('Must be a valid URL'),
  categoryId: z.string().min(1, 'Category ID is required'),
  variants: z.array(variantSchema).optional(),
});

export default function AdminAddProduct() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const productForm = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      imageUrl: '',
      categoryId: '',
      variants: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: productForm.control,
    name: 'variants',
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
          <form onSubmit={productForm.handleSubmit(onProductSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={productForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Product Name</FormLabel><FormControl><Input placeholder="e.g., Netflix Premium" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={productForm.control} name="categoryId" render={({ field }) => (<FormItem><FormLabel>Category ID</FormLabel><FormControl><Input placeholder="e.g., entertainment" {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            
            <FormField control={productForm.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Subscription details" {...field} /></FormControl><FormMessage /></FormItem>)} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={productForm.control} name="price" render={({ field }) => (<FormItem><FormLabel>Base Price (PKR)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="3000" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={productForm.control} name="discountedPrice" render={({ field }) => (<FormItem><FormLabel>Discounted Price (PKR)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="2499" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={productForm.control} name="imageUrl" render={({ field }) => (<FormItem><FormLabel>Image URL</FormLabel><FormControl><Input placeholder="https://example.com/image.png" {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Product Variants</h3>
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-end gap-4 p-4 border rounded-lg">
                    <FormField
                      control={productForm.control}
                      name={`variants.${index}.name`}
                      render={({ field }) => (
                        <FormItem className="flex-grow">
                          <FormLabel>Variant Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 1 Month" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={productForm.control}
                      name={`variants.${index}.price`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Variant Price (PKR)</FormLabel>
                          <FormControl>
                            <Input type="number" step="1" placeholder="3000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => append({ name: '', price: 0 })}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Variant
              </Button>
            </div>

            <Button type="submit" size="lg" className="w-full">Add Product</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
