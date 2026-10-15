import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ONB_CONDS, ONB_DIET, ONB_STEPS } from '@kinwell/shared';
import { BrandMark } from '../../components/layout/index.js';
import { Avatar, Button, Card, Chip, ChipGroup, Field, Icon } from '../../components/ui/index.js';
import { useApi } from '../../hooks/useApi.js';
import { onboardingApi } from '../../api/endpoints.js';
import { useOptionalAuth } from '../../context/AuthContext.jsx';
import { usePageTitle } from '../../hooks/usePageTitle.js';
import './onboarding.css';

const CITIES = [
  ['London', 'London, United Kingdom (GMT+1)', 'Europe/London'],
  ['Dubai', 'Dubai, UAE (GMT+4)', 'Asia/Dubai'],
  ['Toronto', 'Toronto, Canada (GMT−4)', 'America/Toronto'],
  ['Riyadh', 'Riyadh, Saudi Arabia (GMT+3)', 'Asia/Riyadh'],
  ['Houston', 'Houston, USA (GMT−5)', 'America/Chicago'],
  ['Lahore', 'Lahore, Pakistan (GMT+5)', 'Asia/Karachi'],
  ['Karachi', 'Karachi, Pakistan (GMT+5)', 'Asia/Karachi'],
  ['Islamabad', 'Islamabad, Pakistan (GMT+5)', 'Asia/Karachi'],
];

