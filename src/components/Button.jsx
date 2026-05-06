import React from 'react';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

export const Button = React.forwardRef(({ className, variant = 'primary', children, ...props }, ref) => {
  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative inline-flex items-center justify-center px-6 py-3 font-heading font-semibold text-sm rounded-lg transition-all",
        variant === 'primary' && "border-spin-gradient hover-shimmer text-white",
        variant === 'secondary' && "bg-dark-surface border border-dark-border hover:border-accent/50 text-gray-300 hover:text-white",
        className
      )}
      {...props}
    >
      <span className="relative z-10 flex items-center gap-2">
        {children}
      </span>
    </motion.button>
  );
});

Button.displayName = 'Button';
