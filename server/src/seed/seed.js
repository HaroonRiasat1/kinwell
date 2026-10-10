// Seeds MongoDB with the Rahman family and the rest of the demo data from the Kinwell design.
// Run with: npm run seed   (drops the existing kinwell database first)
import { pathToFileURL } from 'node:url';
import ur from '@kinwell/shared/i18n/ur.js';
import mongoose from 'mongoose';
import {
  BAND,
  BAND_ABBU,
  CONTACTS,
  DISHES,
  DOCS,
  FAVOR,
  INTERACT,
  MEANING,
  MONTHS,
  MSGS,
  PARENTS,
  PROFILE,
  REPORTS,
  SUPPX,
  VISITS,
  WEEK,
} from '@kinwell/shared';
import { connectDb } from '../config/db.js';
import {
  AccessRequest,
  DailyLog,
  Dish,
  Document,
  Family,
  Flag,
  LabMarker,
  LabReport,
  MealPlan,
  Message,
  Parent,
  ServiceArea,
  Supplement,
  User,
  Visit,
} from '../models/index.js';
import { todayKey, weekDateKeys, weekdayIndex } from '../utils/time.js';

export const DEMO_PASSWORD = 'kinwell-demo';

const daysFromNow = (n) => new Date(Date.now() + n * 24 * 3600 * 1000);

// "2026-10-12", "11:00 am" → that moment in Lahore (UTC+5, no daylight saving).
function lahoreTime(dateKey, clock) {
  const [, h, m = '00', ap] = clock.match(/(\d+):?(\d+)?\s*(am|pm)/i);
  const hour = (Number(h) % 12) + (ap.toLowerCase() === 'pm' ? 12 : 0);
  return new Date(`${dateKey}T${String(hour).padStart(2, '0')}:${m}:00+05:00`);
}

async function makeUser(fields) {
  const user = new User(fields);
  await user.setPassword(DEMO_PASSWORD);
  return user.save();
}

async function seedPeople() {
  const nutritionists = {};
  const team = [
    ['hina', 'Hina Qureshi', 'Registered dietitian · 9 years', 'Urdu, Punjabi, English', ['Model Town', 'Gulberg', 'Johar Town'], 'Mon 12 Oct', '98%'],
    ['amna', 'Amna Sheikh', 'Clinical nutritionist · 12 years', 'Urdu, English', ['DHA', 'Cantt'], 'Wed 14 Oct', '91%'],
    ['usman', 'Usman Tariq', 'Registered dietitian · 6 years', 'Urdu, Punjabi', ['Gulberg', 'Garden Town'], 'Tue 13 Oct', '96%'],
    ['sadia', 'Sadia Malik', 'Registered dietitian · 7 years', 'Urdu, English', ['Johar Town'], 'Thu 15 Oct', '94%'],
    ['faraz', 'Faraz Ahmed', 'Clinical nutritionist · 4 years', 'Urdu, Punjabi', ['Bahria Town'], '19 Oct', '—'],
  ];
  for (const [key, name, credential, languages, areas, nextOpening, onTimeRate] of team) {
    nutritionists[key] = await makeUser({
      name,
      email: `${name.toLowerCase().replace(' ', '.')}@kinwell.pk`,
      role: 'nutritionist',
      city: 'Lahore',
      nutritionist: {
        credential,
        languages,
        areas,
        nextOpening,
        onTimeRate,
        availability: key === 'faraz' ? 'on_leave' : 'active',
        leaveUntil: key === 'faraz' ? daysFromNow(9) : undefined,
        licenceRenewsOn: key === 'usman' ? daysFromNow(14) : daysFromNow(300),
      },
    });
  }
  const admin = await makeUser({ name: 'Zara Ahmed', email: 'zara.ahmed@kinwell.pk', role: 'admin', city: 'Lahore' });
  return { nutritionists, admin };
}

