# Kinwell

Home nutrition care for parents in Lahore, with plain-language updates for their children abroad.
Built with the MERN stack (MongoDB, Express, React, Node) from the **Kinwell v2 · Glass** design.

**Live:** https://kinwell-sepia.vercel.app (frontend and API in one Vercel project, database on MongoDB Atlas)

## Who uses it

| Role | Signs in with | Lands on |
| --- | --- | --- |
| Family member (e.g. Sana in London) | email + password | `/family/:parentId/dashboard` |
| Parent (e.g. Ammi in Lahore) | 6-digit SMS code | `/parent` (simple, large-text view) |
| Nutritionist (e.g. Hina) | email + password | `/workspace/clients` |
| Admin (e.g. Zara) | email + password | `/admin/overview` |

## Quick start

Needs Node 20+ and Docker (for MongoDB).

```bash
npm install
```

```bash
npm run db:up
```

```bash
npm run seed
```

```bash
npm run dev
```

The web app runs on http://localhost:5173 and the API on http://localhost:4000 (port 5000 is taken by
AirPlay on macOS). Copy `server/.env.example` to `server/.env` to change settings.

### Demo accounts (created by `npm run seed`)

All use the password `kinwell-demo`.

- Family: `sana.rahman@gmail.com`, `bilal.rahman@gmail.com`
- Nutritionist: `hina.qureshi@kinwell.pk` (also amna.sheikh, usman.tariq, sadia.malik, faraz.ahmed)
- Admin: `zara.ahmed@kinwell.pk`
- Parent: choose “I'm a parent: sign in with my phone number” and enter `0300 1112233` (Ammi) or
  `0300 1112244` (Abbu). Any format works (`+92 300…`, `0300-…`).

### How parents get their sign-in code

Until a text-message provider is connected, a family member makes the code: on the parent's
**Profile → Help with sign in** (or **Help Ammi sign in** in the sidebar), tap **Make a code**, then
**Send on WhatsApp**. The message has a link that opens the code screen with the number filled in.
Codes work once, for 30 minutes, and lock after 5 wrong tries. Parents then stay signed in for 90 days.
In development the code is also shown on screen.

To send codes by SMS instead, set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` and `TWILIO_FROM` in the
server environment (Vercel → Settings → Environment Variables) and redeploy. Nothing else changes.

## Languages

Parents can use Kinwell in **English** or **Urdu** (right-to-left, Nastaliq font). Ammi and Abbu's
demo accounts are set to Urdu; the switcher on their screen changes it and saves it to their account.
Today the parent's screens are translated (sign-in, daily view, sign-out); family, nutritionist and
admin screens are English.

How it fits together:
- **Interface text**: `client/src/i18n/locales/<lang>.js`, used through `useI18n().t('key', { vars })`.
  Missing keys fall back to English.
- **Content** (tablet names, meals, the nutritionist's note): stored on each document under
  `i18n.<lang>`. The API returns it in the language sent in the `X-Language` header.
- **Server labels** (dates, meal slots, cities): `server/src/i18n/`.

To add a language, for example Punjabi (`pa`):
1. Add it to `client/src/i18n/languages.js` (label, `dir`, locale, and a font if needed).
2. Copy `client/src/i18n/locales/ur.js` to `pa.js`, translate it, and register it in `I18nProvider.jsx`.
3. Add `'pa'` to `LANGUAGES` in `server/src/i18n/index.js` and to `languageSchema`, plus a
   `labels.pa.js` if dates or labels need it.
4. Add content translations to `shared/i18n/pa.js` (used by the seeder).
5. Run `npm run i18n:check -w client` to catch missing keys or placeholders.

The Urdu text was machine-assisted; have a native speaker review it before real use.

## Storybook: core UI and storyboards

```bash
npm run storybook
```

Opens on http://localhost:6006 and needs no server or database.

- **Foundations**: design system page (colours, type, spacing) and icons.
- **Components**: every core UI component with controls (Button, StatusTag, Card, Chip, Segmented,
  Field, Toggle, data viz, feedback states, modal…).
- **Screens**: every screen and its states (loading, empty, error, upload failed, reschedule…).
- Use the **Language** button in the toolbar to see any story in Urdu.
- **Storyboards**: numbered frames walking through each journey: family check-in, rescheduling a
  visit, the parent's day, a nutritionist's home visit, the admin morning review, and onboarding.
  Frames are live components, so they stay in sync with the code.

## Project layout

```
kinwell/
├─ shared/                  Demo dataset from the design (used by the seeder and Storybook)
├─ server/                  Express + Mongoose API
│  └─ src/
│     ├─ config/            env + database connection
│     ├─ models/            Mongoose schemas (User, Family, Parent, LabMarker, Visit, Message, …)
│     ├─ services/          business logic (one file per area; no HTTP here)
│     ├─ controllers/       thin HTTP handlers that call services
│     ├─ routes/            URL → validator → controller, with auth/role guards
│     ├─ validators/        zod request schemas
│     ├─ middleware/        auth (JWT + roles), validation, errors
│     └─ seed/              database seeder
└─ client/                  React (Vite) app
   ├─ .storybook/
   └─ src/
      ├─ styles/            design tokens + component/layout CSS
      ├─ components/ui/     core UI library (+ stories)
      ├─ components/layout/ app shell, headers, sign-out dialog
      ├─ api/               fetch client + one endpoint map
      ├─ context/ hooks/ lib/
      ├─ features/          auth, family, parent, workspace, admin, onboarding, design-system
      ├─ mocks/             API-shaped fixtures for Storybook
      └─ storyboards/       screen catalogue, Storyboard component, journey stories
