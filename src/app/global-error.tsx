'use client';

import { Button } from '@/components/ui/button';
import { Frown } from 'lucide-react';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <html>
      <body>
        <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mb-4">
                <Frown className="h-10 w-10 text-destructive" />
            </div>
            <div className="space-y-2">
                <h1 className="text-3xl font-extrabold tracking-tight text-destructive">
                    Oops! Something went wrong.
                </h1>
                <p className="text-muted-foreground">
                    An unexpected error occurred. Please try again.
                </p>
            </div>
            <Button onClick={() => reset()}>Try again</Button>
        </main>
      </body>
    </html>
  );
}
