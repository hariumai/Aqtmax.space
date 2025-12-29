
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gem, Loader2, LogOut, Menu } from 'lucide-react';
import AdminDashboard, { AdminDashboardProvider } from '@/components/admin-dashboard';
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import SiteFooter from '@/components/site-footer';
import { useUser } from '@/firebase';
import AdminBottomNav from '@/components/admin-bottom-nav';

const ADMIN_KEY = '36572515';

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
  const { isUserLoading } = useUser();


  useEffect(() => {
    const storedKey = localStorage.getItem('admin-key');
    if (storedKey === ADMIN_KEY) {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handleLogin = () => {
    if (key === ADMIN_KEY) {
      setIsAuthenticated(true);
      setError('');
      localStorage.setItem('admin-key', key);
    } else {
      setError('Invalid admin key.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setKey('');
    localStorage.removeItem('admin-key');
  }
  
  const pageIsLoading = isLoading;
  
  if (pageIsLoading) {
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
                  <Button onClick={handleLogin} className="w-full" disabled={pageIsLoading}>
                    {pageIsLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
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
