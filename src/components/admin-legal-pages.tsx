
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { doc, collection, writeBatch, getDocs, query, orderBy } from 'firebase/firestore';
import { useEffect } from 'react';
import { Textarea } from './ui/textarea';

const legalPageSchema = z.object({
    id: z.string(),
    title: z.string().min(1, 'Title is required'),
    content: z.string().min(1, 'Content is required'),
});

const legalPagesSchema = z.object({
    pages: z.array(legalPageSchema)
});

export default function AdminLegalPages() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const legalPagesForm = useForm<z.infer<typeof legalPagesSchema>>({
    resolver: zodResolver(legalPagesSchema),
  });
  
  useEffect(() => {
    async function fetchLegalPages() {
      if (!firestore) return;
      const pagesQuery = query(collection(firestore, 'legalPages'), orderBy('title'));
      const pagesSnapshot = await getDocs(pagesQuery);
      const pages = pagesSnapshot.docs.map(d => ({ ...d.data(), id: d.id })) as z.infer<typeof legalPageSchema>[];
      if (pages.length > 0) {
        legalPagesForm.reset({ pages });
      } else {
        legalPagesForm.reset({ pages: [
            { id: 'terms', title: 'Terms of Service', content: ''},
            { id: 'privacy', title: 'Privacy Policy', content: ''},
            { id: 'refund', title: 'Refund Policy', content: ''},
        ]});
      }
    }
    if (firestore) {
      fetchLegalPages();
    }
  }, [firestore, legalPagesForm]);

  async function onLegalPagesSubmit(values: z.infer<typeof legalPagesSchema>) {
    if (!firestore) return;
    try {
      const batch = writeBatch(firestore);
      values.pages.forEach(page => {
        const docRef = doc(firestore, 'legalPages', page.id);
        batch.set(docRef, { title: page.title, content: page.content }, { merge: true });
      });
      await batch.commit();
      toast({ title: 'Legal Pages Updated', description: 'Your legal pages have been saved.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error Updating Pages', description: error.message || 'An unexpected error occurred.' });
    }
  }

  const { fields: legalFields } = useFieldArray({
      control: legalPagesForm.control,
      name: "pages",
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Legal Pages</CardTitle>
        <CardDescription>Update the content for your terms, privacy, and refund pages.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...legalPagesForm}>
          <form onSubmit={legalPagesForm.handleSubmit(onLegalPagesSubmit)} className="space-y-6">
            {legalFields.map((field, index) => (
              <div key={field.id} className="space-y-2 p-4 border rounded-lg">
                <h3 className="font-semibold text-lg">{field.title}</h3>
                <FormField
                  control={legalPagesForm.control}
                  name={`pages.${index}.content`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="sr-only">Content</FormLabel>
                      <FormControl>
                        <Textarea placeholder={`Enter content for ${field.title}...`} {...field} className="min-h-[200px]" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ))}
            <Button type="submit">Save Legal Pages</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
