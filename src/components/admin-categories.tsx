
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
import { useForm } from 'react-hook-form';
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
import { ScrollArea } from './ui/scroll-area';

const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  imageUrl: z.string().url('Must be a valid URL'),
});

type Category = z.infer<typeof categorySchema>;

function CategoryForm({
  category,
  onFinished,
}: {
  category?: Category;
  onFinished: () => void;
}) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const form = useForm<Category>({
    resolver: zodResolver(categorySchema),
    defaultValues: category || { name: '', imageUrl: ''},
  });

  async function onSubmit(values: Category) {
    if (!firestore) return;
    try {
      const id = values.id || doc(collection(firestore, 'categories')).id;
      const docRef = doc(firestore, 'categories', id);
      await setDoc(docRef, { ...values, id });
      toast({
        title: category ? 'Category Updated' : 'Category Added',
        description: `The category "${values.name}" has been saved.`,
      });
      onFinished();
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Error saving category',
        description: e.message,
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <ScrollArea className="h-[60vh] pr-6">
          <div className="space-y-6">
            <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Category Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="imageUrl" render={({ field }) => (<FormItem><FormLabel>Image URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
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

export default function AdminCategories() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>(undefined);

  const categoriesQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'categories')) : null),
    [firestore]
  );
  const { data: categories, isLoading } = useCollection<Category>(categoriesQuery);

  const handleDelete = async (categoryId: string) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'categories', categoryId));
      toast({
        title: 'Category Deleted',
        description: 'The category has been successfully deleted.',
      });
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Error deleting category',
        description: e.message,
      });
    }
  };
  
  const handleEditClick = (category: Category) => {
    setSelectedCategory(category);
    setIsFormOpen(true);
  }

  const handleAddClick = () => {
    setSelectedCategory(undefined);
    setIsFormOpen(true);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
            <div>
                <CardTitle>Manage Categories</CardTitle>
                <CardDescription>Create, edit, and delete your product categories.</CardDescription>
            </div>
            <Button onClick={handleAddClick}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Category
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={2}>Loading categories...</TableCell>
              </TableRow>
            )}
            {!isLoading && categories?.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEditClick(category)}>
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
                            This action cannot be undone. This will permanently delete the category "{category.name}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(category.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading && categories?.length === 0 && (
                <TableRow>
                    <TableCell colSpan={2} className="text-center">No categories found.</TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{selectedCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
                </DialogHeader>
                <CategoryForm
                    category={selectedCategory}
                    onFinished={() => setIsFormOpen(false)}
                />
            </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
