import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ONB_CONDS, ONB_DIET, ONB_STEPS } from '@kinwell/shared';
import { BrandMark } from '../../components/layout/index.js';
import { Avatar, Button, Card, Chip, ChipGroup, Field, Icon } from '../../components/ui/index.js';
import { useApi } from '../../hooks/useApi.js';
import { onboardingApi } from '../../api/endpoints.js';
import { useOptionalAuth } from '../../context/AuthContext.jsx';
import { usePageTitle } from '../../hooks/usePageTitle.js';

const CITIES = [
  ['London', 'London, United Kingdom (GMT+1)', 'Europe/London'],
  ['Dubai', 'Dubai, UAE (GMT+4)', 'Asia/Dubai'],
  ['Toronto', 'Toronto, Canada (GMT−4)', 'America/Toronto'],
  ['Riyadh', 'Riyadh, Saudi Arabia (GMT+3)', 'Asia/Riyadh'],
  ['Houston', 'Houston, USA (GMT−5)', 'America/Chicago'],
  ['Lahore', 'Lahore, Pakistan (GMT+5)', 'Asia/Karachi'],
];

export const initialOnboarding = () => ({
  you: { name: '', email: '', password: '', city: 'London' },
  parents: [
    { name: '', callThem: 'Ammi', age: '', area: '' },
    { name: '', callThem: 'Abbu', age: '', area: '' },
  ],
  invites: [
    { email: '', access: 'edit' },
    { email: '', access: 'view' },
  ],
  nutritionistId: null,
  health: { conditions: ['High blood pressure'], diet: ['Halal', 'Low sodium'], medicines: '' },
});

// Fields required before leaving each step.
const STEP_VALID = [
  (f) => f.you.name.trim().length > 1 && /\S+@\S+\.\S+/.test(f.you.email) && f.you.password.length >= 8,
  (f) => f.parents.some((p) => p.name.trim() && Number(p.age) >= 40),
  () => true,
  () => true,
  () => true,
];

