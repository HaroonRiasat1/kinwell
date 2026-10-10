import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, Button, Card, Chip, EmptyState, Icon, SkeletonCard, StatusTag } from '../../components/ui/index.js';
import { longDate } from '../../lib/dates.js';
import { useHeader, useWorkspace } from './WorkspaceLayout.jsx';

const FILTERS = [
  ['all', 'All'],
  ['attention', 'Needs attention'],
  ['watch', 'Watch'],
  ['normal', 'Normal'],
];
const COLS = 'minmax(0,1.6fr) minmax(0,1.2fr) minmax(170px,1.1fr) minmax(0,0.8fr) minmax(0,1.1fr) auto';

/** Clients, most urgent first. A table on wide screens, cards on phones; every row opens the client. */
export function ClientsView({ clients, filter, onFilter, query, onQuery }) {
  const shown = clients.filter((c) => (filter === 'all' || c.status === filter) && (!query || c.name.toLowerCase().includes(query.toLowerCase())));
  return (
    <div className="stack" style={{ '--gap': '20px' }}>
      <div className="row row--between">
        <div role="group" aria-label="Filter clients" className="row" style={{ '--gap': '8px' }}>
          {FILTERS.map(([v, label]) => (
            <Chip key={v} selected={filter === v} onClick={() => onFilter(v)}>
              {label} · {v === 'all' ? clients.length : clients.filter((c) => c.status === v).length}
            </Chip>
          ))}
        </div>
        <label className="kw-input-wrap" style={{ minWidth: 240 }}>
          <span className="sr-only">Search clients</span>
          <span style={{ position: 'absolute', left: 16, color: 'var(--kw-muted)', display: 'flex' }}>
            <Icon name="search" />
          </span>
          <input type="search" className="kw-input" style={{ paddingLeft: 44, borderRadius: 999 }} placeholder="Search clients" value={query} onChange={(e) => onQuery(e.target.value)} />
        </label>
      </div>

      <Card variant="flush" className="kw-wide-only">
        <div role="table" aria-label="Clients" style={{ '--cols': COLS }}>
          <div role="row" className="kw-table__head">
            {['Client', 'Family contact', 'Status', 'Last visit', 'Next visit'].map((h) => (
              <span key={h} role="columnheader">{h}</span>
            ))}
            <span role="columnheader"><span className="sr-only">Actions</span></span>
          </div>
          {shown.map((c) => (
            <div key={c.id} role="row" className="kw-table__row">
              <span role="cell" className="row" style={{ '--gap': '12px', flexWrap: 'nowrap' }}>
                <Avatar name={c.name} size={40} />
                <Link to={`/workspace/clients/${c.id}`} style={{ color: 'var(--kw-ink)' }}>
                  <span className="strong" style={{ display: 'block', lineHeight: 1.25 }}>{c.name}</span>
                  <span className="muted" style={{ fontSize: 14 }}>{c.age} · {c.area}</span>
                </Link>
              </span>
              <span role="cell" style={{ fontSize: 15 }}>{c.family}</span>
              <span role="cell"><StatusTag status={c.status} /></span>
              <span role="cell" style={{ fontSize: 15 }}>{c.last ?? '—'}</span>
              <span role="cell" className="strong" style={{ fontSize: 15 }}>{c.next ?? 'Not booked'}</span>
              <span role="cell">
                <Button size="sm" to={`/workspace/visit/${c.id}`}>Start visit</Button>
              </span>
            </div>
          ))}
        </div>
        {shown.length === 0 && <p className="muted" style={{ padding: 20 }}>No clients match.</p>}
      </Card>

      <ul className="kw-narrow-only stack" style={{ '--gap': '12px' }}>
        {shown.map((c) => (
          <li key={c.id}>
            <Link to={`/workspace/clients/${c.id}`} className="kw-card" style={{ '--pad': '16px', '--gap': '8px', textDecoration: 'none', color: 'var(--kw-ink)' }}>
              <span className="row row--between">
                <span className="strong">{c.name}</span>
                <StatusTag status={c.status} />
              </span>
              <span className="muted text-sm">
                {c.age} · {c.area} · {c.family}
              </span>
              <span className="text-sm">
                Next: <strong>{c.next ?? 'Not booked'}</strong>
              </span>
            </Link>
          </li>
        ))}
        {shown.length === 0 && <p className="muted">No clients match.</p>}
      </ul>
    </div>
  );
}

export default function ClientsPage() {
  const { clients } = useWorkspace();
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  useHeader('Your clients', `${longDate()} · most urgent first`, null, []);
  if (clients.error) return <EmptyState title="We couldn't load your clients" action={<Button onClick={clients.reload}>Try again</Button>} />;
  if (!clients.data) return <SkeletonCard minHeight={420} />;
  return <ClientsView clients={clients.data} filter={filter} onFilter={setFilter} query={query} onQuery={setQuery} />;
}
