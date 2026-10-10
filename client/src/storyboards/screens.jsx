// Every screen rendered from fixtures — no server needed. Used by screen stories and storyboards.
import { useState } from 'react';
import * as fx from '../mocks/fixtures.js';
import { LoginView } from '../features/auth/LoginPage.jsx';
import SignedOutPage from '../features/auth/SignedOutPage.jsx';
import { FamilyShell } from '../features/family/FamilyLayout.jsx';
import { ProfileHeader } from '../features/family/ProfileLayout.jsx';
import { DashboardView } from '../features/family/DashboardPage.jsx';
import { OverviewView } from '../features/family/OverviewPage.jsx';
import { LabsView } from '../features/family/LabsPage.jsx';
import { NutritionView } from '../features/family/NutritionPage.jsx';
import { SupplementsView } from '../features/family/SupplementsPage.jsx';
import { RescheduleDialog, VisitsView } from '../features/family/VisitsPage.jsx';
import { DocumentsView } from '../features/family/DocumentsPage.jsx';
import { ParentSignInDialog } from '../features/family/ParentSignInHelp.jsx';
import { MessagesView } from '../features/family/MessagesPage.jsx';
import { ParentHomeView } from '../features/parent/ParentHomePage.jsx';
import { WorkspaceShell } from '../features/workspace/WorkspaceLayout.jsx';
import { TodayView } from '../features/workspace/TodayPage.jsx';
import { ClientsView } from '../features/workspace/ClientsPage.jsx';
import { ClientView } from '../features/workspace/ClientPage.jsx';
import { emptyVisitForm, VisitFormView } from '../features/workspace/VisitPage.jsx';
import { PlanBuilderView } from '../features/workspace/PlanBuilderPage.jsx';
import { AdminShell } from '../features/admin/AdminLayout.jsx';
import { AdminOverviewView } from '../features/admin/AdminOverviewPage.jsx';
import { FamiliesView } from '../features/admin/FamiliesPage.jsx';
import { NutritionistsView } from '../features/admin/NutritionistsPage.jsx';
import { ActivityView, AreasView } from '../features/admin/OpsPages.jsx';
import { initialOnboarding, OnboardingView } from '../features/onboarding/OnboardingPage.jsx';
import { PageHeader } from '../components/layout/index.js';
import { DEFAULT_UPD } from '@kinwell/shared';
import { useI18n } from '../i18n/index.js';

const noop = () => {};

function Family({ section, parentKey = 'ammi', profileArea = false, children }) {
  const parent = fx.parentSummary(parentKey);
  return (
    <FamilyShell parents={fx.parents} parent={parent} section={section} user={fx.SANA} onSelectParent={noop}>
      {profileArea && <ProfileHeader parent={parent} profile={fx.profile(parentKey)} />}
      {children}
    </FamilyShell>
  );
}

// ---------- Auth ----------
export function Login({ mode = 'signin', role = 'family', error = null, busy = false }) {
  const [m, setM] = useState(mode);
  const [r, setR] = useState(role);
  return <LoginView mode={m} setMode={setM} role={r} setRole={setR} onSubmit={noop} onSession={noop} busy={busy} error={error} />;
}
export const SignedOut = () => <SignedOutPage />;
export function ParentSignInHelp() {
  return (
    <Family section="profile" profileArea>
      <ParentSignInDialog
        open
        parent={fx.parentSummary('ammi')}
        onClose={noop}
        createCode={async () => ({ code: '482913', expiresAt: new Date(Date.now() + 30 * 60000).toISOString(), phone: '+923001112233', shareText: 'Assalam-o-Alaikum Ammi! Your Kinwell code is 482913.' })}
      />
    </Family>
  );
}

