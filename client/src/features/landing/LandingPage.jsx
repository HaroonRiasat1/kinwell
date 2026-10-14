import { Link } from 'react-router-dom';
import { BrandMark } from '../../components/layout/index.js';
import { Icon, StatusTag } from '../../components/ui/index.js';
// Example data from the design (the Rahman family) so previews are real product content.
import { dashboard } from '../../mocks/fixtures.js';
import { ExplainerVideo } from './ExplainerVideo.jsx';
import { McpFilm } from './McpFilm.jsx';
import { usePageTitle } from '../../hooks/usePageTitle.js';
import './landing.css';

const demo = dashboard('ammi');

/** The questions families abroad actually ask, answered plainly (including what we don't do). */
const WORRIES = [
  {
    q: 'Is she actually eating properly?',
    a: 'Her nutritionist plans each week from what is cooked in her own kitchen: daliya, moong dal, roti, chai. She ticks off meals and tablets on her phone, and you can see what was done today.',
  },
  {
    q: 'What did the lab report actually say?',
    a: 'Send the PDF or a photo. Every result is shown against its healthy range, with a six-month trend and one sentence on what it means. No medical jargon.',
  },
  {
    q: 'How will I know something is wrong without calling every day?',
    a: 'You get a short note after every visit and an alert only when something needs you: a missed tablet two days running, a reading that is rising, a test that is overdue.',
  },
  {
    q: 'Who is actually going to their house?',
    a: 'One named nutritionist, the same person every visit. You see their qualifications and the languages they speak before the first visit, and you can message them any time.',
  },
  {
    q: 'What happens in an emergency?',
    a: 'Kinwell is not an emergency service. In an emergency, call Rescue 1122. What we do: tell you straight away when a reading means a doctor should see them, and keep their history ready to share.',
  },
];

const STEPS = [
  { when: 'Day 1', title: 'We call you', text: 'Your nutritionist calls within a day of sign-up to hear about your parents and book the first visit at a time that suits them.' },
  { when: 'Week 1', title: 'First home visit', text: 'At home, at their pace: blood pressure, sugar and weight, their medicines and recent reports, and what they like to eat.' },
  { when: 'Every week', title: 'Plan, checklist, updates', text: 'A meal plan from their own kitchen, a simple daily checklist for them, and a plain note for you.' },
  { when: 'Every 4 weeks', title: 'The next visit', text: 'Readings are compared with last time, the plan is adjusted, and you see what changed and why.' },
];

const INCLUDED = [
  ['Home visits every four weeks', 'By a registered dietitian or clinical nutritionist, always the same person.'],
  ['Meals from their own kitchen', 'Desi food, adjusted rather than replaced. Each dish shows which result it helps.'],
  ['Supplements, checked', 'Every supplement is checked against the medicines they already take.'],
  ['Lab results you can read', 'Upload a report from any lab. Results come with ranges, trends and plain words.'],
  ['A checklist they can manage', 'Big text, one button per task, in Urdu if they prefer. Sign-in with a six-digit code.'],
  ['One thread for the family', 'You, your brothers and sisters and the nutritionist, in one conversation.'],
];

export const FAQ = [
  ['Where do you visit?', 'Kinwell nutritionists visit homes across Lahore today, including Model Town, Gulberg, DHA, Johar Town and Cantt. More cities are planned.'],
  ['Who are the nutritionists?', 'Registered dietitians and clinical nutritionists. You can see each one’s experience, languages and the areas they cover before you choose.'],
  ['My parents aren’t good with phones. Will this work?', 'Yes. Their view has one column, large text and one big button per task. They sign in with a six-digit code you can create for them in the app, so there is no password to remember.'],
  ['Can my brothers and sisters see the updates too?', 'Yes. Invite them during setup and choose whether each person can only view, or view and edit.'],
  ['What if the visit day doesn’t suit them?', 'Ask to move it in the app. The nutritionist accepts or suggests another time, and everyone in the family is told.'],
  ['Does this replace their doctor?', 'No. Kinwell looks after food, supplements and day-to-day habits, and works alongside their doctors. Nutritionists share trends with the family’s doctor when it helps.'],
];

const GUIDE = [
  [
    'Know their numbers',
    'Blood pressure, fasting sugar, HbA1c and vitamin D tell you most of what you need. Ask for the actual values from every report, not just “it’s fine”, and keep them in one place so you can see whether they are going up or down.',
  ],
  [
    'Food is where most of the work happens',
    'Small changes to familiar food last longer than new diets: one roti fewer, less oil in the salan, less sugar in the chai, a walk after dinner. Plans that ignore what is cooked at home tend to be abandoned within weeks.',
  ],
  [
    'Keep one record',
    'Reports arrive on WhatsApp, prescriptions sit in drawers, and every sibling remembers something different. One shared record saves time with every doctor and stops tests from being repeated.',
  ],
  [
    'Agree who does what',
    'Decide which sibling talks to the doctor, who pays for what, and which relative or neighbour nearby can go round at short notice. Write it down where everyone can see it.',
  ],
  [
    'Have an emergency plan',
    'Save Rescue 1122 and the nearest hospital in their phone and yours, keep a list of medicines by the door, and make sure someone nearby has a key.',
  ],
];

