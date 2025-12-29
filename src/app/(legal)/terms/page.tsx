import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-grow container mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="prose prose-invert max-w-none">
          <h1 className="font-headline text-4xl font-extrabold tracking-tighter">Terms of Service</h1>
          <p className="lead">Last updated: {new Date().toLocaleDateString()}</p>
          <p>
            Welcome to SubLime Marketplace. These Terms of Service ("Terms") govern your use of our website and services. By accessing or using our service, you agree to be bound by these Terms.
          </p>

          <h2>1. Accounts</h2>
          <p>
            When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our service.
          </p>

          <h2>2. Purchases</h2>
          <p>
            If you wish to purchase any product or service made available through the Service ("Purchase"), you may be asked to supply certain information relevant to your Purchase including, without limitation, your credit card number, the expiration date of your credit card, your billing address, and your shipping information.
          </p>

          <h2>3. Content</h2>
          <p>
            Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material ("Content"). You are responsible for the Content that you post to the Service, including its legality, reliability, and appropriateness.
          </p>

          <h2>4. Termination</h2>
          <p>
            We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
          </p>
          
          <h2>Contact Us</h2>
          <p>If you have any questions about these Terms, please contact us.</p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
