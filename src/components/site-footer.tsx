import { Gem } from 'lucide-react';
import DelayedLink from './delayed-link';

export default function SiteFooter() {
  return (
    <footer className="border-t border-border/10 py-8">
      <div className="container mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 sm:flex-row sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <Gem className="h-5 w-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} AQT Max. All rights reserved.
          </p>
        </div>
        <nav className="flex gap-4 sm:gap-6">
          <DelayedLink href="/legal/terms" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Terms
          </DelayedLink>
          <DelayedLink href="/legal/privacy" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Privacy
          </DelayedLink>
          <DelayedLink href="/legal/refund" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Refund Policy
          </DelayedLink>
           <DelayedLink href="/legal" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Legal
          </DelayedLink>
        </nav>
      </div>
    </footer>
  );
}
