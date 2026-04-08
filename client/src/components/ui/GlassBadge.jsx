import clsx from 'clsx';

const VARIANT_MAP = {
  low: 'glass-badge--low',
  medium: 'glass-badge--medium',
  high: 'glass-badge--high',
  default: '',
};

export function GlassBadge({ children, variant = 'default', className }) {
  return (
    <span className={clsx('glass-badge', VARIANT_MAP[variant] || '', className)}>
      {children}
    </span>
  );
}
