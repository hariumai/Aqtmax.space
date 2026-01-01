
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

const defaultLegalContent = {
    terms: {
        title: 'Terms of Service',
        content: `Welcome to SubLime Marketplace!\n\n1. Service Agreement\nBy using our services, you agree to these terms. We provide digital subscription credentials for various services.\n\n2. Delivery Policy\nWe guarantee the delivery of your subscription credentials to your email and account page within 24 hours of successful payment verification. If you do not receive your order within this timeframe, you are eligible for a full refund.\n\n3. Account Integrity\nAny attempt to perform a chargeback or dispute a payment made for a delivered product will be considered a violation of these terms. Such actions will result in the immediate and permanent termination of your account and cancellation of any active subscriptions without any possibility of a refund.\n\n4. User Conduct\nYou agree not to misuse the service or help anyone else to do so. You are responsible for your conduct and your data.\n\n5. Limitation of Liability\nOur liability is limited to the purchase price of the product you have purchased.`
    },
    privacy: {
        title: 'Privacy Policy',
        content: `Your privacy is important to us.\n\n1. Information Collection\nWe collect information you provide directly to us, such as your name, email address, phone number, and order details when you make a purchase.\n\n2. Use of Information\nWe use the information we collect to process your transactions, send you order confirmations, and provide customer support.\n\n3. Data Security\nWe implement security measures designed to protect your information from unauthorized access, alteration, and disclosure.\n\n4. Information Sharing\nWe do not sell or share your personal information with third parties for their marketing purposes. Information may be shared with payment processors solely for the purpose of completing your transaction.\n\n5. Your Rights\nYou have the right to access and update your personal information at any time through your account profile.`
    },
    refund: {
        title: 'Refund Policy',
        content: `Our refund policy is designed to be fair and transparent.\n\n1. Eligibility for Refund\nA full refund will be issued if we fail to deliver your subscription credentials to your registered email or account page within the guaranteed 24-hour delivery window after your payment has been successfully verified. \n\n2. Non-Refundable Items\nOnce subscription credentials have been delivered, the sale is final and cannot be refunded.\n\n3. How to Request a Refund\nIf you have not received your order within 24 hours, please contact our support team with your order ID. We will verify the delivery status and process your refund accordingly.\n\n4. Chargeback Policy\nInitiating a chargeback for a delivered order will result in a permanent ban from our services, as outlined in our Terms of Service.`
    },
    rules: {
        title: 'Account Rules',
        content: `To ensure a fair and stable service for everyone, you must adhere to the following rules for all subscription accounts purchased through our platform:\n\n1.  **Do Not Change Passwords:** You are strictly prohibited from changing the password of the subscription account provided.\n\n2.  **One Device Login:** Unless specified otherwise, each subscription is for a single user on a single device. Do not log in on multiple devices simultaneously.\n\n3.  **Do Not Alter Account Settings:** You must not change any account settings, including profile names, email addresses, or billing information.\n\n4.  **No Phone Number Changes:** Do not add, remove, or change any phone number associated with the account.\n\n5.  **Consequences of Violation:** Any violation of these rules will result in the immediate termination of your subscription without any replacement or refund. Your AQT Max account may also be permanently banned.\n\nBy using the subscription account, you agree to follow these rules and our full [Terms of Service](/legal/terms).`
    }
};

type LegalPageContent = z.infer<typeof legalPageSchema>;

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
      const pages = pagesSnapshot.docs.map(d => ({ ...d.data(), id: d.id })) as LegalPageContent[];
      
      const pageData: LegalPageContent[] = [];
      const existingIds = new Set(pages.map(p => p.id));
      
      const defaultPages: Record<string, {title: string, content: string}> = defaultLegalContent;
      
      // Ensure all default pages exist
      for (const id in defaultPages) {
          if (existingIds.has(id)) {
              // Use existing data from firestore
              pageData.push(pages.find(p => p.id === id)!);
          } else {
              // Use default content
              pageData.push({
                  id: id,
                  title: defaultPages[id].title,
                  content: defaultPages[id].content
              });
          }
      }

      legalPagesForm.reset({ pages: pageData });
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
