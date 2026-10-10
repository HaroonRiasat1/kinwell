import { useParams } from 'react-router-dom';
import { Avatar, Button, Card, EmptyState, Icon, Kicker, SkeletonCard, StatusTag } from '../../components/ui/index.js';
import { useApi } from '../../hooks/useApi.js';
import { parentApi, workspaceApi } from '../../api/endpoints.js';
import { MarkerCard } from '../family/DashboardPage.jsx';
import { useHeader } from './WorkspaceLayout.jsx';

/** Everything about one client in one place, with the actions a nutritionist takes. */
export function ClientView({ summary, dash, visits }) {
  const id = summary.parent.id;
  const c = summary.family.contact;
  return (
    <div className="stack" style={{ '--gap': '20px' }}>
      <div className="row">
        <Button to={`/workspace/visit/${id}`} icon="edit">Start visit</Button>
        <Button variant="glass" to={`/workspace/plan/${id}`} icon="utensils">Meal plan</Button>
        <Button variant="glass" to={`/workspace/messages/${id}`} icon="message">Message family</Button>
      </div>

      <div className="grid-auto" style={{ '--min': '320px' }}>
        <Card pad={22}>
          <Kicker>Status</Kicker>
          <StatusTag status={summary.parent.overall} size="lg" />
          <div className="strong" style={{ fontSize: 20 }}>{summary.parent.overallTitle}</div>
          <dl className="kw-dl">
            <dt>Last visit</dt>
            <dd>{summary.lastVisit ?? '—'}</dd>
            <dt>Next visit</dt>
            <dd>{summary.nextVisit ? `${summary.nextVisit} (${summary.nextIn})` : 'Not booked'}</dd>
            <dt>Meal plan</dt>
            <dd>
              {summary.plan.published ? `Week of ${summary.plan.published.weekOf}` : 'None yet'}
              {summary.plan.hasDraft && ' · draft waiting to publish'}
            </dd>
          </dl>
        </Card>
        <Card pad={22}>
          <Kicker>Family</Kicker>
          {c ? (
            <div className="row" style={{ flexWrap: 'nowrap' }}>
              <Avatar name={c.name} size={48} />
              <div style={{ lineHeight: 1.35 }}>
                <div className="strong">{c.name}</div>
                <div className="muted text-sm">{summary.family.name} · {c.city}</div>
              </div>
            </div>
          ) : (
            <p className="muted">No contact on file.</p>
          )}
          <div className="row" style={{ '--gap': '8px' }}>
            {c?.phone && (
              <a className="kw-btn kw-btn--glass kw-btn--sm" href={`tel:${c.phone}`}>
                <Icon name="phone" /> Call
              </a>
            )}
            {c?.email && (
              <a className="kw-btn kw-btn--glass kw-btn--sm" href={`mailto:${c.email}`}>
                <Icon name="message" /> Email
              </a>
            )}
          </div>
        </Card>
        <Card pad={22}>
          <Kicker>Alerts ({dash.parent.alerts.length})</Kicker>
          {dash.parent.alerts.length === 0 && <p className="muted">No alerts.</p>}
          {dash.parent.alerts.slice(0, 4).map((a) => (
            <div key={a.id ?? a.title} className={`kw-notice kw-notice--${a.status}`}>
              <div className="strong">{a.title}</div>
              <div className="text-sm">{a.text}</div>
            </div>
          ))}
        </Card>
      </div>

      {dash.markers.length > 0 && (
        <>
          <h2 style={{ fontSize: 22, fontWeight: 800 }}>Vitals &amp; lab markers</h2>
          <div className="grid-fill">
            {dash.markers.map((m) => (
              <MarkerCard key={m.id ?? m.name} marker={m} />
            ))}
          </div>
        </>
      )}

      <Card pad={22}>
        <h2 style={{ fontSize: 20, fontWeight: 800 }}>Visit history</h2>
        {visits.past.length === 0 && <p className="muted">No visits yet.</p>}
        {visits.past.map((v) => (
          <div key={v.id} className="stack" style={{ '--gap': '6px', paddingTop: 10, borderTop: '1px solid var(--kw-rule-soft)' }}>
            <div className="row row--between">
              <span className="strong">{v.short} · {v.title}</span>
            </div>
            {v.summary && <div className="text-sm">{v.summary}</div>}
            {v.meas?.length > 0 && (
              <div className="row" style={{ '--gap': '6px' }}>
                {v.meas.map((m) => (
                  <StatusTag key={m.n} status={m.status} label={`${m.n} ${m.v}`} />
                ))}
              </div>
            )}
          </div>
        ))}
      </Card>
    </div>
  );
}

export default function ClientPage() {
  const { id } = useParams();
  const summary = useApi(() => workspaceApi.client(id), [id]);
  const dash = useApi(() => parentApi.dashboard(id), [id]);
  const visits = useApi(() => parentApi.visits(id), [id]);
  const p = summary.data?.parent;
  useHeader(p ? `${p.fullName}, ${p.age}` : 'Client', p ? `${p.area} · your client` : '', null, [p?.id]);
  if (summary.error || dash.error) return <EmptyState title="We couldn't load this client" action={<Button onClick={summary.reload}>Try again</Button>} />;
  if (!summary.data || !dash.data || !visits.data) return <SkeletonCard minHeight={420} />;
  return <ClientView summary={summary.data} dash={dash.data} visits={visits.data} />;
}