async function seedRahmanFamily(hina) {
  const sana = await makeUser({ name: 'Sana Rahman', email: 'sana.rahman@gmail.com', phone: '+44 7700 900412', role: 'family', city: 'London', timezone: 'Europe/London' });
  const bilal = await makeUser({ name: 'Bilal Rahman', email: 'bilal.rahman@gmail.com', phone: '+971 50 123 4567', role: 'family', city: 'Dubai', timezone: 'Asia/Dubai' });

  const family = await Family.create({
    name: 'Rahman family',
    mainContact: sana.id,
    nutritionist: hina.id,
    members: [
      { user: sana.id, relation: 'Your daughter', access: 'edit' },
      { user: bilal.id, relation: 'Your son', access: 'edit' },
    ],
    contacts: CONTACTS,
    status: 'attention',
    lastActivityAt: new Date(),
  });
  sana.family = family.id;
  bilal.family = family.id;
  await Promise.all([sana.save(), bilal.save()]);

  const people = { hina, sana, bilal };
  const phones = { ammi: '+923001112233', abbu: '+923001112244' };

  for (const key of ['ammi', 'abbu']) {
    const P = PARENTS[key];
    const pr = PROFILE[key];
    const parent = await Parent.create({
      family: family.id,
      nutritionist: hina.id,
      key,
      short: P.short,
      fullName: pr.full,
      age: P.age,
      born: pr.born,
      languages: pr.langs,
      lives: pr.lives,
      city: P.city,
      area: 'Model Town',
      phone: phones[key],
      overall: P.overall,
      overallTitle: P.overallTitle,
      overallText: P.overallText,
      note: P.note,
      changes: P.changes,
      lastVisit: P.lastVisit,
      nextVisit: P.nextVisit,
      nextIn: P.nextIn,
      nextVisitLong: P.nextVisitLong,
      // Missed-dose alerts are worked out from the daily checklists, so only the others are stored.
      alerts: P.alerts.filter((a) => a.type !== 'Missed'),
      conditions: pr.conditions,
      allergies: pr.allergies,
      medicines: pr.meds,
      diet: pr.diet,
      favor: FAVOR[key].favor,
      limit: FAVOR[key].limit,
      interactions: INTERACT[key],
      i18n: { ur: { note: ur.notes[key], short: ur.names[key] } },
    });

    // Ammi and Abbu read the app in Urdu.
    await makeUser({ name: pr.full, phone: phones[key], role: 'parent', city: 'Lahore', language: 'ur', family: family.id, parent: parent.id });

    await LabMarker.insertMany(
      P.markers.map((m, order) => ({
        parent: parent.id,
        order,
        name: m.name,
        value: m.value,
        unit: m.unit,
        status: m.status,
        series: m.series,
        months: MONTHS,
        trend: m.trend,
        range: m.range,
        band: (key === 'abbu' && BAND_ABBU[m.name]) || BAND[m.name] || undefined,
        plain: m.plain,
        meaning: MEANING[key][m.name] ?? MEANING.fallback,
      })),
    );

    await LabReport.insertMany(REPORTS.map((r) => ({ parent: parent.id, ...r, status: 'read', resultsFound: 8 })));
    await Document.insertMany(DOCS[key].map((d) => ({ parent: parent.id, name: d.n, type: d.t, file: d.f, by: d.by })));

    const supps = P.items.filter((i) => i.kind === 'supp');
    await Supplement.insertMany(
      supps.map((i) => {
        const { week, ...x } = SUPPX[key][i.id]; // eslint-disable-line no-unused-vars
        return { parent: parent.id, code: i.id, title: i.title, simple: i.simple, dose: i.dose, time: i.time, ...x, i18n: { ur: ur.supplements[key][i.id] } };
      }),
    );
    await MealPlan.create({ parent: parent.id, weekOf: '5–11 October', createdBy: hina.id, createdLabel: 'Made by Hina on 28 Sep', days: WEEK[key] });
    // Checklists for the earlier days of this week, from the design's adherence record
    // (its "today" was Friday), then today's list in the design's state.
    const today = weekdayIndex();
    const history = (code, d) => {
      const v = SUPPX[key][code]?.week[d];
      if (v !== null && v !== undefined) return v === 1;
      return d === 4 ? P.items.find((i) => i.id === code).done : true;
    };
    const dishOf = (title) => Object.entries(DISHES).find(([, d]) => d.n === title)?.[0];
    const logItem = (i, done) => ({ code: i.id, dish: i.kind === 'meal' ? dishOf(i.title) : undefined, kind: i.kind, title: i.title, simple: i.simple, dose: i.dose, time: i.time, done });
    const keys = weekDateKeys();
    const logs = keys.slice(0, today).map((date, d) => ({
      parent: parent.id,
      date,
      items: P.items.map((i) => logItem(i, i.kind === 'supp' ? history(i.id, d) : true)),
    }));
    logs.push({
      parent: parent.id,
      date: todayKey(),
      items: P.items.map((i) => logItem(i, i.done)),
    });
    await DailyLog.insertMany(logs);

    const V = VISITS[key];
    const visitsByCode = {};
    for (const v of V.past) {
      const doc = await Visit.create({
        parent: parent.id,
        nutritionist: hina.id,
        status: 'completed',
        code: v.id,
        scheduledFor: lahoreTime(todayKey(new Date(`${v.short} 2026 12:00`)), '10:00 am'),
        loggedAt: new Date(lahoreTime(todayKey(new Date(`${v.short} 2026 12:00`)), '10:00 am').getTime() + 4 * 3600 * 1000),
        date: v.date,
        short: v.short,
        title: v.title,
        summary: v.summary,
        dur: v.dur,
        obs: v.obs,
        meas: v.meas.map(([n, val, status]) => ({ n, v: val, status })),
        tests: v.tests,
        recs: v.recs,
        next: v.next,
      });
      visitsByCode[v.id] = doc;
    }
    await Visit.create({
      parent: parent.id,
      nutritionist: hina.id,
      status: 'scheduled',
      scheduledFor: lahoreTime('2026-10-12', V.next.time),
      date: V.next.date,
      time: V.next.time,
      plan: V.next.plan,
    });

    // Message history, oldest first, with createdAt spaced so sort order is stable.
    const base = new Date('2026-09-28T09:00:00Z').getTime();
    await Message.insertMany(
      MSGS[key].map((m, i) => {
        const at = new Date(base + i * 60_000);
        if (m.card) return { parent: parent.id, from: hina.id, fromKey: 'hina', fromName: 'Hina Qureshi', fromRole: 'Nutritionist', visit: visitsByCode[m.card].id, createdAt: at };
        const who = people[m.from];
        return {
          parent: parent.id,
          from: who.id,
          fromKey: m.from,
          fromName: who.name,
          fromRole: m.from === 'hina' ? 'Nutritionist' : m.from === 'sana' ? 'Daughter' : 'Son · Dubai',
          text: m.text,
          timeLabel: m.t,
          createdAt: at,
        };
      }),
    );
  }
  return family;
}

