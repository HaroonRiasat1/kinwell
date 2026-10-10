// Checks and grades the readings a nutritionist enters at a home visit.
// Ranges follow common adult guidance for older people; a clinician should review them
// before real use. Each reading gets normal / watch / attention.

const num = (v) => Number(String(v).trim());

export const VITALS = {
  'Blood pressure': {
    unit: 'mmHg',
    parse(v) {
      const m = String(v).trim().match(/^(\d{2,3})\s*\/\s*(\d{2,3})$/);
      if (!m) return { error: 'Write blood pressure as two numbers, like 130/80.' };
      const [s, d] = [Number(m[1]), Number(m[2])];
      if (s < 60 || s > 260 || d < 30 || d > 160 || d >= s) return { error: 'That blood pressure looks mistyped. Check both numbers.' };
      return { value: `${s}/${d}`, number: s, s, d };
    },
    grade: ({ s, d }) => (s >= 160 || d >= 100 || s < 90 ? 'attention' : s >= 130 || d >= 80 ? 'watch' : 'normal'),
    word: ({ s, d }) => (s < 90 ? 'low' : s >= 160 || d >= 100 ? 'very high' : 'high'),
  },
  Pulse: {
    unit: 'bpm',
    range: [30, 220],
    grade: (n) => (n < 50 || n > 110 ? 'attention' : n < 60 || n > 100 ? 'watch' : 'normal'),
    word: (n) => (n < 60 ? 'slow' : 'fast'),
  },
  Weight: { unit: 'kg', range: [20, 250], grade: () => 'normal' },
  'Fasting sugar': {
    unit: 'mg/dL',
    range: [20, 600],
    grade: (n) => (n >= 140 || n < 70 ? 'attention' : n >= 100 ? 'watch' : 'normal'),
    word: (n) => (n < 70 ? 'low' : 'high'),
  },
  Oxygen: { unit: '%', range: [50, 100], grade: (n) => (n < 92 ? 'attention' : n < 95 ? 'watch' : 'normal'), word: () => 'low' },
  'Water today': { unit: 'glasses', range: [0, 30], grade: (n) => (n < 6 ? 'watch' : 'normal'), word: () => 'low' },
};

/** Lab marker each vital updates on the client's record. */
export const MARKER_FOR = { 'Blood pressure': 'Blood pressure', 'Fasting sugar': 'Fasting blood sugar', Weight: 'Weight' };

/**
 * Validates and grades a visit's vitals. Returns { readings, errors }.
 * readings: [{ label, value, unit, status, number, word }]
 */
export function assessVitals(vitals = []) {
  const readings = [];
  const errors = {};
  for (const { label, value } of vitals) {
    if (value === undefined || String(value).trim() === '') continue;
    const spec = VITALS[label];
    if (!spec) continue;
    if (spec.parse) {
      const p = spec.parse(value);
      if (p.error) {
        errors[label] = p.error;
        continue;
      }
      readings.push({ label, value: p.value, unit: spec.unit, number: p.number, status: spec.grade(p), word: spec.word?.(p) });
      continue;
    }
    const n = num(value);
    if (!Number.isFinite(n) || n < spec.range[0] || n > spec.range[1]) {
      errors[label] = `${label} should be a number between ${spec.range[0]} and ${spec.range[1]} ${spec.unit}.`;
      continue;
    }
    readings.push({ label, value: String(n), unit: spec.unit, number: n, status: spec.grade(n), word: spec.word?.(n) });
  }
  return { readings, errors };
}
