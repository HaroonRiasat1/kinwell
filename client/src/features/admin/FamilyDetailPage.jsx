import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../../components/layout/index.js';
import { Avatar, Button, Card, EmptyState, Field, Modal, SkeletonCard, StatusTag, useToast } from '../../components/ui/index.js';
import { useApi } from '../../hooks/useApi.js';
import { adminApi } from '../../api/endpoints.js';
import { FlagList } from './FlagActions.jsx';
import { SecretDialog, Section, when } from './kit.jsx';

function AssignDialog({ family, parent, team, onClose, onDone }) {
  const current = parent ? parent.nutritionist?.id : family.nutritionist?.id;
  const choices = team.filter((t) => t.active && t.id !== current);
  const [chosen, setChosen] = useState(choices[0]?.id ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const who = parent ? parent.fullName : `everyone in the ${family.name}`;
  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      onDone(await adminApi.assignNutritionist(family.id, chosen, parent?.id));
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal open onClose={onClose} labelledBy="assign-h" width={520}>
      <h2 id="assign-h" style={{ fontSize: 24, fontWeight: 800 }}>
        Change nutritionist
      </h2>
      <p className="muted">
        For {who}. Upcoming visits move to the new nutritionist, and they get a notice in their workspace.
      </p>
      <Field
        as="select"
        label="New nutritionist"
        value={chosen}
        onChange={(e) => setChosen(e.target.value)}
        options={choices.map((t) => ({ value: t.id, label: `${t.name} · ${t.clients} clients · ${t.area}${t.status !== 'normal' ? ` · ${t.label}` : ''}` }))}
      />
      {error && <p role="alert" className="kw-field__error">{error}</p>}
      <div className="row">
        <Button onClick={save} disabled={busy || !chosen}>
          {busy ? 'Saving…' : 'Change nutritionist'}
        </Button>
        <Button variant="glass" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Modal>
  );
}