// ---------- Family ----------
export function Dashboard({ status = 'ready', parentKey = 'ammi' }) {
  const [data, setData] = useState(() => fx.dashboard(parentKey));
  const toggle = (it) => setData((d) => ({ ...d, checklist: d.checklist.map((i) => (i.code === it.code ? { ...i, done: !i.done } : i)) }));
  return (
    <Family section="dashboard" parentKey={parentKey}>
      <DashboardView status={status} data={data} parent={fx.parentSummary(parentKey)} onToggle={toggle} onRetry={noop} onGo={noop} />
    </Family>
  );
}
export const Overview = ({ parentKey = 'ammi' }) => (
  <Family section="profile" parentKey={parentKey} profileArea>
    <OverviewView data={fx.profile(parentKey)} onMessage={noop} />
  </Family>
);
export function Labs({ parentKey = 'ammi', upload = 'idle', empty = false }) {
  const [sel, setSel] = useState(null);
  const data = empty ? { markers: [], reports: [] } : fx.labs(parentKey);
  return (
    <Family section="labs" parentKey={parentKey} profileArea>
      <LabsView
        parent={fx.parentSummary(parentKey)}
        data={data}
        selected={sel}
        onSelect={setSel}
        onAsk={noop}
        upload={{ state: upload, fileName: 'Chughtai_Lab_09Oct.pdf', found: 8, error: 'The bottom half of the photo is blurry, so we couldn’t find the cholesterol results.', onPick: noop, onReset: noop }}
      />
    </Family>
  );
}
export function Nutrition({ parentKey = 'ammi' }) {
  const [day, setDay] = useState(4);
  return (
    <Family section="nutrition" parentKey={parentKey} profileArea>
      <NutritionView parent={fx.parentSummary(parentKey)} data={fx.nutrition(parentKey)} day={day} onDay={setDay} onMarker={noop} />
    </Family>
  );
}
export const Supplements = ({ parentKey = 'ammi' }) => (
  <Family section="supplements" parentKey={parentKey} profileArea>
    <SupplementsView data={fx.supplements(parentKey)} onReminder={noop} />
  </Family>
);
export function Visits({ parentKey = 'ammi', rescheduleOpen = false }) {
  const [sel, setSel] = useState(null);
  const [open, setOpen] = useState(rescheduleOpen);
  const data = fx.visits(parentKey);
  const parent = fx.parentSummary(parentKey);
  return (
    <Family section="visits" parentKey={parentKey} profileArea>
      <VisitsView parent={parent} data={data} selectedId={sel} onSelect={setSel} onReschedule={() => setOpen(true)} />
      <RescheduleDialog open={open} parent={parent} availability={data.availability} onClose={() => setOpen(false)} onConfirm={async () => {}} />
    </Family>
  );
}
export const Documents = ({ parentKey = 'ammi' }) => (
  <Family section="documents" parentKey={parentKey} profileArea>
    <DocumentsView parent={fx.parentSummary(parentKey)} docs={fx.documents(parentKey)} />
  </Family>
);
export function Messages({ parentKey = 'ammi' }) {
  const [thread, setThread] = useState(() => fx.messages(parentKey));
  const [draft, setDraft] = useState('');
  const send = () => {
    setThread((t) => [...t, { id: `new${t.length}`, fromKey: 'sana', fromName: 'Sana Rahman', fromRole: 'Daughter', text: draft, timeLabel: 'Just now', mine: true }]);
    setDraft('');
  };
  return (
    <Family section="messages" parentKey={parentKey}>
      <MessagesView threads={fx.threads} activeParentId={parentKey} onThread={noop} thread={thread} draft={draft} onDraft={setDraft} onSend={send} sending={false} onOpenVisit={noop} />
    </Family>
  );
}

// ---------- Parent (simple view) ----------
export function ParentHome({ parentKey = 'ammi', familyPreview = false }) {
  const { lang } = useI18n();
  const [data, setData] = useState(() => fx.home(parentKey, lang));
  const toggle = (it) => setData((d) => ({ ...d, checklist: d.checklist.map((i) => (i.code === it.code ? { ...i, done: !i.done } : i)) }));
  return <ParentHomeView data={data} onToggle={toggle} familyPreview={familyPreview} onBack={noop} onSignOut={noop} />;
}

