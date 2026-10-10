// Lab reports uploaded by families: read the text, let them review, then save the results.
import { Family, Flag, LabReport, Notification } from '../../models/index.js';
import { ApiError } from '../../utils/ApiError.js';
import { testByName } from './catalogue.js';
import { recordResult } from './markers.js';
import { readReport } from './readReport.js';

const today = () => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Karachi' }).format(new Date()).replace('Sept', 'Sep');

/** Step 1: text from the browser's OCR (or a digital PDF) → proposed results to review. Nothing is saved. */
export function proposeResults(_parent, { text }) {
  return readReport(text);
}

/**
 * Step 2: the family confirms (and may correct) the results. Values are re-checked and graded
 * here — the browser's grading is never trusted. Results that need attention alert the family,
 * notify the nutritionist and flag the Kinwell team.
 */
export async function saveReport(parent, user, { fileName, lab, date, results, source }) {
  const graded = results.map((r) => {
    const test = testByName(r.name);
    if (!test) throw ApiError.badRequest(`"${r.name}" isn't a test Kinwell tracks yet.`);
    const number = Number(String(r.value).replace(',', '.'));
    if (!Number.isFinite(number) || number < test.plausible[0] || number > test.plausible[1]) {
      throw ApiError.badRequest(`${r.name}: ${r.value} ${test.unit} can't be right. Check the number on the report.`, { [r.name]: 'Check this number' });
    }
    return { name: test.name, value: String(number), number, unit: test.unit, status: test.grade(number) };
  });
  if (!graded.length) throw ApiError.badRequest('Add at least one result before saving.');

  for (const g of graded) await recordResult(parent.id, g);
  const report = await LabReport.create({
    parent: parent.id,
    lab: lab?.trim() || 'Uploaded report',
    date: date?.trim() || today(),
    file: fileName,
    by: `${source === 'manual' ? 'Typed in' : 'Uploaded'} by ${user.name.split(' ')[0]}`,
    status: 'read',
    resultsFound: graded.length,
  });

  const urgent = graded.filter((g) => g.status === 'attention');
  if (urgent.length) {
    const list = urgent.map((g) => `${g.name} ${g.value} ${g.unit}`).join(', ');
    for (const g of urgent) {
      parent.alerts.unshift({ status: 'attention', type: 'New lab result', title: `${g.name} needs attention (${g.value} ${g.unit})`, text: `From the ${report.lab} report added on ${today()}. Your nutritionist has been told.`, action: 'See result' });
    }
    if (parent.overall !== 'attention') {
      parent.overall = 'attention';
      parent.overallTitle = 'A new lab result needs attention';
    }
    await parent.save();
    if (parent.nutritionist) {
      await Notification.create({ user: parent.nutritionist, title: `New lab results for ${parent.fullName}`, body: `${list}. Uploaded by ${user.name}.`, from: user.name });
    }
    const family = await Family.findById(parent.family, 'name');
    await Flag.create({ status: 'attention', type: 'Critical result', title: `${parent.fullName}: ${list} (lab report)`, meta: `Uploaded by ${user.name} · ${family?.name ?? ''}`, action: 'Review', link: { kind: 'parent', parent: parent.id, family: parent.family, user: parent.nutritionist } });
  } else if (parent.nutritionist) {
    await Notification.create({ user: parent.nutritionist, title: `New lab report for ${parent.fullName}`, body: `${graded.length} results from ${report.lab}. Nothing needs urgent attention.`, from: user.name });
  }
  return { id: report.id, saved: graded.length, results: graded.map(({ name, value, unit, status }) => ({ name, value, unit, status })) };
}

/** When nothing could be read, keep a record so the Kinwell team can help (admin queue). */
export async function reportUnreadable(parent, user, { fileName, reason }) {
  const report = await LabReport.create({ parent: parent.id, lab: 'Uploaded report', date: today(), file: fileName, by: `Uploaded by ${user.name.split(' ')[0]}`, status: 'failed', failureReason: reason || "Couldn't find any results" });
  const open = await LabReport.countDocuments({ status: 'failed' });
  const existing = await Flag.findOne({ resolved: false, 'link.kind': 'labUploads' });
  const title = `${open} report${open > 1 ? 's' : ''} couldn't be read automatically`;
  if (existing) await existing.updateOne({ title, meta: `Newest: ${fileName} for ${parent.fullName}` });
  else await Flag.create({ status: 'watch', type: 'Lab upload', title, meta: `Newest: ${fileName} for ${parent.fullName}`, action: 'See reports', link: { kind: 'labUploads' } });
  return { id: report.id, queued: true };
}

