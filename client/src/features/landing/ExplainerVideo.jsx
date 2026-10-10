import { useEffect, useRef, useState } from 'react';
import { Avatar, Icon, StatusTag } from '../../components/ui/index.js';
import './explainer.css';

// A self-playing "how it works" film made of real UI pieces and CSS animation. Each scene is
// re-mounted when it starts, so its animations play from the beginning; pausing pauses them.

const SCENE_MS = 6500;

/** Tiny helper: an element that animates in after `d` seconds. */
const at = (d) => ({ '--d': `${d}s` });

function VisitScene() {
  const rows = [
    ['Blood pressure', '128/82', 'mmHg', 'normal'],
    ['Fasting sugar', '112', 'mg/dL', 'watch'],
    ['Weight', '63.5', 'kg', 'normal'],
  ];
  return (
    <div className="ex-device ex-in" style={at(0)}>
      <div className="ex-device__head">
        <Avatar name="Hina" size={40} tone="sage" />
        <div className="grow" style={{ lineHeight: 1.25 }}>
          <div className="strong">Home visit · Fatima Rahman (Ammi)</div>
          <div className="muted text-xs">Model Town, Lahore · Mon 12 Oct, 11 am</div>
        </div>
      </div>
      {rows.map(([label, value, unit, status], i) => (
        <div key={label} className="ex-reading ex-in" style={at(0.4 + i * 0.9)}>
          <span className="ex-reading__label">{label}</span>
          <span className="ex-reading__value">
            <span className="ex-type" style={at(0.6 + i * 0.9)}>
              {value}
            </span>{' '}
            <small>{unit}</small>
          </span>
          <span className="ex-pop" style={at(1.2 + i * 0.9)}>
            <StatusTag status={status} />
          </span>
        </div>
      ))}
      <div className="ex-swap ex-device__save">
        <span className="ex-btn ex-btn--primary ex-in ex-out" style={{ '--d': '3.6s', '--o': '4.4s' }}>
          Save visit
        </span>
        <span className="ex-btn ex-btn--done ex-pop" style={at(4.4)}>
          <Icon name="checkCircle" size={18} /> Saved · family told
        </span>
        <span className="ex-tap" style={{ '--d': '4.1s', right: '22%' }} />
      </div>
    </div>
  );
}

function PlanScene() {
  const meals = [
    ['Breakfast', 'Daliya with milk & almonds', 'Blood sugar'],
    ['Lunch', 'Moong dal, palak & 1 chapati', 'Iron'],
    ['Dinner', 'Grilled rohu, brown rice & salad', 'Cholesterol'],
  ];
  return (
    <div className="ex-device ex-in" style={at(0)}>
      <div className="ex-device__head">
        <span className="ex-icon">
          <Icon name="utensils" size={20} />
        </span>
        <div className="grow" style={{ lineHeight: 1.25 }}>
          <div className="strong">Ammi’s plan · this week</div>
          <div className="muted text-xs">Made by Hina from her latest results</div>
        </div>
      </div>
      {meals.map(([slot, dish, helps], i) => (
        <div key={slot} className="ex-meal ex-slide" style={at(0.5 + i * 0.7)}>
          <span className="ex-meal__slot">{slot}</span>
          <span className="ex-meal__dish">{dish}</span>
          <span className="ex-chip ex-pop" style={at(1 + i * 0.7)}>
            Helps: {helps}
          </span>
        </div>
      ))}
      <div className="ex-banner ex-in" style={at(3.4)}>
        <Icon name="checkCircle" size={18} /> Published · Sana and Bilal can see it
      </div>
    </div>
  );
}

