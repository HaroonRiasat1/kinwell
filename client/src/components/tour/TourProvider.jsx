import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { useOptionalAuth } from '../../context/AuthContext.jsx';
import { useI18n } from '../../i18n/index.js';
import { Button } from '../ui/index.js';
import { TOURS, TOUR_FOR_ROLE, TOUR_HOME } from './tours.js';
import './tour.css';

const TourContext = createContext(null);

/** { start(id?), active, setTourContext(ctx) } or null outside the provider (e.g. Storybook). */
export const useTour = () => useContext(TourContext);

const storageKey = (id, userId) => `kinwell.tour.${id}.${userId ?? 'anyone'}`;
const seen = (id, userId) => {
  try {
    return localStorage.getItem(storageKey(id, userId)) === 'done';
  } catch {
    return false;
  }
};
const remember = (id, userId) => {
  try {
    localStorage.setItem(storageKey(id, userId), 'done');
  } catch {
    /* private mode: the tour may show again next time */
  }
};
const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Guided tours. Starts the role's tour once on the person's first visit to their home screen,
 * and again whenever they press "Show me around".
 */
export function TourProvider({ children }) {
  const user = useOptionalAuth()?.user;
  const { t } = useI18n();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [tour, setTour] = useState(null); // { id, steps, i, dir }
  const context = useRef({});
  const returnFocus = useRef(null);

  const setTourContext = useCallback((ctx) => {
    context.current = { ...context.current, ...ctx };
  }, []);

  const start = useCallback(
    (id = TOUR_FOR_ROLE[user?.role]) => {
      const make = TOURS[id];
      if (!make) return;
      returnFocus.current = document.activeElement;
      setTour({ id, steps: make({ t, ...context.current }), i: 0, dir: 1 });
    },
    [t, user?.role],
  );

  const end = useCallback(() => {
    setTour((s) => {
      if (s) remember(s.id, user?.id);
      return null;
    });
    returnFocus.current?.focus?.({ preventScroll: true });
  }, [user?.id]);

  const go = useCallback(
    (delta) =>
      setTour((s) => {
        if (!s) return s;
        const i = s.i + delta;
        if (i < 0) return s;
        if (i >= s.steps.length) {
          remember(s.id, user?.id);
          return null;
        }
        return { ...s, i, dir: delta };
      }),
    [user?.id],
  );

  // First visit to the home screen: start on its own (once per account, per device).
  useEffect(() => {
    if (!user || tour) return undefined;
    const id = TOUR_FOR_ROLE[user.role];
    if (!id || seen(id, user.id) || !TOUR_HOME[id]?.test(pathname)) return undefined;
    const timer = setTimeout(() => start(id), 900);
    return () => clearTimeout(timer);
  }, [user, pathname, tour, start]);

  useEffect(() => {
    if (!user) setTour(null);
  }, [user]);

  // A step on another page: go there first; the overlay waits for its element.
  const step = tour?.steps[tour.i];
  useEffect(() => {
    if (step?.route && pathname !== step.route) navigate(step.route);
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  const value = useMemo(() => ({ start, active: Boolean(tour), setTourContext }), [start, tour, setTourContext]);
  return (
    <TourContext.Provider value={value}>
      {children}
      {tour &&
        createPortal(
          <TourOverlay step={step} index={tour.i} total={tour.steps.length} dir={tour.dir} onNext={() => go(1)} onBack={() => go(-1)} onClose={end} t={t} />,
          document.body,
        )}
    </TourContext.Provider>
  );
}

const visible = (el) => {
  const r = el.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return false;
  return el.checkVisibility ? el.checkVisibility({ visibilityProperty: true, opacityProperty: true }) : true;
};
const findTarget = (name) => [...document.querySelectorAll(`[data-tour="${name}"]`)].find(visible) ?? null;
const sameRect = (a, b) => a && b && ['top', 'left', 'width', 'height'].every((k) => Math.abs(a[k] - b[k]) < 0.5);

function TourOverlay({ step, index, total, dir, onNext, onBack, onClose, t }) {
  const [rect, setRect] = useState(null);
  const [status, setStatus] = useState('finding'); // finding | shown | missing
  const [cardSize, setCardSize] = useState({ w: 380, h: 220 });
  const [viewport, setViewport] = useState({ w: window.innerWidth, h: window.innerHeight });
  const target = useRef(null);
  const card = useRef(null);
  const title = useRef(null);
  const last = index === total - 1;

  // Find the step's element (waiting for the page to load), keep it in view, follow it as it moves.
  useEffect(() => {
    target.current = null;
    if (!step.target) {
      setRect(null);
      setStatus('shown');
      return undefined;
    }
    setStatus('finding');
    let raf;
    let stopped = false;
    let scrolled = false;
    const began = performance.now();
    // Waiting for another page to load takes a moment; on this page, a missing element means
    // it isn't shown at this screen size, so move on quickly.
    const patience = step.route && step.route !== window.location.pathname ? 5000 : 1200;
    const tick = () => {
      if (stopped) return;
      if (!target.current?.isConnected) {
        target.current = findTarget(step.target);
        scrolled = false;
      }
      const el = target.current;
      if (el) {
        if (!scrolled) {
          const tall = el.getBoundingClientRect().height > window.innerHeight * 0.6;
          el.scrollIntoView({ block: tall ? 'start' : 'center', inline: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' });
          scrolled = true;
        }
        // Spotlight only the part that is on screen (a tall card can be taller than the window).
        const r = el.getBoundingClientRect();
        // When the card can't sit beside the element (phones, very wide elements), keep the
        // bottom part of the screen free for it.
        const top = Math.max(r.top, 8);
        const noSideRoom = window.innerWidth < 640 || r.width > window.innerWidth - 440;
        const room = noSideRoom ? window.innerHeight * 0.55 : window.innerHeight - 16;
        const bottom = Math.min(r.bottom, window.innerHeight - 8, top + room);
        const next = { top, left: r.left, width: r.width, height: Math.max(0, bottom - top) };
        setRect((prev) => (sameRect(prev, next) ? prev : next));
        setStatus('shown');
      } else {
        // Not there (yet): dim the whole page rather than spotlight the previous step's element.
        setRect(null);
        if (performance.now() - began > patience) {
          setStatus('missing');
          return;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
    };
  }, [step]);

  // Not on this screen (e.g. a sidebar button on a phone): skip it in the direction of travel.
  useEffect(() => {
    if (status === 'missing') (dir < 0 && index > 0 ? onBack : onNext)();
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  // "Tap here" steps: tapping the real control moves the tour on.
  useEffect(() => {
    const el = target.current;
    if (!step.click || status !== 'shown' || !el) return undefined;
    const onTap = () => setTimeout(onNext, 0);
    el.addEventListener('click', onTap);
    return () => el.removeEventListener('click', onTap);
  }, [step, status]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      else if (e.key === 'ArrowRight') onNext();
      else if (e.key === 'ArrowLeft') onBack();
    };
    const onResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  }, [onNext, onBack, onClose]);

  useLayoutEffect(() => {
    if (card.current) setCardSize({ w: card.current.offsetWidth, h: card.current.offsetHeight });
  }, [step, viewport.w]);

  useEffect(() => {
    if (status === 'shown') title.current?.focus({ preventScroll: true });
  }, [status, step]);

  const { w: vw, h: vh } = viewport;
  const spotlit = step.target && rect;
  const margin = 12;
  const phone = vw < 640;

  // Where the card goes: beside the element on wide screens, a sheet above or below it on phones.
  let cardStyle;
  if (!spotlit) cardStyle = { left: Math.max(margin, (vw - cardSize.w) / 2), top: Math.max(margin, (vh - cardSize.h) / 2) };
  else if (phone) cardStyle = { left: margin, right: margin, top: rect.top + rect.height / 2 > vh / 2 ? margin : vh - cardSize.h - margin };
  else {
    const below = rect.top + rect.height + 18;
    const above = rect.top - 18 - cardSize.h;
    const right = rect.left + rect.width + 18;
    let top;
    let left = Math.min(Math.max(margin, rect.left + rect.width / 2 - cardSize.w / 2), vw - cardSize.w - margin);
    if (below + cardSize.h <= vh - margin) top = below;
    else if (above >= margin) top = above;
    else if (right + cardSize.w <= vw - margin) {
      left = right;
      top = Math.min(Math.max(margin, rect.top), vh - cardSize.h - margin);
    } else if (rect.left - 18 - cardSize.w >= margin) {
      left = rect.left - 18 - cardSize.w;
      top = Math.min(Math.max(margin, rect.top), vh - cardSize.h - margin);
    } else top = vh - cardSize.h - margin;
    cardStyle = { left, top };
  }

  const pad = 8;
  const hole = spotlit
    ? { top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }
    : { top: vh / 2, left: vw / 2, width: 0, height: 0 };

  return (
    <div className={`kw-tour${status === 'shown' ? ' is-ready' : ''}`}>
      {/* Clicks outside the highlighted control are held back; inside it, they reach the page only on "tap here" steps. */}
      <div className="kw-tour__block" style={{ top: 0, left: 0, right: 0, height: Math.max(0, hole.top) }} />
      <div className="kw-tour__block" style={{ top: hole.top + hole.height, left: 0, right: 0, bottom: 0 }} />
      <div className="kw-tour__block" style={{ top: hole.top, left: 0, width: Math.max(0, hole.left), height: hole.height }} />
      <div className="kw-tour__block" style={{ top: hole.top, left: hole.left + hole.width, right: 0, height: hole.height }} />
      {!step.click && <div className="kw-tour__block" style={hole} />}

      <div className={`kw-tour__spot${spotlit ? '' : ' is-empty'}${step.click ? ' is-tap' : ''}`} style={hole} aria-hidden="true" />
      {spotlit && step.click && (
        <div className="kw-tour__pointer" style={{ top: rect.top + rect.height * 0.55, left: rect.left + Math.min(rect.width * 0.62, rect.width - 14) }} aria-hidden="true">
          <span className="kw-tour__ripple" />
          <svg width="30" height="30" viewBox="0 0 24 24">
            <path d="M5 2.5v17.2l4.6-4.3 3.1 6.6 3-1.4-3.1-6.5h6.2z" fill="#fff" stroke="#1f2a28" strokeWidth="1.6" strokeLinejoin="round" />
          </svg>
        </div>
      )}

      <div ref={card} className={`kw-tour__card${phone && spotlit ? ' is-sheet' : ''}`} style={cardStyle} role="dialog" aria-modal="true" aria-labelledby="kw-tour-title" aria-describedby="kw-tour-text">
        <div className="kw-tour__top">
          <span className="kw-tour__count">{t('tour.step', { n: index + 1, total })}</span>
          <button type="button" className="kw-tour__skip" onClick={onClose}>
            {t('tour.skip')}
          </button>
        </div>
        <div className="kw-tour__bar" aria-hidden="true">
          <span style={{ width: `${((index + 1) / total) * 100}%` }} />
        </div>
        <h2 id="kw-tour-title" ref={title} tabIndex={-1}>
          {step.title}
        </h2>
        <p id="kw-tour-text">{step.text}</p>
        {step.click && <p className="kw-tour__hint">{t('tour.tapHere')}</p>}
        <div className="kw-tour__actions">
          {index > 0 && (
            <Button variant="glass" size="sm" onClick={onBack}>
              {t('tour.back')}
            </Button>
          )}
          <Button size="sm" onClick={onNext}>
            {last ? t('tour.done') : t('tour.next')}
          </Button>
        </div>
      </div>
    </div>
  );
}
