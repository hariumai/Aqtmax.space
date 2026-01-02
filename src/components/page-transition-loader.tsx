'use client';

import { usePageTransition } from '@/context/page-transition-context';
import { cn } from '@/lib/utils';

export default function PageTransitionLoader() {
  const { isLoading } = usePageTransition();

  return (
    <div
      className={cn(
        'fixed top-0 left-0 z-[9999] h-1 w-full bg-primary/20 overflow-hidden',
        !isLoading && 'hidden'
      )}
    >
      <div
        className={cn(
          'h-full bg-primary transition-transform duration-[400ms] ease-in-out',
          isLoading ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{
            animation: isLoading ? 'loader-progress 2s ease-out forwards' : 'none',
        }}
      />
      <style jsx>{`
        @keyframes loader-progress {
          0% {
            width: 0%;
          }
          100% {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