function ChecklistScene() {
  const C = 2 * Math.PI * 34;
  return (
    <div className="ex-phone ex-in" style={at(0)}>
      <div className="ex-phone__screen ex-parent">
        <div className="ex-parent__hi">Assalam-o-Alaikum, Ammi</div>
        <div className="ex-ring-row">
          <svg width="84" height="84" viewBox="0 0 84 84" aria-hidden="true">
            <circle cx="42" cy="42" r="34" className="ex-ring__track" />
            <circle cx="42" cy="42" r="34" className="ex-ring__fill" style={{ strokeDasharray: C, '--from': C * 0.5, '--to': C * 0.25 }} transform="rotate(-90 42 42)" />
          </svg>
          <div className="ex-swap" style={{ fontWeight: 800, fontSize: 20 }}>
            <span className="ex-out" style={{ '--o': '3s' }}>2 of 4 done</span>
            <span className="ex-pop" style={at(3)}>3 of 4 done</span>
          </div>
        </div>
        <div className="ex-task is-done ex-in" style={at(0.4)}>
          <div className="grow">
            <div className="ex-task__time">8:00 am</div>
            <div className="ex-task__title">Daliya breakfast</div>
          </div>
          <span className="ex-task__btn is-done">
            <Icon name="check" size={20} strokeWidth={3} /> Eaten
          </span>
        </div>
        <div className="ex-task ex-in" style={at(0.8)}>
          <div className="grow">
            <div className="ex-task__time">9:00 am</div>
            <div className="ex-task__title">Vitamin D tablet</div>
          </div>
          <span className="ex-swap">
            <span className="ex-task__btn ex-out" style={{ '--o': '2.7s' }}>
              <Icon name="check" size={20} strokeWidth={3} /> Done
            </span>
            <span className="ex-task__btn is-done ex-pop" style={at(2.7)}>
              <Icon name="check" size={20} strokeWidth={3} /> Taken
            </span>
            <span className="ex-tap" style={{ '--d': '2.4s', left: '30%' }} />
          </span>
        </div>
        <div className="ex-toast ex-drop" style={at(3.8)}>
          <Icon name="message" size={16} /> Sana sees it in London, 5:00 am her time
        </div>
      </div>
    </div>
  );
}

function LabScene() {
  const lines = [
    ['Glucose Fasting', '118', 'mg/dL'],
    ['HbA1c', '6.4', '%'],
    ['Vitamin D (25-OH)', '18.2', 'ng/mL'],
    ['Hemoglobin', '11.6', 'g/dL'],
  ];
  const results = [
    ['Fasting sugar', '118 mg/dL', 'watch'],
    ['HbA1c', '6.4 %', 'watch'],
    ['Vitamin D', '18.2 ng/mL', 'attention'],
    ['Hemoglobin', '11.6 g/dL', 'watch'],
  ];
  return (
    <div className="ex-lab">
      <div className="ex-paper ex-in" style={at(0)}>
        <div className="ex-paper__lab">CHUGHTAI LAB</div>
        <div className="ex-paper__meta">Fatima Rahman · 72 Y / F · 26-Sep-2026</div>
        {lines.map(([n, v, u], i) => (
          <div key={n} className="ex-paper__row">
            <span>{n}</span>
            <b className="ex-hl" style={at(0.9 + i * 0.45)}>
              {v}
            </b>
            <span>{u}</span>
          </div>
        ))}
        <div className="ex-paper__fine" />
        <div className="ex-paper__fine" style={{ width: '60%' }} />
        <span className="ex-scan" />
      </div>
      <div className="ex-arrow ex-pop" style={at(2.6)}>
        <Icon name="arrowRight" size={22} />
      </div>
      <div className="ex-results">
        <div className="ex-results__head ex-in" style={at(2.7)}>
          <Icon name="flask" size={18} /> Found 4 results · check, then save
        </div>
        {results.map(([n, v, s], i) => (
          <div key={n} className="ex-result ex-slide" style={at(3 + i * 0.35)}>
            <span className="grow strong">{n}</span>
            <span className="ex-result__v">{v}</span>
            <StatusTag status={s} size="sm" />
          </div>
        ))}
      </div>
    </div>
  );
}

function FamilyScene() {
  return (
    <div className="ex-phone ex-in" style={at(0)}>
      <div className="ex-phone__screen">
        <div className="ex-phone__status">
          <span>London 7:40 pm</span>
          <span>Lahore 11:40 pm</span>
        </div>
        <div className="ex-notif ex-drop" style={at(0.5)}>
          <span className="ex-notif__app">K</span>
          <div style={{ lineHeight: 1.3 }}>
            <div className="strong" style={{ fontSize: 14 }}>
              Kinwell · Ammi’s visit note
            </div>
            <div className="text-xs muted">Hina: “Her blood sugar has come down again.”</div>
          </div>
        </div>
        <div className="ex-card ex-in" style={at(1.6)}>
          <div className="row row--between">
            <span className="strong">Ammi at a glance</span>
            <StatusTag status="watch" />
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>Mostly steady</div>
          <p className="text-sm" style={{ color: 'var(--kw-ink-2)', lineHeight: 1.4 }}>
            Sugar is coming down. Hina added a vitamin D supplement.
          </p>
        </div>
        <div className="ex-alert ex-in" style={at(2.8)}>
          <span className="ex-alert__dot" />
          <div className="grow text-sm">
            <b>Vitamin D</b> is low
          </div>
          <span className="ex-btn ex-btn--small">See plan</span>
        </div>
        <div className="ex-reply ex-in" style={at(4)}>
          <Avatar name="Sana" size={30} tone="deep" />
          <span className="ex-bubble">
            Thank you Hina! I’ll call Ammi tomorrow <span className="ex-caret" />
          </span>
        </div>
      </div>
    </div>
  );
}

