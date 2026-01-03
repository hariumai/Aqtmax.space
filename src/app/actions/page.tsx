
'use client';
import { useAuth } from '@/firebase';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { applyActionCode, checkActionCode, confirmPasswordReset } from 'firebase/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import DelayedLink from '@/components/delayed-link';

export default function ActionsPage() {
  const auth = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const mode = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode');
  const continueUrl = searchParams.get('continueUrl');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'resetting'>('loading');
  const [message, setMessage] = useState('Processing...');
  const [newPassword, setNewPassword] = useState('');
  
  useEffect(() => {
    if (!auth || !mode || !oobCode) {
      setStatus('error');
      setMessage('Invalid action link. Please try again.');
      return;
    }

    const handleAction = async () => {
      try {
        switch (mode) {
          case 'verifyEmail':
            await applyActionCode(auth, oobCode);
            setStatus('success');
            setMessage('Your email has been successfully verified! You can now log in.');
            break;
            
          case 'resetPassword':
            const info = await checkActionCode(auth, oobCode);
            setStatus('resetting');
            setMessage(`Please enter a new password for ${info.data.email}.`);
            break;
            
          default:
            setStatus('error');
            setMessage('Unsupported action. Please try again.');
            break;
        }
      } catch (error: any) {
        setStatus('error');
        setMessage(error.message.replace('Firebase: ', ''));
      }
    };
    
    handleAction();
  }, [auth, mode, oobCode]);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !oobCode) return;
    setStatus('loading');
    setMessage('Resetting your password...');
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setStatus('success');
      setMessage('Your password has been reset successfully. You can now log in with your new password.');
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message.replace('Firebase: ', ''));
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-12 w-12 animate-spin text-primary" />;
      case 'success':
        return <CheckCircle className="h-12 w-12 text-green-500" />;
      case 'error':
        return <AlertTriangle className="h-12 w-12 text-destructive" />;
      case 'resetting':
        return (
          <form onSubmit={handlePasswordReset} className="w-full space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full">
              Reset Password
            </Button>
          </form>
        );
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto flex h-16 w-16 items-center justify-center">
            {renderContent()}
          </div>
          <CardTitle className="mt-4 text-2xl">
            {status === 'resetting' ? 'Reset Your Password' : 'Action Status'}
          </CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        {status === 'success' || status === 'error' ? (
          <CardContent>
            <Button asChild className="w-full">
              <DelayedLink href="/login">Proceed to Login</DelayedLink>
            </Button>
          </CardContent>
        ) : null}
      </Card>
    </main>
  );
}
