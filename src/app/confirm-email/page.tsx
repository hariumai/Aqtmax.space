'use client';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth, useUser } from '@/firebase';
import { applyActionCode, User } from 'firebase/auth';
import { doc, updateDoc, getFirestore } from 'firebase/firestore';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Loader2, ShieldCheck, ShieldX } from 'lucide-react';

export default function ConfirmEmailPage() {
  const auth = useAuth();
  const firestore = getFirestore();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const oobCode = searchParams.get('oobCode');

    if (!oobCode) {
      setStatus('error');
      setMessage('Invalid verification link. The link is missing necessary information.');
      return;
    }

    if (!auth || !firestore) {
      // Wait for firebase to initialize
      return;
    }

    const handleVerification = async () => {
      try {
        await applyActionCode(auth, oobCode);

        // After successful verification, Firebase automatically signs the user in.
        // We need to wait for the auth state to update to get the user.
        const unsubscribe = auth.onAuthStateChanged(async (user: User | null) => {
          if (user) {
            // Update the email_verified flag in the user's Firestore document
            const userDocRef = doc(firestore, 'users', user.uid);
            await updateDoc(userDocRef, { emailVerified: true });
            setStatus('success');
            setMessage('Your email has been successfully verified! You can now log in.');
            unsubscribe(); // Stop listening to auth changes
          }
        });
      } catch (error: any) {
        setStatus('error');
        setMessage(error.message || 'Failed to verify email. The link may have expired or already been used.');
      }
    };

    handleVerification();
  }, [auth, firestore, searchParams, router]);


  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
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
      <SiteFooter />
    </div>
  );
}
