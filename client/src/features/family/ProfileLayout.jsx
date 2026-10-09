import { Outlet, useOutletContext } from 'react-router-dom';
import { Avatar, Card, Segmented, StatusTag } from '../../components/ui/index.js';
import { useApi } from '../../hooks/useApi.js';
import { parentApi } from '../../api/endpoints.js';
import { useFamilyParent } from './FamilyLayout.jsx';

export function ProfileHeader({ parent, profile }) {
  const base = `/family/${parent.id}`;
  const tabs = [
    ['profile', 'Overview'],
    ['labs', 'Lab tests'],
    ['nutrition', 'Nutrition plan'],
    ['supplements', 'Supplements'],
    ['visits', 'Visits'],
    ['documents', 'Documents'],
  ].map(([s, label]) => ({ to: `${base}/${s}`, label }));
  const p = profile?.parent;
  return (
    <Card pad={20} gap={18}>
      <div className="row" style={{ '--gap': '18px' }}>
        <Avatar name={parent.short} size={84} tone="sage" />
        <div className="grow stack" style={{ '--gap': '6px', minWidth: 220 }}>
          <div style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.15 }}>{parent.fullName}</div>
          {p && (
            <div className="text-sm muted">
              {[p.born && `Born ${p.born}`, p.languages && `Speaks ${p.languages}`, p.lives].filter(Boolean).join(' · ')}
            </div>
          )}
          <div className="row" style={{ '--gap': '6px' }}>
            {p?.conditions.map((c) => (
              <span key={c.name} className="kw-pill">
                {c.name}
              </span>
            ))}
          </div>
        </div>
        <StatusTag status={parent.overall} />
      </div>
      <Segmented label="Profile sections" items={tabs} />
    </Card>
  );
}

/** Wraps the profile sections with the parent's header card and tab bar. */
export function ProfileLayout() {
  const ctx = useFamilyParent();
  const profile = useApi(() => parentApi.profile(ctx.parent.id), [ctx.parent.id]);
  return (
    <>
      <ProfileHeader parent={ctx.parent} profile={profile.data} />
      <Outlet context={{ ...ctx, profile }} />
    </>
  );
}

export const useProfile = () => useOutletContext();
