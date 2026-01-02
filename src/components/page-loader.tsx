'use client';
import { usePageLoader } from '@/context/page-loader-context';
import { Gem } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function PageLoader() {
  const { isLoading } = usePageLoader();

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
          >
            <Gem className="h-16 w-16 text-primary animate-float" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
