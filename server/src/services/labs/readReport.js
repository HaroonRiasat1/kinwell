// Turns the text of a lab report (from OCR or a digital PDF) into results Kinwell understands.
// Works line by line: find a test's name, take the first number after it (the result, before the
// reference range), read the unit, convert to our units, and reject numbers that can't be real.
import { LAB_TESTS, formatValue } from './catalogue.js';

const KNOWN_LABS = [
  ['Chughtai', 'Chughtai Lab'],
  ['Excel', 'Excel Labs'],
  ['Shaukat Khanum', 'Shaukat Khanum Lab'],
  ['Aga Khan', 'Aga Khan University Hospital Lab'],
  ['Islamabad Diagnostic', 'Islamabad Diagnostic Centre'],
  ['Dr. Essa', "Dr. Essa's Laboratory"],
  ['Citi Lab', 'Citi Lab'],
];
const MONTHS = 'jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec';
const UNIT = /(mg\s*\/\s*d[lL]|mmol\s*\/\s*mol|mmol\s*\/\s*[lL]|[uµμ]mol\s*\/\s*[lL]|nmol\s*\/\s*[lL]|pmol\s*\/\s*[lL]|ng\s*\/\s*m[lL]|pg\s*\/\s*m[lL]|g\s*\/\s*d[lL]|g\s*\/\s*[lL]|m?[iIl1]U\s*\/\s*[lL]|%)/;

/** Fixes the usual OCR slips inside numbers (O for 0, l for 1, comma decimals). */
function normaliseLine(line) {
  return line
    .replace(/(\d)[oO](?=\d|\b)/g, '$10')
    .replace(/(?<=\s|^)[oO](?=[.,]\d)/g, '0')
    .replace(/(\d)[lI](?=[\d.,])/g, '$11')
    .replace(/(?<=\s|^)[lI](?=\d)/g, '1')
    .replace(/(\d),(\d{1,2})(?!\d)/g, '$1.$2')
    .replace(/\b(mg|g|ng|pg|mmol|[uµμ]mol|nmol|pmol|m?IU)\s*[lI1|]\s*(d[lL]|m[lL]|L|mol)\b/g, '$1/$2') // "gldL" → "g/dL"
    .replace(/\s+/g, ' ');
}

const unitKey = (u) => u.replace(/\s+/g, '').replace(/[µμ]/g, 'u').toLowerCase();

/**
 * OCR often loses thin decimal points: "7.4" becomes "74" and the range "4.0 - 5.6" becomes "40-56".
 * If the reference range printed after the result is 10× (or 100×) ours, that's what happened.
 */
function decimalScale(test, after) {
  const range = after.match(/(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)/);
  const bound = after.match(/([<>])\s*(\d+(?:\.\d+)?)/);
  const pairs = range
    ? [[Number(range[1]), test.band[0]], [Number(range[2]), test.band[1]]]
    : bound
      ? [[Number(bound[2]), bound[1] === '<' ? test.band[1] : test.band[0]]]
      : [];
  const scales = pairs.filter(([, ours]) => ours > 0).map(([theirs, ours]) => theirs / ours);
  for (const scale of [10, 100]) if (scales.length && scales.every((x) => Math.abs(x / scale - 1) < 0.2)) return scale;
  return 1;
}

/** First number after the test name that isn't part of a range like "70-99" or a date. */
function firstResult(rest) {
  const re = /(?<![\d.])(\d+(?:\.\d+)?)(?![\d.])/g;
  let m;
  while ((m = re.exec(rest))) {
    const after = rest.slice(m.index + m[0].length, m.index + m[0].length + 3);
    const before = rest.slice(Math.max(0, m.index - 2), m.index);
    if (/^\s*[-–]\s*\d/.test(after) || /[-–]\s*$/.test(before) || /^\s*\/\s*\d/.test(after)) continue; // range, or a date like 12/10
    if (/^\s*[<>]/.test(rest.slice(Math.max(0, m.index - 2), m.index))) continue; // "< 5.7" is a reference, not a result
    // Part of a name like "25-OH" or "B12", not a result, unless a unit follows directly ("18mg/dL").
    if (/^[-–]?[A-Za-z]/.test(after) && !new RegExp(`^${UNIT.source}`).test(rest.slice(m.index + m[0].length).trim())) continue;
    if (/[A-Za-z]$/.test(before)) continue;
    return { raw: Number(m[1]), text: m[1], whole: !m[1].includes('.'), at: m.index + m[0].length };
  }
  return null;
}

