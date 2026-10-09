import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button, Card, Icon, IconButton, Kicker, SkeletonCard } from '../../components/ui/index.js';
import { useApi } from '../../hooks/useApi.js';
import { workspaceApi } from '../../api/endpoints.js';
import { useWorkspace } from './WorkspaceLayout.jsx';

const SLOTS = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

function LinkSelect({ value, options, onChange, id }) {
  return (
    <label className="stack" style={{ '--gap': '4px', fontSize: 14, fontWeight: 700, width: '100%' }}>
      <span className="muted">Linked to</span>
      <select id={id} className="kw-input" style={{ minHeight: 44, fontSize: 15 }} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

function LibraryItem({ kind, id, name, meta, onAdd }) {
  return (
    <li
      className="kw-draggable"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', `${kind}:${id}`);
        e.dataTransfer.effectAllowed = 'copy';
      }}
    >
      <Icon name="grip" />
      <span className="grow">
        <span className="strong" style={{ display: 'block', fontSize: 16 }}>
          {name}
        </span>
        {meta && <span className="muted" style={{ fontSize: 14 }}>{meta}</span>}
      </span>
      <IconButton icon="plus" label={`Add ${name}`} size={18} onClick={onAdd} />
    </li>
  );
}

/**
 * Drag meals and supplements into a day's plan, or tap +. Every item is linked to the
 * lab result it is meant to help, so the family sees why it's there.
 */
export function PlanBuilderView({ library, plan, setPlan, onSave, saving, saved }) {
  const [over, setOver] = useState(null);
  const meal = (code) => library.meals.find((m) => m.code === code);
  const supp = (id) => library.supplements.find((s) => s.id === id);

  const placeMeal = (slot, code) => setPlan((p) => ({ ...p, meals: { ...p.meals, [slot]: code }, links: { ...p.links, [slot]: meal(code)?.link ?? 'General health' } }));
  const addSupp = (id) => setPlan((p) => (p.supplements.includes(id) ? p : { ...p, supplements: [...p.supplements, id] }));
  const drop = (zone) => (e) => {
    e.preventDefault();
    setOver(null);
    const [kind, id] = e.dataTransfer.getData('text/plain').split(':');
    if (kind === 'meal' && zone !== 'supps') placeMeal(zone, id);
    if (kind === 'supp' && zone === 'supps') addSupp(id);
  };
  const zoneProps = (zone) => ({
    className: `kw-drop${over === zone ? ' is-over' : ''}`,
    onDragOver: (e) => {
      e.preventDefault();
      setOver(zone);
    },
    onDragLeave: () => setOver(null),
    onDrop: drop(zone),
  });

  return (
    <div className="split" style={{ '--a': '280px', '--b': '1fr' }}>
      <Card pad={18} gap={12}>
        <Kicker>Meals</Kicker>
        <ul className="stack" style={{ '--gap': '8px' }}>
          {library.meals.map((m) => (
            <LibraryItem key={m.code} kind="meal" id={m.code} name={m.name} meta={m.nut.join(' · ')} onAdd={() => placeMeal(SLOTS.find((s) => !plan.meals[s]) ?? 'Snack', m.code)} />
          ))}
        </ul>
        <Kicker>Supplements</Kicker>
        <ul className="stack" style={{ '--gap': '8px' }}>
          {library.supplements.map((s) => (
            <LibraryItem key={s.id} kind="supp" id={s.id} name={s.n} onAdd={() => addSupp(s.id)} />
          ))}
        </ul>
      </Card>

      <Card pad={22}>
        <h2 style={{ fontSize: 24, fontWeight: 800 }}>{plan.dayLabel}</h2>
        <div className="grid-auto" style={{ '--min': '240px', '--gap': '14px' }}>
          {SLOTS.map((slot) => {
            const code = plan.meals[slot];
            return (
              <div key={slot} {...zoneProps(slot)}>
                <Kicker tone="teal">{slot}</Kicker>
                {code ? (
                  <>
                    <div className="row row--between" style={{ flexWrap: 'nowrap' }}>
                      <span className="strong">{meal(code)?.name}</span>
                      <IconButton icon="x" label={`Remove ${slot}`} size={16} onClick={() => setPlan((p) => ({ ...p, meals: { ...p.meals, [slot]: null } }))} />
                    </div>
                    <LinkSelect value={plan.links[slot] ?? meal(code)?.link} options={library.markers} onChange={(v) => setPlan((p) => ({ ...p, links: { ...p.links, [slot]: v } }))} />
                  </>
                ) : (
                  <span className="muted text-sm">Drag a meal here</span>
                )}
              </div>
            );
          })}
        </div>
        <div {...zoneProps('supps')}>
          <Kicker tone="teal">Supplements</Kicker>
          {plan.supplements.length === 0 && <span className="muted text-sm">Drag a supplement here</span>}
          {plan.supplements.map((id) => (
            <div key={id} className="stack" style={{ '--gap': '6px', paddingTop: 8, borderTop: '1px solid var(--kw-rule-soft)' }}>
              <div className="row row--between" style={{ flexWrap: 'nowrap' }}>
                <span className="strong">{supp(id)?.n}</span>
                <IconButton icon="x" label={`Remove ${supp(id)?.n}`} size={16} onClick={() => setPlan((p) => ({ ...p, supplements: p.supplements.filter((x) => x !== id) }))} />
              </div>
              <LinkSelect value={plan.links[`s-${id}`] ?? supp(id)?.link} options={library.markers} onChange={(v) => setPlan((p) => ({ ...p, links: { ...p.links, [`s-${id}`]: v } }))} />
            </div>
          ))}
        </div>
        <div className="row">
          <Button variant="cta" size="lg" onClick={onSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save plan'}
          </Button>
          {saved && (
            <span role="status" className="row" style={{ '--gap': '6px', color: 'var(--kw-normal)', fontWeight: 700 }}>
              <Icon name="checkCircle" /> Saved as a draft for next week
            </span>
          )}
        </div>
      </Card>
    </div>
  );
}

export const initialPlan = () => ({ dayLabel: 'Monday 12 October', meals: { Breakfast: 'daliya', Lunch: 'dal', Dinner: null, Snack: null }, supplements: ['vitd'], links: {} });

export default function PlanBuilderPage() {
  const { parentId } = useParams();
  const { setHeader, setCurrentId, clients } = useWorkspace();
  const library = useApi(() => workspaceApi.library(), []);
  const [plan, setPlan] = useState(initialPlan);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const client = clients.data?.find((c) => c.id === parentId);

  useEffect(() => setCurrentId(parentId), [parentId, setCurrentId]);
  useEffect(() => {
    setHeader({ title: `Plan builder${client ? ` · ${client.name.split(' (')[1]?.replace(')', '') ?? client.name}` : ''}`, sub: 'Drag meals and supplements into the plan. Link each one to a lab result.' });
  }, [client, setHeader]);

  if (!library.data) return <SkeletonCard minHeight={480} />;
  const save = async () => {
    setSaving(true);
    try {
      await workspaceApi.savePlan(parentId, { meals: plan.meals, supplements: plan.supplements, links: plan.links });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };
  return <PlanBuilderView library={library.data} plan={plan} setPlan={(fn) => (setSaved(false), setPlan(fn))} onSave={save} saving={saving} saved={saved} />;
}
