import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Field, Icon, Modal, StatusTag, useToast } from '../../components/ui/index.js';
import { STATUS } from '../../lib/status.js';
import { adminApi } from '../../api/endpoints.js';
import { when } from './kit.jsx';

/** Where a flag's main action goes, by what the flag is about. */
export function primaryAction(flag, navigate, openContact) {
  const { kind, family, parent } = flag.link ?? {};
  if (kind === 'parent') return () => navigate(`/admin/parents/${parent}`);
  if (kind === 'visit' || kind === 'nutritionist') return () => openContact(flag);
  if (kind === 'labUploads') return () => navigate('/admin/queues/lab-uploads');
  if (kind === 'accessRequest') return () => navigate('/admin/queues/access-requests');
  if (family) return () => navigate(`/admin/families/${family}`);
  return null;
}

/** Contact info for the staff member a flag is about, plus a reminder they'll see in their workspace. */
export function ContactDialog({ flag, onClose, onUpdated }) {
  const [message, setMessage] = useState(
    flag?.link?.kind === 'visit' ? `Please add your notes for this visit today: ${flag.title.split(':')[0]}.` : `Reminder: ${flag?.title}. Please sort this out and let us know.`,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const toast = useToast();
  if (!flag) return null;
  const c = flag.contact ?? {};
  const send = async () => {
    setBusy(true);
    setError(null);
    try {
      const updated = await adminApi.remindFlag(flag.id, message);
      onUpdated(updated);
      toast(`Reminder sent to ${c.name}`);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal open onClose={onClose} labelledBy="contact-h" width={540}>
      <h2 id="contact-h" style={{ fontSize: 24, fontWeight: 800 }}>
        Contact {c.name}
      </h2>
      <p className="muted text-sm">{flag.title}</p>
      <div className="row">
        {c.phone && (
          <a className="kw-btn kw-btn--glass" href={`tel:${c.phone}`}>
            <Icon name="phone" /> {c.phone}
          </a>
        )}
        {c.email && (
          <a className="kw-btn kw-btn--glass" href={`mailto:${c.email}?subject=${encodeURIComponent(flag.title)}`}>
            <Icon name="message" /> Email
          </a>
        )}
      </div>
      <Field as="textarea" label="Send an in-app reminder" hint={`${c.name} sees this on their Clients page.`} value={message} onChange={(e) => setMessage(e.target.value)} style={{ minHeight: 110 }} />
      {error && <p role="alert" className="kw-field__error">{error}</p>}
      {flag.notes?.length > 0 && (
        <div className="stack" style={{ '--gap': '4px' }}>
          <div className="kw-kicker">History</div>
          {flag.notes.map((n, i) => (
            <div key={i} className="text-sm">
              <span className="muted">{when(n.at)} · {n.by}:</span> {n.text}
            </div>
          ))}
        </div>
      )}
      <div className="row">
        <Button onClick={send} disabled={busy || !message.trim()}>
          {busy ? 'Sending…' : 'Send reminder'}
        </Button>
        <Button variant="glass" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
}

export function ResolveDialog({ flag, onClose, onResolved }) {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  if (!flag) return null;
  const resolve = async () => {
    setBusy(true);
    try {
      onResolved(await adminApi.resolveFlag(flag.id, note.trim() || undefined));
      onClose();
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal open onClose={onClose} labelledBy="resolve-h" width={480}>
      <h2 id="resolve-h" style={{ fontSize: 24, fontWeight: 800 }}>
        Mark as resolved?
      </h2>
      <p className="muted">{flag.title}</p>
      <Field label="What was done (optional)" placeholder="e.g. Called Amna, notes added" value={note} onChange={(e) => setNote(e.target.value)} />
      <div className="row">
        <Button onClick={resolve} disabled={busy}>
          {busy ? 'Saving…' : 'Mark resolved'}
        </Button>
        <Button variant="glass" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Modal>
  );
}

/** One flag in the "Needs review" list. */
export function FlagItem({ flag, onAction, onResolve, onReopen }) {
  const label = STATUS[flag.status].label === 'Normal' ? 'Info' : STATUS[flag.status].label;
  return (
    <li className={`kw-notice kw-notice--${flag.status}`} style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 14 }}>
      <div className="grow stack" style={{ '--gap': '4px', minWidth: 240 }}>
        <StatusTag status={flag.status} label={`${label} · ${flag.type}`} />
        <div className="strong">{flag.title}</div>
        <div className="muted" style={{ fontSize: 15 }}>
          {flag.resolved ? `Resolved ${when(flag.resolvedAt)} by ${flag.resolvedBy}${flag.resolutionNote ? ` · “${flag.resolutionNote}”` : ''}` : flag.meta}
        </div>
        {!flag.resolved && flag.notes?.length > 0 && <div className="text-xs muted">Last: {flag.notes.at(-1).text}</div>}
      </div>
      <div className="row" style={{ '--gap': '8px' }}>
        {flag.resolved ? (
          <Button variant="glass" onClick={() => onReopen(flag)}>
            Reopen
          </Button>
        ) : (
          <>
            {onAction && <Button onClick={() => onAction(flag)}>{flag.action}</Button>}
            <Button variant="glass" onClick={() => onResolve(flag)}>
              Mark resolved
            </Button>
          </>
        )}
      </div>
    </li>
  );
}

/** The flag list with its dialogs wired up; used on the overview and on family pages. */
export function FlagList({ flags, setFlags, emptyText = 'All caught up. Nothing needs review right now.' }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [contact, setContact] = useState(null);
  const [resolving, setResolving] = useState(null);
  const replace = (f) => setFlags((list) => list.map((x) => (x.id === f.id ? f : x)));

  const reopen = async (f) => replace(await adminApi.reopenFlag(f.id));
  const onResolved = (f) => {
    replace(f);
    toast('Flag resolved', { action: 'Undo', onAction: () => reopen(f) });
  };
  return (
    <>
      {flags.length === 0 && <p className="muted">{emptyText}</p>}
      <ul className="stack" style={{ '--gap': '12px' }}>
        {flags.map((f) => {
          const act = primaryAction(f, navigate, setContact);
          return <FlagItem key={f.id} flag={f} onAction={act ? () => act() : null} onResolve={setResolving} onReopen={reopen} />;
        })}
      </ul>
      {contact && <ContactDialog flag={contact} onClose={() => setContact(null)} onUpdated={replace} />}
      {resolving && <ResolveDialog flag={resolving} onClose={() => setResolving(null)} onResolved={onResolved} />}
    </>
  );
}
