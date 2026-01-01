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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, Trash, PlusCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { useState, useMemo } from 'react';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Label } from './ui/label';

const variantOptionSchema = z.object({
  optionName: z.string().min(1, 'Option name is required'),
  price: z.coerce.number().min(0, 'Price must be a positive number'),
});

const variantGroupSchema = z.object({
  groupName: z.string().min(1, 'Group name is required'),
  required: z.boolean().default(true),
  options: z.array(variantOptionSchema).min(1, 'At least one option is required'),
});

const productSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Base price must be a positive number'),
  discountedPrice: z.coerce.number().nullable().optional(),
  imageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  categoryId: z.string().min(1, 'Category ID is required'),
  variants: z.array(variantGroupSchema).optional(),
});

type Product = z.infer<typeof productSchema>;

function VariantOptionsArray({ groupIndex, control }: { groupIndex: number, control: any }) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `variants.${groupIndex}.options`,
  });

  return (
    <div className="space-y-2 pl-4 border-l-2">
      {fields.map((option, optionIndex) => (
        <div key={option.id} className="flex items-end gap-2">
          <FormField
            control={control}
            name={`variants.${groupIndex}.options.${optionIndex}.optionName`}
            render={({ field }) => (
              <FormItem className="flex-grow">
                <FormLabel className="text-xs">Option Name</FormLabel>
                <FormControl><Input placeholder="e.g., Large" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`variants.${groupIndex}.options.${optionIndex}.price`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Price (PKR)</FormLabel>
                <FormControl><Input type="number" step="1" placeholder="3000" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="button" variant="ghost" size="icon" onClick={() => remove(optionIndex)}>
            <Trash className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="ghost" size="sm" onClick={() => append({ optionName: '', price: 0 })}>
        <PlusCircle className="mr-2 h-4 w-4" /> Add Option
      </Button>
    </div>
  );
}

function EditProductForm({
  product,
  onFinished,
}: {
  product: Product;
  onFinished: () => void;
}) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const categoriesQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'categories')) : null),
    [firestore]
  );
  const { data: categories } = useCollection(categoriesQuery);

  const form = useForm<Product>({
    resolver: zodResolver(productSchema),
    defaultValues: product,
  });

  const { fields: variantGroups, append: appendVariantGroup, remove: removeVariantGroup } = useFieldArray({
    control: form.control,
    name: 'variants',
  });

  async function onSubmit(values: Product) {
    if (!firestore) return;
    try {
      const docRef = doc(firestore, 'subscriptions', values.id);
      const productData = { ...values, description: values.description || '' };
      await setDoc(docRef, productData);
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

  const hasVariants = form.watch('variants', []).length > 0;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <ScrollArea className="h-[70vh] pr-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Product Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories?.map(category => (
                          <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description (Optional)</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="imageUrl" render={({ field }) => (<FormItem><FormLabel>Image URL (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            
            <div className="p-4 border rounded-lg space-y-4 bg-muted/50">
                <h3 className="text-lg font-medium">Pricing</h3>
                <CardDescription>
                    If your product has multiple options (e.g., 1 Month, 3 Months), add them as variants. Otherwise, set a base price below.
                </CardDescription>
                {!hasVariants && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    <FormField control={form.control} name="price" render={({ field }) => (<FormItem><FormLabel>Base Price (PKR)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="discountedPrice" render={({ field }) => (<FormItem><FormLabel>Discounted Price (PKR)</FormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                )}
                
                {variantGroups.map((group, groupIndex) => (
                  <div key={group.id} className="p-4 border rounded-lg space-y-4 bg-background">
                    <div className="flex justify-between items-start gap-4">
                        <FormField
                            control={form.control}
                            name={`variants.${groupIndex}.groupName`}
                            render={({ field }) => (
                            <FormItem className="flex-grow">
                                <FormLabel>Group Name</FormLabel>
                                <FormControl><Input placeholder="e.g., Size" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                         <div className="flex flex-col items-center gap-2 pt-1">
                           <Label htmlFor={`required-switch-${groupIndex}`} className="text-xs font-normal">Compulsory</Label>
                           <FormField
                                control={form.control}
                                name={`variants.${groupIndex}.required`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Switch
                                                id={`required-switch-${groupIndex}`}
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>
                        <Button type="button" variant="destructive" size="icon" onClick={() => removeVariantGroup(groupIndex)} className="mt-6">
                            <Trash className="h-4 w-4" />
                        </Button>
                    </div>
                    <VariantOptionsArray groupIndex={groupIndex} control={form.control} />
                  </div>
                ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => appendVariantGroup({ groupName: '', required: true, options: [{ optionName: '', price: 0 }] })}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Variant Group
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

  const categoriesQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'categories')) : null),
    [firestore]
  );
  const { data: categories, isLoading: isLoadingCategories } = useCollection(categoriesQuery);

  const categoryMap = useMemo(() => {
    if (!categories) return {};
    return categories.reduce((acc, category) => {
      acc[category.id] = category.name;
      return acc;
    }, {} as Record<string, string>);
  }, [categories]);

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

  const pageIsLoading = isLoading || isLoadingCategories;

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
            {pageIsLoading && (
              <TableRow>
                <TableCell colSpan={5}>Loading products...</TableCell>
              </TableRow>
            )}
            {!pageIsLoading && products?.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{categoryMap[product.categoryId] || product.categoryId}</TableCell>
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
            {!pageIsLoading && products?.length === 0 && (
                <TableRow>
                    <TableCell colSpan={5} className="text-center">No products found.</TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-2xl">
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
