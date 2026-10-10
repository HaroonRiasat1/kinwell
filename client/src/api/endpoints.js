import { api, request } from './client.js';

// One place that knows the REST surface. Features import from here, never build URLs.
export const authApi = {
  login: (body) => api.post('/auth/login', body),
  requestParentCode: (phone) => api.post('/auth/parent-code', { phone }),
  verifyParentCode: (phone, code) => api.post('/auth/parent-code/verify', { phone, code }),
  forgot: (email) => api.post('/auth/forgot', { email }),
  logout: (everywhere) => api.post('/auth/logout', { everywhere }),
  me: () => api.get('/auth/me'),
  invite: (token) => api.get(`/auth/invites/${token}`),
  acceptInvite: (body) => api.post('/auth/invites/accept', body),
  setLanguage: (language) => api.patch('/auth/me/language', { language }),
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
  signInCode: (id) => api.post(`${p(id)}/sign-in-code`),
};

export const workspaceApi = {
  clients: () => api.get('/workspace/clients'),
  library: () => api.get('/workspace/library'),
  notifications: () => api.get('/workspace/notifications'),
  readNotification: (id) => api.post(`/workspace/notifications/${id}/read`),
  visitContext: (id) => api.get(`/workspace/clients/${id}/visit`),
  logVisit: (id, body) => api.post(`/workspace/clients/${id}/visits`, body),
  savePlan: (id, body) => api.put(`/workspace/clients/${id}/plan`, body),
  sendUpdate: (id, text) => api.post(`/workspace/clients/${id}/updates`, { text }),
};

const qs = (params = {}) => {
  const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''));
  const str = q.toString();
  return str ? `?${str}` : '';
};

export const adminApi = {
  overview: () => api.get('/admin/overview'),
  flags: (state) => api.get(`/admin/flags${qs({ state })}`),
  resolveFlag: (id, note) => api.post(`/admin/flags/${id}/resolve`, { note }),
  reopenFlag: (id) => api.post(`/admin/flags/${id}/reopen`),
  noteFlag: (id, text) => api.post(`/admin/flags/${id}/notes`, { text }),
  remindFlag: (id, message) => api.post(`/admin/flags/${id}/remind`, { message }),

  families: (params) => api.get(`/admin/families${qs(params)}`),
  family: (id) => api.get(`/admin/families/${id}`),
  assignNutritionist: (id, nutritionistId, parentId) => api.put(`/admin/families/${id}/nutritionist`, { nutritionistId, parentId }),
  resendInvite: (id, email) => api.post(`/admin/families/${id}/invites`, { email }),

  team: (params) => api.get(`/admin/nutritionists${qs(params)}`),
  nutritionist: (id) => api.get(`/admin/nutritionists/${id}`),
  createNutritionist: (body) => api.post('/admin/nutritionists', body),
  updateNutritionist: (id, body) => api.patch(`/admin/nutritionists/${id}`, body),

  accounts: (params) => api.get(`/admin/accounts${qs(params)}`),
  resetPassword: (id) => api.post(`/admin/accounts/${id}/reset-password`),
  signOutEverywhere: (id) => api.post(`/admin/accounts/${id}/sign-out`),
  parentCode: (id) => api.post(`/admin/accounts/${id}/parent-code`),
  setActive: (id, active) => api.put(`/admin/accounts/${id}/active`, { active }),

  labUploads: () => api.get('/admin/lab-uploads'),
  labUploadAction: (id, action) => api.post(`/admin/lab-uploads/${id}`, { action }),
  accessRequests: () => api.get('/admin/access-requests'),
  decideAccess: (id, decision) => api.post(`/admin/access-requests/${id}`, { decision }),

  areas: () => api.get('/admin/areas'),
  saveArea: (body) => api.put('/admin/areas', body),
  removeArea: (id) => request(`/admin/areas/${id}`, { method: 'DELETE' }),

  activity: (page) => api.get(`/admin/activity${qs({ page })}`),
};

export const onboardingApi = {
  nutritionists: () => api.get('/onboarding/nutritionists'),
  complete: (body) => api.post('/onboarding', body),
};
