// Kinwell tools for MCP clients, grouped by the role of the signed-in account.
// Each tool maps to one Kinwell API call; the API checks permissions, so a tool can only do what
// the account could do in the app. Account-security actions (password resets, signing people out,
// turning accounts off) are deliberately left out.
import { z } from 'zod';
import { KinwellError } from './api.js';

const id = (what) => z.string().regex(/^[a-f0-9]{24}$/i, `A Kinwell ${what} id (24 hex characters)`).describe(`The ${what} id`);
const parentId = id('parent');
const path = (s) => encodeURIComponent(s);

const ok = (data) => ({ content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] });
const fail = (err) => {
  const details = err instanceof KinwellError && err.details ? `\nDetails: ${JSON.stringify(err.details)}` : '';
  return { isError: true, content: [{ type: 'text', text: `${err.message}${details}` }] };
};

/**
 * Registers one tool. `kind`: 'read' (no side effects), 'write' (changes Kinwell data) or
 * 'notify' (also reaches real people: families, nutritionists or admins).
 */
function add(server, name, { title, description, input, kind = 'read', idempotent = false }, run) {
  server.registerTool(
    name,
    {
      title,
      description,
      inputSchema: input,
      annotations: {
        title,
        readOnlyHint: kind === 'read',
        destructiveHint: false,
        idempotentHint: kind === 'read' || idempotent,
        openWorldHint: kind === 'notify',
      },
    },
    async (args) => {
      try {
        return ok(await run(args ?? {}));
      } catch (err) {
        return fail(err);
      }
    },
  );
}

export function registerCommonTools(server, api) {
  add(server, 'whoami', { title: 'Who am I signed in as', description: 'The Kinwell account this server uses: name, role (family, nutritionist or admin) and language.' }, () => api.me());
}

export function registerFamilyTools(server, api) {
  add(server, 'list_parents', { title: 'List my parents', description: "The parents this family looks after, with each one's id, name, overall status and next visit. Start here to get a parentId." }, () => api.get('/parents'));

  add(
    server,
    'get_parent_dashboard',
    { title: "A parent's dashboard", description: "Everything at a glance for one parent: overall status in plain words, alerts (missed doses, results to watch), today's checklist, key lab markers and the next visit.", input: { parentId } },
    ({ parentId: p }) => api.get(`/parents/${path(p)}/dashboard`),
  );

  add(
    server,
    'get_parent_details',
    {
      title: 'One part of a parent’s record',
      description: 'A section of a parent’s record: profile (conditions, medicines, contacts), labs (results with ranges and trends, reports), nutrition (this week’s meal plan), supplements, visits (past and upcoming, with notes), documents, or messages (the family thread with the nutritionist).',
      input: { parentId, section: z.enum(['profile', 'labs', 'nutrition', 'supplements', 'visits', 'documents', 'messages']) },
    },
    ({ parentId: p, section }) => api.get(`/parents/${path(p)}/${section}`),
  );

  add(
    server,
    'send_message',
    { title: 'Message the nutritionist', description: "Posts a message in the parent's thread. The nutritionist and other family members see it. Write it as the family member would.", input: { parentId, text: z.string().min(1).max(4000) }, kind: 'notify' },
    ({ parentId: p, text }) => api.post(`/parents/${path(p)}/messages`, { text }),
  );

  add(
    server,
    'read_lab_report',
    {
      title: 'Find results in lab report text',
      description:
        'Reads the text of a lab report (pasted, or extracted from a PDF or photo) and returns the results Kinwell recognises: test, value in Kinwell units, status, lab and date. Saves nothing. Show the results to the user to check, then call save_lab_results. Rows with confidence "unclear" have no usable number; "decimal" means a dropped decimal point was restored and should be checked.',
      input: { parentId, text: z.string().min(1).max(200_000) },
    },
    ({ parentId: p, text }) => api.post(`/parents/${path(p)}/labs/read`, { text }),
  );

  add(
    server,
    'save_lab_results',
    {
      title: 'Save checked lab results',
      description:
        "Saves lab results the user has checked. Kinwell re-grades each value, updates the parent's markers and trends, tells the nutritionist, and flags anything that needs attention for the Kinwell team. Test names: HbA1c, Fasting blood sugar, Vitamin D, Vitamin B12, Hemoglobin, LDL cholesterol, HDL cholesterol, Total cholesterol, Triglycerides, Creatinine, TSH, Ferritin.",
      input: {
        parentId,
        fileName: z.string().min(1).max(200).describe('Name of the report file, or a short label like "Chughtai report, Oct 2026"'),
        lab: z.string().max(120).optional(),
        date: z.string().max(40).optional().describe('Report date, e.g. "26 Sep 2026"'),
        results: z.array(z.object({ name: z.string(), value: z.union([z.string(), z.number()]) })).min(1).max(40),
      },
      kind: 'notify',
    },
    ({ parentId: p, ...report }) => api.post(`/parents/${path(p)}/labs/reports`, { ...report, source: 'manual' }),
  );

  add(
    server,
    'request_reschedule',
    { title: 'Ask to move the next visit', description: 'Asks the nutritionist to move the next home visit. They accept or decline; the family is told either way.', input: { parentId, day: z.string().describe('e.g. "Thu 15 Oct"'), time: z.string().describe('e.g. "11:00 am"') }, kind: 'notify' },
    ({ parentId: p, day, time }) => api.post(`/parents/${path(p)}/visits/reschedule`, { day, time }),
  );

  add(
    server,
    'set_checklist_item',
    { title: "Tick or untick today's checklist", description: "Marks one item on the parent's checklist for today (a supplement or a meal, by its code from the dashboard) as done or not done.", input: { parentId, code: z.string().min(1).max(40), done: z.boolean() }, kind: 'write', idempotent: true },
    ({ parentId: p, code, done }) => api.patch(`/parents/${path(p)}/checklist/${path(code)}`, { done }),
  );
}

