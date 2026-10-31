/**
 * DevPrep - Centralized API Service (`api.js`)
 * 
 * Concepts explained:
 * 1. Single API Gateway: Components never call `fetch` directly.
 * 2. Token Injection: Automatically retrieves JWT from `localStorage` and attaches `Bearer <token>`.
 * 3. 401 Interception: If the backend returns 401, clears stored session and triggers logout.
 * 4. Error Standardization: Extracts `{ error: "message" }` and throws standard JavaScript errors.
 */

const TOKEN_KEY = 'devprep-token';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const config = {
    ...options,
    headers
  };

  const response = await fetch(endpoint, config);

  let data;
  try {
    data = await response.json();
  } catch (err) {
    data = null;
  }

  // Handle unauthorized responses (except during login/signup attempts)
  if (response.status === 401 && !endpoint.includes('/api/auth/login') && !endpoint.includes('/api/auth/signup')) {
    localStorage.removeItem(TOKEN_KEY);
    window.dispatchEvent(new Event('devprep-unauthorized'));
  }

  if (!response.ok) {
    const errorMessage = (data && data.error) ? data.error : `Request failed with status ${response.status}`;
    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  login: (credentials) => request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  }),

  signup: (userData) => request('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(userData)
  }),

  getMe: () => request('/api/auth/me'),

  // Questions
  getQuestions: (params = {}) => {
    const query = new URLSearchParams();
    if (params.topic) query.append('topic', params.topic);
    if (params.difficulty) query.append('difficulty', params.difficulty);
    if (params.search) query.append('search', params.search);
    const queryString = query.toString();
    return request(`/api/questions${queryString ? `?${queryString}` : ''}`);
  },

  getQuestion: (id) => request(`/api/questions/${id}`),

  // Admin Question Management (Requires Admin Role)
  createQuestion: (questionData) => request('/api/questions', {
    method: 'POST',
    body: JSON.stringify(questionData)
  }),

  updateQuestion: (id, questionData) => request(`/api/questions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(questionData)
  }),

  deleteQuestion: (id) => request(`/api/questions/${id}`, {
    method: 'DELETE'
  }),

  // Progress
  getProgress: () => request('/api/progress'),

  updateProgress: async (payload) => {
    const res = await request('/api/progress', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('devprep-progress-updated'));
    }
    return res;
  },

  // Solutions (My Solution code notepad)
  getSolutions: () => request('/api/solutions'),

  getQuestionSolutions: (questionId) => request(`/api/solutions/${questionId}`),

  saveSolution: (questionId, solutionData) => request(`/api/solutions/${questionId}`, {
    method: 'PUT',
    body: JSON.stringify(solutionData)
  }),

  deleteSolution: (questionId, language) => request(
    `/api/solutions/${questionId}${language ? `?language=${encodeURIComponent(language)}` : ''}`,
    { method: 'DELETE' }
  ),

  // Applications (Job & Internship Tracker)
  getApplications: (params = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.search) query.append('search', params.search);
    const queryString = query.toString();
    return request(`/api/applications${queryString ? `?${queryString}` : ''}`);
  },

  createApplication: (appData) => request('/api/applications', {
    method: 'POST',
    body: JSON.stringify(appData)
  }),

  updateApplication: (id, appData) => request(`/api/applications/${id}`, {
    method: 'PUT',
    body: JSON.stringify(appData)
  }),

  deleteApplication: (id) => request(`/api/applications/${id}`, {
    method: 'DELETE'
  }),

  // Mock Tests Engine
  getMockTest: (params = {}) => {
    const query = new URLSearchParams();
    if (params.topic) query.append('topic', params.topic);
    if (params.count) query.append('count', params.count);
    const queryString = query.toString();
    return request(`/api/mock-test${queryString ? `?${queryString}` : ''}`);
  },

  submitMockTest: (submission) => request('/api/mock-test/submit', {
    method: 'POST',
    body: JSON.stringify(submission)
  }),

  getMockTestAttempts: (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    const queryString = query.toString();
    return request(`/api/mock-test/attempts${queryString ? `?${queryString}` : ''}`);
  },

  getMockTestAttemptById: (id) => request(`/api/mock-test/attempts/${encodeURIComponent(id)}`),

  getMockTestCounts: () => request('/api/mock-test/counts'),

  // Admin MCQ Bank
  getAdminMcqs: (params = {}) => {
    const query = new URLSearchParams();
    if (params.topic) query.append('topic', params.topic);
    if (params.search) query.append('search', params.search);
    const queryString = query.toString();
    return request(`/api/admin/mcq${queryString ? `?${queryString}` : ''}`);
  },

  getAdminMcqById: (id) => request(`/api/admin/mcq/${id}`),

  createAdminMcq: (mcqData) => request('/api/admin/mcq', {
    method: 'POST',
    body: JSON.stringify(mcqData)
  }),

  updateAdminMcq: (id, mcqData) => request(`/api/admin/mcq/${id}`, {
    method: 'PUT',
    body: JSON.stringify(mcqData)
  }),

  deleteAdminMcq: (id) => request(`/api/admin/mcq/${id}`, {
    method: 'DELETE'
  }),

  // Profile Avatar
  getAvatar: () => request('/api/profile/avatar'),
  uploadAvatar: (image) => request('/api/profile/avatar', {
    method: 'PUT',
    body: JSON.stringify({ image })
  }),
  deleteAvatar: () => request('/api/profile/avatar', {
    method: 'DELETE'
  })
};

export { TOKEN_KEY };
