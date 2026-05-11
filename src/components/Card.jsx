import React from 'react';
import { cn } from '../lib/utils';

export const Card = React.forwardRef(({ className, children, withAccent = true, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl p-6 transition-colors",
        withAccent && "corner-accent",
        "hover-beam",
        className
      )}
      {...props}
    >
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
});

Card.displayName = 'Card';
