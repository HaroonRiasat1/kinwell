import { useState } from 'react';
import { BrandMark } from '../../components/layout/index.js';
import { Button, Card, Chip, EmptyState, Field, Kicker, ProgressRing, Sparkline, StatusTag, Toggle, TrendChart } from '../../components/ui/index.js';

export const SWATCHES = [
  ['Ground', '#f7f3ec', '#1f2a28', 'page'],
  ['Surface', '#fffdf9', '#1f2a28', 'cards'],
  ['Ink', '#1f2a28', '#fff', 'text'],
  ['Ink muted', '#4a5553', '#fff', 'secondary text'],
  ['Teal 700', '#2c6e63', '#fff', 'primary, trust'],
  ['Teal 800', '#1f544b', '#fff', 'hover, links'],
  ['Teal 100', '#e2eeea', '#1f544b', 'selected, tints'],
  ['Coral 400', '#e8805f', '#1f2a28', 'call to action'],
  ['Rule', 'rgba(255,255,255,0.8)', '#1f2a28', '2px dividers'],
  ['Normal', '#1d6a42', '#fff', 'on #e1f0e6'],
  ['Watch', '#7a4d00', '#fff', 'on #fbeccb'],
  ['Attention', '#a1241b', '#fff', 'on #fadfdb'],
];

export const TYPE_SCALE = [
  ['Parent display', '56 / 800', 56, 800, 'Assalam-o-Alaikum'],
  ['Display', '40 / 800', 40, 800, 'How Ammi is doing'],
  ['Title', '28 / 800', 28, 800, 'Mostly steady'],
  ['Section', '24 / 800', 24, 800, 'Vitals & lab markers'],
  ['Parent body', '24 / 400', 24, 400, "You've done 3 of 6 things today."],
  ['Body', '18 / 400', 18, 400, 'Her blood sugar has come down again.'],
  ['Small', '15–16 / 400', 16, 400, 'Last visit · Mon 28 Sep'],
  ['Kicker', '14 / 700 caps', 14, 700, 'HEALTH AT A GLANCE'],
];

const DEMO_MARKER = { name: 'Vitamin D', status: 'attention', series: [24, 22, 21, 19, 17, 18], band: [30, 100], range: '30–100', trend: 'Low for 4 months' };

const H2 = ({ children }) => <h2 style={{ fontSize: 28, fontWeight: 800 }}>{children}</h2>;

