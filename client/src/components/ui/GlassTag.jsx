import clsx from 'clsx';

export function GlassTag({ label, onRemove, color, className }) {
  return (
    <span
      className={clsx('glass-tag', className)}
      style={color ? { background: color } : undefined}
    >
      <span className="glass-tag__label">{label}</span>
      {onRemove && (
        <button
          type="button"
          className="glass-tag__remove"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(label);
          }}
          aria-label={`${label} entfernen`}
        >
          &times;
        </button>
      )}
    </span>
  );
}
