import clsx from 'clsx';

export function GlassButton({ children, variant = 'default', className, disabled, ...props }) {
  return (
    <button
      className={clsx('glass-button', variant === 'primary' && 'glass-button--primary', className)}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
