import { api } from './client.js';

// One place that knows the REST surface. Features import from here, never build URLs.
export const authApi = {
  login: (body) => api.post('/auth/login', body),
  requestParentCode: (phone) => api.post('/auth/parent-code', { phone }),
  verifyParentCode: (phone, code) => api.post('/auth/parent-code/verify', { phone, code }),
  forgot: (email) => api.post('/auth/forgot', { email }),
  logout: (everywhere) => api.post('/auth/logout', { everywhere }),
  me: () => api.get('/auth/me'),
};

const p = (id) => `/parents/${id}`;
export const parentApi = {
  list: () => api.get('/parents'),
  threads: () => api.get('/parents/threads'),
  dashboard: (id) => api.get(`${p(id)}/dashboard`),
  home: (id) => api.get(`${p(id)}/home`),
  profile: (id) => api.get(`${p(id)}/profile`),
  labs: (id) => api.get(`${p(id)}/labs`),
  uploadReport: (id, fileName) => api.post(`${p(id)}/labs/reports`, { fileName }),
  nutrition: (id) => api.get(`${p(id)}/nutrition`),
  supplements: (id) => api.get(`${p(id)}/supplements`),
  setReminder: (id, slot, on) => api.patch(`${p(id)}/supplements/reminders`, { slot, on }),
  setChecklist: (id, code, done) => api.patch(`${p(id)}/checklist/${code}`, { done }),
  visits: (id) => api.get(`${p(id)}/visits`),
  reschedule: (id, day, time) => api.post(`${p(id)}/visits/reschedule`, { day, time }),
  documents: (id) => api.get(`${p(id)}/documents`),
  messages: (id) => api.get(`${p(id)}/messages`),
  sendMessage: (id, text) => api.post(`${p(id)}/messages`, { text }),
};

export const workspaceApi = {
  clients: () => api.get('/workspace/clients'),
  library: () => api.get('/workspace/library'),
  visitContext: (id) => api.get(`/workspace/clients/${id}/visit`),
  logVisit: (id, body) => api.post(`/workspace/clients/${id}/visits`, body),
  savePlan: (id, body) => api.put(`/workspace/clients/${id}/plan`, body),
  sendUpdate: (id, text) => api.post(`/workspace/clients/${id}/updates`, { text }),
};

export const adminApi = {
  overview: () => api.get('/admin/overview'),
  team: () => api.get('/admin/nutritionists'),
  families: () => api.get('/admin/families'),
  resolveFlag: (id) => api.post(`/admin/flags/${id}/resolve`),
};

export const onboardingApi = {
  nutritionists: () => api.get('/onboarding/nutritionists'),
  complete: (body) => api.post('/onboarding', body),
};