// ---------- Nutritionist ----------
const Workspace = ({ title, sub, children }) => (
  <WorkspaceShell user={fx.HINA_USER} unread={2} title={title} sub={sub}>
    {children}
  </WorkspaceShell>
);
export const Today = () => (
  <Workspace title="Today" sub="Saturday, 10 October">
    <TodayView data={fx.workspaceToday} inbox={fx.workspaceInbox} onDecide={noop} />
  </Workspace>
);
export function Clients() {
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  return (
    <Workspace title="Your clients" sub="Saturday 10 October · most urgent first">
      <ClientsView clients={fx.clients} filter={filter} onFilter={setFilter} query={q} onQuery={setQ} />
    </Workspace>
  );
}
export const ClientRecord = () => (
  <Workspace title="Fatima Rahman, 72" sub="Model Town · your client">
    <ClientView summary={fx.workspaceClient('ammi')} dash={fx.dashboard('ammi')} visits={fx.visits('ammi')} />
  </Workspace>
);
const VISIT_PARENT = { short: 'Ammi', fullName: 'Fatima Rahman', age: 72, area: 'Model Town' };
export function VisitForm({ saved = false, attention = false, typo = false }) {
  const [form, setForm] = useState(() => (typo ? { ...emptyVisitForm(), vitals: { 'Blood pressure': '1650/100' } } : emptyVisitForm()));
  const result = attention
    ? { attention: 2, readings: [{ label: 'Blood pressure', value: '165/100', unit: 'mmHg', status: 'attention' }, { label: 'Fasting sugar', value: '186', unit: 'mg/dL', status: 'attention' }, { label: 'Weight', value: '63.6', unit: 'kg', status: 'normal' }] }
    : { attention: 0, readings: [{ label: 'Blood pressure', value: '126/78', unit: 'mmHg', status: 'normal' }] };
  return (
    <Workspace title="Home visit · Ammi" sub="Fatima Rahman, 72 · Model Town">
      <VisitFormView
        parent={VISIT_PARENT}
        lastMeasurements={fx.visits('ammi').past[0].meas}
        form={form}
        setForm={setForm}
        onSave={noop}
        saving={false}
        saved={saved}
        result={result}
        errors={typo ? { 'Blood pressure': 'That blood pressure looks mistyped. Check both numbers.' } : {}}
        onNext={noop}
      />
    </Workspace>
  );
}
export function PlanBuilder() {
  const [plan, setPlan] = useState(() => fx.weekPlan('ammi'));
  const [day, setDay] = useState(0);
  return (
    <Workspace title="Meal plan · Fatima Rahman (Ammi)" sub="Plan the week, link each item to a result, then publish it to the family.">
      <PlanBuilderView library={fx.library} plan={plan} setPlan={setPlan} day={day} setDay={setDay} onSave={noop} onPublish={noop} busy={null} dirty />
    </Workspace>
  );
}

// ---------- Admin ----------
export function AdminOverview() {
  const [flags, setFlags] = useState(fx.adminOverview.queue);
  const [tab, setTab] = useState('open');
  return (
    <AdminShell user={fx.ZARA}>
      <PageHeader eyebrow="Saturday 10 October · All of Lahore" title="Operations overview" divider={false} />
      <AdminOverviewView data={fx.adminOverview} flags={flags} setFlags={setFlags} tab={tab} onTab={setTab} />
    </AdminShell>
  );
}
export function AdminTeam() {
  const [q, setQ] = useState('');
  return (
    <AdminShell user={fx.ZARA}>
      <PageHeader eyebrow="All of Lahore" title="Nutritionists" divider={false} />
      <NutritionistsView rows={fx.team.filter((t) => t.name.toLowerCase().includes(q.toLowerCase()))} q={q} onQuery={setQ} />
    </AdminShell>
  );
}
export function AdminFamilies() {
  const [filters, setFilters] = useState({ q: '', status: '', nutritionist: '', page: 1 });
  return (
    <AdminShell user={fx.ZARA}>
      <PageHeader eyebrow="All of Lahore" title="Families" divider={false} />
      <FamiliesView data={fx.families} team={fx.team} filters={filters} setFilter={(p) => setFilters((f) => ({ ...f, ...p }))} />
    </AdminShell>
  );
}
export const AdminActivity = () => (
  <AdminShell user={fx.ZARA}>
    <PageHeader eyebrow="Every admin action, newest first" title="Activity" divider={false} />
    <ActivityView data={fx.activity} onPage={noop} />
  </AdminShell>
);
export const AdminSettings = () => (
  <AdminShell user={fx.ZARA}>
    <PageHeader eyebrow="How Kinwell is set up" title="Settings" divider={false} />
    <AreasView areas={fx.adminOverview.coverage} onSave={async () => {}} onRemove={noop} />
  </AdminShell>
);

// ---------- Onboarding ----------
const FILLED = () => {
  const f = initialOnboarding();
  f.you = { name: 'Sana Rahman', email: 'sana.rahman@gmail.com', password: 'a-long-password', city: 'London' };
  f.parents[0] = { name: 'Fatima Rahman', callThem: 'Ammi', age: '72', area: 'Model Town' };
  f.parents[1] = { name: 'Tariq Rahman', callThem: 'Abbu', age: '76', area: 'Model Town' };
  f.invites[0].email = 'bilal.rahman@gmail.com';
  return f;
};
export function Onboarding({ step: initial = 0 }) {
  const [step, setStep] = useState(initial);
  const [form, setForm] = useState(FILLED);
  return (
    <OnboardingView
      step={step}
      form={form}
      setForm={setForm}
      nutritionists={fx.nutritionistsForOnboarding}
      busy={false}
      error={null}
      onBack={() => setStep((s) => Math.max(0, s - 1))}
      onNext={() => setStep((s) => Math.min(5, s + 1))}
      onFinish={noop}
    />
  );
}
