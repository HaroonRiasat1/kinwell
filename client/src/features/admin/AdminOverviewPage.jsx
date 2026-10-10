import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/layout/index.js';
import { Button, Card, EmptyState, Icon, Segmented, SkeletonCard, StatusTag } from '../../components/ui/index.js';
import { useApi } from '../../hooks/useApi.js';
import { adminApi } from '../../api/endpoints.js';
import { longDate } from '../../lib/dates.js';
import { STATUS } from '../../lib/status.js';
import { FlagList } from './FlagActions.jsx';

const CAPACITY_LABEL = { attention: 'Full', watch: 'Nearly full', normal: 'Has space' };

function Stat({ s, value, note }) {
  const card = (
    <Card pad={20} gap={4} style={{ height: '100%' }}>
      <div className="text-sm muted strong">{s.label}</div>
      <div style={{ fontSize: 36, fontWeight: 800, lineHeight: 1.1, color: s.status === 'attention' ? 'var(--kw-attention)' : s.status === 'watch' ? 'var(--kw-watch)' : undefined }}>
        {value ?? s.value}
      </div>
      <div className="muted" style={{ fontSize: 15 }}>
        {note ?? s.note}
      </div>
    </Card>
  );
  return s.to ? (
    <Link to={s.to} className="kw-stat-link">
      {card}
    </Link>
  ) : (
    card
  );
}

function WeekChart({ bars }) {
  const max = Math.max(10, ...bars.map((b) => b.booked));
  return (
    <>
      <div className="kw-bars" style={{ '--n': bars.length }} role="img" aria-label={bars.map((b) => `${b.day}: ${b.done} done, ${b.overdue} not logged, ${b.booked} booked`).join('; ')}>
        {bars.map((b) => (
          <div key={b.day} className="kw-bar" style={{ color: b.isToday ? 'var(--kw-teal-800)' : undefined }}>
            <span>
              {b.done}/{b.booked}
            </span>
            <div className="kw-bar__track" style={{ height: `${Math.max(4, (b.booked / max) * 100)}%`, display: 'flex', flexDirection: 'column-reverse', overflow: 'hidden' }}>
              <div style={{ height: `${b.booked ? (b.done / b.booked) * 100 : 0}%`, background: 'var(--kw-teal-700)' }} />
              <div style={{ height: `${b.booked ? (b.overdue / b.booked) * 100 : 0}%`, background: 'var(--kw-coral)' }} />
            </div>
            <span>{b.day}</span>
          </div>
        ))}
      </div>
      <div className="kw-legend">
        {[
          ['var(--kw-teal-700)', 'Done'],
          ['var(--kw-coral)', 'Not logged'],
          ['rgba(31,42,40,0.08)', 'Still to come'],
        ].map(([c, l]) => (
          <span key={l}>
            <span style={{ width: 14, height: 14, borderRadius: 4, background: c }} />
            {l}
          </span>
        ))}
      </div>
    </>
  );
}

