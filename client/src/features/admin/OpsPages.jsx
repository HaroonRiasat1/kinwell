// Smaller admin screens: activity log, settings (service areas), and the two work queues.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/layout/index.js';
import { Button, Card, ConfirmDialog, EmptyState, Field, SkeletonCard, StatusTag, useToast } from '../../components/ui/index.js';
import { useApi } from '../../hooks/useApi.js';
import { adminApi } from '../../api/endpoints.js';
import { Pager, SecretDialog, Section, when } from './kit.jsx';

// ---------- Activity ----------
export function ActivityView({ data, onPage }) {
  return (
    <Card variant="flush">
      {data.items.length === 0 && <p className="muted" style={{ padding: 20 }}>No admin activity yet.</p>}
      <ul>
        {data.items.map((a) => (
          <li key={a.id} className="row" style={{ padding: '12px 20px', borderTop: '1px solid var(--kw-rule-soft)', flexWrap: 'nowrap', alignItems: 'flex-start' }}>
            <span className="muted" style={{ fontSize: 14, minWidth: 130 }}>{when(a.at)}</span>
            <span className="grow">
              <span className="strong">{a.actor}</span> · {a.summary}
            </span>
          </li>
        ))}
      </ul>
      <Pager page={data.page} pages={data.pages} total={data.total} noun="entries" onPage={onPage} />
    </Card>
  );
}

export function ActivityPage() {
  const [page, setPage] = useState(1);
  const { data, error, reload } = useApi(() => adminApi.activity(page), [page]);
  return (
    <>
      <PageHeader eyebrow="Every admin action, newest first" title="Activity" divider={false} />
      {error && <EmptyState title="We couldn't load activity" action={<Button onClick={reload}>Try again</Button>} />}
      {!data && !error && <SkeletonCard />}
      {data && <ActivityView data={data} onPage={setPage} />}
    </>
  );
}

// ---------- Settings: service areas ----------
export function AreasView({ areas, onSave, onRemove }) {
  const [edits, setEdits] = useState({});
  const [adding, setAdding] = useState({ name: '', capacity: '' });
  return (
    <Section title="Service areas">
      <p className="muted text-sm">Capacity is how many clients the team can look after in each area. Client counts come from parents' addresses.</p>
      <div className="kw-table-scroll" style={{ '--min': '560px' }}>
        <div role="table" aria-label="Service areas" style={{ '--cols': 'minmax(0,1.2fr) minmax(0,0.8fr) minmax(0,1fr) minmax(0,1.4fr)' }}>
          <div role="row" className="kw-table__head">
            {['Area', 'Clients', 'Capacity', ''].map((h, i) => (
              <span key={i} role="columnheader">{h}</span>
            ))}
          </div>
          {areas.map((a) => {
            const value = edits[a.id] ?? String(a.capacity);
            return (
              <div key={a.id} role="row" className="kw-table__row" style={{ fontSize: 16 }}>
                <span role="cell" className="strong">{a.area}</span>
                <span role="cell">
                  {a.clients} <StatusTag status={a.status} label={`${a.pct}%`} />
                </span>
                <span role="cell">
                  <input aria-label={`${a.area} capacity`} className="kw-input" type="number" min="0" value={value} onChange={(e) => setEdits((x) => ({ ...x, [a.id]: e.target.value }))} style={{ minHeight: 44, width: 110 }} />
                </span>
                <span role="cell" className="row" style={{ '--gap': '6px' }}>
                  <Button size="sm" disabled={value === String(a.capacity) || value === ''} onClick={() => onSave({ id: a.id, name: a.area, capacity: Number(value) })}>
                    Save
                  </Button>
                  <Button variant="glass" size="sm" onClick={() => onRemove(a)}>
                    Remove
                  </Button>
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <form
        className="row row--end"
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ name: adding.name.trim(), capacity: Number(adding.capacity) }).then(() => setAdding({ name: '', capacity: '' }));
        }}
      >
        <Field label="New area" placeholder="e.g. Wapda Town" value={adding.name} onChange={(e) => setAdding((x) => ({ ...x, name: e.target.value }))} />
        <Field label="Capacity" type="number" min="0" value={adding.capacity} onChange={(e) => setAdding((x) => ({ ...x, capacity: e.target.value }))} style={{ width: 120 }} />
        <Button type="submit" disabled={adding.name.trim().length < 2 || adding.capacity === ''}>
          Add area
        </Button>
      </form>
    </Section>
  );
}

