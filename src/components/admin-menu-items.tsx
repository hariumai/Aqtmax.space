
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser } from '@/firebase';
import { doc, collection, writeBatch, getDocs, query, orderBy, deleteDoc } from 'firebase/firestore';
import { useEffect } from 'react';
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

const defaultMenuItems: Omit<MenuItem, 'order' | 'id'>[] = [
    { label: 'Home', href: '/' },
    { label: 'Products', href: '/products' },
    { label: 'Categories', href: '/categories' },
];

export default function AdminMenuItems() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const menuItemsForm = useForm<z.infer<typeof menuItemsSchema>>({
    resolver: zodResolver(menuItemsSchema),
    defaultValues: { items: [] },
  });

  const { fields: menuFields, append: appendMenuItem, remove: removeMenuItem, replace } = useFieldArray({
    control: menuItemsForm.control,
    name: "items"
  });

  useEffect(() => {
    async function fetchMenuItems() {
        if (!firestore || !user) return;
        const menuItemsQuery = query(collection(firestore, 'menuItems'), orderBy('order'));
        const menuItemsSnapshot = await getDocs(menuItemsQuery);
        let items = menuItemsSnapshot.docs.map(d => ({ ...d.data(), id: d.id })) as MenuItem[];
        
        if (items.length === 0) {
            // If firestore is empty, populate with defaults
            items = defaultMenuItems.map((item, index) => ({...item, order: index}));
        }

        replace(items);
    }
    if (firestore && user) {
      fetchMenuItems();
    }
  }, [firestore, user, replace]);


  async function onMenuItemsSubmit(values: z.infer<typeof menuItemsSchema>) {
    if (!firestore || !user) {
        toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in to update menu items.' });
        return;
    }
    try {
        const batch = writeBatch(firestore);

        const currentItemsQuery = query(collection(firestore, 'menuItems'));
        const snapshot = await getDocs(currentItemsQuery);
        const existingIds = snapshot.docs.map(d => d.id);
        const formIds = new Set(values.items.map(item => item.id).filter(Boolean));

        // Delete items that are in Firestore but not in the form
        existingIds.forEach(id => {
            if (!formIds.has(id)) {
                batch.delete(doc(firestore, 'menuItems', id));
            }
        });

        // Set (create or update) current items
        values.items.forEach((item, index) => {
            const id = item.id || doc(collection(firestore, 'menuItems')).id;
            const docRef = doc(firestore, 'menuItems', id);
            batch.set(docRef, { ...item, id, order: index });
        });

        await batch.commit();
        
        toast({ title: 'Menu Items Updated', description: 'Your navigation menu has been saved.' });

        // Refetch after saving
        const menuItemsQuery = query(collection(firestore, 'menuItems'), orderBy('order'));
        const menuItemsSnapshot = await getDocs(menuItemsQuery);
        const updatedItems = menuItemsSnapshot.docs.map(d => ({ ...d.data(), id: d.id })) as MenuItem[];
        replace(updatedItems);


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
  );
}
