'use client';

import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MailCheck } from 'lucide-react';
import Link from 'next/link';

export default function VerifyEmailPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-grow flex items-center justify-center">
        <Card className="mx-auto max-w-md w-full text-center">
          <CardHeader>
            <div className="flex justify-center">
              <MailCheck className="h-16 w-16 text-primary" />
            </div>
            <CardTitle className="text-2xl mt-4">Verify Your Email</CardTitle>
            <CardDescription>
              A verification link has been sent to your email address. Please check your inbox (and spam folder) to complete your registration.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <p className="text-sm text-muted-foreground">
                Once verified, you can{' '}
                <Link href="/login" className="underline text-primary">
                    log in
                </Link>
                .
             </p>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
