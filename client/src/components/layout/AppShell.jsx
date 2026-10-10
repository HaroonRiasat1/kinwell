import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Avatar, Icon, IconButton } from '../ui/index.js';
import { useOptionalAuth } from '../../context/AuthContext.jsx';
import { SignOutDialog } from './SignOutDialog.jsx';

export function BrandMark({ to = '/', size = 36 }) {
  return (
    <NavLink to={to} className="kw-brand">
      <span className="kw-brand__mark" aria-hidden="true" style={{ width: size, height: size }}>
        K
      </span>
      <span className="kw-brand__name">Kinwell</span>
    </NavLink>
  );
}

/**
 * Signed-in frame shared by the family, nutritionist and admin areas.
 * Desktop: glass sidebar. Mobile (<900px): sticky header + bottom tab bar.
 */
export function AppShell({ nav, tabs, role, home = '/', footerAction, person, children }) {
  const [signingOut, setSigningOut] = useState(false);
  const auth = useOptionalAuth();
  const navigate = useNavigate();
  const mobileTabs = tabs ?? nav.slice(0, 5);

  const confirmSignOut = async (everywhere) => {
    await auth?.signOut(everywhere);
    navigate('/signed-out', { replace: true });
  };

  return (
    <div className="kw-shell kw-backdrop">
      <nav aria-label="Main" className="kw-sidebar">
        <BrandMark to={home} />
        {role && <span className={`kw-brand__role kw-brand__role--${role}`}>{role.toUpperCase()}</span>}
        {nav.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} className="kw-nav__item">
            <span>{n.label}</span>
            {n.badge ? (
              <span className="kw-badge" aria-label={`${n.badge} unread`}>
                {n.badge}
              </span>
            ) : null}
          </NavLink>
        ))}
        <div style={{ flex: 1 }} />
        {footerAction}
        {person && (
          <div className="kw-sidebar__footer">
            <Avatar name={person.name} size={40} />
            <div className="grow">
              <div style={{ fontWeight: 700, fontSize: 16 }}>{person.name}</div>
              <div className="muted" style={{ fontSize: 15 }}>
                {person.sub}
              </div>
            </div>
            <IconButton icon="signOut" label="Sign out" size={18} onClick={() => setSigningOut(true)} />
          </div>
        )}
      </nav>

      <div className="kw-main-col">
        <header className="kw-topbar">
          <div className="row" style={{ '--gap': '8px' }}>
            <span className="kw-brand__mark" aria-hidden="true" style={{ width: 32, height: 32, borderRadius: 9, fontSize: 18 }}>
              K
            </span>
            <span style={{ fontWeight: 800, fontSize: 20 }}>Kinwell</span>
          </div>
          <div className="row" style={{ '--gap': '8px' }}>
            <IconButton icon="signOut" label="Sign out" onClick={() => setSigningOut(true)} />
            <IconButton icon="bell" label="Notifications" />
          </div>
        </header>

        <main className="kw-main">{children}</main>

        <nav aria-label="Sections" className="kw-tabbar" style={{ '--n': mobileTabs.length }}>
          {mobileTabs.map((t) => (
            <NavLink key={t.to} to={t.to} end={t.end}>
              {t.icon && <Icon name={t.icon} size={22} />}
              {t.short ?? t.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <SignOutDialog open={signingOut} onCancel={() => setSigningOut(false)} onConfirm={confirmSignOut} />
    </div>
  );
}
