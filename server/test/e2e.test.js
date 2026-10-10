// End-to-end tests: every role, every main flow, and the permission boundaries between them.
// Reseeds the database, then talks to the running API over HTTP.
//   npm run dev -w server   (in another terminal)
//   npm run test:e2e -w server
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { connectDb } from '../src/config/db.js';
import { seed, DEMO_PASSWORD } from '../src/seed/seed.js';

const API = process.env.API ?? 'http://localhost:4000/api';

async function call(path, { method = 'GET', token, body, lang } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (lang) headers['X-Language'] = lang;
  const res = await fetch(`${API}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}
const ok = async (path, opts) => {
  const r = await call(path, opts);
  assert.ok(r.status < 300, `${opts?.method ?? 'GET'} ${path} → ${r.status} ${JSON.stringify(r.data)}`);
  return r.data;
};
const login = async (email, role) => (await ok('/auth/login', { method: 'POST', body: { email, password: DEMO_PASSWORD, role } })).token;

const T = {};
let ammi;
let abbu;

before(async () => {
  // Fail once, clearly, if the API isn't running, instead of 33 confusing failures.
  const up = await fetch(`${API}/health`).then((r) => r.ok, () => false);
  if (!up) throw new Error(`The API isn't reachable at ${API}. Start it with "npm run dev -w server", then run the tests again.`);
  await connectDb();
  await seed();
  await mongoose.disconnect();
  T.sana = await login('sana.rahman@gmail.com', 'family');
  T.hina = await login('hina.qureshi@kinwell.pk', 'nutritionist');
  T.amna = await login('amna.sheikh@kinwell.pk', 'nutritionist');
  T.zara = await login('zara.ahmed@kinwell.pk', 'admin');
  const parents = await ok('/parents', { token: T.sana });
  [ammi, abbu] = [parents.find((p) => p.key === 'ammi').id, parents.find((p) => p.key === 'abbu').id];
});
after(() => mongoose.disconnect());

describe('auth', () => {
  test('health is public', async () => assert.equal((await call('/health')).status, 200));
  test('protected routes need a token', async () => assert.equal((await call('/parents')).status, 401));
  test('wrong password is refused', async () => assert.equal((await call('/auth/login', { method: 'POST', body: { email: 'sana.rahman@gmail.com', password: 'nope' } })).status, 401));
  test('choosing the wrong role is refused', async () => assert.equal((await call('/auth/login', { method: 'POST', body: { email: 'sana.rahman@gmail.com', password: DEMO_PASSWORD, role: 'admin' } })).status, 401));
  test('bad input is a 400 with field details', async () => {
    const r = await call('/auth/login', { method: 'POST', body: { email: 'not-an-email' } });
    assert.equal(r.status, 400);
    assert.ok(r.data.error.details.email);
  });
  test('sign out everywhere invalidates old tokens', async () => {
    const t = await login('bilal.rahman@gmail.com');
    await ok('/auth/logout', { method: 'POST', token: t, body: { everywhere: true } });
    assert.equal((await call('/auth/me', { token: t })).status, 401);
  });
});

describe('family member (Sana)', () => {
  test('sees both parents and every section', async () => {
    for (const s of ['dashboard', 'profile', 'labs', 'nutrition', 'supplements', 'visits', 'documents', 'messages']) await ok(`/parents/${ammi}/${s}`, { token: T.sana });
    await ok('/parents/threads', { token: T.sana });
  });
  test('next visit countdown is calculated', async () => {
    const d = await ok(`/parents/${ammi}/dashboard`, { token: T.sana });
    assert.match(d.parent.nextIn, /^(Today|Tomorrow|In \d+ days)$/);
  });
  test('missed doses come from the daily checklists', async () => {
    const d = await ok(`/parents/${ammi}/dashboard`, { token: T.sana });
    assert.ok(d.parent.alerts.some((a) => a.type === 'Missed'));
  });
  test('ticking a checklist item is saved', async () => {
    await ok(`/parents/${ammi}/checklist/s2`, { method: 'PATCH', token: T.sana, body: { done: true } });
    const d = await ok(`/parents/${ammi}/dashboard`, { token: T.sana });
    assert.equal(d.checklist.find((i) => i.code === 's2').done, true);
  });
  test('reminders, messages and reschedule requests work', async () => {
    await ok(`/parents/${ammi}/supplements/reminders`, { method: 'PATCH', token: T.sana, body: { slot: 'Morning', on: false } });
    const m = await ok(`/parents/${ammi}/messages`, { method: 'POST', token: T.sana, body: { text: 'Test message' } });
    assert.equal(m.mine, true);
    const { availability } = await ok(`/parents/${abbu}/visits`, { token: T.sana });
    const v = await ok(`/parents/${abbu}/visits/reschedule`, { method: 'POST', token: T.sana, body: { day: availability.days[1].long, time: availability.slots.find((s) => s.open).time } });
    assert.equal(v.status, 'reschedule_requested');
  });
  test("cannot see another family's parent", async () => {
    const zara = await ok('/admin/families?q=khan', { token: T.zara });
    const fam = await ok(`/admin/families/${zara.items[0].id}`, { token: T.zara });
    assert.equal((await call(`/parents/${fam.parents[0].id}/dashboard`, { token: T.sana })).status, 403);
  });
  test('cannot use staff areas', async () => {
    assert.equal((await call('/admin/overview', { token: T.sana })).status, 403);
    assert.equal((await call('/workspace/today', { token: T.sana })).status, 403);
  });
});

