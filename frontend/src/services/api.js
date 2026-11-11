const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper for making authenticated requests
async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || `Request failed with status ${res.status}`);
    }
    return data;
  } catch (error) {
    console.warn(`[Backend API] Offline or unreachable (${endpoint}):`, error.message);
    throw error;
  }
}

export const api = {
  // Auth Services
  auth: {
    login: async (identifier, password) => {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, email: identifier, username: identifier, password }),
      });
      if (res.token) {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
      }
      return res;
    },
    register: async (userData) => {
      const res = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      if (res.token) {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
      }
      return res;
    },
    quickDemo: async (role) => {
      const res = await apiFetch('/auth/quick-demo', {
        method: 'POST',
        body: JSON.stringify({ role }),
      });
      if (res.token) {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
      }
      return res;
    },
    getMe: () => apiFetch('/auth/me'),
    logout: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
  },

  // Admin Services
  admin: {
    getStats: () => apiFetch('/admin/stats'),
    getDepartments: () => apiFetch('/admin/departments'),
    getMentors: () => apiFetch('/admin/mentors'),
    createMentor: (mentorData) =>
      apiFetch('/admin/mentors', {
        method: 'POST',
        body: JSON.stringify(mentorData),
      }),
    createStudent: (studentData) =>
      apiFetch('/admin/students', {
        method: 'POST',
        body: JSON.stringify(studentData),
      }),
    getStudents: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiFetch(`/admin/students${query ? `?${query}` : ''}`);
    },
    allocate: (studentId, mentorId) =>
      apiFetch('/admin/allocate', {
        method: 'POST',
        body: JSON.stringify({ studentId, mentorId }),
      }),
    autoAllocate: (departmentCode) =>
      apiFetch('/admin/auto-allocate', {
        method: 'POST',
        body: JSON.stringify({ departmentCode }),
      }),
  },

  // Session & Meeting Services
  sessions: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiFetch(`/sessions${query ? `?${query}` : ''}`);
    },
    schedule: (sessionData) =>
      apiFetch('/sessions', {
        method: 'POST',
        body: JSON.stringify(sessionData),
      }),
    updateStatus: (id, statusData) =>
      apiFetch(`/sessions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(statusData),
      }),
    saveNotes: (id, notesData) =>
      apiFetch(`/sessions/${id}/notes`, {
        method: 'POST',
        body: JSON.stringify(notesData),
      }),
  },

  // Monthly Appraisal & Feedback Services
  feedback: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiFetch(`/feedback${query ? `?${query}` : ''}`);
    },
    submit: (feedbackData) =>
      apiFetch('/feedback', {
        method: 'POST',
        body: JSON.stringify(feedbackData),
      }),
    acknowledge: (id) =>
      apiFetch(`/feedback/${id}/acknowledge`, {
        method: 'PATCH',
      }),
  },

  // Grievances & Complaints
  complaints: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiFetch(`/complaints${query ? `?${query}` : ''}`);
    },
    submit: (complaintData) =>
      apiFetch('/complaints', {
        method: 'POST',
        body: JSON.stringify(complaintData),
      }),
    resolve: (id, resolutionData) =>
      apiFetch(`/complaints/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(resolutionData),
      }),
  },

  // Students & Academic Monitoring
  students: {
    getProfile: (id) => apiFetch(`/students/${id}`),
    updateAcademics: (id, academicData) =>
      apiFetch(`/students/${id}/academics`, {
        method: 'PATCH',
        body: JSON.stringify(academicData),
      }),
    getGoals: (id) => apiFetch(`/students/${id}/goals`),
    addGoal: (id, goalData) =>
      apiFetch(`/students/${id}/goals`, {
        method: 'POST',
        body: JSON.stringify(goalData),
      }),
    updateGoal: (goalId, goalData) =>
      apiFetch(`/students/goals/${goalId}`, {
        method: 'PATCH',
        body: JSON.stringify(goalData),
      }),
  },

  // NAAC / NBA Reports
  reports: {
    getNaacAudit: () => apiFetch('/reports/naac-audit'),
    getExportCsvUrl: () => `${API_BASE_URL}/reports/export-csv`,
  },

  // In-App Notifications
  notifications: {
    getUserNotifications: (userId) => apiFetch(`/notifications/${userId}`),
    markAsRead: (id) =>
      apiFetch(`/notifications/${id}/read`, {
        method: 'PATCH',
      }),
    markAllAsRead: (userId) =>
      apiFetch(`/notifications/user/${userId}/read-all`, {
        method: 'PATCH',
      }),
  },
};

