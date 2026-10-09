import { VISIT_IDX, VISIT_LBL } from '@kinwell/shared';

const DEFAULT_VISITS = VISIT_IDX.map((index, i) => ({ index, label: VISIT_LBL[i] }));

/**
 * Lays out a lab trend in a 0–100 box: line points, healthy band, gridlines,
 * visit markers and label positions (as percentages for HTML overlays).
 */
export function buildTrend(marker, visits = DEFAULT_VISITS) {
  const s = marker.series;
  const band = marker.band?.length === 2 ? marker.band : null;
  let lo = Math.min(...s);
  let hi = Math.max(...s);
  if (band) {
    if (band[0] > 0 && band[0] >= lo * 0.5) lo = Math.min(lo, band[0]);
    if (band[1] <= hi * 1.5) hi = Math.max(hi, band[1]);
  }
  const pad = (hi - lo) * 0.14 || 1;
  const d0 = lo - pad;
  const d1 = hi + pad;
  const L = 9, R = 97, T = 12, B = 86;
  const X = (i) => L + (i * (R - L)) / (s.length - 1);
  const Y = (v) => T + (1 - (v - d0) / (d1 - d0)) * (B - T);
  const fmt = (v) => ((hi - lo) < 10 ? v.toFixed(1) : String(Math.round(v)));
  const tickValues = [lo, (lo + hi) / 2, hi];

  let bandRect = null;
  if (band) {
    const y1 = Math.max(T, Y(Math.min(band[1], d1)));
    const y2 = Math.min(B, Y(Math.max(band[0], d0)));
    bandRect = { x: L, w: R - L, y: y1.toFixed(2), h: Math.max(0, y2 - y1).toFixed(2) };
  }
  const months = marker.months?.length ? marker.months : ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];

  return {
    line: s.map((v, i) => `${X(i).toFixed(2)},${Y(v).toFixed(2)}`).join(' '),
    band: bandRect,
    grid: tickValues.map((v) => `M${L} ${Y(v).toFixed(2)} H${R}`).join(' '),
    visitLines: visits.map((v) => `M${X(v.index).toFixed(2)} ${T - 4} V${B}`).join(' '),
    ticks: tickValues.map((v) => ({ label: fmt(v), top: `${Y(v).toFixed(2)}%` })),
    xLabels: months.map((label, i) => ({ label, left: `${X(i).toFixed(2)}%` })),
    dots: s.map((v, i) => ({ key: i, left: `${X(i).toFixed(2)}%`, top: `${Y(v).toFixed(2)}%`, label: String(v), size: i === s.length - 1 ? 16 : 11 })),
    visitLabels: visits.map((v) => ({ left: `${X(v.index).toFixed(2)}%`, label: v.label })),
    aria: `${marker.name}, ${months[0]} to ${months[months.length - 1]}: ${s.join(', ')}. ${marker.trend}.`,
  };
}