export function SettingsPage() {
  const { data, error, reload, setData } = useApi(() => adminApi.areas(), []);
  const [removing, setRemoving] = useState(null);
  const toast = useToast();
  const save = async (body) => {
    try {
      setData(await adminApi.saveArea(body));
      toast(body.id ? `${body.name} updated` : `${body.name} added`);
    } catch (err) {
      toast(err.message, { tone: 'attention' });
      throw err;
    }
  };
  return (
    <>
      <PageHeader eyebrow="How Kinwell is set up" title="Settings" divider={false} />
      {error && <EmptyState title="We couldn't load settings" action={<Button onClick={reload}>Try again</Button>} />}
      {!data && !error && <SkeletonCard />}
      {data && <AreasView areas={data} onSave={(b) => save(b).catch(() => {})} onRemove={setRemoving} />}
      {removing && (
        <ConfirmDialog
          open
          title={`Remove ${removing.area}?`}
          confirmLabel="Remove area"
          tone="danger"
          onClose={() => setRemoving(null)}
          onConfirm={async () => {
            setData(await adminApi.removeArea(removing.id));
            toast(`${removing.area} removed`);
          }}
        >
          Only areas with no clients can be removed.
        </ConfirmDialog>
      )}
    </>
  );
}

// ---------- Queue: lab reports the reader couldn't read ----------
const LAB_STATUS = { retake_requested: 'Asked for a clearer copy', typed_in: 'Typed in', dismissed: 'Dismissed' };

export function LabUploadsView({ data, onAction }) {
  return (
    <div className="stack" style={{ '--gap': '20px' }}>
      <Section title={`To handle (${data.open.length})`}>
        {data.open.length === 0 && <p className="muted">Nothing waiting. Every uploaded report has been read.</p>}
        {data.open.map((r) => (
          <div key={r.id} className="kw-notice kw-notice--watch" style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 14 }}>
            <div className="grow" style={{ minWidth: 240 }}>
              <div className="strong">
                {r.file} · <Link to={`/admin/families/${r.familyId}`}>{r.parent}</Link>
              </div>
              <div className="muted text-sm">
                {r.reason} · {r.by} · {when(r.at)}
              </div>
            </div>
            <div className="row" style={{ '--gap': '8px' }}>
              <Button onClick={() => onAction(r, 'retake')}>Ask for a clearer copy</Button>
              <Button variant="glass" onClick={() => onAction(r, 'typed_in')}>I typed it in</Button>
              <Button variant="glass" onClick={() => onAction(r, 'dismiss')}>Dismiss</Button>
            </div>
          </div>
        ))}
      </Section>
      {data.handled.length > 0 && (
        <Section title="Recently handled">
          {data.handled.map((r) => (
            <div key={r.id} className="row row--between text-sm" style={{ paddingTop: 8, borderTop: '1px solid var(--kw-rule-soft)' }}>
              <span>
                {r.file} · {r.parent}
              </span>
              <span className="muted">{LAB_STATUS[r.status]}</span>
            </div>
          ))}
        </Section>
      )}
    </div>
  );
}

