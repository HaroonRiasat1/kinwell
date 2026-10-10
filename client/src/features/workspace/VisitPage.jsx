import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { OBS, TESTS, VITALS_IN } from '@kinwell/shared';
import { Button, Card, ChipGroup, Field, Icon, Kicker, SkeletonCard, StatusTag } from '../../components/ui/index.js';
import { useApi } from '../../hooks/useApi.js';
import { workspaceApi } from '../../api/endpoints.js';
import { ClientPicker, useHeader, useWorkspace } from './WorkspaceLayout.jsx';

const MOODS = ['Good', 'Okay', 'Low'];

/** Tablet-friendly home-visit form: big fields, tap-to-select chips. */
export function VisitFormView({ parent, lastMeasurements, form, setForm, onSave, saving, saved, result, errors = {}, onNext }) {
  const lastFor = (label) => lastMeasurements.find((m) => m.n.toLowerCase().startsWith(label.toLowerCase()))?.v;
  const setVital = (label, value) => setForm((f) => ({ ...f, vitals: { ...f.vitals, [label]: value } }));
  if (saved) {
    const urgent = result?.readings.filter((r) => r.status === 'attention') ?? [];
    return (
      <Card pad={32} style={{ maxWidth: 720 }}>
        <span className="kw-icon-tile" style={urgent.length ? { background: 'var(--kw-attention-bg)', color: 'var(--kw-attention)' } : { background: 'var(--kw-normal-bg)', color: 'var(--kw-normal)' }}>
          <Icon name={urgent.length ? 'alert' : 'checkCircle'} size={26} />
        </span>
        <h2 style={{ fontSize: 28, fontWeight: 800 }}>{urgent.length ? 'Visit saved: some readings need attention' : 'Visit saved'}</h2>
        {result?.readings.length > 0 && (
          <div className="row" style={{ '--gap': '8px' }}>
            {result.readings.map((r) => (
              <StatusTag key={r.label} status={r.status} label={`${r.label} ${r.value} ${r.unit}`} />
            ))}
          </div>
        )}
        <p className="muted">
          {urgent.length
            ? `${parent.short}'s family can see these readings and has an alert. The Kinwell team has been flagged too. Follow up with the family today, and refer to a doctor if needed.`
            : `${parent.short}'s family can now see the visit summary in their messages.`}
        </p>
        <div className="row">
          {urgent.length > 0 && <Button onClick={() => onNext('messages')}>Message the family</Button>}
          <Button variant={urgent.length ? 'glass' : 'primary'} onClick={() => onNext('plan')}>
            Update the meal plan
          </Button>
          <Button variant="glass" onClick={() => onNext('client')}>
            Back to {parent.short}
          </Button>
        </div>
      </Card>
    );
  }
  return (
    <form
      className="stack"
      style={{ '--gap': '20px' }}
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
    >
      <Card pad={24}>
        <h2 style={{ fontSize: 22, fontWeight: 800 }}>Vitals</h2>
        <div className="grid-fill" style={{ '--min': '200px', '--gap': '16px' }}>
          {VITALS_IN.map((v) => (
            <Field
              key={v.label}
              label={`${v.label} (${v.unit})`}
              inputMode="decimal"
              placeholder={v.ph}
              hint={lastFor(v.label) ? `Last time: ${lastFor(v.label)}` : 'No earlier reading'}
              error={errors[v.label]}
              value={form.vitals[v.label] ?? ''}
              onChange={(e) => setVital(v.label, e.target.value)}
              style={{ minHeight: 64, fontSize: 24 }}
            />
          ))}
        </div>
      </Card>

      <Card pad={24}>
        <h2 style={{ fontSize: 22, fontWeight: 800 }}>How is {parent.short} today?</h2>
        <ChipGroup label="Observations" multiple options={OBS} value={form.observations} onChange={(observations) => setForm((f) => ({ ...f, observations }))} />
        <Kicker>Mood</Kicker>
        <ChipGroup label="Mood" options={MOODS} value={form.mood} onChange={(mood) => setForm((f) => ({ ...f, mood }))} />
        <Field as="textarea" label="Notes for the family (plain language)" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
      </Card>

      <div className="grid-auto">
        <Card pad={24}>
          <h2 style={{ fontSize: 22, fontWeight: 800 }}>Photos</h2>
          <div className="kw-drop" style={{ alignItems: 'center', justifyContent: 'center', minHeight: 140 }}>
            <Icon name="camera" size={28} />
            <span className="muted text-sm">Take a photo of a meal, the pill box or a lab slip</span>
          </div>
        </Card>
        <Card pad={24}>
          <h2 style={{ fontSize: 22, fontWeight: 800 }}>Order tests</h2>
          <ChipGroup label="Tests" multiple options={TESTS} value={form.tests} onChange={(tests) => setForm((f) => ({ ...f, tests }))} />
        </Card>
      </div>

      <div className="row">
        <Button type="submit" variant="cta" size="lg" disabled={saving}>
          {saving ? 'Saving…' : 'Save visit'}
        </Button>
        <span className="muted text-sm">Saved visits appear in the family's app straight away.</span>
      </div>
    </form>
  );
}

export const emptyVisitForm = () => ({ vitals: {}, observations: [], mood: 'Good', notes: '', tests: [] });

export default function VisitPage() {
  const { parentId } = useParams();
  const navigate = useNavigate();
  const { clients } = useWorkspace();
  const ctx = useApi(() => workspaceApi.visitContext(parentId), [parentId]);
  const [form, setForm] = useState(emptyVisitForm);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setResult(null);
    setErrors({});
    setError(null);
    setForm(emptyVisitForm());
  }, [parentId]);
  const p = ctx.data?.parent;
  useHeader(
    p ? `Home visit · ${p.short}` : 'Home visit',
    p ? `${p.fullName}, ${p.age} · ${p.area}` : '',
    <ClientPicker clients={clients.data} value={parentId} base="/workspace/visit" />,
    [p?.id, clients.data],
  );

  if (!ctx.data) return <SkeletonCard minHeight={480} />;
  const save = async () => {
    setSaving(true);
    setError(null);
    setErrors({});
    try {
      const vitals = VITALS_IN.map((v) => ({ label: v.label, value: form.vitals[v.label] ?? '', unit: v.unit }));
      setResult(await workspaceApi.logVisit(parentId, { ...form, vitals }));
      window.scrollTo({ top: 0 });
    } catch (err) {
      setError(err.message);
      setErrors(err.details ?? {});
    } finally {
      setSaving(false);
    }
  };
  return (
    <>
      {error && (
        <p role="alert" className="kw-notice kw-notice--attention" style={{ color: 'var(--kw-attention)', fontWeight: 700 }}>
          {error}
        </p>
      )}
      <VisitFormView
        parent={ctx.data.parent}
        lastMeasurements={ctx.data.lastMeasurements}
        form={form}
        setForm={setForm}
        onSave={save}
        saving={saving}
        saved={Boolean(result)}
        result={result}
        errors={errors}
        onNext={(where) => navigate(where === 'client' ? `/workspace/clients/${parentId}` : `/workspace/${where}/${parentId}`)}
      />
    </>
  );
}
