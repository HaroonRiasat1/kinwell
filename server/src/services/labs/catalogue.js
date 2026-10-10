// The lab tests Kinwell recognises in uploaded reports: names labs use, units, conversions to
// the units we show, a plausible range (to reject OCR misreads) and how to grade a result.
// Grading follows common adult reference ranges; a clinician should review before real use.

const grade = (bands) => (v) => {
  for (const [test, status] of bands) if (test(v)) return status;
  return 'normal';
};

export const LAB_TESTS = [
  {
    name: 'HbA1c',
    aliases: [/\bhb\s*a\s*[1lI][lI]?\s*c\b/i, /\ba[1lI][lI]?c\b/i, /glyc(?:at|os)ylated\s+ha?emoglobin/i, /glycated\s+hb/i],
    unit: '%',
    range: '<5.7',
    band: [0, 5.7],
    plausible: [3, 20],
    convert: (v, u) => (/mmol\s*\/\s*mol/i.test(u) || v > 20 ? { value: v / 10.929 + 2.15, from: 'mmol/mol' } : { value: v }),
    grade: grade([[(v) => v >= 7, 'attention'], [(v) => v >= 5.7, 'watch']]),
    plain: 'Average blood sugar over the last 3 months — the bigger picture, not just one day.',
    decimals: 1,
  },
  {
    name: 'Fasting blood sugar',
    aliases: [/fasting\s+(?:blood\s+|plasma\s+)?(?:sugar|glucose)/i, /(?:blood\s+|plasma\s+)?(?:glucose|sugar)[\s,(-]*fasting/i, /\bF\.?B\.?S\.?\b/, /\bFPG\b/],
    unit: 'mg/dL',
    range: '70–99',
    band: [70, 99],
    plausible: [20, 700],
    convert: (v, u) => (/mmol/i.test(u) || v < 35 ? { value: v * 18.02, from: 'mmol/L' } : { value: v }),
    grade: grade([[(v) => v < 70 || v >= 140, 'attention'], [(v) => v >= 100, 'watch']]),
    plain: 'How much sugar is in the blood before breakfast. Lower is better for diabetes.',
  },
  {
    name: 'Vitamin D',
    aliases: [/vit(?:amin)?\.?\s*d\s*3?\b/i, /25\s*-?\s*(?:\(oh\)|oh|hydroxy)\s*(?:vit(?:amin)?\.?\s*)?d/i, /cholecalciferol/i],
    unit: 'ng/mL',
    range: '30–100',
    band: [30, 100],
    plausible: [2, 250],
    convert: (v, u) => (/nmol/i.test(u) ? { value: v / 2.496, from: 'nmol/L' } : { value: v }),
    grade: grade([[(v) => v < 20 || v > 100, 'attention'], [(v) => v < 30, 'watch']]),
    plain: 'Keeps bones strong and muscles working. Most of it comes from sunlight.',
  },
  {
    name: 'Vitamin B12',
    aliases: [/vit(?:amin)?\.?\s*b\s*-?\s*12/i, /cobalamin/i],
    unit: 'pg/mL',
    range: '200–900',
    band: [200, 900],
    plausible: [30, 3000],
    convert: (v, u) => (/pmol/i.test(u) ? { value: v * 1.355, from: 'pmol/L' } : { value: v }),
    grade: grade([[(v) => v < 200, 'attention'], [(v) => v < 300, 'watch']]),
    plain: 'Keeps nerves and memory healthy and helps make blood.',
  },
  {
    name: 'Hemoglobin',
    aliases: [/\bha?emoglobin\b(?!\s*a\s*[1lI][lI]?\s*c)/i, /\bhb\b(?!\s*a\s*[1lI][lI]?\s*c)/i, /\bhgb\b/i],
    unit: 'g/dL',
    range: '12–15.5',
    band: [12, 15.5],
    plausible: [3, 25],
    convert: (v, u) => (/g\s*\/\s*l\b/i.test(u) || v > 30 ? { value: v / 10, from: 'g/L' } : { value: v }),
    grade: grade([[(v) => v < 10 || v > 18, 'attention'], [(v) => v < 12, 'watch']]),
    plain: 'The part of blood that carries oxygen. When low, people often feel tired.',
    decimals: 1,
  },
  {
    name: 'LDL cholesterol',
    aliases: [/\bldl\b(?:[\s-]*(?:cholesterol|c\b|chol))?/i, /low[\s-]density\s+lipoprotein/i],
    unit: 'mg/dL',
    range: 'under 130',
    band: [0, 130],
    plausible: [20, 400],
    convert: (v, u) => (/mmol/i.test(u) || v < 15 ? { value: v * 38.67, from: 'mmol/L' } : { value: v }),
    grade: grade([[(v) => v >= 160, 'attention'], [(v) => v >= 130, 'watch']]),
    plain: 'The “sticky” cholesterol that can build up in blood vessels. Lower is better.',
  },
  {
    name: 'HDL cholesterol',
    aliases: [/\bhdl\b(?:[\s-]*(?:cholesterol|c\b|chol))?/i, /high[\s-]density\s+lipoprotein/i],
    unit: 'mg/dL',
    range: 'over 40',
    band: [40, 100],
    plausible: [5, 150],
    convert: (v, u) => (/mmol/i.test(u) || v < 5 ? { value: v * 38.67, from: 'mmol/L' } : { value: v }),
    grade: grade([[(v) => v < 35, 'attention'], [(v) => v < 40, 'watch']]),
    plain: 'The “good” cholesterol that clears fat from the blood. Higher is better.',
  },
  {
    name: 'Total cholesterol',
    aliases: [/(?:total|serum)\s+cholesterol/i, /^\s*cholesterol\b(?!.*(?:ldl|hdl))/im],
    unit: 'mg/dL',
    range: 'under 200',
    band: [0, 200],
    plausible: [50, 600],
    convert: (v, u) => (/mmol/i.test(u) || v < 20 ? { value: v * 38.67, from: 'mmol/L' } : { value: v }),
    grade: grade([[(v) => v >= 240, 'attention'], [(v) => v >= 200, 'watch']]),
    plain: 'All the cholesterol in the blood, good and bad together.',
  },
  {
    name: 'Triglycerides',
    aliases: [/triglycerides?/i, /\btg\b/i],
    unit: 'mg/dL',
    range: 'under 150',
    band: [0, 150],
    plausible: [20, 3000],
    convert: (v, u) => (/mmol/i.test(u) || v < 15 ? { value: v * 88.57, from: 'mmol/L' } : { value: v }),
    grade: grade([[(v) => v >= 200, 'attention'], [(v) => v >= 150, 'watch']]),
    plain: 'A type of fat in the blood. It rises with sugar, sweets and fried food.',
  },
  {
    name: 'Creatinine',
    aliases: [/(?:serum\s+)?creatinine(?!\s*clearance)/i],
    unit: 'mg/dL',
    range: '0.5–1.2',
    band: [0.5, 1.2],
    plausible: [0.1, 20],
    convert: (v, u) => (/[uµμ]mol/i.test(u) || v > 20 ? { value: v / 88.4, from: 'µmol/L' } : { value: v }),
    grade: grade([[(v) => v >= 2, 'attention'], [(v) => v > 1.2, 'watch']]),
    plain: 'Shows how well the kidneys are clearing waste. Higher can mean the kidneys are struggling.',
    decimals: 2,
  },
  {
    name: 'TSH',
    aliases: [/\btsh\b/i, /thyroid\s+stimulating\s+hormone/i],
    unit: 'mIU/L',
    range: '0.4–4.5',
    band: [0.4, 4.5],
    plausible: [0.005, 100],
    convert: (v) => ({ value: v }),
    grade: grade([[(v) => v < 0.1 || v > 10, 'attention'], [(v) => v < 0.4 || v > 4.5, 'watch']]),
    plain: 'Shows how hard the thyroid is being pushed to work. It affects energy and weight.',
    decimals: 2,
  },
  {
    name: 'Ferritin',
    aliases: [/(?:serum\s+)?ferritin/i],
    unit: 'ng/mL',
    range: '30–300',
    band: [30, 300],
    plausible: [1, 3000],
    convert: (v) => ({ value: v }),
    grade: grade([[(v) => v < 15, 'attention'], [(v) => v < 30 || v > 300, 'watch']]),
    plain: 'The body’s iron store. Low ferritin often explains tiredness.',
  },
];

export const testByName = (name) => LAB_TESTS.find((t) => t.name === name);

/** Rounds for display: one decimal for small numbers, whole numbers otherwise. */
export function formatValue(test, v) {
  const d = test.decimals ?? (v < 20 ? 1 : 0);
  return String(Number(v.toFixed(d)));
}
