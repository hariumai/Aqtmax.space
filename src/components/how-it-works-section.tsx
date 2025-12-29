import { BadgeCheck, ShoppingCart, Smile } from 'lucide-react';
import { Card } from './ui/card';

const steps = [
  {
    icon: ShoppingCart,
    title: 'Choose Your Plan',
    description: 'Browse our selection of premium subscriptions and pick the one that fits your needs.',
  },
  {
    icon: BadgeCheck,
    title: 'Receive Credentials',
    description: 'After a successful purchase, your account details will be delivered to you instantly.',
  },
  {
    icon: Smile,
    title: 'Enjoy Your Subscription',
    description: 'Log in and start enjoying your premium content. Our support is here if you need help.',
  },
];

export default function HowItWorksSection() {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">
            As Easy As 1, 2, 3
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Our process is designed to be simple, fast, and secure.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <Card
              key={step.title}
              className="rounded-3xl border-border/10 bg-card/50 p-8 backdrop-blur-lg"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <step.icon className="h-6 w-6" />
                </div>
                <span className="text-5xl font-bold text-muted-foreground/30">
                  0{index + 1}
                </span>
              </div>
              <h3 className="mt-6 text-xl font-bold">{step.title}</h3>
              <p className="mt-2 text-muted-foreground">{step.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
