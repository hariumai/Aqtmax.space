import SiteHeader from '@/components/site-header';
import HeroSection from '@/components/hero-section';
import CategorySection from '@/components/category-section';
import ProductSection from '@/components/product-section';
import HowItWorksSection from '@/components/how-it-works-section';
import SiteFooter from '@/components/site-footer';
import BottomNav from '@/components/bottom-nav';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-grow pt-20">
        <HeroSection />
        <CategorySection />
        <ProductSection />
        <HowItWorksSection />
      </main>
      <SiteFooter />
      <BottomNav />
    </div>
  );
}
