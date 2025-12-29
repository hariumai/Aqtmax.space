'use client';
import { useState, useEffect } from 'react';
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

export default function RefundPage() {
  const firestore = useFirestore();
  const pageRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'legalPages', 'refund') : null),
    [firestore]
  );
  const { data: page, isLoading } = useDoc(pageRef);
  const [lastUpdated, setLastUpdated] = useState('');

  useEffect(() => {
    setLastUpdated(new Date().toLocaleDateString());
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-grow container mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        {isLoading && (
            <div className="prose prose-invert max-w-none">
                <Skeleton className="h-12 w-3/4 mb-4" />
                <Skeleton className="h-6 w-1/4 mb-8" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-5/6 mb-8" />
                <Skeleton className="h-8 w-1/3 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
            </div>
        )}
        {page && (
            <div className="prose prose-invert max-w-none">
            <h1 className="font-headline text-4xl font-extrabold tracking-tighter">{page.title}</h1>
            {lastUpdated && <p className="lead">Last updated: {lastUpdated}</p>}
            <div dangerouslySetInnerHTML={{ __html: page.content.replace(/\n/g, '<br />') }} />
            </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
