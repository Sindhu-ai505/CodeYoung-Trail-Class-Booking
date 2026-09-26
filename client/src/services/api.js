const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  try {
    const response = await fetch(url, { ...options, headers });
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
  getSubjects: () => request('/subjects'),
  getMentors: (date) => request(`/mentors${date ? `?date=${encodeURIComponent(date)}` : ''}`),
  getAvailability: ({ subjectId, date, parentTimezone }) => 
    request(`/availability?subjectId=${encodeURIComponent(subjectId)}&date=${encodeURIComponent(date)}&parentTimezone=${encodeURIComponent(parentTimezone)}`),
  createBooking: (payload) => request('/bookings', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  getBooking: (id) => request(`/bookings/${encodeURIComponent(id)}`),
  getAllBookings: () => request('/bookings'),
  
  // Evaluator Lab & Dev Test helpers
  getDevStats: () => request('/dev/stats'),
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