export function FamilyDetailView({ data, team, onChange }) {
  const toast = useToast();
  const [assigning, setAssigning] = useState(null); // { parent? }
  const [secret, setSecret] = useState(null);
  const [flags, setFlags] = useState(data.flags);
  useEffect(() => setFlags(data.flags), [data.flags]);

  const invite = async (email) => {
    const r = await adminApi.resendInvite(data.id, email);
    setSecret({ title: `Invite link for ${email}`, value: r.link, hint: 'Send this link to them. It works once; making a new one cancels the old link.' });
  };
  const parentCode = async (account, name) => {
    const r = await adminApi.parentCode(account.id);
    setSecret({ title: `Sign-in code for ${name}`, value: r.code, hint: `For ${r.phone}. Works once, for 30 minutes. This also clears a lockout after wrong tries.` });
  };

  return (
    <div className="stack" style={{ '--gap': '20px' }}>
      <div className="grid-auto" style={{ '--min': '320px' }}>
        <Section title="Main contact">
          {data.mainContact ? (
            <div className="row" style={{ flexWrap: 'nowrap' }}>
              <Avatar name={data.mainContact.name} size={48} />
              <div style={{ lineHeight: 1.35 }}>
                <div className="strong">{data.mainContact.name}</div>
                <div className="muted text-sm">
                  {data.mainContact.email} · {data.mainContact.city}
                </div>
                {data.mainContact.phone && <div className="muted text-sm">{data.mainContact.phone}</div>}
              </div>
            </div>
          ) : (
            <p className="muted">No main contact.</p>
          )}
          <dl className="kw-dl">
            <dt>Joined</dt>
            <dd>{when(data.createdAt)}</dd>
            <dt>Nutritionist</dt>
            <dd>{data.nutritionist ? <Link to={`/admin/nutritionists/${data.nutritionist.id}`}>{data.nutritionist.name}</Link> : 'Not assigned'}</dd>
          </dl>
          <Button variant="glass" onClick={() => setAssigning({})} style={{ alignSelf: 'flex-start' }}>
            Change nutritionist for the family
          </Button>
        </Section>

        <Section title={`Care team (${data.members.length})`}>
          {data.members.map((m) => (
            <div key={m.email ?? m.userId} className="row" style={{ paddingTop: 10, borderTop: '1px solid var(--kw-rule-soft)' }}>
              <div className="grow" style={{ lineHeight: 1.35 }}>
                <div className="strong">{m.name ?? m.email}</div>
                <div className="muted text-sm">
                  {[m.relation, m.access === 'edit' ? 'Can view & edit' : 'Can view', m.city].filter(Boolean).join(' · ')}
                </div>
              </div>
              {m.status === 'invited' ? (
                <>
                  <StatusTag status="watch" label="Invited" />
                  <Button variant="glass" size="sm" onClick={() => invite(m.email)}>
                    New invite link
                  </Button>
                </>
              ) : m.active === false ? (
                <StatusTag status="attention" label="Turned off" />
              ) : (
                <StatusTag status="normal" label="Active" />
              )}
            </div>
          ))}
          {data.accessRequests.filter((r) => r.status === 'pending').length > 0 && (
            <Button variant="link" to="/admin/queues/access-requests">
              {data.accessRequests.filter((r) => r.status === 'pending').length} request to join waiting
            </Button>
          )}
        </Section>
      </div>

      <h2 style={{ fontSize: 22, fontWeight: 800 }}>Parents</h2>
      <div className="grid-auto" style={{ '--min': '320px' }}>
        {data.parents.map((p) => (
          <Card key={p.id} pad={22} gap={12}>
            <div className="row row--between row--top">
              <div>
                <div style={{ fontSize: 20, fontWeight: 800 }}>{p.fullName}</div>
                <div className="muted text-sm">
                  {p.age} · {p.area}
                </div>
              </div>
              <StatusTag status={p.overall} />
            </div>
            <dl className="kw-dl">
              <dt>Nutritionist</dt>
              <dd>{p.nutritionist?.name ?? 'Not assigned'}</dd>
              <dt>Last visit</dt>
              <dd>{p.lastVisit ?? '—'}</dd>
              <dt>Next visit</dt>
              <dd>{p.nextVisit ?? 'Not booked'}</dd>
              <dt>Tablets, last 7 days</dt>
              <dd>{p.adherence === null ? 'No record' : `${p.adherence}% taken`}</dd>
              <dt>Open alerts</dt>
              <dd>{p.openAlerts}</dd>
              {p.account && (
                <>
                  <dt>Phone sign-in</dt>
                  <dd>
                    {p.account.phone}
                    {p.account.locked && (
                      <>
                        {' '}
                        <StatusTag status="attention" label="Locked" />
                      </>
                    )}
                  </dd>
                </>
              )}
            </dl>
            <div className="row" style={{ '--gap': '8px' }}>
              <Button to={`/admin/parents/${p.id}`}>View record</Button>
              <Button variant="glass" onClick={() => setAssigning({ parent: p })}>
                Change nutritionist
              </Button>
              {p.account && (
                <Button variant="glass" onClick={() => parentCode(p.account, p.fullName)}>
                  {p.account.locked ? 'Unlock & make code' : 'Make sign-in code'}
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      <Section title="Flags">
        <FlagList flags={flags} setFlags={setFlags} emptyText="No flags for this family." />
      </Section>

      <Section title="Recent admin activity">
        {data.activity.length === 0 && <p className="muted">Nothing yet.</p>}
        {data.activity.map((a) => (
          <div key={a.id} className="text-sm" style={{ paddingTop: 8, borderTop: '1px solid var(--kw-rule-soft)' }}>
            <span className="muted">{when(a.at)} · {a.actor}:</span> {a.summary}
          </div>
        ))}
      </Section>

      {assigning && (
        <AssignDialog
          family={data}
          parent={assigning.parent}
          team={team}
          onClose={() => setAssigning(null)}
          onDone={(d) => {
            onChange(d);
            toast('Nutritionist changed');
          }}
        />
      )}
      <SecretDialog secret={secret} onClose={() => setSecret(null)} />
    </div>
  );
}

export default function FamilyDetailPage() {
  const { id } = useParams();
  const { data, error, reload, setData } = useApi(() => adminApi.family(id), [id]);
  const team = useApi(() => adminApi.team(), []);
  return (
    <>
      <PageHeader eyebrow={<Link to="/admin/families">← All families</Link>} title={data?.name ?? 'Family'} divider={false} />
      {error && <EmptyState title="We couldn't load this family" action={<Button onClick={reload}>Try again</Button>} />}
      {!data && !error && <SkeletonCard minHeight={400} />}
      {data && <FamilyDetailView data={data} team={team.data ?? []} onChange={setData} />}
    </>
  );
}