export function LabUploadsPage() {
  const { data, error, reload, setData } = useApi(() => adminApi.labUploads(), []);
  const toast = useToast();
  const act = async (r, action) => {
    setData(await adminApi.labUploadAction(r.id, action));
    toast(action === 'retake' ? `Message sent to ${r.parent}'s family asking for a clearer copy` : 'Report updated');
  };
  return (
    <>
      <PageHeader eyebrow={<Link to="/admin/overview">← Overview</Link>} title="Unreadable lab reports" divider={false} />
      {error && <EmptyState title="We couldn't load the queue" action={<Button onClick={reload}>Try again</Button>} />}
      {!data && !error && <SkeletonCard />}
      {data && <LabUploadsView data={data} onAction={act} />}
    </>
  );
}

// ---------- Queue: requests to join a family ----------
export function AccessRequestsView({ requests, onDecide }) {
  const pending = requests.filter((r) => r.status === 'pending');
  const done = requests.filter((r) => r.status !== 'pending');
  return (
    <div className="stack" style={{ '--gap': '20px' }}>
      <Section title={`Waiting (${pending.length})`}>
        {pending.length === 0 && <p className="muted">No requests waiting.</p>}
        {pending.map((r) => (
          <div key={r.id} className="kw-notice kw-notice--normal" style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 14 }}>
            <div className="grow" style={{ minWidth: 240 }}>
              <div className="strong">
                {r.name} ({r.relation}) wants to join the <Link to={`/admin/families/${r.familyId}`}>{r.family}</Link>
              </div>
              <div className="muted text-sm">
                {r.email} · asked by {r.requestedBy} · {r.access === 'edit' ? 'view & edit' : 'view only'} · {when(r.at)}
              </div>
            </div>
            <div className="row" style={{ '--gap': '8px' }}>
              <Button onClick={() => onDecide(r, 'approve')}>Approve</Button>
              <Button variant="glass" onClick={() => onDecide(r, 'decline')}>Decline</Button>
            </div>
          </div>
        ))}
      </Section>
      {done.length > 0 && (
        <Section title="Decided">
          {done.map((r) => (
            <div key={r.id} className="row row--between text-sm" style={{ paddingTop: 8, borderTop: '1px solid var(--kw-rule-soft)' }}>
              <span>
                {r.name} · {r.family}
              </span>
              <StatusTag status={r.status === 'approved' ? 'normal' : 'watch'} label={r.status === 'approved' ? 'Approved' : 'Declined'} />
            </div>
          ))}
        </Section>
      )}
    </div>
  );
}

export function AccessRequestsPage() {
  const { data, error, reload, setData } = useApi(() => adminApi.accessRequests(), []);
  const [secret, setSecret] = useState(null);
  const [deciding, setDeciding] = useState(null);
  return (
    <>
      <PageHeader eyebrow={<Link to="/admin/overview">← Overview</Link>} title="Requests to join a family" divider={false} />
      {error && <EmptyState title="We couldn't load requests" action={<Button onClick={reload}>Try again</Button>} />}
      {!data && !error && <SkeletonCard />}
      {data && <AccessRequestsView requests={data} onDecide={(r, decision) => setDeciding({ r, decision })} />}
      {deciding && (
        <ConfirmDialog
          open
          title={deciding.decision === 'approve' ? `Let ${deciding.r.name} join the ${deciding.r.family}?` : `Decline ${deciding.r.name}'s request?`}
          confirmLabel={deciding.decision === 'approve' ? 'Approve' : 'Decline'}
          tone={deciding.decision === 'approve' ? 'primary' : 'danger'}
          onClose={() => setDeciding(null)}
          onConfirm={async () => {
            const res = await adminApi.decideAccess(deciding.r.id, deciding.decision);
            setData(res.requests);
            if (res.link) setSecret({ title: `Invite link for ${deciding.r.name}`, value: res.link, hint: `Send this to ${deciding.r.email}. It works once.` });
          }}
        >
          {deciding.decision === 'approve' ? `They'll get ${deciding.r.access === 'edit' ? 'view & edit' : 'view-only'} access after they create their account from the invite link.` : 'They will not be added to the care team.'}
        </ConfirmDialog>
      )}
      <SecretDialog secret={secret} onClose={() => setSecret(null)} />
    </>
  );
}
