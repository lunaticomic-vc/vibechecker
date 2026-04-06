'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface AccordionProps {
  header: React.ReactNode;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  headerClassName?: string;
  contentClassName?: string;
}

export default function Accordion({ header, children, isOpen, onToggle, headerClassName, contentClassName }: AccordionProps) {
  return (
    <div>
      <button onClick={onToggle} className={headerClassName}>
        {header}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={`overflow-hidden${contentClassName ? ` ${contentClassName}` : ''}`}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
