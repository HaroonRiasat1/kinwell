import { LabMarker } from '../../models/index.js';
import { testByName } from './catalogue.js';

const monthOf = (d = new Date()) => new Intl.DateTimeFormat('en-GB', { month: 'short', timeZone: 'Asia/Karachi' }).format(d).replace('Sept', 'Sep');

/**
 * Records a new result on a parent's lab marker: sets the latest value and status, and adds the
 * month to the six-month trend (replacing this month's point if there is one). Creates the marker
 * for tests the parent hasn't had before.
 */
export async function recordResult(parentId, { name, value, number, status, unit }, when = new Date()) {
  const month = monthOf(when);
  let m = await LabMarker.findOne({ parent: parentId, name });
  if (!m) {
    const test = testByName(name);
    const order = (await LabMarker.countDocuments({ parent: parentId })) + 1;
    m = new LabMarker({ parent: parentId, order, name, unit: unit ?? test?.unit, range: test?.range, band: test?.band, plain: test?.plain, series: [], months: [] });
  }
  const series = [...m.series];
  const months = [...(m.months ?? [])];
  if (months.at(-1) === month && series.length) series[series.length - 1] = number;
  else {
    series.push(number);
    months.push(month);
  }
  while (series.length > 6) series.shift();
  while (months.length > series.length) months.shift();
  const diff = Math.round((series.at(-1) - series[0]) * 10) / 10;
  m.set({
    value,
    status,
    series,
    months,
    trend: series.length < 2 ? 'First result' : Math.abs(diff) < 1 ? 'Steady' : `${diff > 0 ? 'Up' : 'Down'} ${Math.abs(diff)} since ${months[0]}`,
  });
  await m.save();
  return m;
}
