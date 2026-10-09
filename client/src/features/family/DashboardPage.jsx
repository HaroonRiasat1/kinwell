import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar,
  Button,
  Card,
  CheckRow,
  ErrorState,
  Icon,
  Kicker,
  ProgressRing,
  Skeleton,
  SkeletonCard,
  Sparkline,
  StatusTag,
} from '../../components/ui/index.js';
import { useApi } from '../../hooks/useApi.js';
import { parentApi } from '../../api/endpoints.js';
import { useFamilyParent } from './FamilyLayout.jsx';

const statusIcon = { attention: 'alert', watch: 'eye', normal: 'checkCircle' };

function HealthAtAGlance({ parent, nutritionist, onMessage }) {
  return (
    <Card aria-labelledby="glance-h">
      <Kicker id="glance-h">Health at a glance</Kicker>
      <div className="stack" style={{ '--gap': '10px', alignItems: 'flex-start' }}>
        <StatusTag status={parent.overall} size="lg" />
        <h2 style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.15 }}>{parent.overallTitle}</h2>
        <p className="pretty" style={{ color: 'var(--kw-ink-2)' }}>
          {parent.overallText}
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '1px solid var(--kw-rule)', borderBottom: '1px solid var(--kw-rule)' }}>
        <div style={{ padding: '12px 12px 12px 0', borderRight: '1px solid var(--kw-rule)' }}>
          <div className="text-xs muted">Last visit</div>
          <div style={{ fontWeight: 700 }}>{parent.lastVisit ?? '—'}</div>
        </div>
        <div style={{ padding: '12px 0 12px 14px' }}>
          <div className="text-xs muted">Next visit</div>
          <div style={{ fontWeight: 700 }}>{parent.nextVisit ?? 'Not booked'}</div>
          {parent.nextIn && <div style={{ fontSize: 14, color: 'var(--kw-teal-800)', fontWeight: 600 }}>{parent.nextIn}</div>}
        </div>
      </div>
      {nutritionist && (
        <div className="row">
          <Avatar name={nutritionist.name} size={52} tone="sage" />
          <div className="grow" style={{ minWidth: 120, lineHeight: 1.3 }}>
            <div className="strong">{nutritionist.name}</div>
            <div className="muted" style={{ fontSize: 15 }}>
              Registered dietitian · visits at home
            </div>
          </div>
          <Button variant="cta" icon="message" onClick={onMessage}>
            Message
          </Button>
        </div>
      )}
    </Card>
  );
}

function TodaysPlan({ parent, checklist, onToggle }) {
  const done = checklist.filter((i) => i.done).length;
  const ratio = (kind) => {
    const list = checklist.filter((i) => i.kind === kind);
    return `${list.filter((i) => i.done).length}/${list.length}`;
  };
  return (
    <Card aria-labelledby="today-h">
      <Kicker id="today-h">Today's plan</Kicker>
      <div className="row" style={{ '--gap': '18px', flexWrap: 'nowrap' }}>
        <ProgressRing done={done} total={checklist.length} />
        <div style={{ lineHeight: 1.35 }}>
          <div style={{ fontWeight: 800, fontSize: 22 }}>
            {done} of {checklist.length} done
          </div>
          <div className="muted" style={{ fontSize: 15 }}>
            Supplements {ratio('supp')} · Meals {ratio('meal')}
          </div>
          <div className="muted" style={{ fontSize: 15 }}>
            Ticked by {parent.short} in {parent.city}
          </div>
        </div>
      </div>
      <ul style={{ borderTop: '1px solid var(--kw-rule)' }}>
        {checklist.map((it) => (
          <li key={it.code}>
            <CheckRow
              title={it.title}
              meta={`${it.kind === 'supp' ? 'Supplement' : 'Meal'} · ${it.time}`}
              done={it.done}
              onToggle={() => onToggle(it)}
            />
          </li>
        ))}
      </ul>
    </Card>
  );
}