function Nav() {
  return (
    <header className="lp-nav">
      <div className="lp-wrap lp-nav__bar">
        <BrandMark to="/" />
        <nav className="lp-nav__links" aria-label="Main">
          <a href="#questions">Your questions</a>
          <a href="#how">How it works</a>
          <a href="#watch">Watch</a>
          <a href="#faq">FAQ</a>
        </nav>
        <div className="lp-nav__actions">
          <Link to="/login" className="lp-link lp-nav__signin">
            Sign in
          </Link>
          <Link to="/onboarding" className="lp-btn lp-btn--small">
            Set up your family
          </Link>
        </div>
      </div>
    </header>
  );
}

/** The parent's day as the family sees it, and the nutritionist's note: real product content. */
function HeroPreview() {
  const p = demo.parent;
  const done = demo.checklist.filter((i) => i.done).length;
  return (
    <div className="lp-preview" aria-hidden="true" inert="">
      <div className="lp-phone">
        <div className="lp-phone__screen">
          <div className="lp-phone__top">
            <span>
              Ammi · {p.age}, {p.area}
            </span>
            <StatusTag status={p.overall} />
          </div>
          <div className="lp-phone__title">{p.overallTitle}</div>
          <p className="lp-phone__text">{p.overallText}</p>
          <div className="lp-phone__label">
            Today · {done} of {demo.checklist.length} done
          </div>
          <ul className="lp-phone__list">
            {demo.checklist.slice(0, 3).map((it) => (
              <li key={it.code} className={it.done ? 'is-done' : ''}>
                <span className="lp-phone__tick">{it.done && <Icon name="check" size={13} strokeWidth={3} />}</span>
                <span>
                  {it.simple}
                  <small>{it.time}</small>
                </span>
              </li>
            ))}
          </ul>
          <div className="lp-phone__next">
            Next visit <b>{p.nextVisit}</b>
          </div>
        </div>
      </div>
      <figure className="lp-note">
        <blockquote>“Her morning daliya and evening walks are working. Her blood sugar has come down again.”</blockquote>
        <figcaption>Hina, her nutritionist · visit note, {p.lastVisit}</figcaption>
      </figure>
    </div>
  );
}

function SectionHead({ n, label, title, children, id }) {
  return (
    <div className="lp-head">
      <p className="lp-label">
        <span>{n}</span> {label}
      </p>
      <h2 id={id}>{title}</h2>
      {children && <p className="lp-lead">{children}</p>}
    </div>
  );
}

