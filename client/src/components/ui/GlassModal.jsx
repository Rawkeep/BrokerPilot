import { useRef, useEffect } from 'react';
import clsx from 'clsx';

export function GlassModal({ open, onClose, title, children, className }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  function handleBackdropClick(e) {
    if (e.target === dialogRef.current) {
      onClose?.();
    }
  }

  function handleCancel(e) {
    e.preventDefault();
    onClose?.();
  }

  return (
    <dialog
      ref={dialogRef}
      className={clsx('glass-modal', className)}
      onClick={handleBackdropClick}
      onCancel={handleCancel}
    >
      <div className="glass-modal__content">
        {title && (
          <div className="glass-modal__header">
            <h2 className="glass-modal__title">{title}</h2>
            <button
              type="button"
              className="glass-modal__close"
              onClick={onClose}
              aria-label="Schließen"
            >
              &times;
            </button>
          </div>
        )}
        <div className="glass-modal__body">{children}</div>
      </div>
    </dialog>
  );
}
