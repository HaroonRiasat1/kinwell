import { z } from 'zod';

const email = z.string().trim().toLowerCase().email('Enter a valid email address');
const roles = z.enum(['family', 'nutritionist', 'admin']);

export const loginSchema = z.object({ email, password: z.string().min(1, 'Enter your password'), role: roles.optional() });
export const parentCodeRequestSchema = z.object({ phone: z.string().trim().min(6, 'Enter a phone number') });
export const parentCodeVerifySchema = z.object({
  phone: z.string().trim().min(6),
  code: z.string().regex(/^\d{6}$/, 'The code has 6 digits'),
});
export const forgotSchema = z.object({ email });
export const languageSchema = z.object({ language: z.enum(['en', 'ur']) });
export const logoutSchema = z.object({ everywhere: z.boolean().default(false) });

export const checklistSchema = z.object({ done: z.boolean() });
export const reminderSchema = z.object({ slot: z.enum(['Morning', 'Afternoon', 'Evening', 'Night']), on: z.boolean() });
export const rescheduleSchema = z.object({ day: z.string().min(1), time: z.string().min(1) });
export const messageSchema = z.object({ text: z.string().trim().min(1, 'Write a message first').max(4000) });
export const readReportSchema = z.object({ text: z.string().max(200_000) });
export const saveReportSchema = z.object({
  fileName: z.string().trim().min(1).max(200),
  lab: z.string().trim().max(120).optional(),
  date: z.string().trim().max(40).optional(),
  source: z.enum(['ocr', 'pdf', 'manual']).default('ocr'),
  results: z.array(z.object({ name: z.string().trim().min(1), value: z.union([z.string(), z.number()]) })).max(40),
});
export const unreadableSchema = z.object({ fileName: z.string().trim().min(1).max(200), reason: z.string().trim().max(200).optional() });

export const visitLogSchema = z.object({
  title: z.string().trim().optional(),
  vitals: z.array(z.object({ label: z.string(), value: z.string().trim().max(20).optional().default(''), unit: z.string().default('') })).max(12).default([]),
  observations: z.array(z.string()).default([]),
  mood: z.string().optional(),
  notes: z.string().max(4000).optional(),
  tests: z.array(z.string()).default([]),
});
export const planWeekSchema = z.object({
  days: z.array(z.array(z.string().nullable()).max(4)).length(7),
  supplements: z.array(z.string()).default([]),
  links: z.record(z.string(), z.string()).default({}),
});
export const rescheduleDecisionSchema = z.object({ decision: z.enum(['accept', 'decline']) });
export const familyUpdateSchema = z.object({ text: z.string().trim().min(1).max(4000) });

export const onboardingSchema = z.object({
  you: z.object({
    name: z.string().trim().min(2, 'Enter your name'),
    email,
    password: z.string().min(8, 'Use at least 8 characters'),
    city: z.string().trim().min(1),
    timezone: z.string().optional(),
    relation: z.string().optional(),
  }),
  parents: z
    .array(z.object({ name: z.string().trim().min(2), callThem: z.string().trim().optional(), age: z.coerce.number().int().min(40).max(120), city: z.string().default('Lahore'), area: z.string().optional() }))
    .min(1, 'Add at least one parent'),
  invites: z.array(z.object({ email: z.string().trim().optional().default(''), access: z.enum(['view', 'edit']) })).default([]),
  nutritionistId: z.string().optional(),
  health: z.object({ conditions: z.array(z.string()).default([]), diet: z.array(z.string()).default([]), medicines: z.string().optional() }).default({}),
});

// ---------- Invites ----------
export const acceptInviteSchema = z.object({
  token: z.string().min(10),
  name: z.string().trim().min(2, 'Enter your name'),
  password: z.string().min(8, 'Use at least 8 characters'),
  city: z.string().trim().optional(),
});

// ---------- Admin ----------
const objectId = z.string().regex(/^[a-f0-9]{24}$/i, 'Invalid id');
const optionalDate = z.union([z.coerce.date(), z.literal(''), z.null()]).optional();
export const adminListQuery = z.object({
  q: z.string().optional().default(''),
  status: z.enum(['normal', 'watch', 'attention']).optional(),
  role: z.enum(['family', 'nutritionist', 'admin', 'parent']).optional(),
  nutritionist: objectId.optional(),
  state: z.enum(['open', 'resolved']).optional(),
  page: z.coerce.number().int().min(1).default(1),
});
export const flagResolveSchema = z.object({ note: z.string().trim().max(500).optional() });
export const flagNoteSchema = z.object({ text: z.string().trim().min(1).max(500) });
export const flagRemindSchema = z.object({ message: z.string().trim().min(1).max(500) });
export const assignSchema = z.object({ nutritionistId: objectId, parentId: objectId.optional() });
export const inviteSchema = z.object({ email: z.string().trim().toLowerCase().email() });
export const nutritionistCreateSchema = z.object({
  name: z.string().trim().min(2, 'Enter their name'),
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  phone: z.string().trim().optional(),
  credential: z.string().trim().min(2, 'Add their qualification'),
  languages: z.string().trim().optional().default(''),
  areas: z.array(z.string().trim().min(1)).min(1, 'Choose at least one area'),
});
export const nutritionistUpdateSchema = z.object({
  phone: z.string().trim().optional(),
  credential: z.string().trim().optional(),
  languages: z.string().trim().optional(),
  areas: z.array(z.string().trim().min(1)).optional(),
  availability: z.enum(['active', 'on_leave']).optional(),
  leaveUntil: optionalDate,
  licenceRenewsOn: optionalDate,
});
export const activeSchema = z.object({ active: z.boolean() });
export const labActionSchema = z.object({ action: z.enum(['retake', 'typed_in', 'dismiss']) });
export const accessDecisionSchema = z.object({ decision: z.enum(['approve', 'decline']) });
export const areaSchema = z.object({ id: objectId.optional(), name: z.string().trim().min(2), capacity: z.coerce.number().int().min(0).max(10000) });
