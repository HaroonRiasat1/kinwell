import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import { AppShell, PageHeader } from '../../components/layout/index.js';
import { useApi } from '../../hooks/useApi.js';
import { workspaceApi } from '../../api/endpoints.js';
import { useOptionalAuth } from '../../context/AuthContext.jsx';

export function WorkspaceShell({ user, unread = 0, title, sub, actions, children }) {
  const nav = [
    { to: '/workspace/today', label: 'Today', icon: 'calendar' },
    { to: '/workspace/clients', label: 'Clients', icon: 'home' },
    { to: '/workspace/messages', label: 'Messages', icon: 'message', badge: unread },
  ];
  return (
    <AppShell nav={nav} tabs={nav} role="nutritionist" home="/workspace/today" person={user && { name: user.name, sub: `${user.city} · ${user.nutritionist?.areas?.length ?? 0} areas` }}>
      <PageHeader eyebrow={sub} title={title} divider={false}>
        {actions}
      </PageHeader>
      {children}
    </AppShell>
  );
}

/** Nutritionist area. Pages set the header; the inbox count shows on the Messages tab. */
export function WorkspaceLayout() {
  const auth = useOptionalAuth();
  const { pathname } = useLocation();
  const clients = useApi(() => workspaceApi.clients(), []);
  const inbox = useApi(() => workspaceApi.inbox(), [pathname]);
  const [header, setHeader] = useState({ title: '', sub: '' });
  return (
    <WorkspaceShell user={auth?.user} unread={inbox.data?.needsReply ?? 0} title={header.title} sub={header.sub} actions={header.actions}>
      <Outlet context={{ clients, setHeader, inbox }} />
    </WorkspaceShell>
  );
}

export const useWorkspace = () => useOutletContext();

/** Lets a page work on any client; switching keeps you on the same kind of page. */
export function ClientPicker({ clients, value, base }) {
  const navigate = useNavigate();
  if (!clients?.length) return null;
  return (
    <label className="row" style={{ '--gap': '8px', fontSize: 15, fontWeight: 700 }}>
      <span className="muted">Client</span>
      <select className="kw-input" style={{ minHeight: 44, width: 'auto', maxWidth: 320, fontSize: 15 }} value={value} onChange={(e) => navigate(`${base}/${e.target.value}`)}>
        {clients.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Sets the page header from a page component. */
export function useHeader(title, sub, actions, deps = []) {
  const { setHeader } = useWorkspace();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setHeader({ title, sub, actions }), deps);
}
