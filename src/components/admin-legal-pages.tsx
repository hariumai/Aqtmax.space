
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
        content: `**Last Updated: [Date]**

Welcome to AQT Max! These Terms of Service ("Terms") govern your use of our website and the services offered through it (collectively, the "Service"). By accessing or using our Service, you agree to be bound by these Terms.

**1. Service Description**
AQT Max provides a marketplace for purchasing digital subscription credentials for various third-party services ("Subscriptions"). We facilitate the sale and delivery of these credentials. We are not affiliated with the owners of the Subscriptions (e.g., Netflix, Spotify).

**2. User Accounts**
You must create an account to purchase Subscriptions. You are responsible for maintaining the confidentiality of your account information, including your password, and for all activity that occurs under your account. You agree to notify us immediately of any unauthorized use of your account.

**3. Orders and Payment**
- **Order Placement:** By placing an order, you agree to pay the specified price for the selected Subscription.
- **Payment Verification:** All payments are subject to verification. We reserve the right to cancel or refuse any order for any reason, including but not limited to payment processing issues or suspicion of fraud.
- **Pricing:** All prices are listed in Pakistani Rupees (PKR) and are subject to change without notice.

**4. Delivery Policy**
We guarantee the delivery of your Subscription credentials to your registered email and your AQT Max account dashboard within 24 hours of successful payment verification. If you do not receive your order within this timeframe, you are eligible for a full refund as per our [Refund Policy](/legal/refund).

**5. User Conduct and Account Rules**
You must adhere strictly to our [Account Rules](/legal/rules) when using any Subscription purchased through our Service. Failure to comply will result in immediate termination of your warranty and may lead to a permanent ban from AQT Max without a refund.

**6. Chargeback Policy**
Initiating a chargeback or payment dispute for a successfully delivered product without first contacting our support team is a violation of these Terms. Such actions will result in the immediate and permanent termination of your AQT Max account, forfeiture of any active warranties, and cancellation of active Subscriptions without refund.

**7. Intellectual Property**
The AQT Max website, logo, and all related content are the exclusive property of AQT Max. The trademarks and brand names of the Subscriptions sold on our platform are the property of their respective owners.

**8. Limitation of Liability**
To the fullest extent permitted by law, AQT Max shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, resulting from (a) your use of the Service or your inability to use the Service; (b) any conduct or content of any third party on the Service; or (c) unauthorized access, use, or alteration of your transmissions or content. Our maximum liability for any claim arising from the Service is limited to the amount you paid for the product in question.

**9. Governing Law**
These Terms shall be governed by and construed in accordance with the laws of Pakistan, without regard to its conflict of law provisions.

**10. Changes to Terms**
We reserve the right to modify these Terms at any time. We will notify you of any changes by posting the new Terms on this page. Your continued use of the Service after any such changes constitutes your acceptance of the new Terms.`
    },
    privacy: {
        title: 'Privacy Policy',
        content: `**Last Updated: [Date]**

AQT Max ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.

**1. Information We Collect**
We may collect personal information from you in a variety of ways, including:
- **Personal Data:** Information you voluntarily provide to us when you register for an account, such as your name, email address, and phone number.
- **Order Data:** Information related to your purchases, such as the products you buy. Payment screenshots are stored temporarily and securely and are deleted after order verification.
- **Device and Usage Data:** Information automatically collected when you access the Service, such as your IP address, browser type, operating system, and login history to enhance security.

**2. How We Use Your Information**
We use the information we collect for various purposes, including to:
- Create and manage your account.
- Process your orders and deliver your purchased products.
- Send you order confirmations, service updates, and support messages.
- Monitor and analyze usage and trends to improve your experience with our Service.
- Prevent fraudulent transactions, monitor against theft, and protect against criminal activity.

**3. Disclosure of Your Information**
We do not sell, trade, or otherwise transfer your Personally Identifiable Information to outside parties except in the following situations:
- **Service Providers:** We may share your information with third-party vendors and service providers that perform services for us or on our behalf, such as payment processing and email delivery.
- **Legal Requirements:** We may disclose your information if required to do so by law or in response to valid requests by public authorities.
- **To Protect Our Rights:** We may disclose information where we believe it is necessary to investigate, prevent, or take action regarding potential violations of our policies, suspected fraud, or illegal activities.

**4. Data Security**
We implement a variety of administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that no security measures are perfect or impenetrable.

**5. Your Data Rights**
You have the right to:
- **Access and Update:** Review and update your personal information through your account profile page.
- **Opt-Out:** Unsubscribe from our marketing communications at any time by following the instructions in those emails.
- **Data Deletion:** Request the deletion of your personal account and associated data, subject to legal and transactional record-keeping requirements.

**6. Changes to This Privacy Policy**
We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.

**7. Contact Us**
If you have questions or comments about this Privacy Policy, please refer to the contact information provided on our website.`
    },
    refund: {
        title: 'Refund Policy',
        content: `**Last Updated: [Date]**

At AQT Max, we are committed to customer satisfaction. This Refund Policy outlines the specific conditions under which a refund may be granted.

**1. Full Refund Conditions**
A 100% full refund will be issued **only** under the following circumstance:
- **Service Non-Delivery:** If we fail to deliver your purchased subscription credentials to both your registered email address and your AQT Max account dashboard within our guaranteed 24-hour delivery window, which begins after your payment has been successfully verified.

**2. Non-Refundable Scenarios**
Please be aware that refunds will **not** be provided in the following situations:
- **Successful Delivery:** Once subscription credentials have been successfully delivered to your account, the transaction is considered final and non-refundable.
- **Terms of Service Violations:** If your subscription warranty becomes void due to a violation of our [Account Rules](/legal/rules) or [Terms of Service](/legal/terms)—such as changing the account password, email, or profile PIN—you forfeit any right to a refund.
- **Customer Error or Change of Mind:** We do not offer refunds for purchases made by mistake or if you change your mind after the credentials have been delivered.
- **Account Issues Caused by User:** We are not liable for account access issues or suspensions that arise from your failure to comply with the provided account usage rules.

**3. How to Request a Refund for Non-Delivery**
If you have not received your order within the guaranteed 24-hour delivery period, please take the following steps:
1. Contact our customer support team immediately through the official WhatsApp number provided on our website.
2. Provide your Order ID and the email address associated with your AQT Max account.
3. Our team will promptly investigate the delivery status. If we confirm that the credentials were not delivered as promised, we will process a full refund to your original payment method.

**4. Chargeback and Dispute Policy**
Initiating a payment dispute or chargeback with your bank or payment provider for an order that has been successfully delivered is a material breach of our Terms of Service. Such action will result in the immediate and permanent termination of your AQT Max account, forfeiture of all active warranties, and cancellation of any active subscriptions without any possibility of a refund. We strongly urge you to contact our support team to resolve any issues amicably before taking such action.`
    },
    rules: {
        title: 'Account Rules',
        content: `**Last Updated: [Date]**

To ensure a fair, stable, and long-lasting service for all our customers, you **must** adhere to the following rules for all subscription accounts purchased through AQT Max. Failure to comply will result in an immediate and permanent voiding of your warranty, and may lead to a ban from our platform, with no refund.

**1. Core Prohibitions (Do Not Do These):**
- **DO NOT** change the account password.
- **DO NOT** change the email address or phone number associated with the account.
- **DO NOT** alter the subscription plan or billing information.
- **DO NOT** add, remove, or change any profile names or PINs, unless explicitly permitted for your specific purchase.

**2. Profile and Device Usage:**
- **Use Only Your Assigned Profile:** If you are assigned a specific profile number or name, use only that one. Do not access or modify other profiles.
- **Single Device Login:** Unless you have purchased a multi-screen or multi-device plan, you are permitted to log in on one device only. Logging into multiple devices simultaneously on a single-device plan will void your warranty.

**3. General Conduct:**
- **No Sharing Credentials:** You are not permitted to share the subscription credentials with anyone else.
- **No Reselling:** The accounts are for personal use only and cannot be resold.

**4. Consequences of Violation:**
Any violation of these rules, however minor, will result in the following actions without exception:
- **Immediate Voiding of Warranty:** Your warranty for the subscription will be instantly terminated.
- **No Replacement or Refund:** You will not be eligible for a replacement account or any form of refund.
- **Permanent Ban:** Your AQT Max account may be permanently banned, preventing you from making future purchases.

By purchasing and using a subscription account from AQT Max, you acknowledge that you have read, understood, and agree to be bound by these rules and our complete [Terms of Service](/legal/terms).`
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