// ---------- The rest of the client base ----------
// Deterministic random numbers, so every seed produces the same "random" team.
function mulberry32(a) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20261010);
const pick = (list) => list[Math.floor(rand() * list.length)];
const between = (lo, hi) => lo + Math.floor(rand() * (hi - lo + 1));

const MOTHERS = ['Shabana', 'Nasreen', 'Parveen', 'Rukhsana', 'Zahida', 'Kausar', 'Naseem', 'Rubina', 'Shamim', 'Bushra', 'Farzana', 'Tahira', 'Yasmin', 'Saeeda', 'Khalida', 'Razia'];
const FATHERS = ['Aslam', 'Javed', 'Rashid', 'Akram', 'Saleem', 'Anwar', 'Iqbal', 'Khalid', 'Nadeem', 'Pervaiz', 'Shahid', 'Zafar', 'Mushtaq', 'Ghulam', 'Bashir', 'Rafiq'];
const SURNAMES = ['Malik', 'Chaudhry', 'Sheikh', 'Siddiqui', 'Mirza', 'Raza', 'Awan', 'Bhatti', 'Hashmi', 'Gill', 'Rana', 'Abbasi', 'Ansari', 'Dar', 'Mughal', 'Javed'];
const CHILDREN = ['Ayesha', 'Hamza', 'Zainab', 'Usman', 'Fatima', 'Ali', 'Maryam', 'Omar', 'Hira', 'Sara', 'Hassan', 'Amna', 'Fahad', 'Mehwish', 'Danish', 'Saad'];
const ABROAD = ['London', 'Dubai', 'Toronto', 'Riyadh', 'Houston', 'Manchester', 'Sydney', 'New York', 'Doha', 'Birmingham'];
const UPDATES = [
  'Visit went well today. Blood pressure is steady and appetite is good. No changes to the plan this week.',
  "Today's visit is done. Sugar is a little higher, so I've swapped white rice for brown at dinner.",
  'All good today. Walking most days and taking tablets on time. Keep encouraging the morning walk.',
  "Checked in today. Slightly tired, so I've added more dal and palak at lunch. I'll re-check iron next time.",
];

