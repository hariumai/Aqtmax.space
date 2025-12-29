import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";

export default function RefundPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-grow container mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="prose prose-invert max-w-none">
          <h1 className="font-headline text-4xl font-extrabold tracking-tighter">Refund Policy</h1>
          <p className="lead">Last updated: {new Date().toLocaleDateString()}</p>
          <p>
            Thank you for shopping at SubLime Marketplace. We want to ensure you are happy with your purchase.
          </p>

          <h2>1. General Policy</h2>
          <p>
            Due to the nature of digital goods, all sales are final. We do not offer refunds or exchanges for any products once they have been delivered.
          </p>

          <h2>2. Defective Products</h2>
          <p>
            In the rare event that a digital product (such as account credentials) is not working, please contact our support team within 24 hours of purchase. We will investigate the issue and provide a replacement if the product is confirmed to be defective.
          </p>

          <h2>3. Non-Refundable Items</h2>
          <p>
            All digital subscriptions and accounts are non-refundable. We encourage you to read the product description carefully before making a purchase.
          </p>

          <h2>4. Chargebacks</h2>
          <p>
            Initiating a chargeback or payment dispute for a valid purchase will result in an immediate and permanent ban from our services.
          </p>
          
          <h2>Contact Us</h2>
          <p>If you have any questions about our Refund Policy, please contact us.</p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
