import { Button, Card, EmptyState, Icon, Kicker, SkeletonCard, StatusTag, Toggle } from '../../components/ui/index.js';
import { useApi } from '../../hooks/useApi.js';
import { parentApi } from '../../api/endpoints.js';
import { STATUS } from '../../lib/status.js';
import { useProfile } from './ProfileLayout.jsx';

const SLOTS = [
  ['Morning', '9:00 am'],
  ['Afternoon', '1:30 pm'],
  ['Evening', '7:00 pm'],
  ['Night', '10:00 pm'],
];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function WeekDots({ week, todayIndex }) {
  return (
    <div className="row" style={{ '--gap': '6px', flexWrap: 'nowrap' }}>
      {week.map((v, d) => {
        const style =
          v === 1
            ? { background: 'var(--kw-normal-bg)', color: 'var(--kw-normal)' }
            : v === 0
              ? { background: 'var(--kw-attention-bg)', color: 'var(--kw-attention)' }
              : { background: 'rgba(255,255,255,0.6)', color: 'var(--kw-muted)' };
        const word = v === 1 ? 'taken' : v === 0 ? 'missed' : d > todayIndex ? 'later' : d === todayIndex ? 'not yet' : 'not started';
        return (
          <span
            key={d}
            title={`${DAYS[d]}: ${word}`}
            aria-label={`${DAYS[d]}: ${word}`}
            style={{ ...style, width: 34, height: 34, borderRadius: 999, display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 800, border: d === todayIndex ? '2px solid var(--kw-teal-700)' : '1px solid rgba(31,42,40,0.12)' }}
          >
            {v === 1 ? <Icon name="check" size={14} strokeWidth={3} /> : v === 0 ? <Icon name="x" size={14} strokeWidth={3} /> : 'MTWTFSS'[d]}
          </span>
        );
      })}
    </div>
  );
}

export function SupplementsView({ data, onReminder }) {
  const markerFor = (name) => data.markers.find((m) => m.name === name);
  const slots = SLOTS.map(([name, time]) => ({ name, time, items: data.supplements.filter((s) => s.slot === name) })).filter((s) => s.items.length);
  if (!data.supplements.length) {
    return <EmptyState kicker="No supplements" title="Nothing to take right now">Your nutritionist only suggests supplements when a lab result shows they'd help.</EmptyState>;
  }
  return (
    <div className="stack" style={{ '--gap': '20px' }}>
      <Card aria-labelledby="int-h" pad={22} gap={12}>
        <h2 id="int-h" style={{ fontSize: 20, fontWeight: 800 }}>
          Medicine interaction checks
        </h2>
        {data.interactions.map((x) => (
          <div key={x.title} className={`kw-notice kw-notice--${x.level}`}>
            <StatusTag status={x.level} label={x.level === 'normal' ? 'No problems found' : STATUS[x.level].label} />
            <div className="strong">{x.title}</div>
            <div className="text-sm" style={{ color: 'var(--kw-ink-2)' }}>
              {x.text}
            </div>
            <div className="muted" style={{ fontSize: 14 }}>
              {x.by}
            </div>
          </div>
        ))}
      </Card>

      <div className="split" style={{ '--a': '1fr', '--b': '1.4fr' }}>
        <Card aria-labelledby="sch-h" pad={22}>
          <h2 id="sch-h" style={{ fontSize: 20, fontWeight: 800 }}>
            Today's schedule
          </h2>
          {slots.map((slot) => {
            const on = slot.items.every((s) => s.reminderOn);
            return (
              <div key={slot.name} className="stack" style={{ '--gap': '8px', paddingTop: 12, borderTop: '1px solid var(--kw-rule-soft)' }}>
                <div className="row row--between">
                  <div>
                    <div className="strong">{slot.name}</div>
                    <div className="muted" style={{ fontSize: 15 }}>
                      {on ? `Phone reminder at ${slot.time}` : 'Reminder off'}
                    </div>
                  </div>
                  <Toggle checked={on} onChange={(v) => onReminder(slot.name, v)} label={`${slot.name} reminder`} />
                </div>
                {slot.items.map((s) => (
                  <div key={s.code} className="row" style={{ '--gap': '10px' }}>
                    <span className="kw-icon-tile" style={{ '--size': '40px', borderRadius: 12 }}>
                      <Icon name="pill" />
                    </span>
                    <span className="grow">
                      <span className="strong" style={{ fontSize: 17 }}>
                        {s.title}
                      </span>
                      <span className="muted" style={{ display: 'block', fontSize: 15 }}>
                        {s.dose}
                      </span>
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: s.doneToday ? 'var(--kw-normal)' : 'var(--kw-muted)' }}>
                      {s.doneToday ? 'Taken' : 'Not yet'}
                    </span>
                  </div>
                ))}
              </div>
            );
          })}
        </Card>

        <section aria-labelledby="all-h" className="stack">
          <h2 id="all-h" style={{ fontSize: 22, fontWeight: 800 }}>
            Recommended by your nutritionist
          </h2>
          {data.supplements.map((s) => {
            const mk = markerFor(s.link);
            const tone = mk ? STATUS[mk.status] : { fg: 'var(--kw-teal-800)', bg: 'var(--kw-teal-100)' };
            return (
              <Card key={s.code} as="article" pad={20} gap={12}>
                <div className="row row--between row--top">
                  <div>
                    <h3 style={{ fontSize: 20, fontWeight: 800 }}>{s.title}</h3>
                    <div className="muted" style={{ fontSize: 16 }}>
                      {s.dose}
                    </div>
                  </div>
                  <div className="row" style={{ '--gap': '6px' }}>
                    {s.chips.map((c) => (
                      <span key={c} className="kw-pill kw-pill--teal">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="row" style={{ '--gap': '8px' }}>
                  <Kicker>Why</Kicker>
                  <span style={{ padding: '4px 12px', borderRadius: 999, fontSize: 14, fontWeight: 700, background: tone.bg, color: tone.fg }}>
                    {mk ? `${mk.name}: ${mk.value} ${mk.unit}` : s.reason}
                  </span>
                </div>
                <div className="text-sm" style={{ color: 'var(--kw-ink-2)' }}>
                  {s.reason} · Started {s.start} · Review: {s.review}
                </div>
                <div className="stack" style={{ '--gap': '6px' }}>
                  <Kicker>This week</Kicker>
                  <WeekDots week={s.week} todayIndex={data.todayIndex} />
                </div>
              </Card>
            );
          })}
        </section>
      </div>
    </div>
  );
}

export default function SupplementsPage() {
  const { parent } = useProfile();
  const { data, error, reload, setData } = useApi(() => parentApi.supplements(parent.id), [parent.id]);
  const onReminder = async (slot, on) => {
    const apply = (value) => (d) => ({ ...d, supplements: d.supplements.map((s) => (s.slot === slot ? { ...s, reminderOn: value } : s)) });
    setData(apply(on));
    try {
      await parentApi.setReminder(parent.id, slot, on);
    } catch {
      setData(apply(!on));
    }
  };
  if (error) return <EmptyState title="We couldn't load supplements" action={<Button onClick={reload}>Try again</Button>} />;
  if (!data) return <SkeletonCard minHeight={400} />;
  return <SupplementsView data={data} onReminder={onReminder} />;
}