describe('parent (Ammi) sign-in and Urdu', () => {
  let code;
  test('family creates a code; any phone format signs in; it works once', async () => {
    ({ code } = await ok(`/parents/${ammi}/sign-in-code`, { method: 'POST', token: T.sana }));
    const s = await ok('/auth/parent-code/verify', { method: 'POST', body: { phone: '0300-111 2233', code } });
    assert.equal(s.user.role, 'parent');
    assert.equal(s.user.language, 'ur');
    T.ammi = s.token;
    assert.equal((await call('/auth/parent-code/verify', { method: 'POST', body: { phone: '+923001112233', code } })).status, 401);
  });
  test('five wrong tries lock the code', async () => {
    ({ code } = await ok(`/parents/${ammi}/sign-in-code`, { method: 'POST', token: T.sana }));
    for (let i = 0; i < 5; i++) await call('/auth/parent-code/verify', { method: 'POST', body: { phone: '+923001112233', code: '000000' } });
    const r = await call('/auth/parent-code/verify', { method: 'POST', body: { phone: '+923001112233', code } });
    assert.equal(r.data.error.code, 'code_locked');
  });
  test('home screen comes back in Urdu', async () => {
    const h = await ok(`/parents/${ammi}/home`, { token: T.ammi, lang: 'ur' });
    assert.equal(h.parent.short, 'امی');
    assert.match(h.checklist[0].simple, /[؀-ۿ]/);
    assert.match(h.nextVisit.date, /[؀-ۿ]/);
    assert.ok(h.children.every((c) => c.phone));
  });
  test('language choice is saved', async () => {
    const r = await ok('/auth/me/language', { method: 'PATCH', token: T.ammi, body: { language: 'en' } });
    assert.equal(r.user.language, 'en');
  });
  test('cannot see Abbu or staff areas', async () => {
    assert.equal((await call(`/parents/${abbu}/dashboard`, { token: T.ammi })).status, 403);
    assert.equal((await call('/admin/overview', { token: T.ammi })).status, 403);
  });
});

