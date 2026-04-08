import { forwardRef } from 'react';
import clsx from 'clsx';

export const GlassCard = forwardRef(function GlassCard({ children, className, hoverable = true, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={clsx('glass-card', hoverable && 'glass-card--hoverable', className)}
      {...props}
    >
      {children}
    </div>
  );
});
