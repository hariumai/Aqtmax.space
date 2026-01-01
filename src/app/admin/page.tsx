
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gem, Loader2, LogOut, Menu } from 'lucide-react';
import AdminDashboard, { AdminDashboardProvider } from '@/components/admin-dashboard';
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import SiteFooter from '@/components/site-footer';
import { useUser, useAuth } from '@/firebase';
import AdminBottomNav from '@/components/admin-bottom-nav';
import { useToast } from '@/hooks/use-toast';
import { signInAnonymously, signOut } from 'firebase/auth';

function AdminHeader({ onLogout }: { onLogout: () => void }) {
    const { isMobile, toggleSidebar } = useSidebar();

    return (
        <header className="flex h-20 items-center justify-between border-b px-4 md:px-8">
            <div className="flex items-center gap-2">
                {isMobile && <Button variant="ghost" size="icon" onClick={toggleSidebar}><Menu className="h-5 w-5"/></Button>}
                <Gem className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold tracking-tighter">Admin Panel</span>
            </div>
            <div className="flex items-center gap-2">
                <Button onClick={onLogout} variant="ghost" size="sm">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </Button>
            </div>
        </header>
    );
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const auth = useAuth();

  useEffect(() => {
    const checkAuth = async () => {
      const storedKey = sessionStorage.getItem('admin-key');
      if (storedKey) {
        try {
            const response = await fetch('/api/admin-auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: storedKey }),
            });
            if (response.ok) {
                setIsAuthenticated(true);
                if (auth && !auth.currentUser) {
                  await signInAnonymously(auth);
                }
            } else {
                sessionStorage.removeItem('admin-key');
            }
        } catch (e) {
            // network error
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, [auth]);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });

      if (response.ok) {
        if (auth) {
          await signInAnonymously(auth);
          setIsAuthenticated(true);
          setError('');
          sessionStorage.setItem('admin-key', key);
          toast({ title: 'Admin access granted.' });
        } else {
          setError('Firebase auth not available.');
        }
      } else {
        const data = await response.json();
        setError(data.error || 'Invalid admin key.');
      }
    } catch (e) {
      setError('An error occurred during login.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsAuthenticated(false);
    setKey('');
    sessionStorage.removeItem('admin-key');
    if (auth?.currentUser?.isAnonymous) {
      await signOut(auth);
    }
  };
  
  if (isLoading) {
    return (
        <div className="flex flex-col min-h-screen">
          <main className="flex-grow flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </main>
        </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-grow">
        {isAuthenticated ? (
          <SidebarProvider>
            <AdminDashboardProvider>
              <div className="flex flex-col h-full">
                <AdminHeader onLogout={handleLogout} />
                <div className="flex-grow">
                  <AdminDashboard isAuthenticated={isAuthenticated} />
                </div>
                <AdminBottomNav />
              </div>
            </AdminDashboardProvider>
          </SidebarProvider>
        ) : (
          <div className="flex items-center justify-center h-full pt-40">
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
                  <Button onClick={handleLogin} className="w-full" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
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
