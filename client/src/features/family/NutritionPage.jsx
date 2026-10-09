import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, EmptyState, Kicker, Modal, SkeletonCard } from '../../components/ui/index.js';
import { useApi } from '../../hooks/useApi.js';
import { parentApi } from '../../api/endpoints.js';
import { weekdayIndex } from '../../lib/dates.js';
import { STATUS } from '../../lib/status.js';
import { useProfile } from './ProfileLayout.jsx';

const DAY_LABELS = [
  ['Mon', 'Monday'],
  ['Tue', 'Tuesday'],
  ['Wed', 'Wednesday'],
  ['Thu', 'Thursday'],
  ['Fri', 'Friday'],
  ['Sat', 'Saturday'],
  ['Sun', 'Sunday'],
];

// "5–11 October" → the calendar dates for each weekday chip.
const datesFor = (weekOf) => {
  const start = parseInt(weekOf, 10);
  const month = weekOf.split(' ').at(-1);
  return DAY_LABELS.map(([s, long], i) => ({ s, d: Number.isNaN(start) ? '' : String(start + i), long: `${long} ${Number.isNaN(start) ? '' : start + i} ${month.slice(0, 3)}` }));
};

function MealCard({ meal, marker, onLink }) {
  const tone = marker ? STATUS[marker.status] : { fg: 'var(--kw-teal-800)', bg: 'var(--kw-teal-100)' };
  return (
    <Card as="article" pad={18} gap={10}>
      <div className="row row--between" style={{ alignItems: 'baseline' }}>
        <Kicker tone="teal">{meal.slot}</Kicker>
        <span className="muted" style={{ fontSize: 15 }}>
          {meal.time}
        </span>
      </div>
      <h3 style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.25 }}>{meal.name}</h3>
      <div className="row" style={{ '--gap': '6px' }}>
        {meal.nut.map((n) => (
          <span key={n} className="kw-pill kw-pill--teal">
            {n}
          </span>
        ))}
      </div>
      <p style={{ fontSize: 16, color: 'var(--kw-ink-2)' }}>
        <strong>Why this helps:</strong> {meal.why}
      </p>
      {meal.link && (
        <button
          type="button"
          onClick={onLink}
          className="row"
          style={{ '--gap': '6px', alignSelf: 'flex-start', border: 0, cursor: 'pointer', padding: '6px 12px', borderRadius: 999, background: tone.bg, color: tone.fg, fontWeight: 700, fontSize: 14 }}
        >
          For {meal.link}
          {marker && `: ${marker.value} ${marker.unit}`} →
        </button>
      )}
    </Card>
  );
}