```

Each page is split into a **View** (pure, takes props, used in Storybook) and a default-exported
container that loads data through `api/endpoints.js`.

## API overview

All routes are under `/api`. Everything except sign-in, onboarding and `/health` needs a
`Authorization: Bearer <token>` header.

| Area | Routes |
| --- | --- |
| Auth | `POST /auth/login`, `/auth/parent-code`, `/auth/parent-code/verify`, `/auth/forgot`, `/auth/logout` (`everywhere` signs out all devices), `GET /auth/me` |
| Parents (family, the parent, their nutritionist, admins) | `GET /parents`, `/parents/threads`, `/parents/:id/{dashboard,home,profile,labs,nutrition,supplements,visits,documents,messages}`; `PATCH /parents/:id/checklist/:code`, `/parents/:id/supplements/reminders`; `POST /parents/:id/{labs/read,labs/reports,labs/unreadable,visits/reschedule,messages}` |
| Nutritionist | `GET /workspace/today`, `/workspace/inbox`, `/workspace/clients`, `/workspace/clients/:id`; `POST /workspace/clients/:id/visits` (readings validated and graded); `GET`/`PUT /workspace/clients/:id/plan`, `POST …/plan/publish`; `POST /workspace/requests/:visitId` (accept or decline a reschedule) |
| Admin | Overview; flags (`resolve`, `reopen`, `notes`, `remind`); families (search, detail, change nutritionist, invite links); nutritionists (list, detail, create, update, leave); accounts (reset password, sign out everywhere, parent code, turn on/off); queues (unreadable lab reports, access requests); service areas; activity log |
| Invites | `GET /auth/invites/:token`, `POST /auth/invites/accept` (the `/join/:token` page) |
| Onboarding | `GET /onboarding/nutritionists`, `POST /onboarding` |

## Tests

With the API running (`npm run dev -w server`):

```bash
npm test
```

This runs the lab-report parser tests (`server/test/readReport.test.js`, no API needed:
`npm run test:unit -w server`), then reseeds the local database and runs 37 end-to-end tests over HTTP:
every role's main flows and the permission boundaries between them (`server/test/e2e.test.js`). `npm run test:smoke -w server` is a
quicker manual check that prints raw responses.

## Search engines and link previews

- **The homepage is pre-rendered** at build time (`client/src/prerender.jsx`, `client/scripts/prerender.mjs`),
  so search engines and link previews read the real content without running JavaScript. The page head
  has a title, description, canonical link, Open Graph/Twitter cards (`client/public/og-image.png`) and
  schema.org data (organisation, service area in Lahore, FAQ) built from the same text the page shows.
- **Signed-in areas are private:** they're served from `app.html` with `noindex` (meta tag and
  `X-Robots-Tag` header, see `vercel.json`) and disallowed in `robots.txt`.
- `robots.txt` and `sitemap.xml` are generated on each build; unknown addresses get a real 404 page.
- The site address comes from `SITE_URL` (default `https://kinwell-sepia.vercel.app`, in
  `client/site.config.js`). Set it in Vercel when you move to your own domain, and redeploy.

## Reading lab reports (OCR)

Families add a report on the Lab tests page as a PDF or a phone photo. The numbers are read **on the
device**: the file itself is never uploaded.

1. **Get the text** (`client/src/lib/ocr.js`). Digital PDFs: the text is read directly with pdf.js.
   Scanned PDFs (up to 4 pages) and photos: rendered to a canvas, cleaned up and read with
   Tesseract. The Tesseract worker, engine and English data are served from our own domain under
   `/ocr` (copied by `client/scripts/copy-ocr-assets.mjs` before dev and build), so the strict
   security policy holds; both libraries load only when someone adds a report.
2. **Find the results** (`POST /parents/:id/labs/read`, `server/src/services/labs/readReport.js`).
   Each line is matched against the tests in `catalogue.js` (HbA1c, fasting sugar, vitamin D, B12,
   hemoglobin, cholesterol, triglycerides, creatinine, TSH, ferritin), using the names Pakistani
   and overseas labs print. The parser takes the result rather than the reference range, fixes
   common OCR slips (`1O8`, `2l,5`, `gldL`) and converts SI units (mmol/L, nmol/L, g/L…). OCR often
   drops thin decimal points: if the printed range is 10× ours, the decimal is put back and the row
   is marked "please check". A number that can't be real is not guessed: the test is listed empty
   for the family to type in. Nothing is saved at this step.
3. **Check, then save** (`POST /parents/:id/labs/reports`). The family corrects, unticks or adds
   rows. The server re-grades every value, updates the parent's markers and trends, tells the
   nutritionist, and flags anything that needs attention for the Kinwell team.
4. **Can't read it?** The family can try another photo, type the results in, or send it to the
   team (`POST /parents/:id/labs/unreadable`), which adds it to the admin's unreadable-reports queue.

Results are graded with general adult ranges; have a clinician review `catalogue.js` before real use.

## Visit readings

Readings entered at a home visit are checked for typos and graded normal / watch / needs attention
(`server/src/services/vitals.js`). Anything that needs attention updates the parent's vitals and status,
adds an alert for the family, and flags the Kinwell team. The ranges are general adult guidance;
have a clinician review them before real use.

## Not built yet

- Password-reset emails. (SMS for parent codes works once Twilio keys are set; see above.)
- Urdu-only lab reports: OCR reads English, which is what labs in Pakistan print results in.
- File storage for documents and visit photos.
- Google/Apple sign-in buttons from the design were left out until they can actually work.
- Reschedule slots are a fixed set until the nutritionist's calendar is connected.
