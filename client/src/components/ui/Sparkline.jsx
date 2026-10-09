import { STATUS } from '../../lib/status.js';

/** Tiny six-month trend line for a vital card. */
export function Sparkline({ series, status = 'normal', label }) {
  const mn = Math.min(...series);
  const mx = Math.max(...series);
  const r = mx - mn || 1;
  const pts = series.map((v, i) => `${(2 + (i * 116) / (series.length - 1)).toFixed(1)},${(36 - ((v - mn) / r) * 32).toFixed(1)}`).join(' ');
  return (
    <svg width="100%" height="40" viewBox="0 0 120 40" preserveAspectRatio="none" role="img" aria-label={label}>
      <line x1="0" y1="39" x2="120" y2="39" stroke="var(--kw-warm-line)" strokeWidth="1" />
      <polyline
        points={pts}
        fill="none"
        stroke={STATUS[status].fg}
        strokeWidth="2.25"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