export function NutritionView({ parent, data, day, onDay, onMarker }) {
  const [cookOpen, setCookOpen] = useState(false);
  if (!data.plan) {
    return (
      <EmptyState kicker="No plan yet" title={`${parent.short}'s first meal plan is on its way`}>
        After the first home visit, your nutritionist will write a week of meals that fit {parent.short}'s tastes and lab results.
      </EmptyState>
    );
  }
  const days = datesFor(data.plan.weekOf);
  const today = weekdayIndex();
  const markerFor = (name) => data.markers.find((m) => m.name === name);
  const slots = data.plan.days[0].map((m) => m.slot);

  return (
    <div className="stack" style={{ '--gap': '20px' }}>
      <div className="row row--between row--end">
        <div>
          <Kicker>Week of {data.plan.weekOf}</Kicker>
          <div className="text-sm muted">
            {data.plan.createdLabel} for {parent.short} · {data.diet.join(' · ')}
          </div>
        </div>
        <div className="row no-print" style={{ '--gap': '10px' }}>
          <Button variant="glass" icon="print" onClick={() => setCookOpen(true)}>
            Print for the cook
          </Button>
          <Button variant="glass" icon="share" onClick={() => setCookOpen(true)}>
            Share
          </Button>
        </div>
      </div>

      <div role="tablist" aria-label="Day of the week" className="row" style={{ '--gap': '8px', flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: 4 }}>
        {days.map((d, i) => (
          <button
            key={d.s}
            type="button"
            role="tab"
            aria-selected={i === day}
            onClick={() => onDay(i)}
            className={`kw-chip${i === day ? ' is-on' : ''}`}
            style={{ minWidth: 72, minHeight: 64, borderRadius: 20, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}
          >
            <span style={{ fontSize: 14, color: i === day ? '#d7e8e3' : 'var(--kw-muted)' }}>{i === today ? 'Today' : d.s}</span>
            <span style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.1 }}>{d.d}</span>
          </button>
        ))}
      </div>

      <h2 style={{ fontSize: 24, fontWeight: 800 }}>{days[day].long}</h2>
      <div className="grid-auto" style={{ '--min': '260px' }}>
        {data.plan.days[day].map((m) => (
          <MealCard key={m.slot} meal={m} marker={markerFor(m.link)} onLink={() => onMarker(m.link)} />
        ))}
      </div>

      <div className="grid-auto">
        {[
          ['Foods to favour', data.favor, 'var(--kw-normal)'],
          ['Foods to limit', data.limit, 'var(--kw-attention)'],
        ].map(([title, list, color]) => (
          <Card key={title} pad={22} gap={10}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color }}>{title}</h2>
            {list.map((f) => (
              <div key={f.n} className="row row--between" style={{ paddingTop: 10, borderTop: '1px solid var(--kw-rule-soft)' }}>
                <span className="strong" style={{ fontSize: 17 }}>
                  {f.n}
                </span>
                <span className="muted" style={{ fontSize: 15 }}>
                  {f.why}
                </span>
              </div>
            ))}
          </Card>
        ))}
      </div>

      <Card variant="flush">
        <h2 style={{ fontSize: 20, fontWeight: 800, padding: '14px 20px' }}>The whole week</h2>
        <div className="kw-table-scroll" style={{ '--min': '900px' }}>
          <div role="table" aria-label="Meals for the week" style={{ '--cols': '110px repeat(7, minmax(0,1fr))' }}>
            <div role="row" className="kw-table__head">
              <span role="columnheader">Meal</span>
              {days.map((d, i) => (
                <span key={d.s} role="columnheader" style={{ color: i === day ? 'var(--kw-teal-800)' : undefined }}>
                  {d.s} {d.d}
                </span>
              ))}
            </div>
            {slots.map((slot, j) => (
              <div key={slot} role="row" className="kw-table__row" style={{ fontSize: 15, alignItems: 'stretch' }}>
                <span role="rowheader" className="strong">
                  {slot}
                </span>
                {data.plan.days.map((meals, i) => (
                  <span
                    key={i}
                    role="cell"
                    style={{ padding: 8, borderRadius: 10, background: i === day ? 'rgba(226,238,234,0.9)' : 'rgba(255,255,255,0.35)', fontWeight: i === day ? 700 : 400 }}
                  >
                    {meals[j]?.name}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Modal open={cookOpen} onClose={() => setCookOpen(false)} labelledBy="cook-h" width={720}>
        <h2 id="cook-h" style={{ fontSize: 24, fontWeight: 800 }}>
          {parent.short}'s meals, week of {data.plan.weekOf}
        </h2>
        <p className="muted text-sm">{data.diet.join(' · ')}</p>
        {data.plan.days.map((meals, i) => (
          <div key={i} style={{ paddingTop: 10, borderTop: '1px solid var(--kw-rule)' }}>
            <div className="strong">{days[i].long}</div>
            <ul className="text-sm">
              {meals.map((m) => (
                <li key={m.slot}>
                  <span className="muted">{m.slot}:</span> {m.name}
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div className="row no-print">
          <Button icon="print" onClick={() => window.print()}>
            Print
          </Button>
          <Button variant="glass" onClick={() => setCookOpen(false)}>
            Close
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export default function NutritionPage() {
  const { parent } = useProfile();
  const navigate = useNavigate();
  const [day, setDay] = useState(weekdayIndex());
  const { data, error, reload } = useApi(() => parentApi.nutrition(parent.id), [parent.id]);
  if (error) return <EmptyState title="We couldn't load the meal plan" action={<Button onClick={reload}>Try again</Button>} />;
  if (!data) return <SkeletonCard minHeight={400} />;
  return (
    <NutritionView
      parent={parent}
      data={data}
      day={day}
      onDay={setDay}
      onMarker={(name) => navigate(`/family/${parent.id}/labs?marker=${encodeURIComponent(name)}`)}
    />
  );
}