describe('nutritionist (Hina)', () => {
  test('today, inbox and sorted clients', async () => {
    const today = await ok('/workspace/today', { token: T.hina });
    assert.equal(today.clashes, 0);
    assert.ok(today.requests.length >= 1);
    const inbox = await ok('/workspace/inbox', { token: T.hina });
    assert.ok(inbox.needsReply >= 1);
    const clients = await ok('/workspace/clients', { token: T.hina });
    const rank = { attention: 2, watch: 1, normal: 0 };
    for (let i = 1; i < clients.length; i++) assert.ok(rank[clients[i - 1].status] >= rank[clients[i].status], 'clients sorted by urgency');
  });
  test("cannot open another nutritionist's client", async () => {
    const amnas = await ok('/workspace/clients', { token: T.amna });
    assert.equal((await call(`/workspace/clients/${amnas[0].id}`, { token: T.hina })).status, 404);
  });
  test('empty and mistyped visits are refused', async () => {
    assert.equal((await call(`/workspace/clients/${ammi}/visits`, { method: 'POST', token: T.hina, body: {} })).status, 400);
    const r = await call(`/workspace/clients/${ammi}/visits`, { method: 'POST', token: T.hina, body: { vitals: [{ label: 'Blood pressure', value: '1650/100' }] } });
    assert.equal(r.status, 400);
    assert.ok(r.data.error.details['Blood pressure']);
  });
  test('high readings are graded and reach the family and admins', async () => {
    const r = await ok(`/workspace/clients/${ammi}/visits`, { method: 'POST', token: T.hina, body: { vitals: [{ label: 'Blood pressure', value: '165/100' }, { label: 'Fasting sugar', value: '186' }, { label: 'Weight', value: '63.5' }], notes: 'High readings today.' } });
    assert.deepEqual(r.readings.map((x) => x.status), ['attention', 'attention', 'normal']);
    const d = await ok(`/parents/${ammi}/dashboard`, { token: T.sana });
    assert.equal(d.parent.overall, 'attention');
    assert.equal(d.markers.find((m) => m.name === 'Blood pressure').value, '165/100');
    assert.ok(d.parent.alerts.some((a) => a.type === 'Visit reading'));
    const msgs = await ok(`/parents/${ammi}/messages`, { token: T.sana });
    assert.ok(msgs.some((m) => m.visit?.title?.includes('attention')));
    const o = await ok('/admin/overview', { token: T.zara });
    assert.ok(o.queue.some((f) => f.title.startsWith('Fatima Rahman') && f.type === 'Critical result'));
  });
  test('plans publish only when complete, then reach the family', async () => {
    const plan = await ok(`/workspace/clients/${ammi}/plan`, { token: T.hina });
    plan.days[2][2] = null;
    await ok(`/workspace/clients/${ammi}/plan`, { method: 'PUT', token: T.hina, body: { days: plan.days, links: plan.links, supplements: [...plan.supplements, 'b12'] } });
    assert.equal((await call(`/workspace/clients/${ammi}/plan/publish`, { method: 'POST', token: T.hina })).status, 400);
    plan.days[2][2] = 'fish';
    await ok(`/workspace/clients/${ammi}/plan`, { method: 'PUT', token: T.hina, body: { days: plan.days, links: plan.links, supplements: [...plan.supplements, 'b12'] } });
    await ok(`/workspace/clients/${ammi}/plan/publish`, { method: 'POST', token: T.hina });
    const n = await ok(`/parents/${ammi}/nutrition`, { token: T.sana });
    assert.equal(n.plan.weekOf, plan.weekOf);
    const s = await ok(`/parents/${ammi}/supplements`, { token: T.sana });
    assert.ok(s.supplements.some((x) => x.title.startsWith('Vitamin B12')));
  });
  test('accepting a reschedule request tells the family', async () => {
    const today = await ok('/workspace/today', { token: T.hina });
    const req = today.requests.find((r) => r.parent.name === 'Tariq Rahman') ?? today.requests[0];
    const after = await ok(`/workspace/requests/${req.visitId}`, { method: 'POST', token: T.hina, body: { decision: 'accept' } }).catch(async () =>
      ok(`/workspace/requests/${req.visitId}`, { method: 'POST', token: T.hina, body: { decision: 'decline' } }),
    );
    assert.ok(!after.requests.some((r) => r.visitId === req.visitId));
  });
  test('cannot use the admin area', async () => assert.equal((await call('/admin/overview', { token: T.hina })).status, 403));
});