export function OnboardingView({ step, form, setForm, nutritionists, onBack, onNext, busy, error, onFinish }) {
  const set = (path, value) =>
    setForm((f) => {
      const next = structuredClone(f);
      let o = next;
      path.slice(0, -1).forEach((k) => (o = o[k]));
      o[path.at(-1)] = value;
      return next;
    });
  const first = form.parents.find((p) => p.name.trim()) ?? form.parents[0];

  return (
    <div className="kw-backdrop" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 32, padding: 'clamp(20px, 4vw, 48px)', alignItems: 'start' }}>
      <aside className="stack" style={{ '--gap': '20px', maxWidth: 380 }}>
        <BrandMark to="/" />
        <h1 style={{ fontSize: 34, fontWeight: 800, lineHeight: 1.1 }}>Set up Kinwell for your family</h1>
        <p className="muted">About 5 minutes. You can change everything later.</p>
        <ol className="kw-steps stack" style={{ '--gap': '4px' }}>
          {ONB_STEPS.map((label, i) => (
            <li key={label} aria-current={i === step ? 'step' : undefined} className={i < step ? 'is-done' : ''}>
              <span className="kw-steps__n">{i < step ? <Icon name="check" size={16} strokeWidth={3} /> : i + 1}</span>
              {label}
            </li>
          ))}
        </ol>
      </aside>

      <div className="stack" style={{ '--gap': '20px', maxWidth: 720 }}>
        {step < 5 && (
          <div className="kw-meter" role="img" aria-label={`Step ${step + 1} of 5`}>
            <span style={{ width: `${(step / 5) * 100}%` }} />
          </div>
        )}
        <Card pad={28}>
          {step === 0 && (
            <>
              <div className="kw-kicker kw-kicker--teal">Step 1</div>
              <h2 style={{ fontSize: 28, fontWeight: 800 }}>Tell us about you</h2>
              <p className="muted">You'll be the main contact for your parents' care.</p>
              <Field label="Your name" autoComplete="name" value={form.you.name} onChange={(e) => set(['you', 'name'], e.target.value)} />
              <Field label="Email" type="email" autoComplete="email" value={form.you.email} onChange={(e) => set(['you', 'email'], e.target.value)} />
              <Field label="Create a password" type="password" autoComplete="new-password" hint="At least 8 characters." value={form.you.password} onChange={(e) => set(['you', 'password'], e.target.value)} />
              <Field as="select" label="Where you live" options={CITIES.map(([v, l]) => ({ value: v, label: l }))} hint="We show visit times in your time and your parents' time." value={form.you.city} onChange={(e) => set(['you', 'city'], e.target.value)} />
            </>
          )}
          {step === 1 && (
            <>
              <div className="kw-kicker kw-kicker--teal">Step 2</div>
              <h2 style={{ fontSize: 28, fontWeight: 800 }}>Who are we looking after?</h2>
              {form.parents.map((p, i) => (
                <div key={i} className="grid-auto" style={{ '--min': '180px', '--gap': '12px', paddingTop: 14, borderTop: '1px solid var(--kw-rule)' }}>
                  <Field label="Full name" value={p.name} onChange={(e) => set(['parents', i, 'name'], e.target.value)} />
                  <Field label="What you call them" value={p.callThem} onChange={(e) => set(['parents', i, 'callThem'], e.target.value)} />
                  <Field label="Age" inputMode="numeric" value={p.age} onChange={(e) => set(['parents', i, 'age'], e.target.value.replace(/\D/g, ''))} />
                  <Field label="Area of Lahore" placeholder="Model Town" value={p.area} onChange={(e) => set(['parents', i, 'area'], e.target.value)} />
                </div>
              ))}
            </>
          )}
          {step === 2 && (
            <>
              <div className="kw-kicker kw-kicker--teal">Step 3</div>
              <h2 style={{ fontSize: 28, fontWeight: 800 }}>Invite brothers and sisters</h2>
              <p className="muted">They'll get the same updates. You can skip this.</p>
              {form.invites.map((iv, i) => (
                <div key={i} className="stack" style={{ '--gap': '8px', paddingTop: 14, borderTop: '1px solid var(--kw-rule)' }}>
                  <Field label={`Email ${i + 1}`} type="email" value={iv.email} onChange={(e) => set(['invites', i, 'email'], e.target.value)} />
                  <div className="row" style={{ '--gap': '8px' }}>
                    {[
                      ['view', 'Can view'],
                      ['edit', 'Can view & edit'],
                    ].map(([v, l]) => (
                      <Chip key={v} selected={iv.access === v} onClick={() => set(['invites', i, 'access'], v)}>
                        {l}
                      </Chip>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
          {step === 3 && (
            <>
              <div className="kw-kicker kw-kicker--teal">Step 4</div>
              <h2 style={{ fontSize: 28, fontWeight: 800 }}>Choose a nutritionist</h2>
              {nutritionists.length === 0 && <p className="muted">We couldn't load the list right now. You can skip this — we'll match you with someone in your parents' area.</p>}
              <div role="radiogroup" aria-label="Nutritionists" className="stack" style={{ '--gap': '10px' }}>
                {nutritionists.map((n) => {
                  const on = (form.nutritionistId ?? nutritionists[0]?.id) === n.id;
                  return (
                    <button
                      key={n.id}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => set(['nutritionistId'], n.id)}
                      className="row"
                      style={{ flexWrap: 'nowrap', textAlign: 'left', padding: 16, borderRadius: 20, cursor: 'pointer', color: 'var(--kw-ink)', border: on ? '2px solid var(--kw-teal-700)' : '1px solid rgba(255,255,255,0.8)', background: on ? 'rgba(226,238,234,0.85)' : 'rgba(255,255,255,0.5)' }}
                    >
                      <Avatar name={n.name} size={56} tone="sage" />
                      <span className="grow" style={{ lineHeight: 1.35 }}>
                        <span className="strong" style={{ display: 'block', fontSize: 19 }}>
                          {n.name}
                        </span>
                        <span className="muted" style={{ display: 'block', fontSize: 15 }}>
                          {n.credential} · {n.languages}
                        </span>
                        <span className="muted" style={{ display: 'block', fontSize: 15 }}>
                          {n.areas}
                        </span>
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--kw-teal-800)' }}>{n.next}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
          {step === 4 && (
            <>
              <div className="kw-kicker kw-kicker--teal">Step 5</div>
              <h2 style={{ fontSize: 28, fontWeight: 800 }}>Health basics for {first.callThem || 'your parent'}</h2>
              <p className="muted">Just what you know. The nutritionist will go through the details at the first visit.</p>
              <div className="strong text-sm">Health conditions</div>
              <ChipGroup label="Health conditions" multiple options={ONB_CONDS} value={form.health.conditions} onChange={(v) => set(['health', 'conditions'], v)} />
              <div className="strong text-sm">Diet</div>
              <ChipGroup label="Diet" multiple options={ONB_DIET} value={form.health.diet} onChange={(v) => set(['health', 'diet'], v)} />
              <Field as="textarea" label="Medicines they take (optional)" placeholder="e.g. Amlodipine 5 mg in the morning" value={form.health.medicines} onChange={(e) => set(['health', 'medicines'], e.target.value)} style={{ minHeight: 100 }} />
            </>
          )}
          {step === 5 && (
            <>
              <span className="kw-icon-tile" style={{ background: 'var(--kw-normal-bg)', color: 'var(--kw-normal)' }}>
                <Icon name="checkCircle" size={26} />
              </span>
              <h2 style={{ fontSize: 30, fontWeight: 800 }}>You're all set, {form.you.name.split(' ')[0]}</h2>
              <p className="muted">Your nutritionist will call within a day to book the first home visit. Until then, you can add a lab report.</p>
              <Button size="lg" iconRight="arrowRight" onClick={onFinish} style={{ alignSelf: 'flex-start' }}>
                Go to your dashboard
              </Button>
            </>
          )}
          {error && (
            <p role="alert" className="kw-field__error">
              {error}
            </p>
          )}
        </Card>
        {step < 5 && (
          <div className="row row--between">
            {step > 0 ? (
              <Button variant="glass" icon="arrowLeft" onClick={onBack}>
                Back
              </Button>
            ) : (
              <span />
            )}
            <Button size="lg" iconRight="arrowRight" onClick={onNext} disabled={busy || !STEP_VALID[step](form)}>
              {busy ? 'Setting up…' : step === 4 ? 'Finish' : 'Continue'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  usePageTitle('Set up your family');
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialOnboarding);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [session, setSession] = useState(null);
  const nutritionists = useApi(() => onboardingApi.nutritionists(), []);
  const auth = useOptionalAuth();
  const navigate = useNavigate();
  const list = nutritionists.data ?? [];

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const city = CITIES.find(([v]) => v === form.you.city);
      const body = {
        you: { ...form.you, timezone: city?.[2] },
        parents: form.parents.filter((p) => p.name.trim()).map((p) => ({ ...p, age: Number(p.age), city: 'Lahore' })),
        invites: form.invites.filter((i) => i.email.trim()),
        nutritionistId: form.nutritionistId ?? list[0]?.id,
        health: form.health,
      };
      setSession(await onboardingApi.complete(body));
      setStep(5);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <OnboardingView
      step={step}
      form={form}
      setForm={setForm}
      nutritionists={list}
      busy={busy}
      error={error}
      onBack={() => setStep((s) => Math.max(0, s - 1))}
      onNext={() => (step === 4 ? submit() : setStep((s) => s + 1))}
      onFinish={() => {
        auth?.startSession(session);
        navigate('/family', { replace: true });
      }}
    />
  );
}
