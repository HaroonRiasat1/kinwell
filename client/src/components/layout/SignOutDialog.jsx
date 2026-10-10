import { useState } from 'react';
import { Button, Checkbox, Modal } from '../ui/index.js';

export function SignOutDialog({ open, onCancel, onConfirm, message = "You'll need your email and password to sign back in. Your family's information stays safe." }) {
  const [everywhere, setEverywhere] = useState(false);
  const [busy, setBusy] = useState(false);
  const confirm = async () => {
    setBusy(true);
    try {
      await onConfirm(everywhere);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal open={open} onClose={onCancel} labelledBy="so-h" width={460}>
      <h2 id="so-h" style={{ fontSize: 26, fontWeight: 800 }}>
        Sign out of Kinwell?
      </h2>
      <p className="muted">{message}</p>
      <Checkbox label="Also sign out on my other devices" checked={everywhere} onChange={(e) => setEverywhere(e.target.checked)} />
      <div className="row">
        <Button icon="signOut" onClick={confirm} disabled={busy}>
          {busy ? 'Signing out…' : 'Sign out'}
        </Button>
        <Button variant="glass" onClick={onCancel}>
          Stay signed in
        </Button>
      </div>
    </Modal>
  );
}
