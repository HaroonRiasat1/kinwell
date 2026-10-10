import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BrandMark, SignOutDialog } from '../../components/layout/index.js';
import { Avatar, Button, ErrorState, Icon, Skeleton } from '../../components/ui/index.js';
import { useApi } from '../../hooks/useApi.js';
import { authApi, parentApi } from '../../api/endpoints.js';
import { LanguageSwitcher, useI18n } from '../../i18n/index.js';
import { useOptionalAuth } from '../../context/AuthContext.jsx';
import { longDate } from '../../lib/dates.js';

function Task({ title, sub, detail, done, doneLabel, onToggle }) {
  const { t } = useI18n();
  return (
    <div className={`kw-parent-task${done ? ' is-done' : ''}`}>
      <div className="grow">
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--kw-teal-700)' }}>{sub}</div>
        <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.4 }}>{title}</div>
        {detail && <div style={{ fontSize: 20, color: 'var(--kw-muted)' }}>{detail}</div>}
      </div>
      <button type="button" className="kw-parent-task__btn" aria-pressed={done} onClick={onToggle}>
        <Icon name="check" size={26} strokeWidth={3} />
        {done ? doneLabel : t('parent.done')}
      </button>
    </div>
  );
}

/**
 * The parent's own screen: one column, 24px text, a big button per task.
 * Shown in the parent's language; `familyPreview` shows it to a family member with a way back.
 */
export function ParentHomeView({ data, onToggle, familyPreview, onBack, onSignOut, onLanguage }) {
  const { t, locale } = useI18n();
  const { parent, checklist, children, nextVisit, nutritionist, latestNote } = data;
  const done = checklist.filter((i) => i.done).length;
  const supps = checklist.filter((i) => i.kind === 'supp');
  const meals = checklist.filter((i) => i.kind === 'meal');
  const nutritionistFirst = nutritionist?.name?.split(' ')[0];
  return (
    <div className="kw-backdrop">
      <div className="kw-parent-view">
        <div className="row row--between">
          <BrandMark to="." />
          {familyPreview ? (
            <Button variant="glass" onClick={onBack}>
              {t('parent.familyView')}
            </Button>
          ) : (
            <Button variant="glass" icon="signOut" onClick={onSignOut}>
              {t('common.signOut')}
            </Button>
          )}
        </div>
        <LanguageSwitcher onChange={onLanguage} />
        <div className="stack" style={{ '--gap': '10px' }}>
          <div className="muted">{longDate(new Date(), locale)}</div>
          <h1>{t('parent.greeting', { name: parent.short })}</h1>
          <p>{t('parent.progress', { done, total: checklist.length })}</p>
          <div className="kw-meter" style={{ height: 14 }} role="img" aria-label={t('parent.progressAria', { done, total: checklist.length })}>
            <span style={{ width: `${(done / Math.max(1, checklist.length)) * 100}%` }} />
          </div>
        </div>

        <section aria-labelledby="pv-supp" className="stack">
          <h2 id="pv-supp">{t('parent.vitamins')}</h2>
          {supps.map((i) => (
            <Task key={i.code} sub={i.time} title={i.simple} detail={i.dose} done={i.done} doneLabel={t('parent.taken')} onToggle={() => onToggle(i)} />
          ))}
        </section>

        <section aria-labelledby="pv-food" className="stack">
          <h2 id="pv-food">{t('parent.food')}</h2>
          {meals.map((i) => (
            <Task key={i.code} sub={i.time} title={i.simple} done={i.done} doneLabel={t('parent.eaten')} onToggle={() => onToggle(i)} />
          ))}
        </section>

        {latestNote && (
          <section aria-labelledby="pv-note" className="kw-parent-card">
            <h2 id="pv-note">{t('parent.noteFrom', { name: latestNote.from.split(' ')[0] })}</h2>
            <p style={{ lineHeight: 1.8 }}>“{latestNote.text}”</p>
            <div className="muted" style={{ fontSize: 20 }}>
              {t('parent.noteAfter', { date: latestNote.after })}
            </div>
          </section>
        )}

        {nextVisit && (
          <section aria-labelledby="pv-visit" className="kw-parent-card">
            <h2 id="pv-visit">{t('parent.nextVisit')}</h2>
            <div className="row" style={{ flexWrap: 'nowrap' }}>
              <Avatar name={nutritionist?.name} size={64} tone="sage" />
              <div>
                <div style={{ fontWeight: 800 }}>{nextVisit.nextIn}</div>
                <div>{nextVisit.date}</div>
                <div className="muted">{t('parent.willVisit', { name: nutritionistFirst })}</div>
              </div>
            </div>
          </section>
        )}

        <section className="stack" aria-labelledby="pv-call">
          <h2 id="pv-call">{t('parent.callFamily')}</h2>
          {children.map((c) =>
            c.phone ? (
              <a key={c.id} className="kw-btn kw-btn--primary kw-btn--block kw-parent-call" href={`tel:${c.phone}`}>
                <Icon name="phone" size={26} />
                <span>
                  {t('parent.call', { name: c.name })} <span className="kw-parent-call__sub">{c.city}</span>
                </span>
              </a>
            ) : (
              <div key={c.id} className="muted" style={{ fontSize: 20 }}>
                {t('parent.noPhone', { name: c.name })}
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
  const { t, lang } = useI18n();
  // Reload when the language changes so the server's content (meals, notes, dates) follows.
  const { data, error, reload, setData } = useApi(() => parentApi.home(parentId), [parentId, lang]);
  // Save the choice on the parent's account so it sticks on every device.
  const saveLanguage = (code) => {
    if (!familyPreview && auth?.user?.role === 'parent') authApi.setLanguage(code).catch(() => {});
  };

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
        <ErrorState title={t('common.somethingWrong')} onRetry={reload} retryLabel={t('common.tryAgain')}>
          {t('common.tryLater')}
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
        onLanguage={saveLanguage}
      />
      <SignOutDialog
        message={t('signOut.parentMessage')}
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
