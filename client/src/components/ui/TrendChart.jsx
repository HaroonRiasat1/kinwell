import { buildTrend } from '../../lib/chart.js';
import { STATUS } from '../../lib/status.js';

/**
 * Lab trend: healthy range band, home-visit markers, and the parent's results.
 * Plotted in a 0–100 viewBox with HTML labels on top so text never stretches.
 */
export function TrendChart({ marker, who = 'Results', visits }) {
  const c = buildTrend(marker, visits);
  const color = STATUS[marker.status].fg;
  return (
    <>
      <div className="kw-trend" role="img" aria-label={c.aria} style={{ color }}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {c.band && <rect x={c.band.x} y={c.band.y} width={c.band.w} height={c.band.h} fill="var(--kw-band)" opacity="0.85" />}
          <path d={c.grid} stroke="rgba(31,42,40,0.1)" strokeWidth="1" vectorEffect="non-scaling-stroke" fill="none" />
          <path d={c.visitLines} stroke="var(--kw-coral)" strokeWidth="1.5" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" fill="none" />
          <polyline points={c.line} fill="none" stroke={color} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>
        {c.ticks.map((t) => (
          <span key={t.top} className="kw-trend__tick" style={{ top: t.top }}>
            {t.label}
          </span>
        ))}
        {c.xLabels.map((x) => (
          <span key={x.label} className="kw-trend__x" style={{ left: x.left }}>
            {x.label}
          </span>
        ))}
        {c.visitLabels.map((v) => (
          <span key={v.label} className="kw-trend__visit" style={{ left: v.left }}>
            {v.label}
          </span>
        ))}
        {c.dots.map((d) => (
          <span key={d.key}>
            <span className="kw-trend__dot" style={{ left: d.left, top: d.top, width: d.size, height: d.size }} />
            <span className="kw-trend__val" style={{ left: d.left, top: d.top }}>
              {d.label}
            </span>
          </span>
        ))}
      </div>
      <div className="kw-legend">
        <span>
          <span style={{ width: 16, height: 12, borderRadius: 3, background: 'var(--kw-band)' }} />
          Healthy range ({marker.range})
        </span>
        <span>
          <span style={{ width: 16, borderTop: '2px dashed var(--kw-coral)' }} />
          Home visit
        </span>
        <span>
          <span style={{ width: 16, height: 3, borderRadius: 2, background: color }} />
          {who}
        </span>
      </div>
    </>
  );
}
