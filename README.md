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

## Storybook: core UI and storyboards

```bash
npm run storybook
```

Opens on http://localhost:6006 and needs no server or database.

- **Foundations**: design system page (colours, type, spacing) and icons.
- **Components**: every core UI component with controls (Button, StatusTag, Card, Chip, Segmented,
  Field, Toggle, data viz, feedback states, modal…).
- **Screens**: every screen and its states (loading, empty, error, upload failed, reschedule…).
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
| Parents (family, the parent, their nutritionist, admins) | `GET /parents`, `/parents/threads`, `/parents/:id/{dashboard,home,profile,labs,nutrition,supplements,visits,documents,messages}`; `PATCH /parents/:id/checklist/:code`, `/parents/:id/supplements/reminders`; `POST /parents/:id/{labs/reports,visits/reschedule,messages}` |
| Nutritionist | `GET /workspace/clients`, `/workspace/library`, `/workspace/clients/:id/visit`; `POST /workspace/clients/:id/visits`, `/workspace/clients/:id/updates`; `PUT /workspace/clients/:id/plan` |
| Admin | `GET /admin/overview`, `/admin/nutritionists`, `/admin/families`; `POST /admin/flags/:id/resolve` |
| Onboarding | `GET /onboarding/nutritionists`, `POST /onboarding` |

`server/test/smoke.sh` exercises the main routes against a running, seeded API.

## Not built yet

- Password-reset emails. (SMS for parent codes works once Twilio keys are set; see above.)
- Reading numbers from uploaded lab PDFs/photos: uploads are recorded, but the values aren't parsed.
- File storage for documents and visit photos.
- Google/Apple sign-in buttons from the design were left out until they can actually work.
- Reschedule slots are a fixed set until the nutritionist's calendar is connected.
