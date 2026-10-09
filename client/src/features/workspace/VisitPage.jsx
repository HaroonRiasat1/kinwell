import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { OBS, TESTS, VITALS_IN } from '@kinwell/shared';
import { Button, Card, ChipGroup, Field, Icon, Kicker, SkeletonCard } from '../../components/ui/index.js';
import { useApi } from '../../hooks/useApi.js';
import { workspaceApi } from '../../api/endpoints.js';
import { useWorkspace } from './WorkspaceLayout.jsx';

const MOODS = ['Good', 'Okay', 'Low'];

/** Tablet-friendly home-visit form: big fields, tap-to-select chips. */
export function VisitFormView({ parent, lastMeasurements, form, setForm, onSave, saving, saved, onNext }) {
  const lastFor = (label) => lastMeasurements.find((m) => m.n.toLowerCase().startsWith(label.toLowerCase()))?.v;
  const setVital = (label, value) => setForm((f) => ({ ...f, vitals: { ...f.vitals, [label]: value } }));
  if (saved) {
    return (
      <Card pad={32} style={{ maxWidth: 640 }}>
        <span className="kw-icon-tile" style={{ background: 'var(--kw-normal-bg)', color: 'var(--kw-normal)' }}>
          <Icon name="checkCircle" size={26} />
        </span>
        <h2 style={{ fontSize: 28, fontWeight: 800 }}>Visit saved</h2>
        <p className="muted">{parent.short}'s family can now see today's measurements. Next, update the plan or send them a note.</p>
        <div className="row">
          <Button onClick={() => onNext('builder')}>Open plan builder</Button>
          <Button variant="glass" onClick={() => onNext('update')}>
            Send update to the family
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
              hint={lastFor(v.label) ? `Last time: ${lastFor(v.label)}` : `Last time: ${v.last} ${v.unit}`}
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

export const emptyVisitForm = () => ({ vitals: {}, observations: ['Good appetite', 'A bit tired'], mood: 'Good', notes: '', tests: ['HbA1c'] });

export default function VisitPage() {
  const { parentId } = useParams();
  const navigate = useNavigate();
  const { setHeader, setCurrentId } = useWorkspace();
  const ctx = useApi(() => workspaceApi.visitContext(parentId), [parentId]);
  const [form, setForm] = useState(emptyVisitForm);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setCurrentId(parentId);
    setSaved(false);
    setForm(emptyVisitForm());
  }, [parentId, setCurrentId]);
  useEffect(() => {
    const p = ctx.data?.parent;
    if (p) setHeader({ title: `Home visit · ${p.short}`, sub: `${p.fullName}, ${p.age} · ${p.area} · started ${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` });
  }, [ctx.data, setHeader]);

  if (!ctx.data) return <SkeletonCard minHeight={480} />;
  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const vitals = VITALS_IN.map((v) => ({ label: v.label, value: form.vitals[v.label] ?? '', unit: v.unit }));
      await workspaceApi.logVisit(parentId, { ...form, vitals });
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <>
      {error && (
        <p role="alert" className="kw-field__error">
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
        saved={saved}
        onNext={(where) => navigate(`/workspace/${where}/${parentId}`)}
      />
    </>
  );
}
