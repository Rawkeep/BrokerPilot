import clsx from 'clsx';

export function GlassInput({ className, label, id, error, ...props }) {
  const inputId = id || props.name;
  return (
    <div className="glass-input-wrapper">
      {label && (
        <label htmlFor={inputId} className="glass-input-label">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={clsx('glass-input', error && 'glass-input--error', className)}
        {...props}
      />
      {error && <span className="glass-input-error">{error}</span>}
    </div>
  );
}