// Cities with home visits and their areas come from the admin's service areas (Settings).
const OTHER = '__other';
const listCities = (names) => (names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}` : names[0] ?? '');
const MAX_PARENTS = 4;

const emptyParent = (callThem = '') => ({ name: '', callThem, age: '', cityChoice: '', city: '', areaChoice: '', area: '' });

/** The city a parent lives in: one Kinwell serves, or the one typed in. */
export const cityOf = (p) => (p.cityChoice === OTHER ? p.city.trim() : p.cityChoice);

/** What's missing for one parent, or null when they're ready (blank rows are simply skipped). */
export function parentProblem(p) {
  const named = p.name.trim().length >= 2;
  const age = Number(p.age);
  if (!named && !p.age) return 'empty';
  if (!named) return 'Add their full name.';
  if (!p.age) return 'Add their age.';
  if (age < 40 || age > 120) return 'Kinwell is for parents aged 40 or over. Check the age.';
  if (!p.cityChoice) return 'Choose the city they live in.';
  if (p.cityChoice === OTHER && !p.city.trim()) return 'Add the city they live in.';
  return null;
}

export const initialOnboarding = () => ({
  you: { name: '', email: '', password: '', city: 'London' },
  parents: [emptyParent('Ammi'), emptyParent('Abbu')],
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
  (f) => f.parents.some((p) => parentProblem(p) === null) && f.parents.every((p) => [null, 'empty'].includes(parentProblem(p))),
  () => true,
  () => true,
  () => true,
];

// Said under Continue while it is disabled, so it's clear what is missing.
const STEP_HINT = ['Add your name, a valid email and a password of at least 8 characters to continue.', 'Add a full name, age (40 or over) and city for at least one parent to continue.'];

export function OnboardingView({ step, form, setForm, nutritionists, areas = [], onBack, onNext, busy, error, onFinish }) {
  const set = (path, value) =>
    setForm((f) => {
      const next = structuredClone(f);
      let o = next;
      path.slice(0, -1).forEach((k) => (o = o[k]));
      o[path.at(-1)] = value;
      return next;
    });
  const first = form.parents.find((p) => p.name.trim()) ?? form.parents[0];
  const served = areas.map((c) => c.city);
  const areasIn = (city) => areas.find((c) => c.city === city)?.areas ?? [];
  // Step 4 offers nutritionists from the first parent's city.
  const firstCity = cityOf(form.parents.find((p) => parentProblem(p) === null) ?? first);
  const local = nutritionists.filter((n) => n.city === firstCity);

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
            <span style={{ width: `${((step + 1) / 5) * 100}%` }} />
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
              <p className="muted">Add the parents Kinwell will look after. A name, age and city are enough for now; the nutritionist goes through the rest at the first visit.</p>
              {form.parents.map((p, i) => {
                const problem = parentProblem(p);
                const ageError = p.age && (Number(p.age) < 40 || Number(p.age) > 120) ? 'Enter an age of 40 or over.' : null;
                const update = (key) => (e) => set(['parents', i, key], e.target.value);
                return (
                  <fieldset key={i} className="kw-onb-parent">
                    <legend>
                      Parent {i + 1}
                      {p.callThem.trim() && <span className="muted"> · {p.callThem.trim()}</span>}
                    </legend>
                    {form.parents.length > 1 && (
                      <button type="button" className="kw-onb-parent__remove" onClick={() => setForm((f) => ({ ...f, parents: f.parents.filter((_, j) => j !== i) }))}>
                        Remove
                      </button>
                    )}
                    <div className="grid-auto" style={{ '--min': '200px', '--gap': '12px' }}>
                      <Field label="Full name" autoComplete="off" value={p.name} onChange={update('name')} />
                      <Field label="What you call them" hint="Ammi, Abbu, Nani…" value={p.callThem} onChange={update('callThem')} />
                      <Field label="Age" inputMode="numeric" maxLength={3} hint={ageError ? undefined : '40 or over'} error={ageError} value={p.age} onChange={(e) => set(['parents', i, 'age'], e.target.value.replace(/\D/g, ''))} />
                      <Field
                        as="select"
                        label="City"
                        options={[{ value: '', label: 'Choose a city' }, ...served.map((c) => ({ value: c, label: c })), { value: OTHER, label: 'Another city' }]}
                        value={p.cityChoice}
                        onChange={(e) => setForm((f) => {
                          const next = structuredClone(f);
                          Object.assign(next.parents[i], { cityChoice: e.target.value, areaChoice: '', area: '' });
                          return next;
                        })}
                      />
                      {p.cityChoice === OTHER ? (
                        <Field label="Which city?" placeholder="e.g. Multan" value={p.city} onChange={update('city')} />
                      ) : (
                        p.cityChoice && (
                          <Field
                            as="select"
                            label="Area"
                            options={[{ value: '', label: 'Choose an area' }, ...areasIn(p.cityChoice).map((a) => ({ value: a, label: a })), { value: OTHER, label: 'Another area' }]}
                            value={p.areaChoice}
                            onChange={update('areaChoice')}
                          />
                        )
                      )}
                      {p.cityChoice && p.cityChoice !== OTHER && p.areaChoice === OTHER && <Field label="Which area?" placeholder="e.g. Shadman" value={p.area} onChange={update('area')} />}
                    </div>
                    {p.cityChoice === OTHER && (
                      <p className="kw-onb-note">
                        Home visits aren’t available in {p.city.trim() || 'other cities'} yet{served.length ? `: today we visit homes in ${listCities(served)}` : ''}. You can still set up your family and keep {p.callThem.trim() || 'their'}
                        {p.callThem.trim() ? '’s' : ''} lab results and updates in one place.
                      </p>
                    )}
                    {problem && problem !== 'empty' && !ageError && <p className="kw-onb-parent__todo">{problem}</p>}
                  </fieldset>
                );
              })}
              {form.parents.length < MAX_PARENTS && (
                <Button variant="glass" icon="plus" style={{ alignSelf: 'flex-start' }} onClick={() => setForm((f) => ({ ...f, parents: [...f.parents, emptyParent()] }))}>
                  Add another parent
                </Button>
              )}
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
              {local.length > 0 && <p className="muted">Nutritionists who visit homes in {firstCity}.</p>}
              {local.length === 0 && (
                <p className="kw-onb-note">
                  {served.includes(firstCity)
                    ? `There’s no Kinwell nutritionist taking new families in ${firstCity} right now, so you can skip this step. Our team will match you when one is free.`
                    : `Kinwell doesn’t have nutritionists in ${firstCity || 'that city'} yet, so you can skip this step.`}
                </p>
              )}
              <div role="radiogroup" aria-label="Nutritionists" className="stack" style={{ '--gap': '10px' }}>
                {local.map((n) => {
                  const on = (form.nutritionistId ?? local[0]?.id) === n.id;
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
        {step < 5 && !STEP_VALID[step](form) && STEP_HINT[step] && (
          <p className="muted text-sm" role="status" style={{ textAlign: 'right' }}>
            {STEP_HINT[step]}
          </p>
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
  const areas = useApi(() => onboardingApi.areas(), []);
  const auth = useOptionalAuth();
  const navigate = useNavigate();
  const list = nutritionists.data ?? [];
  // The default nutritionist is the first one in the first parent's city (none if there is none).
  const localFor = (f) => {
    const p = f.parents.find((x) => parentProblem(x) === null);
    return p ? list.filter((n) => n.city === cityOf(p)) : [];
  };

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const city = CITIES.find(([v]) => v === form.you.city);
      const body = {
        you: { ...form.you, timezone: city?.[2] },
        parents: form.parents
          .filter((p) => parentProblem(p) === null)
          .map((p) => ({
            name: p.name.trim(),
            callThem: p.callThem.trim(),
            age: Number(p.age),
            city: cityOf(p),
            area: p.cityChoice === OTHER ? undefined : p.areaChoice === OTHER ? p.area.trim() || undefined : p.areaChoice || undefined,
          })),
        invites: form.invites.filter((i) => i.email.trim()),
        nutritionistId: form.nutritionistId ?? localFor(form)[0]?.id,
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
      areas={areas.data ?? []}
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
