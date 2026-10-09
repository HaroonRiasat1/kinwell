/** Circular progress for "3 of 6 done today". */
export function ProgressRing({ done, total, size = 96 }) {
  const C = 2 * Math.PI * 42;
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }} role="img" aria-label={`${done} of ${total} done today`}>
      <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="50" cy="50" r="42" fill="none" stroke="var(--kw-skeleton)" strokeWidth="10" />
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="var(--kw-teal-700)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${total ? ((C * done) / total).toFixed(1) : 0} ${C.toFixed(1)}`}
          style={{ transition: 'stroke-dasharray .4s ease' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: size * 0.23 }}>
        {pct}%
      </div>
    </div>
  );
}
