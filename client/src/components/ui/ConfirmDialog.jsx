import { useState } from 'react';
import { Button } from './Button.jsx';
import { Modal } from './Modal.jsx';

/** Asks before a consequential action; shows the server's error if it fails. */
export function ConfirmDialog({ open, title, children, confirmLabel = 'Confirm', tone = 'primary', onConfirm, onClose }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal open={open} onClose={onClose} labelledBy="confirm-h" width={480}>
      <h2 id="confirm-h" style={{ fontSize: 24, fontWeight: 800 }}>
        {title}
      </h2>
      <div className="muted">{children}</div>
      {error && (
        <p role="alert" className="kw-field__error">
          {error}
        </p>
      )}
      <div className="row">
        <Button variant={tone} onClick={confirm} disabled={busy}>
          {busy ? 'Working…' : confirmLabel}
        </Button>
        <Button variant="glass" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Modal>
  );
}
