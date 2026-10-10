import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * Accessible dialog: focuses itself, closes on Escape or backdrop click.
 * Rendered into <body> so containers (e.g. the app shell's container query) can't trap or cover it.
 */
export function Modal({ open, onClose, labelledBy, width, children }) {
  const panel = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.activeElement;
    panel.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      prev?.focus?.();
    };
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className="kw-modal" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div ref={panel} className="kw-modal__panel" role="dialog" aria-modal="true" aria-labelledby={labelledBy} tabIndex={-1} style={width ? { '--w': `${width}px` } : undefined}>
        {children}
      </div>
    </div>,
    document.body,
  );
}
