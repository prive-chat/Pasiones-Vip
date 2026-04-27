import React, { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/src/lib/utils';

interface HomeActionAreaProps {
  children?: ReactNode;
  leftContent?: ReactNode;
  rightContent?: ReactNode;
  className?: string;
}

/**
 * Modular action area for the home page.
 * Designed to be 100% scalable for future integrations.
 */
export function HomeActionArea({ 
  children, 
  leftContent, 
  rightContent, 
  className 
}: HomeActionAreaProps) {
  return (
    <div className={cn("mb-12", className)}>
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        {/* Left Slot: Primarily for status, greetings or context (modular) */}
        <div className="flex flex-col items-start gap-4 empty:hidden min-w-0">
          {leftContent}
        </div>

        {/* Right Slot: Primarily for actions or filters (extensible) */}
        <div className="flex flex-wrap items-center gap-3 empty:hidden">
          {rightContent}
        </div>
      </div>

      {/* Center/Full Slot: For large future integrations like Search or Stories */}
      <AnimatePresence>
        {children && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-8 overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default HomeActionArea;
