
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, setDoc, query } from 'firebase/firestore';
import { PlusCircle, Trash, Sparkles, Loader2, Info } from 'lucide-react';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Switch } from './ui/switch';
import { Label } from '@/components/ui/label';


const variantGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required'),
  options: z.array(z.string().min(1, 'Option name cannot be empty')).min(1, 'At least one option is required'),
});

const variantMatrixEntrySchema = z.object({
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
  variantMatrix: z.array(variantMatrixEntrySchema).optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

const getCombinations = (groups: z.infer<typeof variantGroupSchema>[]) => {
    if (!groups || groups.length === 0) return [];

    const combinations: Record<string, string>[] = [];
    const recursion = (index: number, currentCombination: Record<string, string>) => {
        if (index === groups.length) {
            combinations.push(currentCombination);
            return;
        }

        const group = groups[index];
        if (group.name && group.options) {
            for (const option of group.options) {
                const newCombination = { ...currentCombination, [group.name]: option };
                recursion(index + 1, newCombination);
            }
        }
    };
    recursion(0, {});
    return combinations;
};

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
      imageUrl: '',
      categoryId: '',
      variantGroups: [],
      variantMatrix: [],
    },
  });

  const { fields: variantGroups, append: appendVariantGroup, remove: removeVariantGroup, update: updateVariantGroup } = useFieldArray({
    control: productForm.control,
    name: 'variantGroups',
  });
  
  const { fields: variantMatrixFields, replace: replaceVariantMatrix } = useFieldArray({
    control: productForm.control,
    name: 'variantMatrix',
  });

  const watchedVariantGroups = useWatch({
    control: productForm.control,
    name: 'variantGroups',
  });

  useMemo(() => {
    const newCombinations = getCombinations(watchedVariantGroups || []);
    const existingMatrix = productForm.getValues('variantMatrix') || [];

    const updatedMatrix = newCombinations.map(combo => {
      const existingEntry = existingMatrix.find(entry => {
        return Object.keys(combo).every(key => combo[key] === entry.options[key]) && Object.keys(entry.options).every(key => combo[key] === entry.options[key]);
      });
      return existingEntry || { options: combo, price: 0, inStock: true };
    });

    replaceVariantMatrix(updatedMatrix);

  }, [watchedVariantGroups, replaceVariantMatrix, productForm]);


  async function onProductSubmit(values: ProductFormData) {
    if (!firestore) return;
    try {
      const newId = doc(collection(firestore, 'subscriptions')).id;
      const productData = { ...values, id: newId, description: values.description || '' };
      
      // If there are no variants, ensure variantMatrix is empty
      if (!values.variantGroups || values.variantGroups.length === 0) {
        productData.variantMatrix = [];
      }

      await setDoc(doc(firestore, 'subscriptions', newId), productData);
      toast({ title: 'Product Added', description: `${values.name} has been successfully added.` });
      productForm.reset();
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
            
             <FormField
              control={productForm.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Description (Optional)</FormLabel>
                  </div>
                  <FormControl>
                    <Textarea
                      placeholder="A short description of the product."
                      {...field}
                      className="min-h-[100px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField control={productForm.control} name="imageUrl" render={({ field }) => (<FormItem><FormLabel>Image URL (Optional)</FormLabel><FormControl><Input placeholder="https://example.com/image.png" {...field} /></FormControl><FormMessage /></FormItem>)} />

            {!hasVariants && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <FormField control={productForm.control} name="price" render={({ field }) => (<FormItem><FormLabel>Base Price (PKR)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="3000" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
            )}
            
            <div className="p-4 border rounded-lg space-y-4 bg-muted/50">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Product Variants</h3>
                   <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button type="button" variant="ghost" size="icon"><Info className="h-4 w-4" /></Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Add groups like "Screen" or "Duration". Then add options for each, like "1 Screen" or "1 Month". A matrix will be generated to set the price for each combination.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                {variantGroups.map((group, groupIndex) => (
                    <VariantGroup key={group.id} groupIndex={groupIndex} removeGroup={removeVariantGroup} control={productForm.control} />
                ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => appendVariantGroup({ name: '', options: [''] })}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Variant Group
              </Button>
            </div>

            {hasVariants && variantMatrixFields.length > 0 && (
                <div className="p-4 border rounded-lg space-y-4">
                    <h3 className="text-lg font-medium">Variant Pricing Matrix</h3>
                    <div className="grid grid-cols-3 gap-4 font-semibold">
                        <span className="col-span-1">Combination</span>
                        <span>Price (PKR)</span>
                        <span>In Stock</span>
                    </div>
                     {variantMatrixFields.map((field, index) => {
                        const optionNames = Object.values(field.options).join(' / ');
                        return (
                            <div key={field.id} className="grid grid-cols-3 gap-4 items-center">
                                <span className="text-sm">{optionNames}</span>
                                <FormField
                                    control={productForm.control}
                                    name={`variantMatrix.${index}.price`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl><Input type="number" step="1" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                 <FormField
                                    control={productForm.control}
                                    name={`variantMatrix.${index}.inStock`}
                                    render={({ field }) => (
                                        <FormItem className="flex justify-center">
                                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        );
                    })}
                </div>
            )}

            <Button type="submit" size="lg" className="w-full">Add Product</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}


function VariantGroup({ groupIndex, removeGroup, control }: { groupIndex: number; removeGroup: (index: number) => void; control: any }) {
    const { fields, append, remove } = useFieldArray({
        control,
        name: `variantGroups.${groupIndex}.options`
    });

    return (
        <div className="p-4 border rounded-lg space-y-3 bg-background relative">
            <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => removeGroup(groupIndex)}>
                <Trash className="h-4 w-4 text-destructive" />
            </Button>
            <FormField
                control={control}
                name={`variantGroups.${groupIndex}.name`}
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Group Name</FormLabel>
                        <FormControl><Input placeholder="e.g., Duration" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <div className="space-y-2">
                <Label>Options</Label>
                {fields.map((option, optionIndex) => (
                    <div key={option.id} className="flex items-center gap-2">
                        <FormField
                            control={control}
                            name={`variantGroups.${groupIndex}.options.${optionIndex}`}
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
                <Button type="button" variant="ghost" size="sm" onClick={() => append('')}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Option
                </Button>
            </div>
        </div>
    );
}