const DAY_MS = 24 * 3600 * 1000;
const lahoreAt = (date, hour) => lahoreTime(todayKey(date), `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'pm' : 'am'}`);

// Clients per nutritionist (including the named families below) and where they work.
const TEAM_PLAN = {
  hina: { clients: 18, areas: ['Model Town', 'Gulberg', 'Johar Town'] },
  amna: { clients: 22, areas: ['DHA Phase 5', 'DHA Phase 6', 'Cantt'] },
  usman: { clients: 15, areas: ['Gulberg', 'Garden Town'] },
  sadia: { clients: 20, areas: ['Johar Town'] },
  faraz: { clients: 9, areas: ['Bahria Town'] },
};

let sharedHash;
async function quickUser(fields) {
  // One bcrypt hash reused for generated accounts keeps seeding fast.
  sharedHash ??= await (async () => {
    const u = new User({ name: 'x', role: 'family' });
    await u.setPassword(DEMO_PASSWORD);
    return u.passwordHash;
  })();
  return User.create({ ...fields, passwordHash: sharedHash });
}

async function makeFamily({ surname, contactFirst, city, nutritionist, members, createdDaysAgo, activeDaysAgo }) {
  const contactName = `${contactFirst} ${surname}`;
  const contact = await quickUser({
    name: contactName,
    email: `${contactFirst}.${surname}.${between(10, 99)}@example.com`.toLowerCase(),
    role: 'family',
    city,
  });
  const created = new Date(Date.now() - createdDaysAgo * DAY_MS);
  const [family] = await Family.insertMany(
    [
      {
        name: `${surname} family`,
        mainContact: contact.id,
        nutritionist: nutritionist.id,
        members: [{ user: contact.id, relation: 'Main contact', access: 'edit' }],
        lastActivityAt: new Date(Date.now() - activeDaysAgo * DAY_MS),
        createdAt: created,
        updatedAt: created,
      },
    ],
    { timestamps: false },
  );
  contact.family = family.id;
  await contact.save();
  const parents = [];
  for (const m of members) {
    parents.push(
      await Parent.create({
        family: family.id,
        nutritionist: nutritionist.id,
        key: m.name.split(' ')[0].toLowerCase(),
        short: m.name,
        fullName: m.name,
        age: m.age,
        city: 'Lahore',
        area: m.area,
        overall: m.overall,
        overallTitle: { normal: 'Doing well', watch: 'Keeping an eye on it', attention: 'Needs attention' }[m.overall],
      }),
    );
  }
  return { family, contact, parents };
}

