
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, setDoc, query } from 'firebase/firestore';
import { PlusCircle, Trash, Info } from 'lucide-react';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Switch } from './ui/switch';
import { Label } from '@/components/ui/label';

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
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Base price must be a positive number'),
  discountedPrice: z.coerce.number().nullable().optional(),
  imageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  categoryId: z.string().min(1, 'Category ID is required'),
  variants: z.array(variantGroupSchema).optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function AdminAddProduct() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const categoriesQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'categories')) : null),
    [firestore]
  );
  const { data: categories } = useCollection(categoriesQuery);

  const productForm = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      discountedPrice: null,
      imageUrl: '',
      categoryId: '',
      variants: [],
    },
  });

  const { fields: variantGroups, append: appendVariantGroup, remove: removeVariantGroup } = useFieldArray({
    control: productForm.control,
    name: 'variants',
  });

  async function onProductSubmit(values: ProductFormData) {
    if (!firestore) return;
    try {
      const newId = doc(collection(firestore, 'subscriptions')).id;
      await setDoc(doc(firestore, 'subscriptions', newId), { ...values, id: newId, description: values.description || '' });
      toast({ title: 'Product Added', description: `${values.name} has been successfully added.` });
      productForm.reset();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error Adding Product', description: error.message || 'An unexpected error occurred.' });
    }
  }

  const hasVariants = productForm.watch('variants', []).length > 0;

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
              <FormField
                control={productForm.control}
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
            
            <FormField control={productForm.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl><Textarea placeholder="A short description of the product." {...field} className="min-h-[100px]" /></FormControl>
                  <FormMessage />
                </FormItem>
            )} />

            <FormField control={productForm.control} name="imageUrl" render={({ field }) => (<FormItem><FormLabel>Image URL (Optional)</FormLabel><FormControl><Input placeholder="https://example.com/image.png" {...field} /></FormControl><FormMessage /></FormItem>)} />

            <div className="p-4 border rounded-lg space-y-4 bg-muted/50">
                <h3 className="text-lg font-medium">Pricing</h3>
                <CardDescription>
                    If your product has multiple options (e.g., 1 Month, 3 Months), add them as variants. Otherwise, set a base price below.
                </CardDescription>
                {!hasVariants && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    <FormField control={productForm.control} name="price" render={({ field }) => (<FormItem><FormLabel>Base Price (PKR)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="3000" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={productForm.control} name="discountedPrice" render={({ field }) => (<FormItem><FormLabel>Discounted Price (PKR)</FormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                )}
                
                {variantGroups.map((group, groupIndex) => (
                  <VariantGroup key={group.id} groupIndex={groupIndex} removeGroup={removeVariantGroup} control={productForm.control} />
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

            <Button type="submit" size="lg" className="w-full">Add Product</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

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
                <FormControl><Input placeholder="e.g., 1 Month" {...field} /></FormControl>
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
                <FormControl><Input type="number" step="1" placeholder="300" {...field} /></FormControl>
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


function VariantGroup({ groupIndex, removeGroup, control }: { groupIndex: number; removeGroup: (index: number) => void; control: any }) {
    return (
        <div className="p-4 border rounded-lg space-y-4 bg-background">
            <div className="flex justify-between items-start gap-4">
                <FormField
                    control={control}
                    name={`variants.${groupIndex}.groupName`}
                    render={({ field }) => (
                    <FormItem className="flex-grow">
                        <FormLabel>Group Name</FormLabel>
                        <FormControl><Input placeholder="e.g., Duration" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <div className="flex flex-col items-center gap-2 pt-1">
                   <Label htmlFor={`required-switch-${groupIndex}`} className="text-xs font-normal">Compulsory</Label>
                   <FormField
                        control={control}
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
                <Button type="button" variant="destructive" size="icon" onClick={() => removeGroup(groupIndex)} className="mt-6">
                    <Trash className="h-4 w-4" />
                </Button>
            </div>
            <VariantOptionsArray groupIndex={groupIndex} control={control} />
        </div>
    );
}