export function registerNutritionistTools(server, api) {
  add(server, 'get_today', { title: "Today's visits", description: "Today's home visits in order, with each client's status and what to check, plus reschedule requests waiting for an answer." }, () => api.get('/workspace/today'));
  add(server, 'get_inbox', { title: 'Messages needing a reply', description: 'Family threads, newest first, marking those waiting for a reply.' }, () => api.get('/workspace/inbox'));
  add(server, 'get_notifications', { title: 'Notifications', description: 'Recent notices: new lab results, flags from the Kinwell team, reschedule requests.' }, () => api.get('/workspace/notifications'));
  add(server, 'list_clients', { title: 'My clients', description: 'All clients, those needing attention first, with area, status and next visit. Use it to get a parentId.' }, () => api.get('/workspace/clients'));
  add(server, 'get_client', { title: "A client's record", description: "One client's full record: conditions, medicines, latest readings and labs, visits, plan status and family contacts.", input: { parentId } }, ({ parentId: p }) => api.get(`/workspace/clients/${path(p)}`));
  add(server, 'get_food_library', { title: 'Dishes and supplements', description: 'The dishes and supplements a weekly plan can use, with their ids. Needed before save_plan.' }, () => api.get('/workspace/library'));
  add(server, 'get_plan', { title: "A client's weekly plan", description: "The client's meal plan for next week (draft or published).", input: { parentId } }, ({ parentId: p }) => api.get(`/workspace/clients/${path(p)}/plan`));

  add(
    server,
    'log_visit',
    {
      title: 'Log a home visit',
      description:
        'Records a home visit. Readings are checked and graded (normal / watch / attention); anything needing attention updates the client, alerts the family and flags the Kinwell team. The family gets a visit card and the notes. Reading labels: Blood pressure (e.g. "128/82"), Fasting sugar (mg/dL), Weight (kg), Pulse, Oxygen (%), Water today (glasses).',
      input: {
        parentId,
        vitals: z.array(z.object({ label: z.string(), value: z.string().max(20), unit: z.string().optional() })).max(12).default([]),
        observations: z.array(z.string()).optional(),
        mood: z.string().optional(),
        notes: z.string().max(4000).optional().describe('A note for the family in plain words'),
        tests: z.array(z.string()).optional().describe('Lab tests to order'),
      },
      kind: 'notify',
    },
    ({ parentId: p, ...visit }) => api.post(`/workspace/clients/${path(p)}/visits`, visit),
  );

  add(
    server,
    'save_plan',
    {
      title: 'Save a weekly plan (draft)',
      description: 'Saves next week’s plan as a draft. days: 7 days (Mon–Sun), each up to 4 meal slots holding a dish id from get_food_library or null. Not shown to the family until publish_plan.',
      input: {
        parentId,
        days: z.array(z.array(z.string().nullable()).max(4)).length(7),
        supplements: z.array(z.string()).optional(),
        links: z.record(z.string(), z.string()).optional().describe('Dish id → the lab result it helps, e.g. { "daliya": "Fasting blood sugar" }'),
      },
      kind: 'write',
      idempotent: true,
    },
    ({ parentId: p, ...plan }) => api.put(`/workspace/clients/${path(p)}/plan`, plan),
  );

  add(server, 'publish_plan', { title: 'Publish a weekly plan', description: 'Publishes the saved plan to the family. Refused if a day has gaps.', input: { parentId }, kind: 'notify' }, ({ parentId: p }) => api.post(`/workspace/clients/${path(p)}/plan/publish`));

  add(
    server,
    'answer_reschedule',
    { title: 'Accept or decline a reschedule', description: 'Answers a family’s request to move a visit (visitId from get_today). Accepting checks for clashes. The family is told.', input: { visitId: id('visit'), decision: z.enum(['accept', 'decline']) }, kind: 'notify' },
    ({ visitId, decision }) => api.post(`/workspace/requests/${path(visitId)}`, { decision }),
  );

  add(
    server,
    'send_family_update',
    { title: 'Send the family an update', description: 'Sends the family a plain-language update in their thread.', input: { parentId, text: z.string().min(1).max(4000) }, kind: 'notify' },
    ({ parentId: p, text }) => api.post(`/workspace/clients/${path(p)}/updates`, { text }),
  );
}

