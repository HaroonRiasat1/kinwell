import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../../components/layout/index.js';
import { Button, Card, Chip, ConfirmDialog, EmptyState, Field, SkeletonCard, StatusTag, useToast } from '../../components/ui/index.js';
import { useApi } from '../../hooks/useApi.js';
import { adminApi } from '../../api/endpoints.js';
import { SecretDialog, Section, dayOnly, when } from './kit.jsx';

const dateInput = (iso) => (iso ? new Date(iso).toISOString().slice(0, 10) : '');
const STATE = { done: ['normal', 'Done'], not_logged: ['attention', 'Not logged'], upcoming: ['watch', 'Booked'] };

function ProfileForm({ data, areas, onSaved }) {
  const [form, setForm] = useState(() => ({ ...data.profile, phone: data.phone ?? '', leaveUntil: dateInput(data.profile.leaveUntil), licenceRenewsOn: dateInput(data.profile.licenceRenewsOn) }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const toast = useToast();
  useEffect(() => setForm({ ...data.profile, phone: data.phone ?? '', leaveUntil: dateInput(data.profile.leaveUntil), licenceRenewsOn: dateInput(data.profile.licenceRenewsOn) }), [data]);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const toggleArea = (a) => setForm((f) => ({ ...f, areas: f.areas.includes(a) ? f.areas.filter((x) => x !== a) : [...f.areas, a] }));
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      onSaved(await adminApi.updateNutritionist(data.id, form));
      toast('Profile saved');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <form className="stack" onSubmit={save}>
      <div className="grid-auto" style={{ '--min': '220px', '--gap': '12px' }}>
        <Field label="Qualification" value={form.credential} onChange={set('credential')} />
        <Field label="Languages" value={form.languages} onChange={set('languages')} />
        <Field label="Phone" type="tel" dir="ltr" value={form.phone} onChange={set('phone')} />
        <Field label="Licence renews on" type="date" value={form.licenceRenewsOn} onChange={set('licenceRenewsOn')} />
      </div>
      <div className="stack" style={{ '--gap': '8px' }}>
        <span className="strong text-sm">Areas</span>
        <div className="row" style={{ '--gap': '8px' }}>
          {[...new Set([...areas, ...form.areas])].map((a) => (
            <Chip key={a} selected={form.areas.includes(a)} onClick={() => toggleArea(a)}>
              {a}
            </Chip>
          ))}
        </div>
      </div>
      <div className="row">
        <Field as="select" label="Availability" value={form.availability} onChange={set('availability')} options={[{ value: 'active', label: 'Working' }, { value: 'on_leave', label: 'On leave' }]} />
        {form.availability === 'on_leave' && <Field label="Back on" type="date" value={form.leaveUntil} onChange={set('leaveUntil')} />}
      </div>
      {error && <p role="alert" className="kw-field__error">{error}</p>}
      <Button type="submit" disabled={busy} style={{ alignSelf: 'flex-start' }}>
        {busy ? 'Saving…' : 'Save changes'}
      </Button>
    </form>
  );
}

export function NutritionistDetailView({ data, areas, onChange }) {
  const [confirm, setConfirm] = useState(null);
  const [secret, setSecret] = useState(null);
  const toast = useToast();
  return (
    <div className="stack" style={{ '--gap': '20px' }}>
      <div className="grid-auto" style={{ '--min': '200px', '--gap': '14px' }}>
        {[
          ['Clients', data.clients.length],
          ['Visits this week', `${data.week.filter((v) => v.state === 'done').length}/${data.week.length}`],
          ['Not logged', data.notLogged.length],
          ['Notes on time', data.onTime === null ? '—' : `${data.onTime}%`],
        ].map(([l, v]) => (
          <Card key={l} pad={18} gap={2}>
            <div className="muted text-sm strong">{l}</div>
            <div style={{ fontSize: 30, fontWeight: 800 }}>{v}</div>
          </Card>
        ))}
      </div>

      {data.notLogged.length > 0 && (
        <Section title="Visits with no notes">
          {data.notLogged.map((v) => (
            <div key={v.id} className="row row--between" style={{ paddingTop: 8, borderTop: '1px solid var(--kw-rule-soft)' }}>
              <span>
                <span className="strong">{v.parent}</span> <span className="muted">· {when(v.at)}</span>
              </span>
              {v.familyId && <Button variant="link" to={`/admin/families/${v.familyId}`}>Open family</Button>}
            </div>
          ))}
        </Section>
      )}

      <div className="grid-auto" style={{ '--min': '360px' }}>
        <Section title="Profile">
          <ProfileForm data={data} areas={areas} onSaved={onChange} />
        </Section>
        <Section title="Account">
          <dl className="kw-dl">
            <dt>Email</dt>
            <dd>{data.email}</dd>
            <dt>Status</dt>
            <dd>
              <StatusTag status={data.active ? 'normal' : 'attention'} label={data.active ? 'Can sign in' : 'Turned off'} />
            </dd>
          </dl>
          <div className="row" style={{ '--gap': '8px' }}>
            <Button variant="glass" onClick={() => setConfirm('reset')}>Reset password</Button>
            <Button variant="glass" onClick={() => setConfirm('signout')}>Sign out everywhere</Button>
            <Button variant={data.active ? 'glass' : 'primary'} onClick={() => setConfirm('active')}>
              {data.active ? 'Turn off account' : 'Turn account back on'}
            </Button>
          </div>
          {data.notices.length > 0 && (
            <div className="stack" style={{ '--gap': '6px' }}>
              <div className="kw-kicker">Reminders sent</div>
              {data.notices.map((n) => (
                <div key={n.id} className="text-sm">
                  <span className="muted">{when(n.at)} · {n.from}{n.read ? ' · seen' : ''}:</span> {n.body ?? n.title}
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      <Section title="This week's visits">
        {data.week.length === 0 && <p className="muted">No visits booked this week.</p>}
        {data.week.map((v) => (
          <div key={v.id} className="row row--between" style={{ paddingTop: 8, borderTop: '1px solid var(--kw-rule-soft)' }}>
            <span>
              <span className="strong">{dayOnly(v.at)}</span> · {v.parent}
            </span>
            <StatusTag status={STATE[v.state][0]} label={STATE[v.state][1]} />
          </div>
        ))}
      </Section>

      <Section title={`Clients (${data.clients.length})`}>
        <div className="kw-table-scroll" style={{ '--min': '640px' }}>
          <div role="table" aria-label="Clients" style={{ '--cols': 'minmax(0,1.3fr) minmax(0,1fr) minmax(0,0.9fr) minmax(0,0.9fr) minmax(0,1fr)' }}>
            <div role="row" className="kw-table__head">
              {['Client', 'Area', 'Status', 'Last visit', 'Next visit'].map((h) => (
                <span key={h} role="columnheader">{h}</span>
              ))}
            </div>
            {data.clients.map((c) => (
              <Link key={c.id} role="row" to={`/admin/families/${c.familyId}`} className="kw-table__row kw-table__row--link" style={{ fontSize: 15 }}>
                <span role="cell" className="strong">{c.name}</span>
                <span role="cell">{c.area}</span>
                <span role="cell"><StatusTag status={c.status} /></span>
                <span role="cell">{c.last ?? '—'}</span>
                <span role="cell">{c.next ?? 'Not booked'}</span>
              </Link>
            ))}
          </div>
        </div>
      </Section>

      <ConfirmDialog
        open={confirm === 'reset'}
        title={`Reset ${data.name}'s password?`}
        confirmLabel="Reset password"
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          const r = await adminApi.resetPassword(data.id);
          setSecret({ title: `New temporary password for ${data.name}`, value: r.tempPassword, hint: "Give it to them privately. They've been signed out everywhere." });
        }}
      >
        They'll be signed out on every device and get a temporary password from you.
      </ConfirmDialog>
      <ConfirmDialog
        open={confirm === 'signout'}
        title={`Sign ${data.name} out everywhere?`}
        confirmLabel="Sign out everywhere"
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          await adminApi.signOutEverywhere(data.id);
          toast(`${data.name} was signed out on all devices`);
        }}
      >
        Use this if a phone or tablet is lost. Their password doesn't change.
      </ConfirmDialog>
      <ConfirmDialog
        open={confirm === 'active'}
        title={data.active ? `Turn off ${data.name}'s account?` : `Turn ${data.name}'s account back on?`}
        confirmLabel={data.active ? 'Turn off' : 'Turn on'}
        tone={data.active ? 'danger' : 'primary'}
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          await adminApi.setActive(data.id, !data.active);
          onChange({ ...data, active: !data.active });
          toast(data.active ? 'Account turned off' : 'Account turned on');
        }}
      >
        {data.active ? 'They will be signed out and unable to sign in. Move their clients to someone else first.' : 'They will be able to sign in again.'}
      </ConfirmDialog>
      <SecretDialog secret={secret} onClose={() => setSecret(null)} />
    </div>
  );
}

export default function NutritionistDetailPage() {
  const { id } = useParams();
  const { data, error, reload, setData } = useApi(() => adminApi.nutritionist(id), [id]);
  const areas = useApi(() => adminApi.areas(), []);
  return (
    <>
      <PageHeader eyebrow={<Link to="/admin/nutritionists">← All nutritionists</Link>} title={data?.name ?? 'Nutritionist'} divider={false}>
        {data && <StatusTag status={data.status} label={data.label} size="lg" />}
      </PageHeader>
      {error && <EmptyState title="We couldn't load this nutritionist" action={<Button onClick={reload}>Try again</Button>} />}
      {!data && !error && <SkeletonCard minHeight={400} />}
      {data && <NutritionistDetailView data={data} areas={(areas.data ?? []).map((a) => a.area)} onChange={setData} />}
    </>
  );
}