export const SCENES = [
  { title: 'A nutritionist visits at home', text: 'Hina checks Ammi’s blood pressure, sugar and weight. Each reading is checked as she types it and graded on the spot.', Scene: VisitScene },
  { title: 'A plan from her own kitchen', text: 'Desi meals, each linked to the result it helps. When Hina publishes the week, the whole family can see it.', Scene: PlanScene },
  { title: 'Ammi ticks off her day', text: 'Big buttons, big text, nothing to learn. One tap when a tablet is taken, and her children see it wherever they are.', Scene: ChecklistScene },
  { title: 'Lab reports, read in seconds', text: 'Snap a photo or add the PDF. The numbers are read on the phone, checked by you, and graded against healthy ranges.', Scene: LabScene },
  { title: 'You see it all, in plain words', text: 'A clear note after every visit, and alerts only when something needs you, with what’s already being done about it.', Scene: FamilyScene },
];

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function ExplainerVideo({ autoPlay = true }) {
  const [scene, setScene] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(() => autoPlay && !reducedMotion());
  const [visible, setVisible] = useState(false);
  const userPaused = useRef(!autoPlay);
  const root = useRef(null);

  // Play only while on screen.
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return setVisible(true);
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.35 });
    io.observe(root.current);
    return () => io.disconnect();
  }, []);

  // ...and only while the browser tab is in front.
  const [pageShown, setPageShown] = useState(() => typeof document === 'undefined' || !document.hidden);
  useEffect(() => {
    const onChange = () => setPageShown(!document.hidden);
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);

  const running = playing && visible && pageShown;
  useEffect(() => {
    if (!running) return undefined;
    const t = setInterval(() => setElapsed((e) => e + 100), 100);
    return () => clearInterval(t);
  }, [running]);
  useEffect(() => {
    if (elapsed < SCENE_MS) return;
    setScene((s) => (s + 1) % SCENES.length);
    setElapsed(0);
  }, [elapsed]);

  const go = (i) => {
    setScene(i);
    setElapsed(0);
    if (!userPaused.current && !reducedMotion()) setPlaying(true);
  };
  const toggle = () => {
    userPaused.current = playing;
    setPlaying(!playing);
  };

  const { Scene, title, text } = SCENES[scene];
  // Not started (or reduced motion): show the scene's finished state rather than a blank first
  // frame. Paused part-way: freeze it. The key re-mounts the scene so it replays when play starts.
  const still = !running && elapsed === 0;
  return (
    <div className="ex" ref={root}>
      <div className={`ex-stage lp-glass${still ? ' is-still' : running ? '' : ' is-paused'}`}>
        <div className="ex-stage__inner" key={`${scene}-${still}`} aria-hidden="true">
          <Scene />
        </div>
        <button type="button" className="ex-play" onClick={toggle} aria-label={playing ? 'Pause the walkthrough' : 'Play the walkthrough'}>
          {playing ? (
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="6" y="5" width="4" height="14" rx="1.2" fill="currentColor" />
              <rect x="14" y="5" width="4" height="14" rx="1.2" fill="currentColor" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" fill="currentColor" />
            </svg>
          )}
        </button>
      </div>

      <div className="ex-caption" aria-live="off">
        <span className="ex-caption__n">0{scene + 1}</span>
        <div>
          <h3>{title}</h3>
          <p>{text}</p>
        </div>
      </div>

      <div className="ex-chapters" role="group" aria-label="Chapters">
        {SCENES.map((s, i) => (
          <button key={s.title} type="button" className={`ex-chapter${i === scene ? ' is-current' : ''}`} onClick={() => go(i)} aria-current={i === scene ? 'step' : undefined} aria-label={`Chapter ${i + 1}: ${s.title}`}>
            <span className="ex-chapter__bar">
              <span style={{ width: `${i < scene ? 100 : i === scene ? Math.min(100, (elapsed / SCENE_MS) * 100) : 0}%` }} />
            </span>
            <span className="ex-chapter__label">{s.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