function Alerts({ alerts, onAction }) {
  return (
    <Card aria-labelledby="alerts-h">
      <div className="row" style={{ '--gap': '10px' }}>
        <Kicker id="alerts-h">Alerts</Kicker>
        <span className="kw-count">{alerts.length}</span>
      </div>
      {alerts.length === 0 && <p className="muted">Nothing needs your attention right now.</p>}
      <ul className="stack" style={{ '--gap': '12px' }}>
        {alerts.map((a) => (
          <li key={a.id ?? a.title} className={`kw-notice kw-notice--${a.status}`}>
            <span className="row" style={{ '--gap': '6px', fontSize: 14, fontWeight: 800, color: `var(--kw-${a.status})` }}>
              <Icon name={statusIcon[a.status]} size={16} strokeWidth={2.4} />
              {a.status === 'attention' ? 'Needs attention' : a.status === 'watch' ? 'Watch' : 'Normal'} · {a.type}
            </span>
            <div className="strong" style={{ lineHeight: 1.3 }}>
              {a.title}
            </div>
            <div className="pretty" style={{ fontSize: 16, color: 'var(--kw-ink-2)' }}>
              {a.text}
            </div>
            <Button variant="link" iconRight="arrowRight" style={{ alignSelf: 'flex-start' }} onClick={() => onAction(a)}>
              {a.action}
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function MarkerCard({ marker }) {
  const [tip, setTip] = useState(false);
  return (
    <Card as="article" pad={16} gap={10}>
      <div className="row row--between row--top" style={{ '--gap': '6px', flexWrap: 'nowrap' }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.25 }}>{marker.name}</h3>
        <button
          type="button"
          onClick={() => setTip(!tip)}
          aria-expanded={tip}
          aria-label={`What is ${marker.name}?`}
          style={{ width: 32, height: 32, margin: '-4px -4px 0 0', flexShrink: 0, borderRadius: 999, border: 0, background: tip ? '#c7ddd6' : 'var(--kw-teal-100)', color: 'var(--kw-teal-800)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}
        >
          <Icon name="help" />
        </button>
      </div>
      <div className="row" style={{ '--gap': '6px', alignItems: 'baseline' }}>
        <span style={{ fontSize: 28, fontWeight: 800, lineHeight: 1 }}>{marker.value}</span>
        <span className="text-xs muted">{marker.unit}</span>
      </div>
      <StatusTag status={marker.status} />
      <Sparkline series={marker.series} status={marker.status} label={`${marker.name} trend over 6 months: ${marker.trend}`} />
      <div className="row row--between text-xs muted" style={{ '--gap': '6px' }}>
        <span>{marker.trend}</span>
        <span>Target {marker.range}</span>
      </div>
      {tip && <div className="kw-plain">{marker.plain}</div>}
    </Card>
  );
}

function LatestNote({ parent, nutritionist, onVisits, onMessage }) {
  if (!parent.note) return null;
  const first = nutritionist?.name.split(' ')[0] ?? 'your nutritionist';
  return (
    <Card aria-labelledby="note-h" gap={18}>
      <div className="row">
        <Avatar name={nutritionist?.name ?? 'K'} size={52} tone="sage" />
        <div className="grow" style={{ minWidth: 180 }}>
          <h2 id="note-h" style={{ fontSize: 22, fontWeight: 800 }}>
            Latest from {first}
          </h2>
          <div className="muted" style={{ fontSize: 15 }}>
            After the home visit on {parent.lastVisit} · written in plain language
          </div>
        </div>
      </div>
      <p className="pretty" style={{ fontSize: 19, lineHeight: 1.6, maxWidth: '68ch' }}>
        “{parent.note}”
      </p>
      <div className="grid-auto" style={{ '--min': '220px', '--gap': '0px', borderTop: '1px solid var(--kw-rule)' }}>
        {parent.changes.map((c) => (
          <div key={c.k} className="stack" style={{ '--gap': '4px', padding: '14px 16px 4px 0' }}>
            <Kicker tone="teal">{c.k}</Kicker>
            <div style={{ fontSize: 17, lineHeight: 1.4 }}>{c.v}</div>
          </div>
        ))}
      </div>
      <div className="row">
        <Button onClick={onVisits}>Read full visit summary</Button>
        <Button variant="glass" onClick={onMessage}>
          Reply to {first}
        </Button>
      </div>
    </Card>
  );
}

export function DashboardSkeleton({ parent }) {
  return (
    <div role="status" aria-live="polite" className="stack" style={{ '--gap': '20px' }}>
      <div className="text-sm muted">Loading {parent.short}'s latest updates…</div>
      <div className="grid-auto">
        {[1, 2, 3].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      <div className="grid-fill">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Card key={i} pad={18} gap={12} style={{ height: 150 }}>
            <Skeleton width="60%" height={12} />
            <Skeleton width="45%" height={24} block />
            <Skeleton height={32} block soft />
          </Card>
        ))}
      </div>
    </div>
  );
}

const EMPTY_STEPS = [
  { title: 'Upload a lab report', text: "A PDF or a clear photo works. We'll pull out the numbers for you.", cta: 'Upload report', to: 'labs', variant: 'cta' },
  { title: 'Book the first home visit', text: 'Your nutritionist has openings next week in Lahore.', cta: 'See times', to: 'visits', variant: 'glass' },
  { title: 'Add medicines & allergies', text: 'So supplements can be checked as safe alongside them.', cta: 'Add details', to: 'profile', variant: 'glass' },
];

export function DashboardEmpty({ parent, onGo }) {
  return (
    <Card pad={32} className="grid-auto" style={{ '--min': '320px', '--gap': '28px', display: 'grid' }}>
      <div className="stack" style={{ '--gap': '14px' }}>
        <Kicker tone="teal">Getting started</Kicker>
        <h2 style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.15 }}>Let's set up {parent.short}'s health hub</h2>
        <p className="muted">
          Nothing here yet. Once you add a lab report or the first visit happens, you'll see {parent.short}'s vitals, meals and alerts on this page.
        </p>
      </div>
      <ol className="stack" style={{ '--gap': '0px' }}>
        {EMPTY_STEPS.map((s, i) => (
          <li key={s.title} style={{ display: 'grid', gridTemplateColumns: '44px 1fr', gap: 14, padding: '18px 0', borderTop: '1px solid var(--kw-rule)' }}>
            <span className="kw-avatar" style={{ '--size': '44px', fontSize: 18 }}>
              {i + 1}
            </span>
            <div className="stack" style={{ '--gap': '10px', alignItems: 'flex-start' }}>
              <div>
                <div className="strong">{s.title}</div>
                <div className="text-sm muted">{s.text}</div>
              </div>
              <Button variant={s.variant} onClick={() => onGo(s.to)}>
                {s.cta}
              </Button>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}

/** Pure view of the family dashboard; `status` drives loading / error / empty / ready. */
export function DashboardView({ status = 'ready', data, parent, onToggle, onRetry, onGo }) {
  if (status === 'loading') return <DashboardSkeleton parent={parent} />;
  if (status === 'error') {
    return (
      <ErrorState
        title={`We couldn't load ${parent.short}'s latest updates`}
        onRetry={onRetry}
        secondary={
          <Button variant="glass" size="lg" onClick={() => onGo('messages')}>
            Message your nutritionist instead
          </Button>
        }
      >
        This is on our side, not yours. {parent.short}'s records are safe. Check your internet connection and try again — if it keeps
        happening, we'll look into it.
      </ErrorState>
    );
  }
  if (status === 'empty') return <DashboardEmpty parent={parent} onGo={onGo} />;

  const p = data.parent;
  const onAlert = (a) => {
    if (/reminder/i.test(a.action)) return onGo('supplements');
    if (/test|visit/i.test(a.action)) return onGo('visits');
    const marker = data.markers.find((m) => a.title.startsWith(m.name));
    return onGo(marker ? `labs?marker=${encodeURIComponent(marker.name)}` : 'labs');
  };
  return (
    <div className="stack" style={{ '--gap': '28px' }}>
      <div className="grid-auto" style={{ alignItems: 'stretch' }}>
        <HealthAtAGlance parent={p} nutritionist={data.nutritionist} onMessage={() => onGo('messages')} />
        <TodaysPlan parent={p} checklist={data.checklist} onToggle={onToggle} />
        <Alerts alerts={p.alerts} onAction={onAlert} />
      </div>
      <section aria-labelledby="vitals-h" className="stack">
        <div className="row row--between row--end">
          <div>
            <h2 id="vitals-h" style={{ fontSize: 26, fontWeight: 800 }}>
              Vitals &amp; lab markers
            </h2>
            <div className="text-sm muted">From the last home visit and lab report. Tap ? for what each one means.</div>
          </div>
          <Button variant="glass" iconRight="arrowRight" onClick={() => onGo('labs')}>
            All lab tests
          </Button>
        </div>
        <div className="grid-fill">
          {data.markers.map((m) => (
            <MarkerCard key={m.id ?? m.name} marker={m} />
          ))}
        </div>
      </section>
      <LatestNote parent={p} nutritionist={data.nutritionist} onVisits={() => onGo('visits')} onMessage={() => onGo('messages')} />
    </div>
  );
}

export default function DashboardPage() {
  const { parent } = useFamilyParent();
  const navigate = useNavigate();
  const { data, error, loading, reload, setData } = useApi(() => parentApi.dashboard(parent.id), [parent.id]);

  const toggle = async (item) => {
    const flip = (done) => (d) => ({ ...d, checklist: d.checklist.map((i) => (i.code === item.code ? { ...i, done } : i)) });
    setData(flip(!item.done)); // optimistic
    try {
      await parentApi.setChecklist(parent.id, item.code, !item.done);
    } catch {
      setData(flip(item.done));
    }
  };

  const status = loading && !data ? 'loading' : error ? 'error' : !data.markers.length && !data.checklist.length ? 'empty' : 'ready';
  return (
    <DashboardView
      status={status}
      data={data}
      parent={parent}
      onToggle={toggle}
      onRetry={reload}
      onGo={(to) => navigate(`/family/${parent.id}/${to}`)}
    />
  );
}
