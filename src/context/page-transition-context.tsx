'use client';

import { useRouter } from 'next/navigation';
import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface PageTransitionContextType {
  isLoading: boolean;
  handleLinkClick: (href: string) => void;
}

const PageTransitionContext = createContext<PageTransitionContextType | undefined>(undefined);

export function PageTransitionProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLinkClick = useCallback((href: string) => {
    setIsLoading(true);
    
    // Duration should match the loader animation
    const transitionDuration = 800;

    setTimeout(() => {
      router.push(href);
      // A short delay before hiding the loader to allow the new page to start rendering
      setTimeout(() => setIsLoading(false), 200);
    }, transitionDuration);

  }, [router]);

  return (
    <PageTransitionContext.Provider value={{ isLoading, handleLinkClick }}>
      {children}
    </PageTransitionContext.Provider>
  );
}

export function usePageTransition() {
  const context = useContext(PageTransitionContext);
  if (context === undefined) {
    throw new Error('usePageTransition must be used within a PageTransitionProvider');
  }
  return context;
}