export default function LandingPage() {
  usePageTitle();
  return (
    // The website is in English: keep it English and left-to-right even when this device's app
    // language is Urdu (which sets dir="rtl" on the whole document).
    <div className="lp" lang="en" dir="ltr">
      <Nav />

      <main>
        <section className="lp-wrap lp-hero">
          <div className="lp-hero__copy">
            <p className="lp-label">Home nutrition care · Lahore</p>
            <h1>Looking after your parents in Lahore, from wherever you live.</h1>
            <p className="lp-hero__lead">
              A registered nutritionist visits them at home every four weeks, plans meals from their own kitchen and reads every lab report. You get a clear note after each visit, in your time zone, and an alert only when something needs you.
            </p>
            <div className="lp-hero__ctas">
              <Link to="/onboarding" className="lp-btn">
                Set up your family <Icon name="arrowRight" size={18} />
              </Link>
              <a href="#watch" className="lp-link">
                See a month in 30 seconds
              </a>
            </div>
          </div>
          <HeroPreview />
        </section>

        <div className="lp-wrap">
          <dl className="lp-facts">
            <div>
              <dt>Every 4 weeks</dt>
              <dd>a home visit by the same nutritionist</dd>
            </div>
            <div>
              <dt>Within a day</dt>
              <dd>your first call after signing up</dd>
            </div>
            <div>
              <dt>Your time zone</dt>
              <dd>updates timed for London, Dubai or Toronto</dd>
            </div>
            <div>
              <dt>Urdu, Punjabi, English</dt>
              <dd>spoken on visits; the app is in Urdu and English</dd>
            </div>
          </dl>
        </div>

        <section id="questions" className="lp-wrap lp-section" aria-labelledby="questions-h">
          <SectionHead n="01" label="Your questions" title="What families abroad ask us first." id="questions-h">
            Most people come to us after a worrying phone call. These are the questions we hear most, answered plainly.
          </SectionHead>
          <div className="lp-worries">
            {WORRIES.map((w) => (
              <article key={w.q} className="lp-worry">
                <h3>{w.q}</h3>
                <p>{w.a}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="how" className="lp-band" aria-labelledby="how-h">
          <div className="lp-wrap lp-section">
            <SectionHead n="02" label="How it works" title="From the first call to the fourth visit." id="how-h" />
            <ol className="lp-timeline">
              {STEPS.map((s) => (
                <li key={s.when}>
                  <span className="lp-timeline__when">{s.when}</span>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="watch" className="lp-wrap lp-section" aria-labelledby="watch-h">
          <SectionHead n="03" label="Watch" title="A month with Ammi, in 30 seconds." id="watch-h">
            The visit, the plan, her checklist, a lab report and the note you get. Every screen here is from the real app.
          </SectionHead>
          <ExplainerVideo />
        </section>

        <section id="included" className="lp-wrap lp-section lp-split" aria-labelledby="included-h">
          <SectionHead n="04" label="What’s included" title="Everything in one calm place." id="included-h" />
          <ul className="lp-included">
            {INCLUDED.map(([t, d]) => (
              <li key={t}>
                <h3>{t}</h3>
                <p>{d}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="privacy" className="lp-band lp-band--ink" aria-labelledby="privacy-h">
          <div className="lp-wrap lp-section lp-split">
            <SectionHead n="05" label="Privacy" title="Their health record stays in the family." id="privacy-h" />
            <ul className="lp-privacy">
              <li>Only the family, their nutritionist and the parent can see a record. Every change our team makes is logged.</li>
              <li>Lab reports are read on your own phone or computer; the file itself is never uploaded.</li>
              <li>No advertising or tracking cookies. You can sign out of every device at once.</li>
            </ul>
          </div>
        </section>

        <section id="claude" className="lp-wrap lp-section" aria-labelledby="claude-h">
          <SectionHead n="06" label="Works with Claude" title="Ask Kinwell from Claude." id="claude-h">
            Connect Kinwell to Claude Desktop or Claude Code and ask in plain words: “How was Ammi’s week?”. Claude sees only what your account can see and asks before anything reaches a family.{' '}
            <a className="lp-link" href="https://github.com/HaroonRiasat1/kinwell/blob/main/mcp/README.md" target="_blank" rel="noopener">
              How to connect it
            </a>
          </SectionHead>
          <McpFilm />
        </section>

        <section id="faq" className="lp-wrap lp-section lp-split" aria-labelledby="faq-h">
          <SectionHead n="07" label="FAQ" title="Good to know." id="faq-h">
            Something else? Sign up and your nutritionist will call you within a day.
          </SectionHead>
          <div className="lp-faq">
            {FAQ.map(([q, a]) => (
              <details key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="lp-wrap">
          <div className="lp-cta">
            <h2>You can’t be there every day. You can always know how they are.</h2>
            <p>Setting up takes about five minutes. Your nutritionist will call to book the first home visit.</p>
            <div className="lp-hero__ctas">
              <Link to="/onboarding" className="lp-btn lp-btn--light">
                Set up your family <Icon name="arrowRight" size={18} />
              </Link>
              <Link to="/login" className="lp-link lp-link--light">
                Sign in
              </Link>
            </div>
          </div>
        </section>

        <article id="guide" className="lp-wrap lp-section lp-guide" aria-labelledby="guide-h">
          <p className="lp-label">A practical guide</p>
          <h2 id="guide-h">How to look after elderly parents in Lahore when you live abroad</h2>
          <p className="lp-guide__intro">
            Caring from a distance takes more than a weekly phone call. Five habits make the biggest difference, whether or not you use Kinwell. None of this replaces their doctor’s advice.
          </p>
          <ol>
            {GUIDE.map(([t, d]) => (
              <li key={t}>
                <h3>{t}</h3>
                <p>{d}</p>
              </li>
            ))}
          </ol>
        </article>
      </main>

      <footer className="lp-foot">
        <div className="lp-wrap lp-foot__inner">
          <BrandMark to="/" />
          <nav aria-label="Footer">
            <a href="#how">How it works</a>
            <a href="#faq">FAQ</a>
            <a href="#guide">Guide</a>
            <a href="#claude">Use with Claude</a>
            <a href="/login">Sign in</a>
            <a href="/cookies">Cookies</a>
          </nav>
          <span>© {new Date().getFullYear()} Kinwell · Lahore</span>
        </div>
      </footer>
    </div>
  );
}
