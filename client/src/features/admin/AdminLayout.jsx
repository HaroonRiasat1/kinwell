import { Outlet } from 'react-router-dom';
import { AppShell } from '../../components/layout/index.js';
import { useOptionalAuth } from '../../context/AuthContext.jsx';

export const ADMIN_NAV = [
  { to: '/admin/overview', label: 'Overview', icon: 'home', short: 'Home' },
  { to: '/admin/families', label: 'Families', icon: 'message' },
  { to: '/admin/nutritionists', label: 'Nutritionists', icon: 'edit', short: 'Team' },
  { to: '/admin/accounts', label: 'Accounts', icon: 'lock', short: 'People' },
  { to: '/admin/activity', label: 'Activity', icon: 'file', short: 'Log' },
  { to: '/admin/settings', label: 'Settings', icon: 'calendar' },
];

export function AdminShell({ user, children }) {
  return (
    <AppShell nav={ADMIN_NAV} tabs={ADMIN_NAV} role="admin" home="/admin/overview" person={user && { name: user.name, sub: 'Operations · Lahore' }}>
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
