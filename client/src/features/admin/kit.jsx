// Small pieces shared by the admin screens: search, paging, links-as-rows, one-time secrets.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Icon, Modal } from '../../components/ui/index.js';

export function SearchBox({ value, onChange, placeholder = 'Search', label = 'Search', delay = 250 }) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  useEffect(() => {
    if (text === value) return undefined;
    const t = setTimeout(() => onChange(text), delay);
    return () => clearTimeout(t);
  }, [text, value, onChange, delay]);
  return (
    <label className="kw-input-wrap" style={{ minWidth: 240, flex: '1 1 260px', maxWidth: 420 }}>
      <span className="sr-only">{label}</span>
      <span style={{ position: 'absolute', left: 16, color: 'var(--kw-muted)', display: 'flex' }}>
        <Icon name="search" />
      </span>
      <input type="search" className="kw-input" style={{ paddingLeft: 44, borderRadius: 999 }} placeholder={placeholder} value={text} onChange={(e) => setText(e.target.value)} />
    </label>
  );
}

export function FilterSelect({ label, value, onChange, options }) {
  return (
    <label className="row" style={{ '--gap': '8px', fontSize: 15, fontWeight: 700 }}>
      <span className="muted">{label}</span>
      <select className="kw-input" style={{ minHeight: 44, width: 'auto', fontSize: 15 }} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Pager({ page, pages, total, noun = 'results', onPage }) {
  if (pages <= 1) return <p className="muted text-sm" style={{ padding: '12px 20px' }}>{total} {noun}</p>;
  return (
    <nav aria-label="Pages" className="row row--between" style={{ padding: '12px 20px', borderTop: '1px solid var(--kw-rule-soft)' }}>
      <span className="muted text-sm">
        {total} {noun} · page {page} of {pages}
      </span>
      <span className="row" style={{ '--gap': '8px' }}>
        <Button variant="glass" size="sm" icon="arrowLeft" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Previous
        </Button>
        <Button variant="glass" size="sm" iconRight="arrowRight" disabled={page >= pages} onClick={() => onPage(page + 1)}>
          Next
        </Button>
      </span>
    </nav>
  );
}

/** A table row that is a link, so the whole row opens the record (and works with keyboard and middle-click). */
export function RowLink({ to, children }) {
  return (
    <Link role="row" to={to} className="kw-table__row kw-table__row--link">
      {children}
    </Link>
  );
}

export function Section({ title, action, children, pad = 22 }) {
  return (
    <Card pad={pad} gap={12}>
      <div className="row row--between">
        <h2 style={{ fontSize: 20, fontWeight: 800 }}>{title}</h2>
        {action}
      </div>
      {children}
    </Card>
  );
}

/**
 * Shows a one-time secret (temporary password, sign-in code, invite link) with copy.
 * It's shown once because the server doesn't keep it in a readable form.
 */
export function SecretDialog({ secret, onClose }) {
  const [copied, setCopied] = useState(false);
  if (!secret) return null;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(secret.value);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };
  return (
    <Modal open onClose={onClose} labelledBy="secret-h" width={500}>
      <h2 id="secret-h" style={{ fontSize: 24, fontWeight: 800 }}>
        {secret.title}
      </h2>
      <div className="kw-notice kw-notice--normal" style={{ alignItems: 'center', textAlign: 'center' }}>
        <span className="kw-ltr" style={{ fontSize: secret.value.length > 20 ? 16 : 30, fontWeight: 800, wordBreak: 'break-all', letterSpacing: secret.value.length > 20 ? 0 : '0.08em' }}>
          {secret.value}
        </span>
      </div>
      <p className="muted text-sm">{secret.hint}</p>
      <div className="row">
        <Button onClick={copy}>{copied ? 'Copied' : 'Copy'}</Button>
        <Button variant="glass" onClick={onClose}>
          Done
        </Button>
      </div>
    </Modal>
  );
}

export const when = (iso) =>
  iso ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Karachi' }).format(new Date(iso)) : '—';
export const dayOnly = (iso) => (iso ? new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Karachi' }).format(new Date(iso)) : '—');
