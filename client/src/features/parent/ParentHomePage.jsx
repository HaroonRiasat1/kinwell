import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BrandMark, SignOutDialog } from '../../components/layout/index.js';
import { Avatar, Button, ErrorState, Icon, Skeleton } from '../../components/ui/index.js';
import { useApi } from '../../hooks/useApi.js';
import { parentApi } from '../../api/endpoints.js';
import { useOptionalAuth } from '../../context/AuthContext.jsx';
import { longDate } from '../../lib/dates.js';

function Task({ title, sub, detail, done, doneLabel, onToggle }) {
  return (
    <div className={`kw-parent-task${done ? ' is-done' : ''}`}>
      <div className="grow">
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--kw-teal-700)' }}>{sub}</div>
        <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.2 }}>{title}</div>
        {detail && <div style={{ fontSize: 20, color: 'var(--kw-muted)' }}>{detail}</div>}
      </div>
      <button type="button" className="kw-parent-task__btn" aria-pressed={done} onClick={onToggle}>
        <Icon name="check" size={26} strokeWidth={3} />
        {done ? doneLabel : 'Done'}
      </button>
    </div>
  );
}

/**
 * The parent's own screen: one column, 24px text, a big button per task.
 * `familyPreview` shows it to a family member with a way back.
 */
export function ParentHomeView({ data, onToggle, familyPreview, onBack, onSignOut }) {
  const { parent, checklist, children, nextVisit, nutritionist, latestNote } = data;
  const done = checklist.filter((i) => i.done).length;
  const supps = checklist.filter((i) => i.kind === 'supp');
  const meals = checklist.filter((i) => i.kind === 'meal');
  return (
    <div className="kw-backdrop">
      <div className="kw-parent-view">
        <div className="row row--between">
          <BrandMark to="." />
          {familyPreview ? (
            <Button variant="glass" onClick={onBack}>
              Family view
            </Button>
          ) : (
            <Button variant="glass" icon="signOut" onClick={onSignOut}>
              Sign out
            </Button>
          )}
        </div>
        <div className="stack" style={{ '--gap': '10px' }}>
          <div className="muted">{longDate()}</div>
          <h1>Assalam-o-Alaikum, {parent.short}</h1>
          <p>
            You've done <strong>{done} of {checklist.length}</strong> things today.
          </p>
          <div className="kw-meter" style={{ height: 14 }} role="img" aria-label={`${done} of ${checklist.length} done`}>
            <span style={{ width: `${(done / Math.max(1, checklist.length)) * 100}%` }} />
          </div>
        </div>

        <section aria-labelledby="pv-supp" className="stack">
          <h2 id="pv-supp">Your vitamins</h2>
          {supps.map((i) => (
            <Task key={i.code} sub={i.time} title={i.simple} detail={i.dose} done={i.done} doneLabel="Taken" onToggle={() => onToggle(i)} />
          ))}
        </section>

        <section aria-labelledby="pv-food" className="stack">
          <h2 id="pv-food">What to eat today</h2>
          {meals.map((i) => (
            <Task key={i.code} sub={i.time} title={i.simple} done={i.done} doneLabel="Eaten" onToggle={() => onToggle(i)} />
          ))}
        </section>

        {latestNote && (
          <section aria-labelledby="pv-note" className="kw-parent-card">
            <h2 id="pv-note">A note from {latestNote.from.split(' ')[0]}</h2>
            <p style={{ lineHeight: 1.5 }}>“{latestNote.text}”</p>
            <div className="muted" style={{ fontSize: 20 }}>
              After the visit on {latestNote.after}
            </div>
          </section>
        )}

        {nextVisit && (
          <section aria-labelledby="pv-visit" className="kw-parent-card">
            <h2 id="pv-visit">Your next visit</h2>
            <div className="row" style={{ flexWrap: 'nowrap' }}>
              <Avatar name={nutritionist?.name} size={64} tone="sage" />
              <div>
                <div style={{ fontWeight: 800 }}>{nextVisit.nextIn}</div>
                <div>{nextVisit.date}</div>
                <div className="muted">{nutritionist?.name} will come to your home.</div>
              </div>
            </div>
          </section>
        )}

        <section className="stack" aria-labelledby="pv-call">
          <h2 id="pv-call">Call your family</h2>
          {children.map((c) =>
            c.phone ? (
              <a key={c.id} className="kw-btn kw-btn--primary kw-btn--block kw-parent-call" href={`tel:${c.phone}`}>
                <Icon name="phone" size={26} />
                <span>
                  Call {c.name} <span className="kw-parent-call__sub">{c.city}</span>
                </span>
              </a>
            ) : (
              <div key={c.id} className="muted" style={{ fontSize: 20 }}>
                {c.name} hasn't added a phone number yet.
              </div>
            ),
          )}
        </section>
      </div>
    </div>
  );
}

export default function ParentHomePage({ familyPreview = false }) {
  const params = useParams();
  const auth = useOptionalAuth();
  const navigate = useNavigate();
  const parentId = params.parentId ?? auth?.user?.parent;
  const [signingOut, setSigningOut] = useState(false);
  const { data, error, reload, setData } = useApi(() => parentApi.home(parentId), [parentId]);

  const toggle = async (item) => {
    const flip = (v) => (d) => ({ ...d, checklist: d.checklist.map((i) => (i.code === item.code ? { ...i, done: v } : i)) });
    setData(flip(!item.done));
    try {
      await parentApi.setChecklist(parentId, item.code, !item.done);
    } catch {
      setData(flip(item.done));
    }
  };

  if (error) {
    return (
      <div className="kw-backdrop kw-parent-view">
        <ErrorState title="Something went wrong" onRetry={reload}>
          Please try again in a moment.
        </ErrorState>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="kw-backdrop kw-parent-view">
        <Skeleton height={56} width="70%" block />
        <Skeleton height={120} block soft />
        <Skeleton height={120} block soft />
      </div>
    );
  }
  return (
    <>
      <ParentHomeView
        data={data}
        onToggle={toggle}
        familyPreview={familyPreview}
        onBack={() => navigate(`/family/${parentId}/dashboard`)}
        onSignOut={() => setSigningOut(true)}
      />
      <SignOutDialog
        message="To sign back in, you'll need a new code from your family."
        open={signingOut}
        onCancel={() => setSigningOut(false)}
        onConfirm={async (everywhere) => {
          await auth?.signOut(everywhere);
          navigate('/signed-out?as=parent', { replace: true });
        }}
      />
    </>
  );
}