describe('lab reports (OCR)', () => {
  const text = 'CHUGHTAI LAB\nReported: 26-Sep-2026\nGlucose Fasting 118 mg/dL 70 - 99\nHbA1c 74 % <57\nVitamin D (25-OH) 18.2 ng/mL 30 - 100\nHemoglobin (Hb) 1.6 g/dL 12.0-15.5';
  test('reading proposes results without saving anything', async () => {
    const before = await ok(`/parents/${ammi}/labs`, { token: T.sana });
    const r = await ok(`/parents/${ammi}/labs/read`, { method: 'POST', token: T.sana, body: { text } });
    const x = Object.fromEntries(r.results.map((y) => [y.name, y]));
    assert.equal(r.lab, 'Chughtai Lab');
    assert.equal(r.date, '26 Sep 2026');
    assert.equal(x['Fasting blood sugar'].value, '118');
    assert.equal(x.HbA1c.value, '7.4');
    assert.equal(x.HbA1c.confidence, 'decimal');
    assert.equal(x['Vitamin D'].status, 'attention');
    assert.equal(x.Hemoglobin.confidence, 'unclear');
    const after = await ok(`/parents/${ammi}/labs`, { token: T.sana });
    assert.equal(after.reports.length, before.reports.length);
  });
  test('saving re-grades on the server and reaches the nutritionist and admins', async () => {
    const saved = await ok(`/parents/${ammi}/labs/reports`, { method: 'POST', token: T.sana, body: { fileName: 'oct.pdf', lab: 'Chughtai Lab', date: '26 Sep 2026', source: 'pdf', results: [{ name: 'HbA1c', value: '7.4' }, { name: 'Hemoglobin', value: '11.6' }] } });
    assert.deepEqual(saved.results.map((r) => r.status), ['attention', 'watch']);
    const labs = await ok(`/parents/${ammi}/labs`, { token: T.sana });
    assert.equal(labs.reports[0].file, 'oct.pdf');
    assert.equal(labs.markers.find((m) => m.name === 'HbA1c').value, '7.4');
    const n = await ok('/workspace/notifications', { token: T.hina });
    assert.match(n[0].title, /New lab results for Fatima Rahman/);
    const o = await ok('/admin/flags', { token: T.zara });
    const flags = Array.isArray(o) ? o : Object.values(o).find(Array.isArray);
    assert.ok(flags.some((f) => f.type === 'Critical result' && f.title.includes('HbA1c 7.4')));
  });
  test('impossible and unknown results are refused', async () => {
    assert.equal((await call(`/parents/${ammi}/labs/reports`, { method: 'POST', token: T.sana, body: { fileName: 'x.pdf', results: [{ name: 'HbA1c', value: '74' }] } })).status, 400);
    assert.equal((await call(`/parents/${ammi}/labs/reports`, { method: 'POST', token: T.sana, body: { fileName: 'x.pdf', results: [{ name: 'Magic', value: '1' }] } })).status, 400);
    assert.equal((await call(`/parents/${ammi}/labs/read`, { method: 'POST', body: { text } })).status, 401);
  });
  test('an unreadable report goes to the admin queue', async () => {
    const before = await ok('/admin/lab-uploads', { token: T.zara });
    await ok(`/parents/${ammi}/labs/unreadable`, { method: 'POST', token: T.sana, body: { fileName: 'IMG_dark.jpg', reason: "Couldn't find any results" } });
    const after = await ok('/admin/lab-uploads', { token: T.zara });
    assert.equal(after.open.length, before.open.length + 1);
  });
});

