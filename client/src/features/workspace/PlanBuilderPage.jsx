import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button, Card, ConfirmDialog, Icon, IconButton, Kicker, Segmented, SkeletonCard, useToast } from '../../components/ui/index.js';
import { useApi } from '../../hooks/useApi.js';
import { workspaceApi } from '../../api/endpoints.js';
import { ClientPicker, useHeader, useWorkspace } from './WorkspaceLayout.jsx';

const SLOTS = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function LinkSelect({ value, options, onChange, label }) {
  return (
    <label className="stack" style={{ '--gap': '4px', fontSize: 14, fontWeight: 700, width: '100%' }}>
      <span className="muted">Helps with</span>
      <select aria-label={label} className="kw-input" style={{ minHeight: 44, fontSize: 15 }} value={value} onChange={(e) => onChange(e.target.value)}>
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
 * A week of meals plus supplements. Drag from the library or tap +; every item is linked to
 * the lab result it helps. The draft is only seen by the family once published.
 */
export function PlanBuilderView({ library, plan, setPlan, day, setDay, onSave, onPublish, busy, dirty }) {
  const [over, setOver] = useState(null);
  const meal = (code) => library.meals.find((m) => m.code === code);
  const supp = (id) => library.supplements.find((s) => s.id === id);
  const meals = plan.days[day];

  const setMeal = (slotIndex, code) =>
    setPlan((p) => {
      const days = p.days.map((d) => [...d]);
      days[day][slotIndex] = code;
      const links = { ...p.links };
      if (code) links[`${day}-${SLOTS[slotIndex]}`] = meal(code)?.link ?? 'General health';
      return { ...p, days, links };
    });
  const addSupp = (id) => setPlan((p) => (p.supplements.includes(id) ? p : { ...p, supplements: [...p.supplements, id] }));
  const copyToWeek = () => setPlan((p) => ({ ...p, days: p.days.map(() => [...p.days[day]]) }));
  const drop = (zone) => (e) => {
    e.preventDefault();
    setOver(null);
    const [kind, id] = e.dataTransfer.getData('text/plain').split(':');
    if (kind === 'meal' && zone !== 'supps') setMeal(zone, id);
    if (kind === 'supp' && zone === 'supps') addSupp(id);
  };
  const zone = (z) => ({
    className: `kw-drop${over === z ? ' is-over' : ''}`,
    onDragOver: (e) => {
      e.preventDefault();
      setOver(z);
    },
    onDragLeave: () => setOver(null),
    onDrop: drop(z),
  });
  const missing = plan.days.reduce((n, d) => n + d.slice(0, 3).filter((x) => !x).length, 0);

  return (
    <div className="split" style={{ '--a': '280px', '--b': '1fr' }}>
      <Card pad={18} gap={12}>
        <Kicker>Meals</Kicker>
        <ul className="stack" style={{ '--gap': '8px' }}>
          {library.meals.map((m) => (
            <LibraryItem key={m.code} kind="meal" id={m.code} name={m.name} meta={m.nut.join(' · ')} onAdd={() => setMeal(Math.max(0, meals.findIndex((x) => !x)), m.code)} />
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
        <div className="row row--between">
          <div>
            <Kicker>Week of {plan.weekOf}</Kicker>
            <div className="muted text-sm">{plan.isDraft ? 'Draft: the family sees it once you publish.' : plan.published ? `Starting from the current plan (${plan.published.weekOf}).` : 'New plan.'}</div>
          </div>
          <Button variant="link" onClick={copyToWeek}>
            Copy {DAYS[day]} to every day
          </Button>
        </div>
        <Segmented label="Day" value={day} onChange={setDay} items={DAYS.map((d, i) => ({ value: i, label: plan.days[i].slice(0, 3).every(Boolean) ? d : `${d} •` }))} />
        <div className="grid-auto" style={{ '--min': '240px', '--gap': '14px' }}>
          {SLOTS.map((slot, i) => {
            const code = meals[i];
            return (
              <div key={slot} {...zone(i)}>
                <Kicker tone="teal">
                  {slot}
                  {i === 3 && ' (optional)'}
                </Kicker>
                {code ? (
                  <>
                    <div className="row row--between" style={{ flexWrap: 'nowrap' }}>
                      <span className="strong">{meal(code)?.name ?? code}</span>
                      <IconButton icon="x" label={`Remove ${slot}`} size={16} onClick={() => setMeal(i, null)} />
                    </div>
                    <LinkSelect label={`${slot} helps with`} value={plan.links[`${day}-${slot}`] ?? meal(code)?.link} options={library.markers} onChange={(v) => setPlan((p) => ({ ...p, links: { ...p.links, [`${day}-${slot}`]: v } }))} />
                  </>
                ) : (
                  <span className="muted text-sm">Drag a meal here or tap + in the list</span>
                )}
              </div>
            );
          })}
        </div>
        <div {...zone('supps')}>
          <Kicker tone="teal">Supplements (every day)</Kicker>
          {plan.supplements.length === 0 && <span className="muted text-sm">Drag a supplement here</span>}
          {plan.supplements.map((id) => (
            <div key={id} className="stack" style={{ '--gap': '6px', paddingTop: 8, borderTop: '1px solid var(--kw-rule-soft)' }}>
              <div className="row row--between" style={{ flexWrap: 'nowrap' }}>
                <span className="strong">{supp(id)?.n ?? id}</span>
                <IconButton icon="x" label={`Remove ${supp(id)?.n}`} size={16} onClick={() => setPlan((p) => ({ ...p, supplements: p.supplements.filter((x) => x !== id) }))} />
              </div>
              <LinkSelect label={`${supp(id)?.n} helps with`} value={plan.links[`s-${id}`] ?? supp(id)?.link} options={library.markers} onChange={(v) => setPlan((p) => ({ ...p, links: { ...p.links, [`s-${id}`]: v } }))} />
            </div>
          ))}
        </div>
        <div className="row">
          <Button variant="glass" onClick={onSave} disabled={busy || !dirty}>
            {busy === 'save' ? 'Saving…' : dirty ? 'Save draft' : 'Draft saved'}
          </Button>
          <Button variant="cta" onClick={onPublish} disabled={Boolean(busy) || missing > 0}>
            {busy === 'publish' ? 'Publishing…' : 'Publish to family'}
          </Button>
          {missing > 0 && <span className="muted text-sm">{missing === 1 ? '1 meal still to fill' : `${missing} meals still to fill`} (days marked •)</span>}
        </div>
      </Card>
    </div>
  );
}

export default function PlanBuilderPage() {
  const { parentId } = useParams();
  const { clients } = useWorkspace();
  const toast = useToast();
  const library = useApi(() => workspaceApi.library(), []);
  const loaded = useApi(() => workspaceApi.plan(parentId), [parentId]);
  const [plan, setPlanState] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [day, setDay] = useState(0);
  const [busy, setBusy] = useState(null);
  const [confirm, setConfirm] = useState(false);
  const client = clients.data?.find((c) => c.id === parentId);

  useEffect(() => {
    if (loaded.data) {
      setPlanState(loaded.data);
      setDirty(false);
    }
  }, [loaded.data]);
  useHeader(
    `Meal plan${client ? ` · ${client.name}` : ''}`,
    'Plan the week, link each item to a result, then publish it to the family.',
    <ClientPicker clients={clients.data} value={parentId} base="/workspace/plan" />,
    [client?.id, clients.data],
  );

  if (!library.data || !plan) return <SkeletonCard minHeight={480} />;
  const setPlan = (fn) => {
    setDirty(true);
    setPlanState(fn);
  };
  const body = () => ({ days: plan.days, links: plan.links, supplements: plan.supplements });
  const save = async () => {
    setBusy('save');
    try {
      setPlanState(await workspaceApi.savePlan(parentId, body()));
      setDirty(false);
      toast('Draft saved');
    } catch (err) {
      toast(err.message, { tone: 'attention' });
    } finally {
      setBusy(null);
    }
  };
  const publish = async () => {
    setBusy('publish');
    try {
      await workspaceApi.savePlan(parentId, body());
      setPlanState(await workspaceApi.publishPlan(parentId));
      setDirty(false);
      toast('Plan published. The family has been told.');
    } catch (err) {
      toast(err.message, { tone: 'attention' });
      throw err;
    } finally {
      setBusy(null);
    }
  };
  return (
    <>
      <PlanBuilderView library={library.data} plan={plan} setPlan={setPlan} day={day} setDay={setDay} onSave={save} onPublish={() => setConfirm(true)} busy={busy} dirty={dirty} />
      <ConfirmDialog open={confirm} title={`Publish the plan for ${plan.weekOf}?`} confirmLabel="Publish" onClose={() => setConfirm(false)} onConfirm={publish}>
        The family sees it straight away, gets a message, and the daily checklist follows it from tomorrow. Supplements added or removed here change their list too.
      </ConfirmDialog>
    </>
  );
}
