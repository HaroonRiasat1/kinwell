import { PageHeader } from '../../components/layout/index.js';
import { Button, Card, EmptyState, SkeletonCard, StatusTag } from '../../components/ui/index.js';
import { useApi } from '../../hooks/useApi.js';
import { adminApi } from '../../api/endpoints.js';
import { longDate } from '../../lib/dates.js';
import { STATUS } from '../../lib/status.js';

const CAPACITY_LABEL = { attention: 'Full', watch: 'Nearly full', normal: 'Has space' };

export function AdminOverviewView({ data, onResolve }) {
  const max = Math.max(50, ...data.weekBars.map((b) => b.booked));
  return (
    <div className="stack" style={{ '--gap': '20px' }}>
      <div className="grid-auto" style={{ '--min': '200px', '--gap': '14px' }}>
        {data.stats.map((s) => (
          <Card key={s.label} pad={20} gap={4}>
            <div className="text-sm muted strong">{s.label}</div>
            <div style={{ fontSize: 36, fontWeight: 800, lineHeight: 1.1 }}>{s.value}</div>
            <div className="muted" style={{ fontSize: 15 }}>
              {s.note}
            </div>
          </Card>
        ))}
      </div>

      <Card pad={22}>
        <div className="row" style={{ '--gap': '10px' }}>
          <h2 style={{ fontSize: 22, fontWeight: 800 }}>Needs review</h2>
          <span className="kw-count">{data.queue.length}</span>
        </div>
        {data.queue.length === 0 && <p className="muted">All caught up. Nothing needs review right now.</p>}
        <ul className="stack" style={{ '--gap': '12px' }}>
          {data.queue.map((q) => (
            <li key={q.id} className={`kw-notice kw-notice--${q.status}`} style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 14 }}>
              <div className="grow stack" style={{ '--gap': '4px', minWidth: 240 }}>
                <StatusTag status={q.status} label={`${STATUS[q.status].label === 'Normal' ? 'Info' : STATUS[q.status].label} · ${q.type}`} />
                <div className="strong">{q.title}</div>
                <div className="muted" style={{ fontSize: 15 }}>
                  {q.meta}
                </div>
              </div>
              <div className="row" style={{ '--gap': '8px' }}>
                <Button>{q.action}</Button>
                <Button variant="glass" onClick={() => onResolve(q)}>
                  Mark resolved
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid-auto" style={{ '--min': '420px' }}>
        <Card pad={22}>
          <h2 style={{ fontSize: 22, fontWeight: 800 }}>Home visits this week</h2>
          <div className="kw-bars" style={{ '--n': data.weekBars.length }} role="img" aria-label={data.weekBars.map((b) => `${b.day}: ${b.done} of ${b.booked}`).join(', ')}>
            {data.weekBars.map((b) => (
              <div key={b.day} className="kw-bar" style={{ color: b.isToday ? 'var(--kw-teal-800)' : undefined }}>
                <span>
                  {b.done}/{b.booked}
                </span>
                <div className="kw-bar__track" style={{ height: `${(b.booked / max) * 100}%` }}>
                  <div className="kw-bar__fill" style={{ height: `${b.booked ? (b.done / b.booked) * 100 : 0}%` }} />
                </div>
                <span>{b.day}</span>
              </div>
            ))}
          </div>
          <div className="kw-legend">
            <span>
              <span style={{ width: 14, height: 14, borderRadius: 4, background: 'var(--kw-teal-700)' }} />
              Done
            </span>
            <span>
              <span style={{ width: 14, height: 14, borderRadius: 4, background: 'rgba(31,42,40,0.08)' }} />
              Booked
            </span>
          </div>
        </Card>
        <Card pad={22} gap={14}>
          <h2 style={{ fontSize: 22, fontWeight: 800 }}>Nutritionist capacity by area</h2>
          {data.coverage.map((c) => (
            <div key={c.area} className="stack" style={{ '--gap': '6px' }}>
              <div className="row row--between">
                <span className="strong">{c.area}</span>
                <span className="row" style={{ '--gap': '8px' }}>
                  <span className="muted" style={{ fontSize: 15 }}>
                    {c.clients}/{c.capacity}
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
  const { data, error, reload, setData } = useApi(() => adminApi.overview(), []);
  const resolve = async (q) => {
    setData((d) => ({ ...d, queue: d.queue.filter((x) => x.id !== q.id) }));
    try {
      await adminApi.resolveFlag(q.id);
    } catch {
      reload();
    }
  };
  return (
    <>
      <PageHeader eyebrow={`${longDate()} · All of Lahore`} title="Operations overview" divider={false}>
        <Button variant="glass" icon="print" onClick={() => window.print()}>
          Export report
        </Button>
      </PageHeader>
      {error && <EmptyState title="We couldn't load the overview" action={<Button onClick={reload}>Try again</Button>} />}
      {!data && !error && <SkeletonCard minHeight={420} />}
      {data && <AdminOverviewView data={data} onResolve={resolve} />}
    </>
  );
}