/** Named families from the design, then generated ones up to each nutritionist's client count. */
async function seedClientBase(team, rahmanParents) {
  const named = [
    { surname: 'Khan', contactFirst: 'Imran', city: 'Toronto', nut: 'hina', members: [{ name: 'Zubaida Khan', age: 81, area: 'Gulberg', overall: 'normal' }], createdDaysAgo: 120, activeDaysAgo: 1 },
    { surname: 'Hussain', contactFirst: 'Ayesha', city: 'Riyadh', nut: 'amna', members: [{ name: 'Mumtaz Hussain', age: 69, area: 'DHA Phase 5', overall: 'attention' }], createdDaysAgo: 200, activeDaysAgo: 3 },
    { surname: 'Butt', contactFirst: 'Saima', city: 'Houston', nut: 'usman', members: [{ name: 'Rehana Butt', age: 77, area: 'Cantt', overall: 'watch' }, { name: 'Aslam Butt', age: 80, area: 'Cantt', overall: 'normal' }], createdDaysAgo: 90, activeDaysAgo: 2 },
    { surname: 'Ali', contactFirst: 'Faisal', city: 'Manchester', nut: 'sadia', members: [{ name: 'Nasir Ali', age: 74, area: 'Johar Town', overall: 'normal' }], createdDaysAgo: 60, activeDaysAgo: 0 },
  ];
  const clients = Object.fromEntries(Object.keys(TEAM_PLAN).map((k) => [k, []]));
  clients.hina.push(...rahmanParents);
  const byName = {};

  for (const f of named) {
    const made = await makeFamily({ ...f, nutritionist: team[f.nut] });
    clients[f.nut].push(...made.parents);
    byName[f.surname] = made;
  }

  let n = 0;
  for (const [key, plan] of Object.entries(TEAM_PLAN)) {
    while (clients[key].length < plan.clients) {
      n++;
      const surname = SURNAMES[n % SURNAMES.length];
      const couple = n % 5 === 0 && clients[key].length + 2 <= plan.clients;
      const area = pick(plan.areas);
      const roll = rand();
      const overall = roll < 0.6 ? 'normal' : roll < 0.9 ? 'watch' : 'attention';
      const members = [{ name: `${MOTHERS[n % MOTHERS.length]} ${surname}`, age: between(64, 86), area, overall }];
      if (couple) members.push({ name: `${FATHERS[n % FATHERS.length]} ${surname}`, age: between(66, 88), area, overall: 'normal' });
      const made = await makeFamily({
        surname,
        contactFirst: CHILDREN[n % CHILDREN.length],
        city: pick(ABROAD),
        nutritionist: team[key],
        members,
        createdDaysAgo: n % 9 === 0 ? between(1, 8) : between(20, 280),
        activeDaysAgo: between(0, 12),
      });
      clients[key].push(...made.parents);
    }
  }
  return { clients, byName };
}

/**
 * Every client (except the Rahmans, who have their own history) is seen every two weeks:
 * a recent visit with notes and an update to the family, and the next one booked.
 */
async function seedVisitRhythm(team, clients, { notLogged = {} } = {}) {
  const now = Date.now();
  const visits = [];
  const messages = [];
  // One visit per hour per nutritionist, so nobody is double-booked.
  const taken = new Set((await Visit.find({}, 'nutritionist scheduledFor')).map((v) => `${v.nutritionist}-${v.scheduledFor.getTime()}`));
  const book = (nutId, date, hour) => {
    for (let i = 0; i < 8; i++) {
      const h = 9 + ((hour - 9 + i) % 8);
      const at = lahoreAt(date, h);
      if (!taken.has(`${nutId}-${at.getTime()}`)) {
        taken.add(`${nutId}-${at.getTime()}`);
        return at;
      }
    }
    return lahoreAt(date, hour);
  };
  for (const [key, list] of Object.entries(clients)) {
    const nut = team[key];
    const onLeave = nut.nutritionist?.availability === 'on_leave';
    for (const p of list) {
      if (p.key === 'ammi' || p.key === 'abbu') continue;
      const forced = notLogged[p.id]; // { daysAgo, hour } for a visit that still has no notes
      // Someone on leave last saw clients before their leave began (over a week ago).
      const offset = forced?.daysAgo ?? (onLeave ? between(8, 13) : between(0, 13));
      const hour = forced?.hour ?? between(9, 16);
      const last = book(nut.id, new Date(now - offset * DAY_MS), hour);
      const previous = book(nut.id, new Date(last.getTime() - 14 * DAY_MS), hour);
      let next = book(nut.id, new Date(last.getTime() + 14 * DAY_MS), hour);
      if (onLeave && nut.nutritionist.leaveUntil && next < nut.nutritionist.leaveUntil) next = book(nut.id, new Date(nut.nutritionist.leaveUntil.getTime() + between(1, 5) * DAY_MS), hour);

      for (const at of [previous, last]) {
        if (at.getTime() > now) {
          visits.push({ parent: p.id, nutritionist: nut.id, status: 'scheduled', scheduledFor: at, title: 'Home visit' });
          continue;
        }
        if (forced && at === last) {
          visits.push({ parent: p.id, nutritionist: nut.id, status: 'scheduled', scheduledFor: at, title: 'Home visit' });
          continue;
        }
        const late = rand() < 0.1;
        const loggedAt = new Date(at.getTime() + (late ? between(26, 40) : between(1, 18)) * 3600 * 1000);
        visits.push({ parent: p.id, nutritionist: nut.id, status: 'completed', scheduledFor: at, loggedAt: loggedAt.getTime() > now ? new Date(now) : loggedAt, title: 'Home visit', short: todayKey(at) });
        const sent = new Date(Math.min(now, loggedAt.getTime() + between(0, 3) * 3600 * 1000));
        messages.push({ parent: p.id, from: nut.id, fromKey: key, fromName: nut.name, fromRole: 'Nutritionist', text: pick(UPDATES), timeLabel: 'Visit update', createdAt: sent, updatedAt: sent });
      }
      visits.push({ parent: p.id, nutritionist: nut.id, status: 'scheduled', scheduledFor: next, title: 'Home visit' });
    }
  }
  await Visit.insertMany(visits);
  await Message.insertMany(messages, { timestamps: false });
}

