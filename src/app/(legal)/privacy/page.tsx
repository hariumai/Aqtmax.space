import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-grow container mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="prose prose-invert max-w-none">
          <h1 className="font-headline text-4xl font-extrabold tracking-tighter">Privacy Policy</h1>
          <p className="lead">Last updated: {new Date().toLocaleDateString()}</p>
          <p>
            This Privacy Policy describes Our policies and procedures on the collection, use and disclosure of Your information when You use the Service and tells You about Your privacy rights and how the law protects You.
          </p>

          <h2>1. Information We Collect</h2>
          <p>
            We may collect several different types of information for various purposes to provide and improve our Service to you. This may include personal data, such as email address, first name and last name, and usage data.
          </p>

          <h2>2. Use of Your Personal Data</h2>
          <p>
            The Company may use Personal Data for the following purposes: to provide and maintain our Service, to manage Your Account, for the performance of a contract, to contact You, and to provide You with news, special offers and general information about other goods, services and events which we offer.
          </p>

          <h2>3. Security of Your Personal Data</h2>
          <p>
            The security of Your Personal Data is important to Us, but remember that no method of transmission over the Internet, or method of electronic storage is 100% secure. While We strive to use commercially acceptable means to protect Your Personal Data, We cannot guarantee its absolute security.
          </p>

          <h2>4. Changes to this Privacy Policy</h2>
          <p>
            We may update Our Privacy Policy from time to time. We will notify You of any changes by posting the new Privacy Policy on this page.
          </p>
          
          <h2>Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, You can contact us.</p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
