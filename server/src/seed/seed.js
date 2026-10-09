// Seeds MongoDB with the Rahman family and the rest of the demo data from the Kinwell design.
// Run with: npm run seed   (drops the existing kinwell database first)
import { pathToFileURL } from 'node:url';
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
import { startOfWeek, todayKey, weekdayIndex } from '../utils/time.js';

export const DEMO_PASSWORD = 'kinwell-demo';

const daysFromNow = (n) => new Date(Date.now() + n * 24 * 3600 * 1000);

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
        licenceRenewsOn: key === 'usman' ? daysFromNow(14) : daysFromNow(300),
      },
    });
  }
  const admin = await makeUser({ name: 'Zara Ahmed', email: 'zara.ahmed@kinwell.pk', role: 'admin', city: 'Lahore' });
  return { nutritionists, admin };
}

async function seedRahmanFamily(hina) {
  const sana = await makeUser({ name: 'Sana Rahman', email: 'sana.rahman@gmail.com', role: 'family', city: 'London', timezone: 'Europe/London' });
  const bilal = await makeUser({ name: 'Bilal Rahman', email: 'bilal.rahman@gmail.com', role: 'family', city: 'Dubai', timezone: 'Asia/Dubai' });

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
      alerts: P.alerts,
      conditions: pr.conditions,
      allergies: pr.allergies,
      medicines: pr.meds,
      diet: pr.diet,
      favor: FAVOR[key].favor,
      limit: FAVOR[key].limit,
      interactions: INTERACT[key],
    });

    await makeUser({ name: pr.full, phone: phones[key], role: 'parent', city: 'Lahore', family: family.id, parent: parent.id });

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

    const today = weekdayIndex();
    await Supplement.insertMany(
      P.items
        .filter((i) => i.kind === 'supp')
        .map((i) => {
          const x = SUPPX[key][i.id];
          const week = x.week.map((v, d) => (d === today ? (i.done ? 1 : null) : d > today ? null : v));
          return { parent: parent.id, code: i.id, title: i.title, simple: i.simple, dose: i.dose, time: i.time, ...x, week };
        }),
    );

    await MealPlan.create({ parent: parent.id, weekOf: '5–11 October', createdBy: hina.id, createdLabel: 'Made by Hina on 28 Sep', days: WEEK[key] });
    await DailyLog.create({
      parent: parent.id,
      date: todayKey(),
      items: P.items.map((i) => ({ code: i.id, kind: i.kind, title: i.title, simple: i.simple, dose: i.dose, time: i.time, done: i.done })),
    });

    const V = VISITS[key];
    const visitsByCode = {};
    for (const v of V.past) {
      const doc = await Visit.create({
        parent: parent.id,
        nutritionist: hina.id,
        status: 'completed',
        code: v.id,
        scheduledFor: new Date(`${v.short} 2026 10:00`),
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
      scheduledFor: new Date(`12 October 2026 ${V.next.time}`),
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

// Other families on Hina's client list (lighter records).
async function seedOtherFamilies(hina) {
  const rows = [
    ['Khan family', 'Imran Khan', 'Toronto', [['Zubaida Khan', 81, 'Gulberg', 'normal', '2 Oct', 'Fri 16 Oct, 10 am']], 'normal', 1],
    ['Hussain family', 'Ayesha Hussain', 'Riyadh', [['Mumtaz Hussain', 69, 'DHA Phase 5', 'attention', '6 Oct', 'Tomorrow, 4 pm']], 'attention', 3],
    ['Butt family', 'Saima Butt', 'Houston', [['Rehana Butt', 77, 'Cantt', 'watch', '1 Oct', 'Mon 19 Oct, 3 pm']], 'watch', 2],
    ['Ali family', 'Faisal Ali', 'Manchester', [['Nasir Ali', 74, 'Johar Town', 'normal', '30 Sep', 'Wed 21 Oct, 11 am']], 'normal', 0],
  ];
  const parents = [];
  for (const [familyName, contactName, city, members, status, daysAgo] of rows) {
    const contact = await makeUser({ name: contactName, email: `${contactName.toLowerCase().replace(' ', '.')}@example.com`, role: 'family', city });
    const family = await Family.create({
      name: familyName,
      mainContact: contact.id,
      nutritionist: hina.id,
      members: [{ user: contact.id, relation: 'Main contact', access: 'edit' }],
      status,
      lastActivityAt: daysFromNow(-daysAgo),
    });
    contact.family = family.id;
    await contact.save();
    for (const [fullName, age, area, overall, lastVisit, nextVisit] of members) {
      parents.push(
        await Parent.create({ family: family.id, nutritionist: hina.id, key: fullName.split(' ')[0].toLowerCase(), short: fullName, fullName, age, city: 'Lahore', area, overall, lastVisit, nextVisit }),
      );
    }
  }
  return parents;
}

// This week's visits across the team, so the admin chart reflects real records.
async function seedWeekVisits(nutritionists, parents) {
  const WEEKV = [[38, 40], [32, 34], [36, 38], [41, 42], [19, 34], [0, 16]];
  const active = ['hina', 'amna', 'usman', 'sadia'].map((k) => nutritionists[k]);
  const monday = startOfWeek();
  const docs = [];
  let n = 0;
  WEEKV.forEach(([done, booked], day) => {
    for (let i = 0; i < booked; i++, n++) {
      const at = new Date(monday);
      at.setUTCDate(monday.getUTCDate() + day);
      at.setUTCHours(4 + (i % 8), 0, 0, 0); // 9 am – 4 pm Lahore
      docs.push({ parent: parents[n % parents.length].id, nutritionist: active[n % active.length].id, status: i < done ? 'completed' : 'scheduled', scheduledFor: at, title: 'Home visit' });
    }
  });
  // One of Tuesday's unfinished visits by Amna still has no notes.
  const tuesdayOpen = docs.find((d, i) => i >= 40 && i < 74 && d.status === 'scheduled');
  tuesdayOpen.status = 'in_progress';
  tuesdayOpen.nutritionist = nutritionists.amna.id;
  await Visit.insertMany(docs);
}

async function seedOps() {
  await Flag.insertMany([
    { status: 'attention', type: 'Critical result', title: 'Tariq Rahman: fasting sugar 142, rising for 4 months', meta: 'Hina Qureshi · flagged 2 days ago · family told', action: 'Review' },
    { status: 'attention', type: 'Visit not logged', title: 'Mumtaz Hussain: 6 Oct visit has no notes', meta: 'Amna Sheikh · 3 days overdue', action: 'Contact' },
    { status: 'watch', type: 'Licence', title: 'Usman Tariq: dietitian licence renews in 14 days', meta: 'Pakistan Nutrition & Dietetic Society', action: 'Send reminder' },
    { status: 'watch', type: 'Lab upload', title: "4 reports couldn't be read automatically", meta: 'Blurry photos · oldest from yesterday', action: 'Open' },
    { status: 'normal', type: 'Access request', title: "Imran Khan wants to add his sister to Zubaida Khan's care team", meta: 'Waiting for main contact to approve', action: 'View' },
  ]);
  await ServiceArea.insertMany([
    { name: 'Model Town', activeClients: 64, capacity: 80 },
    { name: 'Gulberg', activeClients: 71, capacity: 72 },
    { name: 'DHA', activeClients: 58, capacity: 90 },
    { name: 'Johar Town', activeClients: 49, capacity: 60 },
    { name: 'Cantt', activeClients: 33, capacity: 40 },
  ]);
  await Dish.insertMany(Object.entries(DISHES).map(([code, d]) => ({ code, name: d.n, nut: d.nut, why: d.why, link: d.link })));
}

export async function seed() {
  await mongoose.connection.dropDatabase();
  await Promise.all(mongoose.modelNames().map((name) => mongoose.model(name).syncIndexes()));
  const { nutritionists } = await seedPeople();
  await seedRahmanFamily(nutritionists.hina);
  const otherParents = await seedOtherFamilies(nutritionists.hina);
  // Team-wide visit volume goes on the lighter records so it doesn't show in the Rahman family's history.
  await seedWeekVisits(nutritionists, otherParents);
  await seedOps();
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await connectDb();
  await seed();
  console.log(`[seed] done. Every demo account uses the password "${DEMO_PASSWORD}".`);
  await mongoose.disconnect();
}
