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
export const logoutSchema = z.object({ everywhere: z.boolean().default(false) });

export const checklistSchema = z.object({ done: z.boolean() });
export const reminderSchema = z.object({ slot: z.enum(['Morning', 'Afternoon', 'Evening', 'Night']), on: z.boolean() });
export const rescheduleSchema = z.object({ day: z.string().min(1), time: z.string().min(1) });
export const messageSchema = z.object({ text: z.string().trim().min(1, 'Write a message first').max(4000) });
export const uploadSchema = z.object({ fileName: z.string().trim().min(1), lab: z.string().trim().optional() });

export const visitLogSchema = z.object({
  title: z.string().trim().optional(),
  vitals: z.array(z.object({ label: z.string(), value: z.string().trim().optional().default(''), unit: z.string().default('') })).default([]),
  observations: z.array(z.string()).default([]),
  mood: z.string().optional(),
  notes: z.string().optional(),
  tests: z.array(z.string()).default([]),
});
export const planDaySchema = z.object({
  meals: z.record(z.enum(['Breakfast', 'Lunch', 'Dinner', 'Snack']), z.string().nullable()),
  supplements: z.array(z.string()).default([]),
  links: z.record(z.string(), z.string()).default({}),
});
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