async function seedOps(team, rahman, byName, clients) {
  const { tariq, rahmanFamily } = rahman;
  const mumtaz = byName.Hussain.parents[0];
  const overdue = await Visit.findOne({ parent: mumtaz.id, status: 'scheduled', scheduledFor: { $lt: new Date() } }).sort('-scheduledFor');
  const overdueDays = overdue ? Math.max(1, Math.round((Date.now() - overdue.scheduledFor) / DAY_MS)) : 0;
  const shortDay = (d) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'Asia/Karachi' }).format(d);

  // Four uploads the lab reader couldn't read, on real client records.
  const candidates = Object.values(clients).flat().filter((p) => p.key !== 'ammi' && p.key !== 'abbu');
  const reasons = ['Blurry photo', 'The bottom of the page is cut off', 'Too dark to read', 'Not a lab report'];
  await LabReport.insertMany(
    reasons.map((reason, i) => {
      const at = new Date(Date.now() - (i * 9 + 3) * 3600 * 1000);
      return { parent: candidates[(i * 7 + 3) % candidates.length].id, lab: 'Uploaded report', file: `IMG_${2040 + i}.jpg`, by: `Uploaded by ${CHILDREN[(i * 3) % CHILDREN.length]}`, status: 'failed', failureReason: reason, createdAt: at, updatedAt: at };
    }),
    { timestamps: false },
  );

  const khan = byName.Khan;
  const request = await AccessRequest.create({ family: khan.family.id, requestedBy: khan.contact.id, name: 'Nadia Khan', email: 'nadia.khan@example.com', relation: 'Daughter', access: 'view' });

  await Flag.insertMany([
    { status: 'attention', type: 'Critical result', title: 'Tariq Rahman: fasting sugar 142, rising for 4 months', meta: 'Hina Qureshi · flagged 2 days ago · family told', action: 'Review', link: { kind: 'parent', parent: tariq.id, family: rahmanFamily.id, user: team.hina.id } },
    ...(overdue
      ? [{ status: 'attention', type: 'Visit not logged', title: `Mumtaz Hussain: ${shortDay(overdue.scheduledFor)} visit has no notes`, meta: `Amna Sheikh · ${overdueDays} day${overdueDays > 1 ? 's' : ''} overdue`, action: 'Contact', link: { kind: 'visit', visit: overdue.id, parent: mumtaz.id, family: byName.Hussain.family.id, user: team.amna.id } }]
      : []),
    { status: 'watch', type: 'Licence', title: 'Usman Tariq: dietitian licence renews in 14 days', meta: 'Pakistan Nutrition & Dietetic Society', action: 'Send reminder', link: { kind: 'nutritionist', user: team.usman.id } },
    { status: 'watch', type: 'Lab upload', title: "4 reports couldn't be read automatically", meta: 'Blurry or cut-off photos · newest 3 hours ago', action: 'See reports', link: { kind: 'labUploads' } },
    { status: 'normal', type: 'Access request', title: "Imran Khan wants to add his sister Nadia to Zubaida Khan's care team", meta: 'Waiting for a decision', action: 'View', link: { kind: 'accessRequest', accessRequest: request.id, family: khan.family.id } },
  ]);

  await ServiceArea.insertMany([
    { name: 'Model Town', capacity: 15 },
    { name: 'Gulberg', capacity: 14 },
    { name: 'Johar Town', capacity: 26 },
    { name: 'DHA', capacity: 20 },
    { name: 'Cantt', capacity: 12 },
    { name: 'Garden Town', capacity: 10 },
    { name: 'Bahria Town', capacity: 12 },
  ]);
  await Dish.insertMany(Object.entries(DISHES).map(([code, d]) => ({ code, name: d.n, nut: d.nut, why: d.why, link: d.link, i18n: { ur: ur.dishes[code] } })));
}

