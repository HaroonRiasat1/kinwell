import { useState } from 'react';
import { Button, Checkbox, Modal } from '../ui/index.js';
import { useI18n } from '../../i18n/index.js';

export function SignOutDialog({ open, onCancel, onConfirm, message = "You'll need your email and password to sign back in. Your family's information stays safe." }) {
  const { t } = useI18n();
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
        {t('signOut.title')}
      </h2>
      <p className="muted">{message}</p>
      <Checkbox label={t('signOut.everywhere')} checked={everywhere} onChange={(e) => setEverywhere(e.target.checked)} />
      <div className="row">
        <Button icon="signOut" onClick={confirm} disabled={busy}>
          {busy ? t('signOut.signingOut') : t('common.signOut')}
        </Button>
        <Button variant="glass" onClick={onCancel}>
          {t('signOut.stay')}
        </Button>
      </div>
    </Modal>
  );
}
