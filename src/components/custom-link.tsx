'use client';

import Link, { LinkProps } from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import React, { MouseEvent } from 'react';
import { usePageLoader } from '@/context/page-loader-context';

interface CustomLinkProps extends LinkProps {
  children: React.ReactNode;
  className?: string;
}

export default function CustomLink({ children, href, className, ...props }: CustomLinkProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { showLoader, hideLoader } = usePageLoader();
  const LOADER_DELAY = 500; // ms

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const targetUrl = href.toString();

    // Don't show loader if it's the same page
    if (targetUrl === pathname) {
      return;
    }

    showLoader();
    setTimeout(() => {
      router.push(targetUrl);
      // It's better to hide the loader on page load of the new page,
      // but a timeout fallback is good.
      setTimeout(hideLoader, 100);
    }, LOADER_DELAY);
  };

  return (
    <Link href={href} onClick={handleClick} className={className} {...props}>
      {children}
    </Link>
  );
}
