import { useState } from 'react';
import { Button, Card, Icon, Kicker, Modal } from '../../components/ui/index.js';
import { parentApi } from '../../api/endpoints.js';

const time = (iso) => new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

/**
 * Lets a family member create their parent's sign-in code and pass it on.
 * This is how parents sign in until text messages are connected.
 */
export function ParentSignInDialog({ open, parent, onClose, createCode = () => parentApi.signInCode(parent.id) }) {
  const [state, setState] = useState({ status: 'idle' });
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setState({ status: 'loading' });
    setCopied(false);
    try {
      setState({ status: 'ready', data: await createCode() });
    } catch (err) {
      setState({ status: 'error', error: err.message });
    }
  };
  const close = () => {
    setState({ status: 'idle' });
    onClose();
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(state.data.shareText);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };
  const d = state.data;

  return (
    <Modal open={open} onClose={close} labelledBy="psi-h" width={520}>
      <Kicker tone="teal">Help with sign in</Kicker>
      <h2 id="psi-h" style={{ fontSize: 26, fontWeight: 800 }}>
        Sign {parent.short} in on their phone
      </h2>
      {state.status === 'idle' && (
        <>
          <p className="muted">
            Make a 6-digit code and send it to {parent.short}. They type it on the sign-in screen. It works once, for 30 minutes, and they stay signed in for 90 days.
          </p>
          <Button size="lg" onClick={generate} style={{ alignSelf: 'flex-start' }}>
            Make a code
          </Button>
        </>
      )}
      {state.status === 'loading' && <p className="muted">Making a code…</p>}
      {state.status === 'error' && (
        <p role="alert" className="kw-field__error">
          {state.error}
        </p>
      )}
      {state.status === 'ready' && (
        <>
          <div className="kw-notice kw-notice--normal" style={{ alignItems: 'center', textAlign: 'center' }}>
            <span className="muted text-sm">{parent.short}'s code</span>
            <span style={{ fontSize: 44, fontWeight: 800, letterSpacing: '0.2em' }} aria-live="polite">
              {d.code}
            </span>
            <span className="muted text-sm">Works until {time(d.expiresAt)} · for {d.phone}</span>
          </div>
          <div className="row">
            <Button variant="cta" icon="message" onClick={() => window.open(`https://wa.me/${d.phone.replace(/\D/g, '')}?text=${encodeURIComponent(d.shareText)}`, '_blank', 'noopener')}>
              Send on WhatsApp
            </Button>
            <Button variant="glass" onClick={copy}>
              {copied ? 'Copied' : 'Copy message'}
            </Button>
            <Button variant="link" icon="refresh" onClick={generate}>
              New code
            </Button>
          </div>
          <p className="muted text-sm">Or call {parent.short} and read the code out.</p>
        </>
      )}
    </Modal>
  );
}

/** Card on the parent's profile that opens the dialog. */
export function ParentSignInCard({ parent }) {
  const [open, setOpen] = useState(false);
  return (
    <Card pad={22} gap={12}>
      <div className="row">
        <span className="kw-icon-tile" style={{ '--size': '44px' }}>
          <Icon name="phone" />
        </span>
        <div className="grow">
          <h2 className="kw-kicker">Help with sign in</h2>
          <div className="strong">Get {parent.short} into their simple view</div>
        </div>
      </div>
      <p className="text-sm" style={{ color: 'var(--kw-ink-2)' }}>
        Make a one-time code and send it on WhatsApp. {parent.short} types it on the sign-in screen.
      </p>
      <Button variant="glass" onClick={() => setOpen(true)} style={{ alignSelf: 'flex-start' }}>
        Make a sign-in code
      </Button>
      <ParentSignInDialog open={open} parent={parent} onClose={() => setOpen(false)} />
    </Card>
  );
}