function findLab(lines) {
  for (const [needle, name] of KNOWN_LABS) if (lines.some((l) => l.toLowerCase().includes(needle.toLowerCase()))) return name;
  return lines.find((l) => /\b(lab(?:oratory|oratories|s)?|diagnostic)\b/i.test(l) && l.length < 60)?.trim() ?? null;
}

function findDate(text) {
  const near = text.match(new RegExp(`(?:reported|report date|collected|sample|date)[^\\n]{0,25}?(\\d{1,2}[\\s/.-](?:\\d{1,2}|${MONTHS})[a-z]*[\\s/.-]\\d{2,4})`, 'i'));
  const any = text.match(new RegExp(`\\b(\\d{1,2}[\\s/.-](?:${MONTHS})[a-z]*[\\s/.-]\\d{4})\\b`, 'i')) ?? text.match(/\b(\d{1,2}[/.-]\d{1,2}[/.-]\d{4})\b/);
  const raw = (near ?? any)?.[1];
  if (!raw) return null;
  const named = raw.match(new RegExp(`(\\d{1,2})[\\s/.-](${MONTHS})[a-z]*[\\s/.-](\\d{2,4})`, 'i'));
  if (named) {
    const year = named[3].length === 2 ? `20${named[3]}` : named[3];
    const month = named[2].slice(0, 3);
    return `${Number(named[1])} ${month[0].toUpperCase()}${month.slice(1).toLowerCase()} ${year}`;
  }
  const [d, mo, y] = raw.split(/[/.-]/).map(Number); // Pakistan uses day/month/year
  if (!d || !mo || mo > 12 || d > 31) return null;
  const date = new Date(Date.UTC(y < 100 ? 2000 + y : y, mo - 1, d));
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date).replace('Sept', 'Sep');
}

/**
 * @returns {{ lab: string|null, date: string|null, results: Array<{ name, value, unit, status, raw, from, line, confidence }> }}
 */
export function readReport(text) {
  const lines = String(text ?? '')
    .split(/\r?\n/)
    .map(normaliseLine)
    .filter((l) => l.trim());
  const used = new Set();
  const results = [];

  for (const test of LAB_TESTS) {
    let unclear = null; // the test is on the report but its number can't be right: ask the family
    for (let i = 0; i < lines.length; i++) {
      if (used.has(i)) continue;
      const line = lines[i];
      if (/ratio|non[\s-]?hdl|\bvldl\b/i.test(line)) continue;
      const alias = test.aliases.map((a) => line.match(a)).find(Boolean);
      if (!alias) continue;
      // The result is usually on the same line; OCR of tables sometimes pushes it to the next.
      let rest = line.slice(alias.index + alias[0].length);
      let found = firstResult(rest);
      if (!found && lines[i + 1] && !LAB_TESTS.some((t) => t.aliases.some((a) => a.test(lines[i + 1])))) {
        rest = lines[i + 1];
        found = firstResult(rest);
      }
      if (!found) continue;
      const unitText = rest.slice(found.at, found.at + 24).match(UNIT)?.[0] ?? '';
      // The report names our unit: take the number as it is, don't guess a conversion from its size.
      let { value, from } = unitText && unitKey(unitText) === unitKey(test.unit) ? { value: found.raw } : test.convert(found.raw, unitText);
      const plausible = (v) => v >= test.plausible[0] && v <= test.plausible[1];
      let scale = 1;
      if (!from && found.whole && test.decimals) {
        scale = decimalScale(test, rest.slice(found.at));
        if (scale === 1 && !plausible(value) && plausible(value / 10)) scale = 10; // "115 g/dL" was 11.5
        if (scale > 1) value = plausible(found.raw / scale) ? found.raw / scale : NaN; // NaN: can't tell what it was
      }
      if (!plausible(value)) {
        unclear ??= { i, line, raw: `${found.raw}${unitText ? ` ${unitText.replace(/\s+/g, '')}` : ''}` };
        continue;
      }
      unclear = null;
      used.add(i);
      results.push({
        name: test.name,
        // Keep the lab's own precision; only round when we converted the unit.
        value: from || scale > 1 ? formatValue(test, value) : found.text,
        unit: test.unit,
        status: test.grade(value),
        raw: `${found.raw}${unitText ? ` ${unitText.replace(/\s+/g, '')}` : ''}`,
        from: from ?? null,
        line: line.trim().slice(0, 120),
        confidence: scale > 1 ? 'decimal' : unitText || from ? 'high' : 'check',
      });
      break;
    }
    if (unclear) {
      used.add(unclear.i);
      results.push({ name: test.name, value: '', unit: test.unit, status: null, raw: unclear.raw, from: null, line: unclear.line.trim().slice(0, 120), confidence: 'unclear' });
    }
  }
  return { lab: findLab(lines), date: findDate(lines.join('\n')), results };
}
