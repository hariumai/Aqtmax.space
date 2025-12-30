import SiteHeader from '@/components/site-header';
import BottomNav from '@/components/bottom-nav';
import SiteFooter from '@/components/site-footer';

export default function OrderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-grow">
        {children}
      </main>
      <SiteFooter />
      <BottomNav />
    </div>
  );
}
```