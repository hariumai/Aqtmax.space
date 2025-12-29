'use client';
import {
  collection,
  deleteDoc,
  doc,
  query,
  setDoc,
} from 'firebase/firestore';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, Trash, PlusCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';

const variantSchema = z.object({
  name: z.string().min(1, 'Variant name is required'),
  price: z.coerce.number().min(0, 'Price must be a positive number'),
});

const productSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.coerce.number().min(0, 'Base price must be a positive number'),
  discountedPrice: z.coerce.number().optional(),
  imageUrl: z.string().url('Must be a valid URL'),
  categoryId: z.string().min(1, 'Category ID is required'),
  variants: z.array(variantSchema).optional(),
});

type Product = z.infer<typeof productSchema>;

function EditProductForm({
  product,
  onFinished,
}: {
  product: Product;
  onFinished: () => void;
}) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const form = useForm<Product>({
    resolver: zodResolver(productSchema),
    defaultValues: product,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'variants',
  });

  async function onSubmit(values: Product) {
    if (!firestore) return;
    try {
      const docRef = doc(firestore, 'subscriptions', values.id);
      await setDoc(docRef, values);
      toast({
        title: 'Product Updated',
        description: 'The product has been successfully updated.',
      });
      onFinished();
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Error updating product',
        description: e.message,
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <ScrollArea className="h-[60vh] pr-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Product Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="categoryId" render={({ field }) => (<FormItem><FormLabel>Category ID</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="price" render={({ field }) => (<FormItem><FormLabel>Base Price (PKR)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="discountedPrice" render={({ field }) => (<FormItem><FormLabel>Discounted Price (PKR)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="imageUrl" render={({ field }) => (<FormItem><FormLabel>Image URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            
            <div>
                <h3 className="text-lg font-medium mb-2">Product Variants</h3>
                <div className="space-y-4">
                {fields.map((field, index) => (
                    <div key={field.id} className="flex items-end gap-4 p-4 border rounded-lg bg-muted/50">
                    <FormField
                        control={form.control}
                        name={`variants.${index}.name`}
                        render={({ field }) => (
                        <FormItem className="flex-grow">
                            <FormLabel>Variant Name</FormLabel>
                            <FormControl><Input placeholder="e.g., 1 Month" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name={`variants.${index}.price`}
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Variant Price</FormLabel>
                            <FormControl><Input type="number" step="1" placeholder="3000" {...field} /></FormControl>
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
                <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => append({ name: '', price: 0 })}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Variant
                </Button>
            </div>
          </div>
        </ScrollArea>
        <DialogFooter className="pt-6">
          <DialogClose asChild>
            <Button type="button" variant="ghost">Cancel</Button>
          </DialogClose>
          <Button type="submit">Save Changes</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export default function AdminManageProducts() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const productsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'subscriptions')) : null),
    [firestore]
  );
  const { data: products, isLoading } = useCollection<Product>(productsQuery);

  const handleDelete = async (productId: string) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'subscriptions', productId));
      toast({
        title: 'Product Deleted',
        description: 'The product has been successfully deleted.',
      });
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Error deleting product',
        description: e.message,
      });
    }
  };

  const handleEditClick = (product: Product) => {
    setSelectedProduct(product);
    setIsEditDialogOpen(true);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Products</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Base Price</TableHead>
              <TableHead>Variants</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5}>Loading products...</TableCell>
              </TableRow>
            )}
            {!isLoading && products?.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.categoryId}</TableCell>
                  <TableCell>{product.price.toFixed(2)} PKR</TableCell>
                  <TableCell>{product.variants?.length || 0}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEditClick(product)}>
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
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the product "{product.name}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(product.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading && products?.length === 0 && (
                <TableRow>
                    <TableCell colSpan={5} className="text-center">No products found.</TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                    <DialogTitle>Edit: {selectedProduct?.name}</DialogTitle>
                </DialogHeader>
                {selectedProduct && (
                    <EditProductForm
                        product={selectedProduct}
                        onFinished={() => setIsEditDialogOpen(false)}
                    />
                )}
            </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
