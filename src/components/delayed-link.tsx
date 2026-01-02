'use client';

import React from 'react';
import { usePageTransition } from '@/context/page-transition-context';

interface DelayedLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
}

const DelayedLink = React.forwardRef<HTMLAnchorElement, DelayedLinkProps>(
  ({ href, onClick, children, ...props }, ref) => {
    const { handleLinkClick, isLoading } = usePageTransition();

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      if (isLoading) return;
      if (onClick) {
        onClick(e);
      }
      handleLinkClick(href);
    };

    return (
      <a href={href} onClick={handleClick} ref={ref} {...props}>
        {children}
      </a>
    );
  }
);

DelayedLink.displayName = 'DelayedLink';

export default DelayedLink;
