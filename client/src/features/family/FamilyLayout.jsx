import { useState } from 'react';
import { Link, Navigate, Outlet, useLocation, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { AppShell, PageHeader, ParentSwitcher } from '../../components/layout/index.js';
import { ErrorState, Skeleton } from '../../components/ui/index.js';
import { useApi } from '../../hooks/useApi.js';
import { parentApi } from '../../api/endpoints.js';
import { useOptionalAuth } from '../../context/AuthContext.jsx';
import { todayGreeting } from '../../lib/dates.js';
import { ParentSignInDialog } from './ParentSignInHelp.jsx';

const SECTIONS = [
  ['dashboard', 'Dashboard', 'home', 'Home'],
  ['profile', 'Profile'],
  ['labs', 'Lab tests', 'flask', 'Labs'],
  ['nutrition', 'Nutrition plan', 'utensils', 'Plan'],
  ['supplements', 'Supplements', 'pill', 'Vitamins'],
  ['visits', 'Visits'],
  ['messages', 'Messages', 'message', 'Chat'],
];

const titleFor = (section, p) =>
  ({
    dashboard: `How ${p.short} is doing`,
    profile: `${p.short}'s profile`,
    labs: 'Lab tests & trends',
    nutrition: 'Nutrition plan',
    supplements: 'Supplements',
    visits: 'Home visits',
    documents: 'Documents',
    messages: 'Messages',
  })[section] ?? '';

/** Shell for everything a family member sees, scoped to one parent at a time. */
export function FamilyShell({ parents, parent, section, user, onSelectParent, children }) {
  const [helpOpen, setHelpOpen] = useState(false);
  const base = `/family/${parent.id}`;
  const nav = SECTIONS.map(([s, label, icon, short]) => ({ to: `${base}/${s}`, label, icon, short, badge: s === 'messages' ? 2 : 0 }));
  const tabs = nav.filter((n) => n.icon);
  const sub =
    section === 'dashboard'
      ? `${todayGreeting()}, ${user?.name?.split(' ')[0] ?? ''}`
      : `${parent.fullName} · ${parent.age} · ${parent.city}`;
  return (
    <AppShell
      nav={nav}
      tabs={tabs}
      home={`${base}/dashboard`}
      person={user && { name: user.name, sub: user.city }}
      footerAction={
        <>
          <Link className="kw-sidebar__cta" to={`${base}/simple`}>
            Open {parent.short}'s simple view
          </Link>
          <button type="button" className="kw-sidebar__cta" style={{ marginTop: 6, cursor: 'pointer', textAlign: 'left' }} onClick={() => setHelpOpen(true)}>
            Help {parent.short} sign in
          </button>
        </>
      }
    >
      <PageHeader eyebrow={sub} title={titleFor(section, parent)}>
        <ParentSwitcher parents={parents} activeId={parent.id} onSelect={onSelectParent} />
      </PageHeader>
      {children}
      <ParentSignInDialog open={helpOpen} parent={parent} onClose={() => setHelpOpen(false)} />
    </AppShell>
  );
}

export function FamilyLayout() {
  const { parentId } = useParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const auth = useOptionalAuth();
  const { data: parents, error, loading, reload } = useApi(() => parentApi.list(), []);

  if (loading && !parents) {
    return (
      <div className="kw-backdrop" style={{ padding: 40 }}>
        <Skeleton width={240} height={40} block />
      </div>
    );
  }
  if (error) {
    return (
      <div className="kw-backdrop" style={{ padding: 40 }}>
        <ErrorState title="We couldn't load your family" onRetry={reload}>
          This is on our side, not yours. Your parents' records are safe.
        </ErrorState>
      </div>
    );
  }
  if (!parents.length) return <Navigate to="/onboarding" replace />;

  const parent = parents.find((p) => p.id === parentId);
  if (!parent) return <Navigate to={`/family/${parents[0].id}/dashboard`} replace />;

  const section = pathname.split('/')[3] ?? 'dashboard';
  const onSelectParent = (p) => navigate(pathname.replace(parent.id, p.id));

  return (
    <FamilyShell parents={parents} parent={parent} section={section} user={auth?.user} onSelectParent={onSelectParent}>
      <Outlet context={{ parent, parents }} />
    </FamilyShell>
  );
}

/** The parent currently selected in the family area. */
export const useFamilyParent = () => useOutletContext();
