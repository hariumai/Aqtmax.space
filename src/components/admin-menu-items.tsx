
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { doc, collection, writeBatch, getDocs, query, orderBy, deleteDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Trash } from 'lucide-react';

const menuItemSchema = z.object({
    id: z.string().optional(),
    label: z.string().min(1, "Label is required"),
    href: z.string().min(1, "Link is required"),
    order: z.number(),
});

const menuItemsSchema = z.object({
    items: z.array(menuItemSchema),
});

type MenuItem = z.infer<typeof menuItemSchema>;

export default function AdminMenuItems() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [initialItems, setInitialItems] = useState<MenuItem[]>([]);
  const [itemsToDelete, setItemsToDelete] = useState<string[]>([]);

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
        const items = menuItemsSnapshot.docs.map(d => ({ ...d.data(), id: d.id })) as MenuItem[];
        menuItemsForm.reset({ items });
        setInitialItems(items);
    }
    if (firestore) {
      fetchMenuItems();
    }
  }, [firestore, menuItemsForm]);

  const handleRemoveItem = (index: number) => {
    const itemToRemove = menuFields[index];
    if (itemToRemove.id) {
        setItemsToDelete(prev => [...prev, itemToRemove.id!]);
    }
    removeMenuItem(index);
  }

  async function onMenuItemsSubmit(values: z.infer<typeof menuItemsSchema>) {
    if (!firestore) return;
    try {
        const batch = writeBatch(firestore);

        // Delete items that were marked for deletion
        itemsToDelete.forEach(id => {
            const docRef = doc(firestore, 'menuItems', id);
            batch.delete(docRef);
        });

        // Set (create or update) current items
        values.items.forEach((item, index) => {
            const id = item.id || doc(collection(firestore, 'menuItems')).id;
            const docRef = doc(firestore, 'menuItems', id);
            batch.set(docRef, { ...item, id, order: index });
        });

        await batch.commit();

        // Refetch the items to update the state
        const menuItemsQuery = query(collection(firestore, 'menuItems'), orderBy('order'));
        const menuItemsSnapshot = await getDocs(menuItemsQuery);
        const updatedItems = menuItemsSnapshot.docs.map(d => ({ ...d.data(), id: d.id })) as MenuItem[];
        menuItemsForm.reset({ items: updatedItems });
        setInitialItems(updatedItems);
        setItemsToDelete([]); // Clear deletion queue
        
        toast({ title: 'Menu Items Updated', description: 'Your navigation menu has been saved.' });

    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error Updating Menu', description: error.message || 'An unexpected error occurred.' });
    }
  }

  return (
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
                  <Button type="button" variant="destructive" size="icon" onClick={() => handleRemoveItem(index)}>
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
  );
}