export default function DesignSystemPage() {
  const [on, setOn] = useState(true);
  const [chip, setChip] = useState('Watch');
  return (
    <div className="kw-backdrop">
      <div className="stack" style={{ '--gap': '40px', maxWidth: 1180, margin: '0 auto', padding: 'clamp(20px, 4vw, 48px)' }}>
        <BrandMark to="/design-system" />
        <header className="stack" style={{ '--gap': '10px' }}>
          <Kicker tone="teal">Kinwell design system · v0.2 Glass</Kicker>
          <h1 style={{ fontSize: 'clamp(34px, 5vw, 48px)', fontWeight: 800 }}>Calm glass, warm color</h1>
          <p style={{ maxWidth: '62ch', color: 'var(--kw-ink-2)' }}>
            Frosted, translucent layers over a soft warm backdrop. Text always sits on a solid-enough glass layer so contrast stays AA. Deep
            teal for trust, coral for action, capsule buttons, 24–28px corners and an 18px base size (24px in the parent view).
          </p>
        </header>
        <div className="divider" />

        <section className="stack">
          <H2>Color</H2>
          <div className="grid-fill" style={{ '--min': '160px' }}>
            {SWATCHES.map(([name, hex, on2, use]) => (
              <div key={name} style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.85)', background: 'rgba(255,255,255,0.6)' }}>
                <div style={{ height: 68, background: hex, color: on2, padding: 10, fontWeight: 800 }}>Aa</div>
                <div style={{ padding: '10px 12px' }}>
                  <div className="strong">{name}</div>
                  <div className="muted" style={{ fontSize: 14 }}>
                    {hex} · {use}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="stack">
          <H2>Type · System sans (SF Pro on Apple devices)</H2>
          <Card gap={0}>
            {TYPE_SCALE.map(([name, spec, size, weight, sample]) => (
              <div key={name} className="row" style={{ padding: '12px 0', borderTop: '1px solid var(--kw-rule-soft)', flexWrap: 'nowrap' }}>
                <div style={{ width: 160, flexShrink: 0 }}>
                  <div className="strong" style={{ fontSize: 15 }}>
                    {name}
                  </div>
                  <div className="muted" style={{ fontSize: 14 }}>
                    {spec}
                  </div>
                </div>
                <div style={{ fontSize: size, fontWeight: weight, lineHeight: 1.15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: name === 'Kicker' ? 'uppercase' : undefined, letterSpacing: name === 'Kicker' ? '0.06em' : undefined }}>
                  {sample}
                </div>
              </div>
            ))}
          </Card>
        </section>

        <section className="stack">
          <H2>Spacing &amp; radius</H2>
          <div className="row" style={{ alignItems: 'flex-end' }}>
            {[4, 8, 12, 16, 24, 32, 48].map((v) => (
              <div key={v} className="stack" style={{ '--gap': '6px', alignItems: 'center' }}>
                <div style={{ width: v, height: v, background: 'var(--kw-teal-700)', borderRadius: 4 }} />
                <span className="muted" style={{ fontSize: 14 }}>
                  {v}
                </span>
              </div>
            ))}
            {[10, 16, 24, 28].map((r) => (
              <div key={r} className="stack" style={{ '--gap': '6px', alignItems: 'center', marginLeft: 16 }}>
                <div style={{ width: 64, height: 64, borderRadius: r, background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(31,42,40,0.12)' }} />
                <span className="muted" style={{ fontSize: 14 }}>
                  r{r}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="stack">
          <H2>Buttons</H2>
          <div className="row">
            <Button>Primary</Button>
            <Button variant="cta">Call to action</Button>
            <Button variant="glass">Secondary</Button>
            <Button variant="link" iconRight="arrowRight">
              Inline action
            </Button>
            <Button disabled>Disabled</Button>
          </div>
        </section>

        <section className="stack">
          <H2>Inputs</H2>
          <div className="grid-auto" style={{ '--min': '260px' }}>
            <Field label="Email" placeholder="sana.rahman@gmail.com" />
            <Field label="With error" defaultValue="sana@" error="Enter a valid email address" />
            <Field as="select" label="Where you live" options={['London', 'Dubai', 'Toronto']} />
          </div>
          <div className="row">
            {['Normal', 'Watch', 'Needs attention'].map((c) => (
              <Chip key={c} selected={chip === c} onClick={() => setChip(c)}>
                {c}
              </Chip>
            ))}
            <Toggle checked={on} onChange={setOn} label="Reminder" />
          </div>
        </section>

        <section className="stack">
          <H2>Status tags</H2>
          <div className="row">
            <StatusTag status="normal" />
            <StatusTag status="watch" />
            <StatusTag status="attention" />
          </div>
          <p className="muted text-sm">Status is always shown with an icon and a word — never color alone.</p>
        </section>

        <section className="stack">
          <H2>Charts</H2>
          <div className="grid-auto">
            <Card>
              <TrendChart marker={DEMO_MARKER} who="Ammi's results" />
            </Card>
            <Card>
              <div className="row">
                <ProgressRing done={3} total={6} />
                <div className="grow">
                  <Sparkline series={[134, 129, 126, 121, 120, 118]} status="watch" label="Fasting sugar trend" />
                </div>
              </div>
            </Card>
          </div>
        </section>

        <section className="stack">
          <H2>Cards &amp; empty states</H2>
          <EmptyState kicker="No lab reports yet" title="Add Ammi's first lab report" action={<Button variant="cta" icon="upload">Choose file</Button>}>
            Once there's a report, you'll see each result here with its healthy range and a plain-language explanation.
          </EmptyState>
        </section>
      </div>
    </div>
  );
}
