'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import { useAuth } from '@/firebase';
import { useSearchParams, useRouter } from 'next/navigation';
import { confirmPasswordReset } from 'firebase/auth';

const formSchema = z.object({
  password: z.string().min(6, {
    message: 'Password must be at least 6 characters.',
  }),
});

export default function ResetPasswordPage() {
  const { toast } = useToast();
  const auth = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const oobCode = searchParams.get('oobCode');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!auth || !oobCode) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Invalid or missing password reset code.',
          });
        return;
    };
    try {
      await confirmPasswordReset(auth, oobCode, values.password);
      toast({
        title: 'Password Reset Successful',
        description: 'You can now log in with your new password.',
      });
      router.push('/login');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error Resetting Password',
        description: error.message || 'An unexpected error occurred. The link may have expired.',
      });
    }
  }
  
  if (!oobCode) {
    return (
        <div className="flex flex-col min-h-screen">
            <SiteHeader />
            <main className="flex-grow flex items-center justify-center">
                <Card className="mx-auto max-w-sm w-full text-center">
                    <CardHeader>
                        <CardTitle className="text-2xl">Invalid Link</CardTitle>
                        <CardDescription>
                            This password reset link is invalid or has expired.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild>
                            <Link href="/forgot-password">Request a new link</Link>
                        </Button>
                    </CardContent>
                </Card>
            </main>
            <SiteFooter />
        </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-grow flex items-center justify-center">
        <Card className="mx-auto max-w-sm w-full">
          <CardHeader>
            <CardTitle className="text-2xl">Reset Password</CardTitle>
            <CardDescription>
              Enter your new password below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">
                  Set New Password
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
