import { createContext, useCallback, useContext, useRef, useState } from 'react';

const ToastContext = createContext(null);

/**
 * Short confirmation messages ("Flag resolved") with an optional action such as Undo.
 * Announced to screen readers through a polite live region.
 */
export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timer = useRef();
  const show = useCallback((message, { action, onAction, tone = 'normal', duration = 6000 } = {}) => {
    clearTimeout(timer.current);
    setToast({ message, action, onAction, tone, id: Date.now() });
    timer.current = setTimeout(() => setToast(null), duration);
  }, []);
  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="kw-toast-region" role="status" aria-live="polite">
        {toast && (
          <div key={toast.id} className={`kw-toast kw-toast--${toast.tone}`}>
            <span>{toast.message}</span>
            {toast.action && (
              <button
                type="button"
                onClick={() => {
                  setToast(null);
                  toast.onAction?.();
                }}
              >
                {toast.action}
              </button>
            )}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

/** show(message, { action, onAction, tone }) — no-ops outside a provider (e.g. Storybook). */
export const useToast = () => useContext(ToastContext) ?? (() => {});