/** Pure view. `flags`/`setFlags` hold every flag loaded (open and, once viewed, resolved). */
export function AdminOverviewView({ data, flags, setFlags, tab, onTab }) {
  const open = flags.filter((f) => !f.resolved);
  const visible = tab === 'open' ? open : flags.filter((f) => f.resolved);
  const urgent = open.filter((f) => f.status === 'attention').length;
  return (
    <div className="stack" style={{ '--gap': '20px' }}>
      <div className="grid-auto" style={{ '--min': '190px', '--gap': '14px' }}>
        {data.stats.map((s) =>
          s.key === 'flags' ? (
            <Stat key={s.key} s={{ ...s, status: urgent ? 'attention' : 'normal' }} value={String(open.length)} note={`${urgent} ${urgent === 1 ? 'needs' : 'need'} action today`} />
          ) : (
            <Stat key={s.key} s={s} />
          ),
        )}
      </div>

      <Card pad={22}>
        <div className="row row--between">
          <div className="row" style={{ '--gap': '10px' }}>
            <h2 style={{ fontSize: 22, fontWeight: 800 }}>Needs review</h2>
            <span className="kw-count">{open.length}</span>
          </div>
          <Segmented label="Show" value={tab} onChange={onTab} items={[{ value: 'open', label: 'Open' }, { value: 'resolved', label: 'Resolved' }]} />
        </div>
        <FlagList flags={visible} setFlags={setFlags} emptyText={tab === 'open' ? 'All caught up. Nothing needs review right now.' : 'Nothing resolved yet.'} />
      </Card>

      <div className="grid-auto" style={{ '--min': '260px', '--gap': '14px' }}>
        {[
          ['/admin/queues/lab-uploads', 'file', 'Unreadable lab reports', data.queues.labUploads],
          ['/admin/queues/access-requests', 'message', 'Requests to join a family', data.queues.accessRequests],
        ].map(([to, icon, label, n]) => (
          <Link key={to} to={to} className="kw-stat-link">
            <Card pad={18} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <span className="kw-icon-tile" style={{ '--size': '44px' }}>
                <Icon name={icon} />
              </span>
              <span className="grow strong">{label}</span>
              <span className="kw-count" style={{ background: n ? 'var(--kw-coral)' : 'rgba(31,42,40,0.3)', color: n ? 'var(--kw-ink)' : '#fff' }}>
                {n}
              </span>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid-auto" style={{ '--min': '420px' }}>
        <Card pad={22}>
          <h2 style={{ fontSize: 22, fontWeight: 800 }}>Home visits this week</h2>
          <WeekChart bars={data.weekBars} />
        </Card>
        <Card pad={22} gap={14}>
          <div className="row row--between">
            <h2 style={{ fontSize: 22, fontWeight: 800 }}>Capacity by area</h2>
            <Button variant="link" to="/admin/settings">
              Edit areas
            </Button>
          </div>
          {data.coverage.map((c) => (
            <div key={c.area} className="stack" style={{ '--gap': '6px' }}>
              <div className="row row--between">
                <span className="strong">{c.area}</span>
                <span className="row" style={{ '--gap': '8px' }}>
                  <span className="muted" style={{ fontSize: 15 }}>
                    {c.clients}/{c.capacity} clients
                  </span>
                  <StatusTag status={c.status} label={CAPACITY_LABEL[c.status]} />
                </span>
              </div>
              <div className="kw-meter">
                <span style={{ width: `${Math.min(100, c.pct)}%`, background: STATUS[c.status].fg }} />
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

export default function AdminOverviewPage() {
  const { data, error, reload } = useApi(() => adminApi.overview(), []);
  const [flags, setFlags] = useState([]);
  const [tab, setTab] = useState('open');
  const [loadedResolved, setLoadedResolved] = useState(false);
  useEffect(() => {
    if (data) setFlags(data.queue);
  }, [data]);
  const onTab = async (t) => {
    setTab(t);
    if (t === 'resolved' && !loadedResolved) {
      const resolved = await adminApi.flags('resolved');
      setFlags((list) => [...list.filter((f) => !f.resolved), ...resolved.filter((r) => !list.some((f) => f.id === r.id))]);
      setLoadedResolved(true);
    }
  };
  return (
    <>
      <PageHeader eyebrow={`${longDate()} · All of Lahore`} title="Operations overview" divider={false}>
        <Button variant="glass" icon="print" onClick={() => window.print()}>
          Print this page
        </Button>
      </PageHeader>
      {error && <EmptyState title="We couldn't load the overview" action={<Button onClick={reload}>Try again</Button>} />}
      {!data && !error && <SkeletonCard minHeight={420} />}
      {data && <AdminOverviewView data={data} flags={flags} setFlags={setFlags} tab={tab} onTab={onTab} />}
    </>
  );
}
