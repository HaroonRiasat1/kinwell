import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, Button, Card, Chip, EmptyState, Icon, SkeletonCard, StatusTag } from '../../components/ui/index.js';
import { longDate } from '../../lib/dates.js';
import { useWorkspace } from './WorkspaceLayout.jsx';
import { Notices } from './Notices.jsx';

const FILTERS = [
  ['all', 'All'],
  ['attention', 'Needs attention'],
  ['watch', 'Watch'],
  ['normal', 'Normal'],
];

export function ClientsView({ clients, filter, onFilter, query, onQuery, onStart }) {
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
          <span style={{ position: 'absolute', left: 16, color: 'var(--kw-muted)' }}>
            <Icon name="search" />
          </span>
          <input className="kw-input" style={{ paddingLeft: 44, borderRadius: 999 }} placeholder="Search clients" value={query} onChange={(e) => onQuery(e.target.value)} />
        </label>
      </div>
      <Card variant="flush">
        <div className="kw-table-scroll" style={{ '--min': '860px' }}>
          <div role="table" aria-label="Clients" style={{ '--cols': 'minmax(0,1.6fr) minmax(0,1.2fr) minmax(170px,1.1fr) minmax(0,0.7fr) minmax(0,1.1fr) auto' }}>
            <div role="row" className="kw-table__head">
              <span role="columnheader">Client</span>
              <span role="columnheader">Family contact</span>
              <span role="columnheader">Status</span>
              <span role="columnheader">Last visit</span>
              <span role="columnheader">Next visit</span>
              <span role="columnheader">
                <span className="sr-only">Actions</span>
              </span>
            </div>
            {shown.map((c) => (
              <div key={c.id} role="row" className="kw-table__row">
                <span role="cell" className="row" style={{ '--gap': '12px', flexWrap: 'nowrap' }}>
                  <Avatar name={c.name} size={40} />
                  <span>
                    <span className="strong" style={{ display: 'block', lineHeight: 1.25 }}>
                      {c.name}
                    </span>
                    <span className="muted" style={{ fontSize: 14 }}>
                      {c.age} · {c.area}
                    </span>
                  </span>
                </span>
                <span role="cell" style={{ fontSize: 15 }}>
                  {c.family}
                </span>
                <span role="cell">
                  <StatusTag status={c.status} />
                </span>
                <span role="cell" style={{ fontSize: 15 }}>
                  {c.last ?? '—'}
                </span>
                <span role="cell" className="strong" style={{ fontSize: 15 }}>
                  {c.next ?? '—'}
                </span>
                <span role="cell">
                  <Button onClick={() => onStart(c)}>Start visit</Button>
                </span>
              </div>
            ))}
          </div>
        </div>
        {shown.length === 0 && <p className="muted" style={{ padding: 20 }}>No clients match.</p>}
      </Card>
    </div>
  );
}

export default function ClientsPage() {
  const { clients, setHeader, setCurrentId } = useWorkspace();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  useEffect(() => setHeader({ title: 'Your clients', sub: longDate() }), [setHeader]);
  if (clients.error) return <EmptyState title="We couldn't load your clients" action={<Button onClick={clients.reload}>Try again</Button>} />;
  if (!clients.data) return <SkeletonCard minHeight={420} />;
  return (
    <>
    <Notices />
    <ClientsView
      clients={clients.data}
      filter={filter}
      onFilter={setFilter}
      query={query}
      onQuery={setQuery}
      onStart={(c) => {
        setCurrentId(c.id);
        navigate(`/workspace/visit/${c.id}`);
      }}
    />
    </>
  );
}
