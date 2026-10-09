import { Outlet } from 'react-router-dom';
import { AppShell } from '../../components/layout/index.js';
import { useOptionalAuth } from '../../context/AuthContext.jsx';

export const ADMIN_NAV = [
  { to: '/admin/overview', label: 'Overview', icon: 'home' },
  { to: '/admin/nutritionists', label: 'Nutritionists', icon: 'edit', short: 'Team' },
  { to: '/admin/families', label: 'Families', icon: 'message' },
];

export function AdminShell({ user, children }) {
  return (
    <AppShell nav={ADMIN_NAV} role="admin" home="/admin/overview" person={user && { name: user.name, sub: 'Operations · Lahore' }}>
      {children}
    </AppShell>
  );
}

export function AdminLayout() {
  const auth = useOptionalAuth();
  return (
    <AdminShell user={auth?.user}>
      <Outlet />
    </AdminShell>
  );
}
