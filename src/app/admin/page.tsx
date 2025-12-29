'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser } from '@/firebase';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import { Loader2 } from 'lucide-react';
import AdminDashboard from '@/components/admin-dashboard';
import { SidebarProvider } from '@/components/ui/sidebar';

const ADMIN_KEY = '36572515';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const { user, isUserLoading } = useUser();

  const handleLogin = () => {
    if (key === ADMIN_KEY) {
      if (user) {
        setIsAuthenticated(true);
        setError('');
        localStorage.setItem('admin-key', key);
      } else {
        setError('You must be signed in to access the admin panel.');
      }
    } else {
      setError('Invalid admin key.');
    }
  };
  
  useEffect(() => {
    const storedKey = localStorage.getItem('admin-key');
    if (storedKey === ADMIN_KEY && user) {
        setIsAuthenticated(true);
    }
  }, [user]);

  if (isUserLoading) {
    return (
        <div className="flex flex-col min-h-screen">
          <SiteHeader />
          <main className="flex-grow flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </main>
          <SiteFooter />
        </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-grow">
        {isAuthenticated ? (
          <SidebarProvider>
            <AdminDashboard />
          </SidebarProvider>
        ) : (
          <div className="flex items-center justify-center h-full pt-20">
              <Card className="mx-auto max-w-sm w-full">
              <CardHeader>
                  <CardTitle className="text-2xl">Admin Access</CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="space-y-4">
                  <Input
                      type="password"
                      placeholder="Enter admin key"
                      value={key}
                      onChange={(e) => setKey(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  />
                  {error && <p className="text-sm font-medium text-destructive">{error}</p>}
                  <Button onClick={handleLogin} className="w-full" disabled={isUserLoading}>
                    {isUserLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Enter
                  </Button>
                  </div>
              </CardContent>
              </Card>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
