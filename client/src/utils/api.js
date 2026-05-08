const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  if (config.body instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

export const api = {
  createUser: (userData) => request('/users', { method: 'POST', body: userData }),
  getUser: (userId) => request(`/users/${userId}`),
  updateUser: (userId, data) => request(`/users/${userId}`, { method: 'PUT', body: data }),
  getUserPreferences: (userId) => request(`/users/${userId}/preferences`),
  updatePreferences: (userId, prefs) => request(`/users/${userId}/preferences`, { method: 'PUT', body: prefs }),

  uploadResume: (userId, formData) => request(`/resume/upload/${userId}`, { method: 'POST', body: formData }),
  getResume: (userId) => request(`/resume/${userId}`),
  deleteResume: (userId) => request(`/resume/${userId}`, { method: 'DELETE' }),

  getJobs: (userId, params = '') => request(`/jobs/${userId}${params ? '?' + params : ''}`),
  createJob: (jobData) => request('/jobs', { method: 'POST', body: jobData }),
  getJobDetail: (jobId) => request(`/jobs/detail/${jobId}`),
  updateJob: (jobId, data) => request(`/jobs/${jobId}`, { method: 'PUT', body: data }),
  deleteJob: (jobId) => request(`/jobs/${jobId}`, { method: 'DELETE' }),
  getJobStats: (userId) => request(`/jobs/${userId}/stats`),

  getAgentStatus: () => request('/agents/status'),
  listAgents: () => request('/agents/list'),
  delegateTask: (agent, task, context) => request('/agents/delegate', { method: 'POST', body: { agent, task, context } }),
  runWorkflow: (workflow, context) => request('/agents/workflow', { method: 'POST', body: { workflow, context } }),

  reviewJob: (data) => request('/agents/job/review', { method: 'POST', body: data }),
  checkEligibility: (data) => request('/agents/job/eligibility', { method: 'POST', body: data }),
  rankJobs: (data) => request('/agents/job/rank', { method: 'POST', body: data }),
  analyzeRequirements: (data) => request('/agents/job/requirements', { method: 'POST', body: data }),

  applyToJob: (data) => request('/agents/job/apply', { method: 'POST', body: data }),
  batchApply: (data) => request('/agents/job/batch-apply', { method: 'POST', body: data }),
  getApplications: (userId) => request(`/agents/applications/${userId}`),

  tailorResume: (data) => request('/agents/resume/tailor', { method: 'POST', body: data }),
  optimizeResume: (data) => request('/agents/resume/optimize', { method: 'POST', body: data }),
  analyzeResume: (data) => request('/agents/resume/analyze', { method: 'POST', body: data }),
  getResumeImprovements: (data) => request('/agents/resume/improvements', { method: 'POST', body: data }),

  createStrategy: (data) => request('/agents/strategy/create', { method: 'POST', body: data }),
  analyzeMarket: (data) => request('/agents/strategy/market', { method: 'POST', body: data }),
  suggestTargets: (data) => request('/agents/strategy/targets', { method: 'POST', body: data }),

  researchCompany: (data) => request('/agents/company/research', { method: 'POST', body: data }),
  evaluateFit: (data) => request('/agents/company/evaluate-fit', { method: 'POST', body: data }),

  fillForm: (data) => request('/agents/form/fill', { method: 'POST', body: data }),
  answerQuestions: (data) => request('/agents/form/questions', { method: 'POST', body: data }),

  setupPlatforms: (data) => request('/agents/accounts/setup', { method: 'POST', body: data }),
  createAccount: (data) => request('/agents/accounts/create', { method: 'POST', body: data }),
  getAccounts: (userId) => request(`/agents/accounts/${userId}`),
  deleteAccount: (userId, accountId) => request(`/agents/accounts/${userId}/${accountId}`, { method: 'DELETE' }),

  getDashboard: (userId) => request(`/agents/dashboard/${userId}`),
  getTimeline: (userId, jobId) => request(`/agents/timeline/${userId}${jobId ? '?jobId=' + jobId : ''}`),
  getAnalytics: (userId) => request(`/agents/analytics/${userId}`),
  updateJobStatus: (data) => request('/agents/status/update', { method: 'POST', body: data }),
  getPipeline: (userId) => request(`/agents/pipeline/${userId}`),
  getRoadmap: (userId) => request(`/agents/roadmap/${userId}`),
  getHealth: () => request('/agents/health'),

  connectGmail: (userId) => request(`/gmail/connect/${userId}`),
  getGmailStatus: (userId) => request(`/gmail/status/${userId}`),
  disconnectGmail: (userId) => request(`/gmail/disconnect/${userId}`, { method: 'POST' }),
};

export default api;
