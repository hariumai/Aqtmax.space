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
import { useAuth, useUser } from '@/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import { confirmPasswordReset, applyActionCode, User } from 'firebase/auth';
import { useEffect, useState, Suspense } from 'react';
import { doc, getFirestore, updateDoc } from 'firebase/firestore';
import { Loader2, ShieldCheck, ShieldX } from 'lucide-react';

const formSchema = z.object({
  password: z.string().min(6, {
    message: 'Password must be at least 6 characters.',
  }),
});

function ActionsPageComponent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode');

  if (mode === 'resetPassword') {
    return <ResetPasswordComponent oobCode={oobCode} />;
  }
  
  if (mode === 'verifyEmail') {
    return <VerifyEmailComponent oobCode={oobCode} />;
  }

  return (
    <main className="flex-grow flex items-center justify-center">
      <Card className="mx-auto max-w-sm w-full text-center">
        <CardHeader>
          <ShieldX className="mx-auto h-12 w-12 text-destructive" />
          <CardTitle className="text-2xl">Invalid Action</CardTitle>
          <CardDescription>
            The link is invalid or has expired. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/">Go to Homepage</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}

export default function ActionsPage() {
  return (
    <Suspense fallback={
        <main className="flex-grow flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </main>
      }>
      <ActionsPageComponent />
    </Suspense>
  )
}

function ResetPasswordComponent({ oobCode }: { oobCode: string | null }) {
  const { toast } = useToast();
  const auth = useAuth();
  const router = useRouter();

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
    }
    try {
      await confirmPasswordReset(auth, oobCode, values.password);
      toast({
        title: 'Password Reset Successful',
        description: 'You can now log in with your new password.',
      });
      router.push('/login');
    } catch (error: any) {
        const errorMessage = (error.message || 'An unexpected error occurred. The link may have expired.').replace('Firebase: ', '');
        toast({
            variant: 'destructive',
            title: 'Error Resetting Password',
            description: errorMessage,
        });
    }
  }

  if (!oobCode) {
    return (
      <main className="flex-grow flex items-center justify-center">
        <Card className="mx-auto max-w-sm w-full text-center">
          <CardHeader>
            <CardTitle className="text-2xl">Invalid Link</CardTitle>
            <CardDescription>This password reset link is invalid or has expired.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/forgot-password">Request a new link</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex-grow flex items-center justify-center">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <CardDescription>Enter your new password below.</CardDescription>
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
              <Button type="submit" className="w-full">Set New Password</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
}

function VerifyEmailComponent({ oobCode }: { oobCode: string | null }) {
  const auth = useAuth();
  const firestore = getFirestore();
  const router = useRouter();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    if (!oobCode) {
      setStatus('error');
      setMessage('Invalid verification link. The link is missing necessary information.');
      return;
    }

    if (!auth || !firestore) {
      return; // Wait for Firebase to initialize
    }

    const handleVerification = async () => {
      try {
        await applyActionCode(auth, oobCode);
        
        // Firebase automatically signs the user in after verification.
        // We need to wait for the auth state to update to get the user.
        const unsubscribe = auth.onAuthStateChanged(async (user: User | null) => {
          if (user) {
            // Update the emailVerified flag in the user's Firestore document
            const userDocRef = doc(firestore, 'users', user.uid);
            await updateDoc(userDocRef, { emailVerified: true });
            setStatus('success');
            setMessage('Your email has been successfully verified! You can now log in.');
            unsubscribe(); // Stop listening to auth changes
            // Sign out the user so they have to log in manually, confirming the flow.
            await auth.signOut();
          }
        });
        
      } catch (error: any) {
        setStatus('error');
        const errorMessage = (error.message || 'Failed to verify email. The link may have expired or already been used.').replace('Firebase: ', '');
        setMessage(errorMessage);
      }
    };

    handleVerification();
  }, [auth, firestore, oobCode, router]);

  return (
    <main className="flex-grow flex items-center justify-center">
      <Card className="mx-auto max-w-md w-full text-center">
        <CardHeader>
          {status === 'loading' && <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />}
          {status === 'success' && <ShieldCheck className="mx-auto h-12 w-12 text-green-500" />}
          {status === 'error' && <ShieldX className="mx-auto h-12 w-12 text-destructive" />}
          <CardTitle className="text-2xl mt-4">
            {status === 'loading' && 'Verifying...'}
            {status === 'success' && 'Email Verified!'}
            {status === 'error' && 'Verification Failed'}
          </CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        {(status === 'success' || status === 'error') && (
          <CardContent>
            <Button asChild>
              <Link href="/login">Go to Login</Link>
            </Button>
          </CardContent>
        )}
      </Card>
    </main>
  );
}
