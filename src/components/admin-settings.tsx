
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useEffect } from 'react';

const settingsSchema = z.object({
    bankName: z.string().min(1, 'Bank name is required'),
    accountHolderName: z.string().min(1, 'Account holder name is required'),
    accountNumber: z.string().min(1, 'Account number is required'),
    whatsappNumber: z.string().optional(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function AdminSettings() {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const settingsRef = useMemoFirebase(() => (firestore ? doc(firestore, 'settings', 'payment') : null), [firestore]);
  const { data: currentSettings, isLoading } = useDoc<SettingsFormValues>(settingsRef);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      bankName: '',
      accountHolderName: '',
      accountNumber: '',
      whatsappNumber: '',
    },
  });

  useEffect(() => {
    if (currentSettings) {
      form.reset(currentSettings);
    }
  }, [currentSettings, form]);

  async function onSubmit(values: SettingsFormValues) {
    if (!firestore || !settingsRef) return;
    try {
      await setDoc(settingsRef, values, { merge: true });
      toast({ title: 'Settings Saved', description: 'Global settings have been updated.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error Saving Settings', description: error.message });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Application Settings</CardTitle>
        <CardDescription>Manage global settings for your marketplace.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="text-lg font-medium">Bank Account Details</h3>
                <FormField control={form.control} name="bankName" render={({ field }) => (
                    <FormItem><FormLabel>Bank Name</FormLabel><FormControl><Input placeholder="e.g., HBL" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="accountHolderName" render={({ field }) => (
                    <FormItem><FormLabel>Account Holder Name</FormLabel><FormControl><Input placeholder="e.g., John Doe" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="accountNumber" render={({ field }) => (
                    <FormItem><FormLabel>Account Number</FormLabel><FormControl><Input placeholder="e.g., 0123456789" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
            </div>
            <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="text-lg font-medium">Support Settings</h3>
                 <FormField control={form.control} name="whatsappNumber" render={({ field }) => (
                    <FormItem><FormLabel>WhatsApp Support Number</FormLabel><FormControl><Input placeholder="e.g., +923001234567" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
            </div>
            <Button type="submit" disabled={isLoading || form.formState.isSubmitting}>
                {isLoading ? 'Loading...' : 'Save Settings'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

    