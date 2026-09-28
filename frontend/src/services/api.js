const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include' // Ensures HTTP-only cookies are sent & received
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(data.message || 'Request failed with status ' + response.status);
      error.status = response.status;
      error.code = data.code || 'API_ERROR';
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (err.status) {
      throw err;
    }
    // Network / offline error
    const netErr = new Error('Unable to connect to the booking server. Please verify your connection.');
    netErr.code = 'NETWORK_ERROR';
    netErr.status = 0;
    throw netErr;
  }
}

export const api = {
  // Authentication & Session (Parent & Mentor)
  login: (payload) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  mentorLogin: (payload) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ role: 'mentor', ...payload })
  }),
  getCurrentSession: () => request('/auth/me'),
  logout: () => request('/auth/logout', { method: 'POST' }),

  // Parent Bookings (Authenticated & Ownership enforced)
  getParentBookings: () => request('/parent/bookings'),
  getParentBooking: (id) => request(`/parent/bookings/${encodeURIComponent(id)}`),

  // Mentor Bookings & Workspace (Strictly enforced mentor ownership)
  getMentorBookings: () => request('/mentor/bookings'),
  getMentorBooking: (id) => request(`/mentor/bookings/${encodeURIComponent(id)}`),
  getMentorProfile: () => request('/mentor/me'),

  // Catalog & Availability
  getSubjects: () => request('/subjects'),
  getMentors: (params = {}) => {
    if (typeof params === 'string') {
      return request(`/mentors?date=${encodeURIComponent(params)}`);
    }
    const query = new URLSearchParams();
    if (params.date) query.set('date', params.date);
    if (params.timezone) query.set('timezone', params.timezone);
    const qs = query.toString();
    return request(`/mentors${qs ? `?${qs}` : ''}`);
  },
  getAvailability: ({ subjectId, date, parentTimezone }) => 
    request(`/availability?subjectId=${encodeURIComponent(subjectId)}&date=${encodeURIComponent(date)}&parentTimezone=${encodeURIComponent(parentTimezone)}`),
  
  // Trial Class Booking
  createBooking: (payload) => request('/bookings', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  getBooking: (id) => request(`/bookings/${encodeURIComponent(id)}`),
  getAllBookings: () => request('/bookings'),
  completeSession: (id) => request(`/bookings/${encodeURIComponent(id)}/complete`, {
    method: 'POST'
  }),
  getLearningCheck: (id) => request(`/bookings/${encodeURIComponent(id)}/learning-check`),
  submitLearningCheck: (id, answers) => request(`/bookings/${encodeURIComponent(id)}/learning-check`, {
    method: 'POST',
    body: JSON.stringify({ answers })
  }),

  // Real-time Classroom & WebRTC Signaling
  getClassroom: (id) => request(`/classroom/${encodeURIComponent(id)}`),
  sendClassroomSignal: (id, signal) => request(`/classroom/${encodeURIComponent(id)}/signal`, {
    method: 'POST',
    body: JSON.stringify({ signal })
  }),
  sendClassroomChat: (id, text) => request(`/classroom/${encodeURIComponent(id)}/chat`, {
    method: 'POST',
    body: JSON.stringify({ text })
  }),
  leaveClassroom: (id) => request(`/classroom/${encodeURIComponent(id)}/leave`, {
    method: 'POST'
  }),
  
  // Evaluator Lab & Dev Test helpers
  getDevStats: (params = {}) => {
    const query = new URLSearchParams();
    if (params.date) query.set('date', params.date);
    if (params.timezone) query.set('timezone', params.timezone);
    const qs = query.toString();
    return request(`/dev/stats${qs ? `?${qs}` : ''}`);
  },
  resetDevData: () => request('/dev/reset', { method: 'POST' }),
  seedDemoSchedule: () => request('/dev/seed-demo-schedule', { method: 'POST' }),
  seedMentorLimit: (subjectId, date) => request('/dev/seed-mentor-limit', {
    method: 'POST',
    body: JSON.stringify({ subjectId, date })
  }),
  seedCapacityLimit: (date) => request('/dev/seed-capacity-limit', {
    method: 'POST',
    body: JSON.stringify({ date })
  })
};
