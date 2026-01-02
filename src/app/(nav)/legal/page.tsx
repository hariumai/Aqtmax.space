'use client';
import { Card } from '@/components/ui/card';
import { FileText, Shield, Undo2, Gavel } from 'lucide-react';
import DelayedLink from '@/components/delayed-link';

const legalLinks = [
    {
        href: '/legal/terms',
        title: 'Terms of Service',
        description: 'Read the terms and conditions for using our service.',
        icon: FileText
    },
    {
        href: '/legal/privacy',
        title: 'Privacy Policy',
        description: 'Learn how we collect, use, and protect your data.',
        icon: Shield
    },
    {
        href: '/legal/refund',
        title: 'Refund Policy',
        description: 'Understand our policy on refunds and returns.',
        icon: Undo2
    },
    {
        href: '/legal/rules',
        title: 'Account Rules',
        description: 'Important rules for using subscription accounts.',
        icon: Gavel
    }
]

export default function LegalPage() {
  return (
    <main className="flex-grow container mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="font-headline text-4xl font-extrabold tracking-tighter sm:text-5xl">
          Legal Documents
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          Review our policies and terms of service.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-1">
        {legalLinks.map((link) => {
            const Icon = link.icon;
            return (
              <DelayedLink href={link.href} key={link.href}>
                <div
                  className="group relative flex items-center gap-6 rounded-2xl border border-border/10 bg-card/50 p-6 transition-all duration-300 hover:bg-card/70 hover:scale-105 hover:shadow-2xl backdrop-blur-xl"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{link.title}</h3>
                    <p className="text-muted-foreground text-sm">{link.description}</p>
                  </div>
                </div>
              </DelayedLink>
            )
        })}
      </div>
    </main>
  );
}