export function registerAdminTools(server, api) {
  add(server, 'get_overview', { title: 'Operations overview', description: 'Key numbers (families, clients, visits, open flags) and the most urgent queue items.' }, () => api.get('/admin/overview'));

  add(
    server,
    'list_flags',
    { title: 'Flags', description: 'Flags that need the team: critical results, missed visits, unreadable uploads and more.', input: { state: z.enum(['open', 'resolved']).optional(), status: z.enum(['normal', 'watch', 'attention']).optional(), q: z.string().optional(), page: z.number().int().min(1).optional() } },
    (query) => api.get('/admin/flags', query),
  );
  add(server, 'resolve_flag', { title: 'Resolve a flag', description: 'Marks a flag resolved, with an optional note on what was done.', input: { flagId: id('flag'), note: z.string().max(500).optional() }, kind: 'write' }, ({ flagId, note }) => api.post(`/admin/flags/${path(flagId)}/resolve`, { note }));
  add(server, 'reopen_flag', { title: 'Reopen a flag', description: 'Reopens a resolved flag.', input: { flagId: id('flag') }, kind: 'write' }, ({ flagId }) => api.post(`/admin/flags/${path(flagId)}/reopen`));
  add(server, 'add_flag_note', { title: 'Note on a flag', description: 'Adds an internal team note to a flag.', input: { flagId: id('flag'), text: z.string().min(1).max(500) }, kind: 'write' }, ({ flagId, text }) => api.post(`/admin/flags/${path(flagId)}/notes`, { text }));
  add(server, 'send_flag_reminder', { title: 'Remind about a flag', description: 'Sends a reminder about a flag to the person who can act on it (for example the nutritionist).', input: { flagId: id('flag'), message: z.string().min(1).max(500) }, kind: 'notify' }, ({ flagId, message }) => api.post(`/admin/flags/${path(flagId)}/remind`, { message }));

  add(
    server,
    'list_families',
    { title: 'Families', description: 'Families, searchable by name, with their parents, status and nutritionist.', input: { q: z.string().optional(), status: z.enum(['normal', 'watch', 'attention']).optional(), nutritionist: id('nutritionist').optional(), page: z.number().int().min(1).optional() } },
    (query) => api.get('/admin/families', query),
  );
  add(server, 'get_family', { title: 'A family', description: 'One family: members, parents, nutritionist and pending invites.', input: { familyId: id('family') } }, ({ familyId }) => api.get(`/admin/families/${path(familyId)}`));
  add(
    server,
    'assign_nutritionist',
    { title: 'Change nutritionist', description: "Assigns a nutritionist to a family's parents (or to one parent).", input: { familyId: id('family'), nutritionistId: id('nutritionist'), parentId: parentId.optional() }, kind: 'notify', idempotent: true },
    ({ familyId, ...body }) => api.put(`/admin/families/${path(familyId)}/nutritionist`, body),
  );

  add(server, 'list_nutritionists', { title: 'Nutritionists', description: 'The team: areas, languages, caseload and availability.' }, () => api.get('/admin/nutritionists'));
  add(server, 'get_nutritionist', { title: 'A nutritionist', description: 'One nutritionist with their clients and schedule.', input: { nutritionistId: id('nutritionist') } }, ({ nutritionistId }) => api.get(`/admin/nutritionists/${path(nutritionistId)}`));

  add(server, 'list_unreadable_reports', { title: 'Unreadable lab reports', description: 'Lab reports families sent to the team because they could not be read automatically.' }, () => api.get('/admin/lab-uploads'));
  add(
    server,
    'handle_unreadable_report',
    { title: 'Handle an unreadable report', description: 'retake: ask the family for a clearer copy; typed_in: the team entered the results; dismiss: nothing to do.', input: { reportId: id('report'), action: z.enum(['retake', 'typed_in', 'dismiss']) }, kind: 'notify' },
    ({ reportId, action }) => api.post(`/admin/lab-uploads/${path(reportId)}`, { action }),
  );

  add(server, 'list_access_requests', { title: 'Access requests', description: 'Relatives asking to join a family on Kinwell.' }, () => api.get('/admin/access-requests'));
  add(
    server,
    'decide_access_request',
    { title: 'Approve or decline access', description: 'Approves (sends an invite link) or declines a request to join a family.', input: { requestId: id('request'), decision: z.enum(['approve', 'decline']) }, kind: 'notify' },
    ({ requestId, decision }) => api.post(`/admin/access-requests/${path(requestId)}`, { decision }),
  );

  add(server, 'get_activity', { title: 'Activity log', description: 'Who did what in the admin area, newest first.', input: { page: z.number().int().min(1).optional() } }, (query) => api.get('/admin/activity', query));
}

export const TOOLS_FOR_ROLE = {
  family: [registerFamilyTools],
  nutritionist: [registerNutritionistTools],
  admin: [registerAdminTools],
};
