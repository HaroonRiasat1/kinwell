import { useState } from 'react';
import { Outlet, useOutletContext } from 'react-router-dom';
import { AppShell, PageHeader } from '../../components/layout/index.js';
import { useApi } from '../../hooks/useApi.js';
import { workspaceApi } from '../../api/endpoints.js';
import { useOptionalAuth } from '../../context/AuthContext.jsx';

export function WorkspaceShell({ user, clientId, title, sub, children }) {
  const c = clientId ?? '';
  const nav = [
    { to: '/workspace/clients', label: 'Clients', icon: 'home' },
    { to: `/workspace/visit/${c}`, label: 'Start visit', icon: 'edit', short: 'Visit' },
    { to: `/workspace/builder/${c}`, label: 'Plan builder', icon: 'utensils', short: 'Plan' },
    { to: `/workspace/update/${c}`, label: 'Send update', icon: 'message', short: 'Update' },
  ];
  return (
    <AppShell nav={nav} role="nutritionist" home="/workspace/clients" person={user && { name: user.name, sub: `${user.city} · ${user.nutritionist?.areas?.length ?? 0} areas` }}>
      <PageHeader eyebrow={sub} title={title} divider={false} />
      {children}
    </AppShell>
  );
}

/** Nutritionist area. Remembers which client is "current" for visit / plan / update. */
export function WorkspaceLayout() {
  const auth = useOptionalAuth();
  const clients = useApi(() => workspaceApi.clients(), []);
  const [currentId, setCurrentId] = useState(null);
  const [header, setHeader] = useState({ title: 'Your clients', sub: '' });
  const clientId = currentId ?? clients.data?.[0]?.id;
  return (
    <WorkspaceShell user={auth?.user} clientId={clientId} title={header.title} sub={header.sub}>
      <Outlet context={{ clients, setCurrentId, setHeader }} />
    </WorkspaceShell>
  );
}

export const useWorkspace = () => useOutletContext();
