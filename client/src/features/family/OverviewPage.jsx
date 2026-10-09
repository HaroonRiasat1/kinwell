import { useNavigate } from 'react-router-dom';
import { Avatar, Button, Card, ErrorState, Icon, Kicker, SkeletonCard } from '../../components/ui/index.js';
import { useProfile } from './ProfileLayout.jsx';

function Section({ title, onEdit, children, gap = 14 }) {
  return (
    <Card pad={22} gap={gap}>
      <div className="row row--between" style={{ '--gap': '8px' }}>
        <Kicker as="h2">{title}</Kicker>
        {onEdit && (
          <Button variant="glass" size="sm" icon="edit" onClick={onEdit}>
            Edit
          </Button>
        )}
      </div>
      {children}
    </Card>
  );
}

const itemRule = { paddingTop: 12, borderTop: '1px solid var(--kw-rule-soft)' };

export function OverviewView({ data, onMessage }) {
  const { parent: p, contacts, nutritionist } = data;
  const noop = () => {};
  return (
    <div className="grid-auto" style={{ '--min': '320px' }}>
      <Section title="Health conditions" onEdit={noop}>
        {p.conditions.length === 0 && <p className="muted">None recorded yet.</p>}
        {p.conditions.map((c) => (
          <div key={c.name} className="stack" style={{ '--gap': '4px', ...itemRule }}>
            <div className="row row--between" style={{ '--gap': '8px' }}>
              <span className="strong">{c.name}</span>
              {c.since && <span className="muted" style={{ fontSize: 15 }}>since {c.since}</span>}
            </div>
            {c.plain && <div style={{ fontSize: 16, color: 'var(--kw-ink-2)' }}>{c.plain}</div>}
          </div>
        ))}
      </Section>

      <Section title="Current medicines" onEdit={noop}>
        {p.medicines.map((m) => (
          <div key={m.name} className="stack" style={{ '--gap': '2px', ...itemRule }}>
            <div className="strong">
              {m.name}
              {m.dose && ` · ${m.dose}`}
            </div>
            {m.when && (
              <div style={{ fontSize: 16, color: 'var(--kw-ink-2)' }}>
                {m.when} · for {m.for}
              </div>
            )}
            {m.by && <div className="muted" style={{ fontSize: 15 }}>Prescribed by {m.by}</div>}
          </div>
        ))}
        <div className="muted" style={{ fontSize: 15 }}>
          Your nutritionist checks every supplement against these.
        </div>
      </Section>

      <Section title="Allergies" onEdit={noop}>
        <ul className="stack" style={{ '--gap': '8px' }}>
          {p.allergies.map((a) => (
            <li key={a.name} className="row" style={{ '--gap': '10px', padding: '12px 14px', borderRadius: 16, background: 'var(--kw-attention-tint)', color: 'var(--kw-attention)' }}>
              <Icon name="alert" strokeWidth={2.4} />
              <span>
                <strong>{a.name}</strong> <span style={{ color: '#7d2a22' }}>· {a.reaction}</span>
              </span>
            </li>
          ))}
        </ul>
        <Kicker as="h2">Diet &amp; preferences</Kicker>
        <div className="row" style={{ '--gap': '8px' }}>
          {p.diet.map((d) => (
            <span key={d} className="kw-pill kw-pill--teal" style={{ fontSize: 15, padding: '6px 14px' }}>
              {d}
            </span>
          ))}
        </div>
      </Section>

      <Section title="Emergency contacts" onEdit={noop} gap={12}>
        {contacts.map((c) => (
          <div key={c.name} className="row" style={{ ...itemRule, flexWrap: 'nowrap' }}>
            <Avatar name={c.name} size={44} />
            <div className="grow" style={{ lineHeight: 1.3 }}>
              <div className="strong">{c.name}</div>
              <div className="muted" style={{ fontSize: 15 }}>
                {c.rel} · {c.where}
              </div>
              <div className="muted" style={{ fontSize: 15 }}>
                {c.phone}
              </div>
            </div>
            <a className="kw-btn kw-btn--primary kw-btn--icon" href={`tel:${c.phone.replace(/\s/g, '')}`} aria-label={`Call ${c.name}`}>
              <Icon name="phone" size={20} />
            </a>
          </div>
        ))}
      </Section>

      {nutritionist && (
        <Section title="Assigned nutritionist">
          <div className="row" style={{ '--gap': '14px', flexWrap: 'nowrap' }}>
            <Avatar name={nutritionist.name} size={72} tone="sage" />
            <div style={{ lineHeight: 1.35 }}>
              <div style={{ fontWeight: 800, fontSize: 20 }}>{nutritionist.name}</div>
              <div className="text-sm muted">{nutritionist.credential}</div>
              <div className="muted" style={{ fontSize: 15 }}>
                Speaks {nutritionist.languages}
              </div>
            </div>
          </div>
          {p.nextVisitLong && (
            <div style={{ fontSize: 16, color: 'var(--kw-ink-2)' }}>
              Visits every 4 weeks, at home. Next: <strong>{p.nextVisitLong}</strong>.
            </div>
          )}
          <div className="row" style={{ '--gap': '10px' }}>
            <Button onClick={onMessage}>Message {nutritionist.name.split(' ')[0]}</Button>
            <Button variant="glass">Change nutritionist</Button>
          </div>
        </Section>
      )}
    </div>
  );
}

export default function OverviewPage() {
  const { parent, profile } = useProfile();
  const navigate = useNavigate();
  if (profile.error) {
    return (
      <ErrorState title={`We couldn't load ${parent.short}'s profile`} onRetry={profile.reload}>
        {parent.short}'s records are safe. Please try again.
      </ErrorState>
    );
  }
  if (!profile.data) {
    return (
      <div className="grid-auto">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }
  return <OverviewView data={profile.data} onMessage={() => navigate(`/family/${parent.id}/messages`)} />;
}
