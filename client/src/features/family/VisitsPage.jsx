import { useState } from 'react';
import { Button, Card, Chip, EmptyState, Icon, Kicker, Modal, SkeletonCard, StatusTag } from '../../components/ui/index.js';
import { useApi } from '../../hooks/useApi.js';
import { parentApi } from '../../api/endpoints.js';
import { useProfile } from './ProfileLayout.jsx';

/** Three steps: pick a day → pick a time → review; then a confirmation. */
export function RescheduleDialog({ open, parent, availability, onClose, onConfirm }) {
  const [step, setStep] = useState(1);
  const [day, setDay] = useState(0);
  const [slot, setSlot] = useState(availability.slots.findIndex((s) => s.open));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const summary = `${availability.days[day].long} at ${availability.slots[slot]?.time}`;

  const close = () => {
    setStep(1);
    setError(null);
    onClose();
  };
  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm(availability.days[day].long, availability.slots[slot].time);
      setStep(4);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={close} labelledBy="rs-h" width={560}>
      {step < 4 ? (
        <>
          <Kicker>Step {step} of 3</Kicker>
          <h2 id="rs-h" style={{ fontSize: 26, fontWeight: 800 }}>
            Reschedule {parent.short}'s visit
          </h2>
          {step === 1 && (
            <div className="stack" style={{ '--gap': '10px' }}>
              <div className="strong">Which day suits {parent.short}?</div>
              <div className="row" style={{ '--gap': '8px' }}>
                {availability.days.map((d, i) => (
                  <Chip key={d.long} selected={day === i} onClick={() => setDay(i)} style={{ minHeight: 60, flexDirection: 'column', display: 'flex', justifyContent: 'center' }}>
                    <span style={{ fontSize: 13 }}>{d.s}</span>
                    <span>{d.d}</span>
                  </Chip>
                ))}
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="stack" style={{ '--gap': '10px' }}>
              <div className="strong">What time? (Lahore time)</div>
              <div className="row" style={{ '--gap': '8px' }}>
                {availability.slots.map((s, i) => (
                  <Chip key={s.time} selected={slot === i} disabled={!s.open} onClick={() => setSlot(i)}>
                    {s.open ? s.time : `${s.time} · taken`}
                  </Chip>
                ))}
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="kw-notice kw-notice--normal">
              <div className="muted text-sm">New time</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{summary}</div>
              <div className="text-sm">Your nutritionist will confirm within a day. {parent.short} will get a text message too.</div>
            </div>
          )}
          {error && (
            <div role="alert" className="kw-field__error">
              {error}
            </div>
          )}
          <div className="row">
            {step > 1 && (
              <Button variant="glass" icon="arrowLeft" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
            {step < 3 && (
              <Button iconRight="arrowRight" onClick={() => setStep(step + 1)}>
                Continue
              </Button>
            )}
            {step === 3 && (
              <Button variant="cta" onClick={confirm} disabled={busy}>
                {busy ? 'Sending…' : 'Send request'}
              </Button>
            )}
            <Button variant="link" onClick={close}>
              Cancel
            </Button>
          </div>
        </>
      ) : (
        <>
          <span className="kw-icon-tile" style={{ background: 'var(--kw-normal-bg)', color: 'var(--kw-normal)' }}>
            <Icon name="checkCircle" size={26} />
          </span>
          <h2 id="rs-h" style={{ fontSize: 26, fontWeight: 800 }}>
            Request sent
          </h2>
          <p>
            We've asked to move {parent.short}'s visit to <strong>{summary}</strong>. You'll get a message when it's confirmed.
          </p>
          <Button onClick={close} style={{ alignSelf: 'flex-start' }}>
            Done
          </Button>
        </>
      )}
    </Modal>
  );
}

function VisitDetail({ visit }) {
  const list = (title, items) =>
    items?.length > 0 && (
      <div className="stack" style={{ '--gap': '6px', paddingTop: 12, borderTop: '1px solid var(--kw-rule-soft)' }}>
        <h3 className="kw-kicker kw-kicker--deep">{title}</h3>
        <ul className="stack" style={{ '--gap': '4px', listStyle: 'disc', paddingLeft: 20 }}>
          {items.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </div>
    );
  return (
    <Card pad={22} gap={14}>
      <div className="row row--between row--top">
        <div>
          <Kicker>{visit.date}</Kicker>
          <h2 style={{ fontSize: 24, fontWeight: 800 }}>{visit.title}</h2>
          <div className="muted text-sm">{visit.summary}</div>
        </div>
        {visit.dur && <span className="kw-pill">{visit.dur}</span>}
      </div>
      {visit.meas?.length > 0 && (
        <div className="grid-fill" style={{ '--min': '170px', '--gap': '10px' }}>
          {visit.meas.map((m) => (
            <div key={m.n} className="stack" style={{ '--gap': '6px', padding: 14, borderRadius: 16, background: 'rgba(255,255,255,0.6)' }}>
              <div className="muted" style={{ fontSize: 14 }}>
                {m.n}
              </div>
              <div className="strong" style={{ fontSize: 20 }}>
                {m.v}
              </div>
              <StatusTag status={m.status} />
            </div>
          ))}
        </div>
      )}
      {list('What the nutritionist noticed', visit.obs)}
      {list('Recommendations', visit.recs)}
      {list('Tests ordered', visit.tests)}
      {list('Next steps', visit.next)}
      <div className="stack" style={{ '--gap': '6px', paddingTop: 12, borderTop: '1px solid var(--kw-rule-soft)' }}>
        <h3 className="kw-kicker kw-kicker--deep">Photos from the visit</h3>
        <div className="row muted text-sm">
          <Icon name="image" /> No photos were shared from this visit.
        </div>
      </div>
    </Card>
  );
}

export function VisitsView({ parent, data, selectedId, onSelect, onReschedule }) {
  const visit = data.past.find((v) => v.id === selectedId) ?? data.past[0];
  const next = data.next;
  return (
    <div className="stack" style={{ '--gap': '20px' }}>
      {next && (
        <Card pad={24}>
          <div className="row row--between row--top">
            <div className="stack" style={{ '--gap': '6px' }}>
              <Kicker tone="teal">{next.status === 'reschedule_requested' ? 'Change requested' : 'Next home visit'}</Kicker>
              <h2 style={{ fontSize: 28, fontWeight: 800 }}>
                {next.requestedSlot?.day ?? next.date}, {next.requestedSlot?.time ?? next.time}
              </h2>
              {next.status === 'reschedule_requested' && (
                <div className="muted text-sm">
                  Was {next.date}, {next.time}. Waiting for the nutritionist to confirm.
                </div>
              )}
            </div>
            <Button variant="glass" icon="calendar" onClick={onReschedule}>
              Reschedule
            </Button>
          </div>
          {next.plan?.length > 0 && (
            <div className="stack" style={{ '--gap': '6px' }}>
              <Kicker>Plan for this visit</Kicker>
              <ul className="stack" style={{ '--gap': '4px', listStyle: 'disc', paddingLeft: 20 }}>
                {next.plan.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}
      {data.past.length === 0 ? (
        <EmptyState title="No visits yet">Once the first home visit happens, its summary will appear here.</EmptyState>
      ) : (
        <div className="split" style={{ '--a': '0.85fr', '--b': '1.6fr' }}>
          <Card pad={16} gap={6}>
            <h2 style={{ fontSize: 20, fontWeight: 800, padding: '4px 8px' }}>Past visits</h2>
            {data.past.map((v) => (
              <button key={v.id} type="button" aria-current={v.id === visit.id} className="kw-timeline__item" onClick={() => onSelect(v.id)}>
                <span className="kw-timeline__dot" />
                <span>
                  <span className="muted" style={{ fontSize: 14, display: 'block' }}>
                    {v.short}
                  </span>
                  <span className="strong" style={{ display: 'block' }}>
                    {v.title}
                  </span>
                  <span className="muted" style={{ fontSize: 15 }}>
                    {v.summary}
                  </span>
                </span>
              </button>
            ))}
          </Card>
          <VisitDetail visit={visit} />
        </div>
      )}
    </div>
  );
}

export default function VisitsPage() {
  const { parent } = useProfile();
  const [selected, setSelected] = useState(null);
  const [rescheduling, setRescheduling] = useState(false);
  const { data, error, reload } = useApi(() => parentApi.visits(parent.id), [parent.id]);
  if (error) return <EmptyState title="We couldn't load visits" action={<Button onClick={reload}>Try again</Button>} />;
  if (!data) return <SkeletonCard minHeight={400} />;
  return (
    <>
      <VisitsView parent={parent} data={data} selectedId={selected} onSelect={setSelected} onReschedule={() => setRescheduling(true)} />
      <RescheduleDialog
        open={rescheduling}
        parent={parent}
        availability={data.availability}
        onClose={() => {
          setRescheduling(false);
          reload();
        }}
        onConfirm={(day, time) => parentApi.reschedule(parent.id, day, time)}
      />
    </>
  );
}