export async function seed() {
  await mongoose.connection.dropDatabase();
  await Promise.all(mongoose.modelNames().map((name) => mongoose.model(name).syncIndexes()));
  const { nutritionists } = await seedPeople();
  const rahmanFamily = await seedRahmanFamily(nutritionists.hina);
  const rahmanParents = await Parent.find({ family: rahmanFamily.id });
  const { clients, byName } = await seedClientBase(nutritionists, rahmanParents);
  // Two of Amna's recent visits have no notes yet: Mumtaz Hussain's, and one more.
  const mumtaz = byName.Hussain.parents[0];
  const another = clients.amna.find((p) => p.id !== mumtaz.id);
  await seedVisitRhythm(nutritionists, clients, {
    notLogged: { [mumtaz.id]: { daysAgo: 4, hour: 11 }, [another.id]: { daysAgo: 2, hour: 15 } },
  });
  await seedOps(nutritionists, { tariq: rahmanParents.find((p) => p.key === 'abbu'), rahmanFamily }, byName, clients);
  await seedHinasDay(nutritionists.hina, clients.hina, byName, rahmanParents);
}

/** Gives the demo nutritionist a real day: three visits still to do today, a request, a question. */
async function seedHinasDay(hina, hinaClients, byName, rahmanParents) {
  const now = Date.now();
  const slot = (h) => new Date(Math.ceil((now + h * 3600 * 1000) / (30 * 60 * 1000)) * 30 * 60 * 1000);
  const others = hinaClients.filter((p) => !rahmanParents.some((r) => r.id === p.id) && p.id !== byName.Khan.parents[0].id).slice(0, 3);
  for (const [i, p] of others.entries()) {
    const next = await Visit.findOne({ parent: p.id, status: 'scheduled', scheduledFor: { $gt: new Date() } }).sort('scheduledFor');
    if (next) await next.updateOne({ scheduledFor: slot(1 + i * 1.5) });
  }
  // Imran Khan asked to move his mother's next visit by a day.
  const zubaida = byName.Khan.parents[0];
  const zv = await Visit.findOne({ parent: zubaida.id, status: 'scheduled', scheduledFor: { $gt: new Date() } }).sort('scheduledFor');
  if (zv) {
    const moved = new Date(zv.scheduledFor.getTime() + DAY_MS);
    const day = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Karachi' }).format(moved).replace(',', '');
    // Ask for a time Hina actually has free that day.
    let time = '10:00 am';
    for (const h of [10, 11, 12, 13, 14, 15, 16]) {
      const at = lahoreAt(moved, h);
      const busy = await Visit.exists({ nutritionist: hina.id, scheduledFor: { $gt: new Date(at - 3600 * 1000), $lt: new Date(at.getTime() + 3600 * 1000) } });
      if (!busy) {
        time = `${h > 12 ? h - 12 : h}:00 ${h >= 12 ? 'pm' : 'am'}`;
        break;
      }
    }
    await zv.updateOne({ status: 'reschedule_requested', requestedSlot: { day, time } });
  }
  // A question from Sana waiting for Hina.
  const sana = await User.findOne({ email: 'sana.rahman@gmail.com' });
  const ammi = rahmanParents.find((p) => p.key === 'ammi');
  const at = new Date(now - 3 * 3600 * 1000);
  await Message.insertMany([{ parent: ammi.id, from: sana.id, fromKey: 'sana', fromName: sana.name, fromRole: 'Daughter', text: "Hina, Ammi says her ankles are swelling in the evenings again. Should we be worried, or can it wait until Monday?", timeLabel: 'Today', createdAt: at, updatedAt: at }], { timestamps: false });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await connectDb();
  await seed();
  console.log(`[seed] done. Every demo account uses the password "${DEMO_PASSWORD}".`);
  await mongoose.disconnect();
}
