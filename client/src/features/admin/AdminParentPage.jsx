import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../../components/layout/index.js';
import { Button, Card, EmptyState, Icon, Kicker, SkeletonCard, StatusTag } from '../../components/ui/index.js';
import { useApi } from '../../hooks/useApi.js';
import { parentApi } from '../../api/endpoints.js';
import { MarkerCard } from '../family/DashboardPage.jsx';
import { Section } from './kit.jsx';

/** Read-only view of a parent's record for admins (no ticking, no messaging as the family). */
export function AdminParentView({ dash, visits }) {
  const p = dash.parent;
  return (
    <div className="stack" style={{ '--gap': '20px' }}>
      <div className="grid-auto" style={{ '--min': '320px' }}>
        <Card pad={22}>
          <Kicker>Health at a glance</Kicker>
          <StatusTag status={p.overall} size="lg" />
          <h2 style={{ fontSize: 24, fontWeight: 800 }}>{p.overallTitle}</h2>
          {p.overallText && <p style={{ color: 'var(--kw-ink-2)' }}>{p.overallText}</p>}
          <dl className="kw-dl">
            <dt>Nutritionist</dt>
            <dd>{dash.nutritionist?.name ?? 'Not assigned'}</dd>
            <dt>Last visit</dt>
            <dd>{p.lastVisit ?? '—'}</dd>
            <dt>Next visit</dt>
            <dd>{p.nextVisit ?? 'Not booked'}</dd>
          </dl>
        </Card>
        <Section title={`Alerts (${p.alerts.length})`}>
          {p.alerts.length === 0 && <p className="muted">No alerts.</p>}
          {p.alerts.map((a) => (
            <div key={a.id ?? a.title} className={`kw-notice kw-notice--${a.status}`}>
              <StatusTag status={a.status} label={a.type} />
              <div className="strong">{a.title}</div>
              <div className="text-sm">{a.text}</div>
            </div>
          ))}
        </Section>
        <Section title="Today's plan">
          {dash.checklist.length === 0 && <p className="muted">No plan for today.</p>}
          {dash.checklist.map((i) => (
            <div key={i.code} className="row row--between" style={{ paddingTop: 8, borderTop: '1px solid var(--kw-rule-soft)' }}>
              <span>
                <span className="strong">{i.title}</span> <span className="muted text-sm">· {i.time}</span>
              </span>
              <span style={{ fontWeight: 700, fontSize: 14, color: i.done ? 'var(--kw-normal)' : 'var(--kw-muted)' }}>
                {i.done ? <Icon name="check" size={16} /> : null} {i.done ? 'Done' : 'Not yet'}
              </span>
            </div>
          ))}
        </Section>
      </div>
      {dash.markers.length > 0 && (
        <>
          <h2 style={{ fontSize: 22, fontWeight: 800 }}>Lab markers</h2>
          <div className="grid-fill">
            {dash.markers.map((m) => (
              <MarkerCard key={m.id ?? m.name} marker={m} />
            ))}
          </div>
        </>
      )}
      <Section title="Visits">
        {visits.next && (
          <div className="kw-notice kw-notice--normal">
            <strong>Next: {visits.next.date}, {visits.next.time}</strong>
            {visits.next.status === 'reschedule_requested' && <span>Family asked to move it to {visits.next.requestedSlot?.day}, {visits.next.requestedSlot?.time}</span>}
          </div>
        )}
        {visits.past.length === 0 && <p className="muted">No completed visits yet.</p>}
        {visits.past.slice(0, 6).map((v) => (
          <div key={v.id} style={{ paddingTop: 8, borderTop: '1px solid var(--kw-rule-soft)' }}>
            <span className="strong">{v.short ?? v.date}</span> · {v.title}
            {v.summary && <div className="muted text-sm">{v.summary}</div>}
          </div>
        ))}
      </Section>
    </div>
  );
}

export default function AdminParentPage() {
  const { id } = useParams();
  const dash = useApi(() => parentApi.dashboard(id), [id]);
  const visits = useApi(() => parentApi.visits(id), [id]);
  const p = dash.data?.parent;
  return (
    <>
      <PageHeader
        eyebrow={p ? <Link to={`/admin/families/${p.familyId}`}>← Back to the family</Link> : <Link to="/admin/families">← Families</Link>}
        title={p ? `${p.fullName}, ${p.age}` : 'Parent record'}
        divider={false}
      />
      {(dash.error || visits.error) && <EmptyState title="We couldn't load this record" action={<Button onClick={dash.reload}>Try again</Button>} />}
      {(!dash.data || !visits.data) && !dash.error && <SkeletonCard minHeight={400} />}
      {dash.data && visits.data && <AdminParentView dash={dash.data} visits={visits.data} />}
    </>
  );
}
