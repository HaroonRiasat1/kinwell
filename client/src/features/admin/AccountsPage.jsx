import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/layout/index.js';
import { Button, Card, ConfirmDialog, EmptyState, SkeletonCard, StatusTag, useToast } from '../../components/ui/index.js';
import { useApi } from '../../hooks/useApi.js';
import { adminApi } from '../../api/endpoints.js';
import { FilterSelect, Pager, SearchBox, SecretDialog } from './kit.jsx';

const ROLE = { family: 'Family', parent: 'Parent', nutritionist: 'Nutritionist', admin: 'Admin' };
const COLS = 'minmax(0,1.4fr) minmax(0,0.8fr) minmax(0,1.3fr) minmax(0,0.9fr) minmax(0,1.8fr)';

/** Everyone who can sign in, with the support actions an admin needs. */
export function AccountsView({ data, filters, setFilter, onAction }) {
  return (
    <div className="stack" style={{ '--gap': '16px' }}>
      <div className="row">
        <SearchBox label="Search accounts" placeholder="Name, email or phone" value={filters.q} onChange={(q) => setFilter({ q, page: 1 })} />
        <FilterSelect label="Role" value={filters.role} onChange={(role) => setFilter({ role, page: 1 })} options={[['', 'Everyone'], ['family', 'Family'], ['parent', 'Parents'], ['nutritionist', 'Nutritionists'], ['admin', 'Admins']]} />
      </div>
      <Card variant="flush">
        <div className="kw-table-scroll" style={{ '--min': '900px' }}>
          <div role="table" aria-label="Accounts" style={{ '--cols': COLS }}>
            <div role="row" className="kw-table__head">
              {['Person', 'Role', 'Family', 'Status', 'Actions'].map((h) => (
                <span key={h} role="columnheader">{h}</span>
              ))}
            </div>
            {data.items.map((a) => (
              <div key={a.id} role="row" className="kw-table__row" style={{ fontSize: 15 }}>
                <span role="cell">
                  <span className="strong" style={{ display: 'block' }}>{a.name}</span>
                  <span className="muted kw-ltr">{a.email ?? a.phone}</span>
                </span>
                <span role="cell">{ROLE[a.role]}</span>
                <span role="cell">{a.familyId ? <Link to={`/admin/families/${a.familyId}`}>{a.family}</Link> : '—'}</span>
                <span role="cell">
                  {!a.active ? <StatusTag status="attention" label="Turned off" /> : a.locked ? <StatusTag status="watch" label="Locked" /> : <StatusTag status="normal" label="Active" />}
                </span>
                <span role="cell" className="row" style={{ '--gap': '6px' }}>
                  {a.role === 'parent' ? (
                    <Button variant="glass" size="sm" onClick={() => onAction('code', a)}>{a.locked ? 'Unlock & code' : 'Sign-in code'}</Button>
                  ) : (
                    <Button variant="glass" size="sm" onClick={() => onAction('reset', a)}>Reset password</Button>
                  )}
                  <Button variant="glass" size="sm" onClick={() => onAction('signout', a)}>Sign out</Button>
                  <Button variant="glass" size="sm" onClick={() => onAction('active', a)}>{a.active ? 'Turn off' : 'Turn on'}</Button>
                </span>
              </div>
            ))}
          </div>
        </div>
        {data.items.length === 0 && <p className="muted" style={{ padding: 20 }}>No accounts match.</p>}
        <Pager page={data.page} pages={data.pages} total={data.total} noun="accounts" onPage={(page) => setFilter({ page })} />
      </Card>
    </div>
  );
}

export default function AccountsPage() {
  const [filters, setFilters] = useState({ q: '', role: '', page: 1 });
  const setFilter = (patch) => setFilters((f) => ({ ...f, ...patch }));
  const { data, error, reload, setData } = useApi(() => adminApi.accounts(filters), [filters.q, filters.role, filters.page]);
  const [confirm, setConfirm] = useState(null); // { kind, account }
  const [secret, setSecret] = useState(null);
  const toast = useToast();
  const replace = (acc) => setData((d) => ({ ...d, items: d.items.map((x) => (x.id === acc.id ? { ...x, ...acc } : x)) }));

  const run = {
    code: async (a) => {
      const r = await adminApi.parentCode(a.id);
      replace({ id: a.id, locked: false });
      setSecret({ title: `Sign-in code for ${a.name}`, value: r.code, hint: `For ${r.phone}. Works once, for 30 minutes.` });
    },
    reset: async (a) => {
      const r = await adminApi.resetPassword(a.id);
      setSecret({ title: `Temporary password for ${a.name}`, value: r.tempPassword, hint: "Give it to them privately. They've been signed out everywhere." });
    },
    signout: async (a) => {
      await adminApi.signOutEverywhere(a.id);
      toast(`${a.name} was signed out on all devices`);
    },
    active: async (a) => {
      const r = await adminApi.setActive(a.id, !a.active);
      replace({ id: a.id, active: r.active });
      toast(r.active ? `${a.name} can sign in again` : `${a.name}'s account is turned off`);
    },
  };
  const TEXT = {
    code: ['Make a sign-in code?', 'Make code', 'This also clears a lockout after too many wrong tries.'],
    reset: ['Reset this password?', 'Reset password', "They'll be signed out everywhere and need the temporary password you give them."],
    signout: ['Sign out everywhere?', 'Sign out', "Use this if a device is lost. Their password doesn't change."],
    active: [null, null, null],
  };
  const c = confirm && TEXT[confirm.kind];
  const activeTitle = confirm?.account.active ? `Turn off ${confirm.account.name}'s account?` : `Turn ${confirm?.account.name}'s account back on?`;

  return (
    <>
      <PageHeader eyebrow="Everyone who can sign in" title="Accounts" divider={false} />
      {error && <EmptyState title="We couldn't load accounts" action={<Button onClick={reload}>Try again</Button>} />}
      {!data && !error && <SkeletonCard />}
      {data && <AccountsView data={data} filters={filters} setFilter={setFilter} onAction={(kind, account) => setConfirm({ kind, account })} />}
      {confirm && (
        <ConfirmDialog
          open
          title={confirm.kind === 'active' ? activeTitle : `${c[0].replace('?', '')} for ${confirm.account.name}?`}
          confirmLabel={confirm.kind === 'active' ? (confirm.account.active ? 'Turn off' : 'Turn on') : c[1]}
          tone={confirm.kind === 'active' && confirm.account.active ? 'danger' : 'primary'}
          onClose={() => setConfirm(null)}
          onConfirm={() => run[confirm.kind](confirm.account)}
        >
          {confirm.kind === 'active' ? (confirm.account.active ? 'They will be signed out now and unable to sign in.' : 'They will be able to sign in again.') : c[2]}
        </ConfirmDialog>
      )}
      <SecretDialog secret={secret} onClose={() => setSecret(null)} />
    </>
  );
}
