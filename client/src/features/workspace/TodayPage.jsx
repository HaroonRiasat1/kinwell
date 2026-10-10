import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, ConfirmDialog, EmptyState, Icon, SkeletonCard, StatusTag, useToast } from '../../components/ui/index.js';
import { useApi } from '../../hooks/useApi.js';
import { workspaceApi } from '../../api/endpoints.js';
import { Notices } from './Notices.jsx';
import { useHeader, useWorkspace } from './WorkspaceLayout.jsx';

const STATE = {
  done: ['normal', 'Done'],
  now: ['attention', 'Now'],
  upcoming: ['watch', 'Booked'],
  not_logged: ['attention', 'No notes yet'],
  requested: ['watch', 'Family asked to move'],
};

function VisitRow({ v, showDay }) {
  const [tone, label] = STATE[v.state];
  return (
    <div className="row" style={{ paddingTop: 12, borderTop: '1px solid var(--kw-rule-soft)', flexWrap: 'wrap' }}>
      <div style={{ minWidth: 92 }}>
        <div className="strong">{v.time}</div>
        {showDay && <div className="muted text-sm">{v.day}</div>}
      </div>
      <div className="grow" style={{ minWidth: 180 }}>
        <Link to={`/workspace/clients/${v.parent.id}`} className="strong" style={{ color: 'var(--kw-ink)' }}>
          {v.parent.name}
        </Link>
        <div className="muted text-sm">{v.parent.area}</div>
      </div>
      <span className="row" style={{ '--gap': '6px' }}>
        {v.clash && <StatusTag status="attention" label="Clash" />}
        <StatusTag status={tone} label={label} />
      </span>
      {(v.state === 'now' || v.state === 'upcoming' || v.state === 'not_logged') && (
        <Button size="sm" to={`/workspace/visit/${v.parent.id}`}>
          {v.state === 'not_logged' ? 'Add notes' : 'Start visit'}
        </Button>
      )}
    </div>
  );
}

/** The nutritionist's day: today's visits, anything overdue, requests, and the week ahead. */
export function TodayView({ data, inbox, onDecide }) {
  return (
    <div className="stack" style={{ '--gap': '20px' }}>
      {data.clashes > 0 && (
        <Card role="alert" pad={18} variant="danger" style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Icon name="alert" />
          <span className="grow strong">
            {data.clashes} visits are booked less than an hour apart. Move one of them so you're not double-booked.
          </span>
        </Card>
      )}
      <div className="grid-auto" style={{ '--min': '380px' }}>
        <Card pad={22}>
          <h2 style={{ fontSize: 22, fontWeight: 800 }}>Today's visits</h2>
          {data.today.length === 0 && <p className="muted">No visits today.</p>}
          {data.today.map((v) => (
            <VisitRow key={v.id} v={v} />
          ))}
        </Card>
        <div className="stack" style={{ '--gap': '20px' }}>
          {data.notLogged.length > 0 && (
            <Card pad={22}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--kw-attention)' }}>Visits with no notes</h2>
              <p className="muted text-sm">Families are waiting to hear how these went.</p>
              {data.notLogged.map((v) => (
                <VisitRow key={v.id} v={v} showDay />
              ))}
            </Card>
          )}
          <Card pad={22}>
            <h2 style={{ fontSize: 20, fontWeight: 800 }}>Requests to move a visit</h2>
            {data.requests.length === 0 && <p className="muted">No requests.</p>}
            {data.requests.map((r) => (
              <div key={r.visitId} className="kw-notice kw-notice--watch">
                <div className="strong">{r.parent.name}</div>
                <div className="text-sm">
                  From <strong>{r.from}</strong> to <strong>{r.to}</strong>
                </div>
                <div className="row" style={{ '--gap': '8px' }}>
                  <Button size="sm" onClick={() => onDecide(r, 'accept')}>
                    Accept
                  </Button>
                  <Button size="sm" variant="glass" onClick={() => onDecide(r, 'decline')}>
                    Keep the original time
                  </Button>
                </div>
              </div>
            ))}
          </Card>
          <Card pad={22}>
            <div className="row row--between">
              <h2 style={{ fontSize: 20, fontWeight: 800 }}>Messages</h2>
              <Button variant="link" to="/workspace/messages">
                Open inbox
              </Button>
            </div>
            {!inbox?.threads.some((t) => t.needsReply) && <p className="muted">Nobody is waiting for a reply.</p>}
            {inbox?.threads
              .filter((t) => t.needsReply)
              .slice(0, 3)
              .map((t) => (
                <Link key={t.parentId} to={`/workspace/messages/${t.parentId}`} className="kw-notice kw-notice--normal" style={{ textDecoration: 'none', color: 'var(--kw-ink)' }}>
                  <span className="strong">
                    {t.from} about {t.name}
                  </span>
                  <span className="text-sm">{t.last}</span>
                </Link>
              ))}
          </Card>
        </div>
      </div>
      <Card pad={22}>
        <h2 style={{ fontSize: 20, fontWeight: 800 }}>Next 7 days</h2>
        {data.week.length === 0 && <p className="muted">Nothing booked.</p>}
        {data.week.map((v) => (
          <VisitRow key={v.id} v={v} showDay />
        ))}
      </Card>
    </div>
  );
}

export default function TodayPage() {
  const { data, error, reload, setData } = useApi(() => workspaceApi.today(), []);
  const { inbox } = useWorkspace();
  const [deciding, setDeciding] = useState(null);
  const toast = useToast();
  useHeader('Today', data?.date ?? '', null, [data?.date]);
  if (error) return <EmptyState title="We couldn't load your day" action={<Button onClick={reload}>Try again</Button>} />;
  if (!data) return <SkeletonCard minHeight={420} />;
  return (
    <>
      <Notices />
      <TodayView data={data} inbox={inbox.data} onDecide={(r, decision) => setDeciding({ r, decision })} />
      {deciding && (
        <ConfirmDialog
          open
          title={deciding.decision === 'accept' ? `Move ${deciding.r.parent.name}'s visit?` : 'Keep the original time?'}
          confirmLabel={deciding.decision === 'accept' ? 'Move the visit' : 'Keep it'}
          onClose={() => setDeciding(null)}
          onConfirm={async () => {
            setData(await workspaceApi.decideReschedule(deciding.r.visitId, deciding.decision));
            toast('The family has been told');
          }}
        >
          {deciding.decision === 'accept' ? `New time: ${deciding.r.to}. The family gets a message.` : `It stays at ${deciding.r.from}. The family gets a message asking them to suggest another time if needed.`}
        </ConfirmDialog>
      )}
    </>
  );
}
