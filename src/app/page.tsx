import SiteHeader from '@/components/site-header';
import HeroSection from '@/components/hero-section';
import CategorySection from '@/components/category-section';
import ProductSection from '@/components/product-section';
import HowItWorksSection from '@/components/how-it-works-section';
import SiteFooter from '@/components/site-footer';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-grow">
        <HeroSection />
        <CategorySection />
        <ProductSection />
        <HowItWorksSection />
      </main>
      <SiteFooter />
    </div>
  );
}
