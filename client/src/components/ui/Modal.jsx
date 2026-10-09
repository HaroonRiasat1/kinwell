import { useEffect, useRef } from 'react';

/** Accessible dialog: focuses itself, closes on Escape or backdrop click. */
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
  return (
    <div className="kw-modal" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div ref={panel} className="kw-modal__panel" role="dialog" aria-modal="true" aria-labelledby={labelledBy} tabIndex={-1} style={width ? { '--w': `${width}px` } : undefined}>
        {children}
      </div>
    </div>
  );
}
