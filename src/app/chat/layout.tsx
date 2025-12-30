import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SubLime AI Chat',
  description: 'Get support from our AI assistant.',
};

export default function ChatLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
