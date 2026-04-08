import clsx from 'clsx';

export function GlassSelect({ className, label, id, options = [], error, ...props }) {
  const selectId = id || props.name;
  return (
    <div className="glass-input-wrapper">
      {label && (
        <label htmlFor={selectId} className="glass-input-label">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={clsx('glass-input glass-select', error && 'glass-input--error', className)}
        {...props}
      >
        {options.map((opt) => {
          const value = typeof opt === 'string' ? opt : opt.value;
          const optLabel = typeof opt === 'string' ? opt : opt.label;
          return (
            <option key={value} value={value}>
              {optLabel}
            </option>
          );
        })}
      </select>
      {error && <span className="glass-input-error">{error}</span>}
    </div>
  );
}
