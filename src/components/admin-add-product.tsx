
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
import { PlusCircle, Trash } from 'lucide-react';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Label } from '@/components/ui/label';
import { useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useAdminDashboard } from './admin-dashboard';

const variantOptionSchema = z.object({
  name: z.string().min(1, 'Option name is required'),
});

const variantGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required'),
  options: z.array(variantOptionSchema).min(1, 'At least one option is required'),
});

const variantMatrixItemSchema = z.object({
  options: z.record(z.string()),
  price: z.coerce.number().min(0, 'Price must be non-negative'),
  inStock: z.boolean(),
});

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Base price must be a positive number'),
  imageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  categoryId: z.string().min(1, 'Category ID is required'),
  variantGroups: z.array(variantGroupSchema).optional(),
  variantMatrix: z.array(variantMatrixItemSchema).optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

// Helper to generate cartesian product of variant options
const cartesian = <T>(...a: T[][]): T[][] => a.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())));

export default function AdminAddProduct() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { newProductCategoryId, setActiveSection } = useAdminDashboard();

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
      imageUrl: '',
      categoryId: newProductCategoryId || '',
      variantGroups: [],
      variantMatrix: [],
    },
  });
  
  useEffect(() => {
    if (newProductCategoryId) {
      productForm.reset({ ...productForm.getValues(), categoryId: newProductCategoryId });
    }
  }, [newProductCategoryId, productForm]);


  const { fields: variantGroups, append: appendVariantGroup, remove: removeVariantGroup } = useFieldArray({
    control: productForm.control,
    name: 'variantGroups',
  });

  const { fields: variantMatrix, replace: replaceVariantMatrix } = useFieldArray({
    control: productForm.control,
    name: "variantMatrix",
  });
  
  const watchedVariantGroups = productForm.watch('variantGroups');

  useEffect(() => {
    if (!watchedVariantGroups || watchedVariantGroups.length === 0) {
      replaceVariantMatrix([]);
      return;
    }

    const optionGroups = watchedVariantGroups
      .map(g => g.options?.map(o => ({ group: g.name, option: o.name })) || [])
      .filter(g => g.length > 0 && g.every(o => o.group && o.option));

    if (optionGroups.length < watchedVariantGroups.length) {
        replaceVariantMatrix([]);
        return;
    }

    const combinations = cartesian(...optionGroups);
    
    const newMatrix = combinations.map(combo => {
      const comboArray = Array.isArray(combo) ? combo : [combo];
      const optionsRecord = comboArray.reduce((acc, curr) => {
        acc[curr.group] = curr.option;
        return acc;
      }, {} as Record<string, string>);
      
      return {
        options: optionsRecord,
        price: 0,
        inStock: true
      };
    });

    replaceVariantMatrix(newMatrix);
  }, [watchedVariantGroups, replaceVariantMatrix]);


  async function onProductSubmit(values: ProductFormData) {
    if (!firestore) return;
    try {
      const newId = doc(collection(firestore, 'subscriptions')).id;
      await setDoc(doc(firestore, 'subscriptions', newId), { ...values, id: newId, description: values.description || '' });
      toast({ title: 'Product Added', description: `${values.name} has been successfully added.` });
      productForm.reset();
      setActiveSection('manageProducts');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error Adding Product', description: error.message || 'An unexpected error occurred.' });
    }
  }

  const hasVariants = (watchedVariantGroups || []).length > 0;

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
                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
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

            {!hasVariants && (
              <FormField control={productForm.control} name="price" render={({ field }) => (<FormItem><FormLabel>Base Price (PKR)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="3000" {...field} /></FormControl><FormMessage /></FormItem>)} />
            )}
            
            <div className="p-4 border rounded-lg space-y-4 bg-muted/50">
              <h3 className="text-lg font-medium">Variants</h3>
              <CardDescription>
                Define groups of options, like 'Duration' or 'Screens'. This will generate a matrix below to manage price and stock for each combination.
              </CardDescription>

              {variantGroups.map((group, groupIndex) => (
                <VariantGroup key={group.id} groupIndex={groupIndex} removeGroup={removeVariantGroup} form={productForm} />
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendVariantGroup({ name: '', options: [{ name: '' }] })}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Variant Group
              </Button>
            </div>
            
            {hasVariants && variantMatrix.length > 0 && (
                 <div className="p-4 border rounded-lg space-y-4 bg-muted/50">
                    <h3 className="text-lg font-medium">Variant Matrix</h3>
                     <CardDescription>
                        Set the price and availability for each specific variant combination.
                    </CardDescription>
                    <div className="space-y-2">
                        {variantMatrix.map((matrixItem, index) => (
                             <div key={matrixItem.id} className="grid grid-cols-3 gap-4 items-center p-2 bg-background rounded-md">
                                <span className="text-sm font-medium">{Object.values(matrixItem.options).join(' / ')}</span>
                                 <FormField
                                    control={productForm.control}
                                    name={`variantMatrix.${index}.price`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormControl>
                                            <Input type="number" step="0.01" placeholder="Price" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                />
                                <FormField
                                    control={productForm.control}
                                    name={`variantMatrix.${index}.inStock`}
                                    render={({ field }) => (
                                      <FormItem className="flex items-center gap-2 space-y-0">
                                        <FormControl>
                                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                                        </FormControl>
                                        <FormLabel>In Stock</FormLabel>
                                      </FormItem>
                                    )}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}


            <Button type="submit" size="lg" className="w-full">Add Product</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function VariantGroup({ groupIndex, removeGroup, form }: { groupIndex: number; removeGroup: (index: number) => void; form: any }) {
  const { control } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: `variantGroups.${groupIndex}.options`,
  });

  return (
    <div className="p-4 border rounded-lg space-y-4 bg-background">
      <div className="flex justify-between items-start gap-4">
        <FormField
          control={control}
          name={`variantGroups.${groupIndex}.name`}
          render={({ field }) => (
            <FormItem className="flex-grow">
              <FormLabel>Group Name</FormLabel>
              <FormControl><Input placeholder="e.g., Duration" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="button" variant="destructive" size="icon" onClick={() => removeGroup(groupIndex)} className="mt-8">
          <Trash className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-2 pl-4 border-l-2">
        <Label>Options</Label>
        {fields.map((option, optionIndex) => (
          <div key={option.id} className="flex items-center gap-2">
            <FormField
              control={control}
              name={`variantGroups.${groupIndex}.options.${optionIndex}.name`}
              render={({ field }) => (
                <FormItem className="flex-grow">
                  <FormControl><Input placeholder="e.g., 1 Month" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="button" variant="ghost" size="icon" onClick={() => remove(optionIndex)}>
              <Trash className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="ghost" size="sm" onClick={() => append({ name: '' })}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Option
        </Button>
      </div>
    </div>
  );
}
