import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { cn } from '@/lib/utils';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { ThemeProvider } from '@/components/theme-provider';
import AppIcons from '@/components/app-icons';
import { PageLoaderProvider } from '@/context/page-loader-context';
import PageLoader from '@/components/page-loader';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'AQT Max | Best & Cheap Subscription Panel in Pakistan',
  description: 'Get the best rates for Netflix, Prime Video, and more digital subscriptions in Pakistan. AQT Max is your fast, cheap, and reliable service panel.',
  keywords: ['cheap subscriptions pakistan', 'netflix pakistan', 'prime video pakistan', 'best rates panel', 'fast service panel', 'subscription panel', 'aqtmax.space'],
  openGraph: {
    title: 'AQT Max | Best & Cheap Subscription Panel in Pakistan',
    description: 'The fastest and most affordable digital subscription panel in Pakistan.',
    images: ['https://pub-084453786b28495bac2d56e573071005.r2.dev/file_00000000135472079d159aeaa589b909.png'],
    url: 'https://aqtmax.space',
    siteName: 'AQT Max',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <AppIcons />
      </head>
      <body className={cn('font-body antialiased', inter.variable)}>
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
        >
          <FirebaseClientProvider>
            <PageLoaderProvider>
              <PageLoader />
              {children}
              <Toaster />
            </PageLoaderProvider>
          </FirebaseClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
