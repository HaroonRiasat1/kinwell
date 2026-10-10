import { useEffect, useRef, useState } from 'react';
import { BrandMark } from '../../components/layout/index.js';
import { Avatar, Button, CheckRow, Icon, Kicker, ProgressRing, StatusTag, TrendChart } from '../../components/ui/index.js';
import { MarkerCard } from '../family/DashboardPage.jsx';
// Example data from the design (the Rahman family) so previews are real components, not screenshots.
import { dashboard, labs } from '../../mocks/fixtures.js';
import { ExplainerVideo } from './ExplainerVideo.jsx';
import './landing.css';

const demo = dashboard('ammi');
const sugar = labs('ammi').markers.find((m) => m.name === 'Fasting blood sugar');
const b12 = labs('ammi').markers.find((m) => m.name === 'Vitamin B12');

/** Adds .is-in to every .lp-reveal element as it scrolls into view. */
function useReveal() {
  const root = useRef(null);
  useEffect(() => {
    const els = root.current?.querySelectorAll('.lp-reveal') ?? [];
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-in'));
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return root;
}

function Nav() {
  return (
    <div className="lp-nav lp-wrap">
      <nav className="lp-nav__bar lp-glass" aria-label="Main">
        <BrandMark to="/" />
        <div className="lp-nav__links">
          <a href="#how">How it works</a>
          <a href="#watch">Watch</a>
          <a href="#who">Who it's for</a>
          <a href="#features">Features</a>
          <a href="#faq">Questions</a>
        </div>
        <div className="row" style={{ '--gap': '8px', flexWrap: 'nowrap' }}>
          <Button variant="glass" to="/login" className="lp-nav__cta-secondary">
            Sign in
          </Button>
          <Button variant="primary" to="/onboarding">
            Get started
          </Button>
        </div>
      </nav>
    </div>
  );
}

function HeroCollage() {
  const p = demo.parent;
  const done = demo.checklist.filter((i) => i.done).length;
  return (
    <div className="lp-collage" aria-hidden="true">
      <div className="lp-collage__main lp-glass">
        <div className="row" style={{ '--gap': '10px' }}>
          <Avatar name="Ammi" size={44} tone="sage" />
          <div className="grow" style={{ lineHeight: 1.2 }}>
            <div className="strong">Ammi, 72</div>
            <div className="muted text-xs">Model Town, Lahore</div>
          </div>
          <StatusTag status={p.overall} />
        </div>
        <div>
          <Kicker>Health at a glance</Kicker>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>{p.overallTitle}</div>
          <p className="text-sm" style={{ color: 'var(--kw-ink-2)', maxWidth: '40ch' }}>
            {p.overallText}
          </p>
        </div>
        <ul style={{ borderTop: '1px solid var(--kw-rule)' }}>
          {demo.checklist.slice(0, 2).map((it) => (
            <li key={it.code}>
              <CheckRow title={it.title} meta={`${it.kind === 'supp' ? 'Supplement' : 'Meal'} · ${it.time}`} done={it.done} onToggle={() => {}} />
            </li>
          ))}
        </ul>
      </div>
      <div className="lp-collage__ring lp-glass">
        <div className="row" style={{ '--gap': '14px', flexWrap: 'nowrap' }}>
          <ProgressRing done={done} total={demo.checklist.length} size={78} />
          <div style={{ lineHeight: 1.3 }}>
            <div className="strong" style={{ fontSize: 18 }}>
              {done} of {demo.checklist.length} done
            </div>
            <div className="muted text-xs">Ticked by Ammi today</div>
          </div>
        </div>
      </div>
      <div className="lp-collage__toast lp-glass">
        <Avatar name="Hina" size={40} tone="sage" />
        <div style={{ lineHeight: 1.3 }}>
          <div className="strong" style={{ fontSize: 15 }}>
            New visit summary
          </div>
          <div className="muted" style={{ fontSize: 14 }}>
            “Her blood sugar has come down again.”
          </div>
        </div>
      </div>
      <div className="lp-collage__chart lp-glass">
        <div className="row row--between" style={{ marginBottom: 6 }}>
          <span className="strong">{sugar.name}</span>
          <span className="muted text-xs">Apr – Sep</span>
        </div>
        <div className="lp-mini-chart">
          <TrendChart marker={sugar} who="Results" />
        </div>
      </div>
    </div>
  );
}

const STEPS = [
  {
    title: 'A dietitian visits at home',
    text: 'A registered nutritionist comes to your parents every four weeks. They check vitals, look at lab results and talk about food the family actually cooks.',
    icon: 'home',
  },
  {
    title: 'A plan that fits their kitchen',
    text: 'Daliya, moong dal, grilled rohu: desi meals, each one linked to the lab result it helps. Supplements are checked against every medicine they take.',
    icon: 'utensils',
  },
  {
    title: 'You see it all, in plain words',
    text: 'Wherever you live, you get a clear update after every visit, a daily checklist your parents tick off, and alerts only when something needs you.',
    icon: 'message',
  },
];

const AUDIENCES = {
  family: {
    label: 'Children abroad',
    title: 'Know how Mom and Dad are doing in a minute.',
    points: ['“Mostly steady” or “needs attention”, never medical jargon', 'See what they ticked off today, in your time zone', 'Every lab result with its healthy range and trend', 'Message the nutritionist and your siblings in one thread'],
  },
  parent: {
    label: 'Parents',
    title: 'Big buttons. Big text. Nothing to learn.',
    points: ['Sign in with a 6-digit text code: no passwords', 'One tap when a tablet is taken or a meal is eaten', 'See when the nutritionist is coming next', 'Call your children straight from the app'],
  },
  nutritionist: {
    label: 'Nutritionists',
    title: 'Built for the home visit, on a tablet.',
    points: ['Today’s clients, sorted by who needs attention', 'Large fields with last visit’s values side by side', 'Drag-and-drop meal plans linked to lab results', 'Send the family a plain-language update in one step'],
  },
};

function AudienceStage({ who }) {
  if (who === 'parent') {
    const supp = demo.checklist.filter((i) => i.kind === 'supp').slice(0, 2);
    return (
      <div className="stack" style={{ width: '100%', maxWidth: 440, fontSize: 22 }}>
        <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.03em' }}>Assalam-o-Alaikum, Ammi</div>
        {supp.map((s) => (
          <div key={s.code} className={`kw-parent-task${s.done ? ' is-done' : ''}`}>
            <div className="grow">
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--kw-teal-700)' }}>{s.time}</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{s.simple}</div>
            </div>
            <span className="kw-parent-task__btn" style={{ fontSize: 20, minHeight: 54, minWidth: 110 }}>
              <Icon name="check" size={22} strokeWidth={3} />
              {s.done ? 'Taken' : 'Done'}
            </span>
          </div>
        ))}
      </div>
    );
  }
  if (who === 'nutritionist') {
    const rows = [
      ['Fatima Rahman (Ammi)', 'Model Town', 'watch', 'Mon 12 Oct, 11 am'],
      ['Tariq Rahman (Abbu)', 'Model Town', 'attention', 'Mon 12 Oct, 12 pm'],
      ['Zubaida Khan', 'Gulberg', 'normal', 'Fri 16 Oct, 10 am'],
    ];
    return (
      <div className="stack" style={{ width: '100%', '--gap': '10px' }}>
        {rows.map(([name, area, status, next]) => (
          <div key={name} className="lp-glass row" style={{ padding: 14, borderRadius: 20, flexWrap: 'nowrap' }}>
            <Avatar name={name} size={40} />
            <div className="grow" style={{ lineHeight: 1.25 }}>
              <div className="strong">{name}</div>
              <div className="muted text-xs">
                {area} · next {next}
              </div>
            </div>
            <StatusTag status={status} />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="grid-auto" style={{ '--min': '200px', '--gap': '12px', width: '100%' }}>
      {demo.markers.slice(0, 4).map((m) => (
        <MarkerCard key={m.name} marker={m} />
      ))}
    </div>
  );
}

const FEATURES = [
  { span: 'lp-span-4', icon: 'flask', title: 'Lab results you can actually read', text: 'Upload a PDF or a photo of any report: Chughtai, Excel, Shaukat Khanum or one from abroad. Each result gets its healthy range, a six-month trend and a sentence on what it means.', chart: true },
  { span: 'lp-span-2', icon: 'pill', title: 'Supplements, checked', text: 'Every supplement is checked against current medicines. Interactions are explained in plain words, with who checked and when.' },
  { span: 'lp-span-2', icon: 'bell', title: 'Alerts only when needed', text: 'A missed tablet, an overdue test, a result that’s rising. Each one says what to do next.' },
  { span: 'lp-span-2', icon: 'calendar', title: 'Visits on your schedule', text: 'See the next visit in your time and theirs. Move it in three taps.' },
  { span: 'lp-span-2', icon: 'lock', title: 'Private by design', text: 'Only the family, the assigned nutritionist and the parent can see a record. Sign out of every device at once.' },
];

const FAQ = [
  ['Where do you visit?', 'Kinwell nutritionists visit homes across Lahore today, including Model Town, Gulberg, DHA, Johar Town and Cantt. More cities are planned.'],
  ['Who are the nutritionists?', 'Registered dietitians and clinical nutritionists. You can see each one’s experience, languages and the areas they cover before you choose.'],
  ['My parents aren’t good with phones. Will this work?', 'Yes. Their view has one column, 24px text and one big button per task. They sign in with a code sent by text message, so there’s no password to remember.'],
  ['Can my brothers and sisters see the updates too?', 'Yes. Invite them during setup and choose whether each person can only view, or view and edit.'],
  ['Does this replace their doctor?', 'No. Kinwell looks after food, supplements and day-to-day habits, and works alongside their doctors. Nutritionists share trends with the family’s doctor when it helps.'],
];

export default function LandingPage() {
  const root = useReveal();
  const [who, setWho] = useState('family');
  const aud = AUDIENCES[who];
  return (
    // The website is in English: keep it English and left-to-right even when this device's app
    // language is Urdu (which sets dir="rtl" on the whole document).
    <div className="lp" ref={root} lang="en" dir="ltr">
      <div className="lp-aurora" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="lp-grain" aria-hidden="true" />

      <Nav />

      <main>
        <section className="lp-wrap lp-hero">
          <div className="stack" style={{ '--gap': '26px' }}>
            <span className="lp-eyebrow">
              <i>
                <Icon name="home" size={13} />
              </i>
              Home nutrition care for parents in Lahore
            </span>
            <h1>
              Know how Mom and Dad are doing, <span className="lp-grad">wherever you are.</span>
            </h1>
            <p className="lp-lead">
              A registered nutritionist visits your parents at home. You get clear, plain-language updates, a daily checklist they tick off, and alerts only when something needs you.
            </p>
            <div className="lp-hero__ctas">
              <Button variant="cta" to="/onboarding" iconRight="arrowRight">
                Set up your family
              </Button>
              <Button variant="glass" to="/login">
                Sign in
              </Button>
            </div>
            <div className="lp-proof">
              <div className="lp-proof__faces">
                <Avatar name="Sana" size={38} tone="deep" />
                <Avatar name="Bilal" size={38} tone="coral" />
                <Avatar name="Hina" size={38} tone="sage" />
              </div>
              Families in London, Dubai, Toronto and beyond, with one shared view of their parents’ health.
            </div>
          </div>
          <HeroCollage />
        </section>

        <div className="lp-wrap lp-reveal">
          <div className="lp-strip lp-glass">
            <span>
              <Icon name="checkCircle" /> Registered dietitians
            </span>
            <span>
              <Icon name="home" /> Visits at home
            </span>
            <span>
              <Icon name="calendar" /> Updates in your time zone
            </span>
            <span>
              <Icon name="message" /> Urdu, Punjabi &amp; English
            </span>
          </div>
        </div>

        <section id="how" className="lp-section lp-wrap stack" style={{ '--gap': '40px' }}>
          <div className="stack lp-reveal" style={{ '--gap': '14px' }}>
            <Kicker tone="teal">How it works</Kicker>
            <h2 className="lp-h2">Care at home. Clarity from anywhere.</h2>
          </div>
          <div className="lp-steps">
            {STEPS.map((s, i) => (
              <article key={s.title} className="lp-step lp-glass lp-reveal" style={{ transitionDelay: `${i * 90}ms` }}>
                <div className="row row--between">
                  <span className="lp-step__n">0{i + 1}</span>
                  <span className="lp-icon">
                    <Icon name={s.icon} size={22} />
                  </span>
                </div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="watch" className="lp-wrap stack" style={{ '--gap': '32px', paddingBottom: 'clamp(64px, 10vw, 128px)' }} aria-labelledby="watch-h">
          <div className="stack lp-reveal" style={{ '--gap': '14px' }}>
            <Kicker tone="teal">See it in action</Kicker>
            <h2 id="watch-h" className="lp-h2">
              One week with Ammi, in 30 seconds.
            </h2>
          </div>
          <div className="lp-reveal">
            <ExplainerVideo />
          </div>
        </section>

        <section id="who" className="lp-wrap lp-reveal" style={{ paddingBottom: 'clamp(64px, 10vw, 128px)' }}>
          <div className="lp-aud lp-glass">
            <div className="stack" style={{ '--gap': '18px' }}>
              <Kicker tone="teal">Who it's for</Kicker>
              <div role="tablist" aria-label="Who it's for" className="lp-aud__tabs">
                {Object.entries(AUDIENCES).map(([k, a]) => (
                  <button key={k} type="button" role="tab" aria-selected={who === k} aria-controls="aud-panel" onClick={() => setWho(k)}>
                    {a.label}
                  </button>
                ))}
              </div>
              <h2 style={{ fontSize: 'clamp(28px, 3.4vw, 40px)', fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.03em' }}>{aud.title}</h2>
              <ul className="lp-aud__list">
                {aud.points.map((pt) => (
                  <li key={pt}>
                    <span>
                      <Icon name="check" size={16} strokeWidth={3} />
                    </span>
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
            <div id="aud-panel" role="tabpanel" className="lp-aud__stage">
              <AudienceStage who={who} />
            </div>
          </div>
        </section>

        <section id="features" className="lp-wrap stack" style={{ '--gap': '40px', paddingBottom: 'clamp(64px, 10vw, 128px)' }}>
          <div className="stack lp-reveal" style={{ '--gap': '14px' }}>
            <Kicker tone="teal">Features</Kicker>
            <h2 className="lp-h2">Everything in one calm place.</h2>
          </div>
          <div className="lp-bento">
            {FEATURES.map((f, i) => (
              <article key={f.title} className={`lp-glass lp-reveal ${f.span}`} style={{ transitionDelay: `${(i % 3) * 80}ms` }}>
                <span className="lp-icon">
                  <Icon name={f.icon} size={22} />
                </span>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
                {f.chart && (
                  <div style={{ marginTop: 8 }}>
                    <TrendChart marker={b12} who="Ammi's results" />
                  </div>
                )}
              </article>
            ))}
            <article className="lp-glass lp-reveal lp-span-6" style={{ justifyContent: 'center' }}>
              <span className="lp-icon">
                <Icon name="utensils" size={22} />
              </span>
              <h3>Meal plans that explain themselves</h3>
              <p>Every dish shows why it’s there and which result it helps. Print the week for the cook in one tap.</p>
              <div className="row" style={{ '--gap': '8px' }}>
                {['Daliya with milk & almonds', 'Moong dal, palak & 1 chapati', 'Grilled rohu, brown rice & salad'].map((m) => (
                  <span key={m} className="kw-pill kw-pill--teal" style={{ fontSize: 15, padding: '8px 14px' }}>
                    {m}
                  </span>
                ))}
              </div>
            </article>
          </div>
        </section>

        <section className="lp-wrap lp-reveal" style={{ paddingBottom: 'clamp(64px, 10vw, 128px)' }}>
          <figure className="lp-quote lp-glass" style={{ margin: 0 }}>
            <Kicker tone="teal">What a visit note looks like</Kicker>
            <blockquote>“Ammi is doing well. Her morning daliya and evening walks are working: her blood sugar has come down again.”</blockquote>
            <figcaption className="row">
              <Avatar name="Hina" size={48} tone="sage" />
              <div style={{ lineHeight: 1.3 }}>
                <div className="strong">Written by the nutritionist after every visit</div>
                <div className="muted text-sm">Example from the Kinwell demo family</div>
              </div>
            </figcaption>
          </figure>
        </section>

        <section id="faq" className="lp-wrap" style={{ paddingBottom: 'clamp(64px, 10vw, 128px)' }}>
          <div className="lp-aud" style={{ padding: 0, alignItems: 'start' }}>
            <div className="stack lp-reveal" style={{ '--gap': '14px' }}>
              <Kicker tone="teal">Questions</Kicker>
              <h2 className="lp-h2">Good to know.</h2>
              <p className="lp-lead">Something else? Sign up and your nutritionist will call you within a day.</p>
            </div>
            <div className="lp-faq lp-glass lp-reveal" style={{ padding: '8px 24px' }}>
              {FAQ.map(([q, a]) => (
                <details key={q}>
                  <summary>{q}</summary>
                  <p>{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-wrap lp-reveal">
          <div className="lp-cta stack" style={{ '--gap': '22px' }}>
            <h2>Start caring from wherever you are.</h2>
            <p>Setting up takes about five minutes. Your nutritionist will call to book the first home visit.</p>
            <div className="row">
              <Button variant="cta" size="lg" to="/onboarding" iconRight="arrowRight">
                Set up your family
              </Button>
              <Button variant="glass" size="lg" to="/login">
                Sign in
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="lp-wrap lp-foot">
        <BrandMark to="/" />
        <nav aria-label="Footer">
          <a href="#how">How it works</a>
          <a href="#features">Features</a>
          <a href="#faq">Questions</a>
          <a href="/login">Sign in</a>
        </nav>
        <span>© {new Date().getFullYear()} Kinwell · Lahore</span>
      </footer>
    </div>
  );
}