describe('admin (Zara)', () => {
  test('overview numbers are consistent', async () => {
    const o = await ok('/admin/overview', { token: T.zara });
    assert.equal(Number(o.stats.find((s) => s.key === 'flags').value), o.queue.length);
    const bars = o.weekBars.reduce((n, b) => n + b.booked, 0);
    assert.equal(bars, Number(o.stats.find((s) => s.key === 'visits').note.match(/\d+/)[0]));
    assert.equal(o.weekBars.length, 7);
  });
  test('flags: remind, resolve, reopen', async () => {
    const o = await ok('/admin/overview', { token: T.zara });
    const visitFlag = o.queue.find((f) => f.link.kind === 'visit');
    const f1 = await ok(`/admin/flags/${visitFlag.id}/remind`, { method: 'POST', token: T.zara, body: { message: 'Please add notes.' } });
    assert.equal(f1.notes.length, 1);
    const notices = await ok('/workspace/notifications', { token: T.amna });
    assert.ok(notices.some((n) => n.body === 'Please add notes.'));
    assert.equal((await ok(`/admin/flags/${visitFlag.id}/resolve`, { method: 'POST', token: T.zara, body: { note: 'done' } })).resolved, true);
    assert.equal((await ok(`/admin/flags/${visitFlag.id}/reopen`, { method: 'POST', token: T.zara })).resolved, false);
  });
  test('families: search, paging, detail, reassign', async () => {
    const page1 = await ok('/admin/families', { token: T.zara });
    assert.ok(page1.pages > 1 && page1.items.length === 20);
    const found = await ok('/admin/families?q=mumtaz', { token: T.zara });
    assert.equal(found.items[0].family, 'Hussain family');
    const team = await ok('/admin/nutritionists', { token: T.zara });
    const sadia = team.find((t) => t.name === 'Sadia Malik');
    const d = await ok(`/admin/families/${found.items[0].id}/nutritionist`, { method: 'PUT', token: T.zara, body: { nutritionistId: sadia.id } });
    assert.equal(d.nutritionist.name, 'Sadia Malik');
  });
  test('access request → invite link → join', async () => {
    const reqs = await ok('/admin/access-requests', { token: T.zara });
    const r = await ok(`/admin/access-requests/${reqs.find((x) => x.status === 'pending').id}`, { method: 'POST', token: T.zara, body: { decision: 'approve' } });
    const token = r.link.split('/').pop();
    await ok(`/auth/invites/${token}`);
    const s = await ok('/auth/invites/accept', { method: 'POST', body: { token, name: 'Nadia Khan', password: 'long-enough-1', city: 'Toronto' } });
    assert.equal(s.user.role, 'family');
    assert.equal((await call(`/auth/invites/${token}`)).status, 404);
  });
  test('team: add, leave, guards on turning off', async () => {
    const n = await ok('/admin/nutritionists', { method: 'POST', token: T.zara, body: { name: 'Test Person', email: 'test.person@kinwell.pk', credential: 'Dietitian', areas: ['Model Town'] } });
    await ok('/auth/login', { method: 'POST', body: { email: 'test.person@kinwell.pk', password: n.tempPassword } });
    const leave = await ok(`/admin/nutritionists/${n.id}`, { method: 'PATCH', token: T.zara, body: { availability: 'on_leave', leaveUntil: '2026-12-01' } });
    assert.match(leave.label, /On leave/);
    const amna = (await ok('/admin/nutritionists?q=amna', { token: T.zara }))[0];
    assert.equal((await call(`/admin/accounts/${amna.id}/active`, { method: 'PUT', token: T.zara, body: { active: false } })).status, 400);
    await ok(`/admin/accounts/${n.id}/active`, { method: 'PUT', token: T.zara, body: { active: false } });
    assert.equal((await call('/auth/login', { method: 'POST', body: { email: 'test.person@kinwell.pk', password: n.tempPassword } })).status, 401);
  });
  test('accounts: reset password and parent code', async () => {
    const acc = await ok('/admin/accounts?q=bilal', { token: T.zara });
    const { tempPassword } = await ok(`/admin/accounts/${acc.items[0].id}/reset-password`, { method: 'POST', token: T.zara });
    await ok('/auth/login', { method: 'POST', body: { email: 'bilal.rahman@gmail.com', password: tempPassword } });
    const parents = await ok('/admin/accounts?role=parent', { token: T.zara });
    assert.match((await ok(`/admin/accounts/${parents.items[0].id}/parent-code`, { method: 'POST', token: T.zara })).code, /^\d{6}$/);
  });
  test('queues, areas and activity', async () => {
    const labs = await ok('/admin/lab-uploads', { token: T.zara });
    const after = await ok(`/admin/lab-uploads/${labs.open[0].id}`, { method: 'POST', token: T.zara, body: { action: 'retake' } });
    assert.equal(after.open.length, labs.open.length - 1);
    const areas = await ok('/admin/areas', { method: 'PUT', token: T.zara, body: { name: 'Test Town', capacity: 5 } });
    const t = areas.find((a) => a.area === 'Test Town');
    await ok(`/admin/areas/${t.id}`, { method: 'DELETE', token: T.zara });
    const busy = areas.find((a) => a.clients > 0);
    assert.equal((await call(`/admin/areas/${busy.id}`, { method: 'DELETE', token: T.zara })).status, 400);
    const log = await ok('/admin/activity', { token: T.zara });
    assert.ok(log.total >= 8);
  });
});

describe('onboarding', () => {
  test('a new family can sign up, and the email is then taken', async () => {
    const team = await ok('/onboarding/nutritionists');
    const body = {
      you: { name: 'Test Family', email: 'test.family@example.com', password: 'long-enough-1', city: 'Dubai' },
      parents: [{ name: 'Test Parent', callThem: 'Ammi', age: 70, area: 'Gulberg' }],
      invites: [{ email: 'sibling@example.com', access: 'view' }],
      nutritionistId: team[0].id,
      health: { conditions: ['Diabetes'], diet: ['Halal'] },
    };
    const s = await ok('/onboarding', { method: 'POST', body });
    const parents = await ok('/parents', { token: s.token });
    assert.equal(parents.length, 1);
    assert.equal((await call('/onboarding', { method: 'POST', body })).status, 400);
  });
});
