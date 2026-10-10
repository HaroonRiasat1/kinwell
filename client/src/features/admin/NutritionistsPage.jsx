import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/layout/index.js';
import { Avatar, Button, Card, Chip, EmptyState, Field, Modal, SkeletonCard, StatusTag, useToast } from '../../components/ui/index.js';
import { useApi } from '../../hooks/useApi.js';
import { adminApi } from '../../api/endpoints.js';
import { RowLink, SearchBox, SecretDialog } from './kit.jsx';

const COLS = 'minmax(0,1.4fr) minmax(0,1.4fr) minmax(0,0.6fr) minmax(0,0.9fr) minmax(0,0.8fr) minmax(0,1.4fr)';

export function NutritionistsView({ rows, q, onQuery }) {
  return (
    <div className="stack" style={{ '--gap': '16px' }}>
      <SearchBox label="Search nutritionists" placeholder="Name" value={q} onChange={onQuery} />
      <Card variant="flush">
        <div className="kw-table-scroll" style={{ '--min': '860px' }}>
          <div role="table" aria-label="Nutritionists" style={{ '--cols': COLS }}>
            <div role="row" className="kw-table__head">
              {['Nutritionist', 'Areas', 'Clients', 'Visits this week', 'Notes on time', 'Status'].map((h) => (
                <span key={h} role="columnheader">
                  {h}
                </span>
              ))}
            </div>
            {rows.map((r) => (
              <RowLink key={r.id} to={`/admin/nutritionists/${r.id}`}>
                <span role="cell" className="row" style={{ '--gap': '10px', flexWrap: 'nowrap' }}>
                  <Avatar name={r.name} size={36} />
                  <span className="strong">{r.name}</span>
                </span>
                <span role="cell" style={{ fontSize: 15 }}>
                  {r.area}
                </span>
                <span role="cell">{r.clients}</span>
                <span role="cell">
                  {r.weekDone}/{r.week} done
                </span>
                <span role="cell">{r.onTime === null ? '—' : `${r.onTime}%`}</span>
                <span role="cell">
                  <StatusTag status={r.status} label={r.label} />
                </span>
              </RowLink>
            ))}
          </div>
        </div>
        {rows.length === 0 && <p className="muted" style={{ padding: 20 }}>No nutritionists match.</p>}
      </Card>
      <p className="muted text-sm">
        Visits this week counts booked home visits Monday to Sunday. Notes on time is the share of the last 30 days' visits with notes saved within 24 hours.
      </p>
    </div>
  );
}

export function AddNutritionistDialog({ areas, onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', credential: '', languages: 'Urdu, English', areas: [] });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const toggleArea = (a) => setForm((f) => ({ ...f, areas: f.areas.includes(a) ? f.areas.filter((x) => x !== a) : [...f.areas, a] }));
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      onCreated(await adminApi.createNutritionist(form), form.name);
    } catch (err) {
      setError(err.details ? Object.values(err.details).flat().join(' ') : err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal open onClose={onClose} labelledBy="add-n-h" width={600}>
      <form className="stack" onSubmit={save}>
        <h2 id="add-n-h" style={{ fontSize: 24, fontWeight: 800 }}>
          Add a nutritionist
        </h2>
        <div className="grid-auto" style={{ '--min': '220px', '--gap': '12px' }}>
          <Field label="Full name" value={form.name} onChange={set('name')} required />
          <Field label="Work email" type="email" value={form.email} onChange={set('email')} required />
          <Field label="Phone" type="tel" dir="ltr" value={form.phone} onChange={set('phone')} />
          <Field label="Qualification" placeholder="Registered dietitian · 5 years" value={form.credential} onChange={set('credential')} required />
        </div>
        <Field label="Languages" value={form.languages} onChange={set('languages')} />
        <div className="stack" style={{ '--gap': '8px' }}>
          <span className="strong text-sm">Areas they cover</span>
          <div className="row" style={{ '--gap': '8px' }}>
            {areas.map((a) => (
              <Chip key={a} selected={form.areas.includes(a)} onClick={() => toggleArea(a)}>
                {a}
              </Chip>
            ))}
          </div>
        </div>
        {error && <p role="alert" className="kw-field__error">{error}</p>}
        <div className="row">
          <Button type="submit" disabled={busy || !form.areas.length}>
            {busy ? 'Adding…' : 'Add nutritionist'}
          </Button>
          <Button variant="glass" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function NutritionistsPage() {
  const [q, setQ] = useState('');
  const [adding, setAdding] = useState(false);
  const [secret, setSecret] = useState(null);
  const navigate = useNavigate();
  const toast = useToast();
  const list = useApi(() => adminApi.team({ q }), [q]);
  const areas = useApi(() => adminApi.areas(), []);
  return (
    <>
      <PageHeader eyebrow="All of Lahore" title="Nutritionists" divider={false}>
        <Button icon="plus" onClick={() => setAdding(true)}>
          Add nutritionist
        </Button>
      </PageHeader>
      {list.error && <EmptyState title="We couldn't load the team" action={<Button onClick={list.reload}>Try again</Button>} />}
      {!list.data && !list.error && <SkeletonCard />}
      {list.data && <NutritionistsView rows={list.data} q={q} onQuery={setQ} />}
      {adding && (
        <AddNutritionistDialog
          areas={(areas.data ?? []).map((a) => a.area)}
          onClose={() => setAdding(false)}
          onCreated={(r, name) => {
            setAdding(false);
            toast(`${name} added`);
            setSecret({
              title: `Temporary password for ${name}`,
              value: r.tempPassword,
              hint: 'Give this to them privately. They sign in with their work email and this password. It is shown only once.',
              then: r.id,
            });
          }}
        />
      )}
      <SecretDialog
        secret={secret}
        onClose={() => {
          const id = secret?.then;
          setSecret(null);
          if (id) navigate(`/admin/nutritionists/${id}`);
        }}
      />
    </>
  );
}
