import clsx from 'clsx';

export function GlassCard({ children, className, hoverable = true, ...props }) {
  return (
    <div
      className={clsx('glass-card', hoverable && 'glass-card--hoverable', className)}
      {...props}
    >
      {children}
    </div>
  );
}
