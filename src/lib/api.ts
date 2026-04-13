/**
 * BibleAlpha - API Client (substitui Supabase)
 */

const API_BASE = '/api';

const api = {
  async get(endpoint, params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${API_BASE}/${endpoint}?${query}` : `${API_BASE}/${endpoint}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    return response.json();
  },

  async post(endpoint, data) {
    const response = await fetch(`${API_BASE}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    return response.json();
  },

  async delete(endpoint, params = {}) {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE}/${endpoint}?${query}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    return response.json();
  },

  verses: {
    get: (book, chapter) => api.get('verses.php', { book, chapter }),
    search: (query) => api.post('verses.php', { action: 'search', query })
  },

  notes: {
    get: (params) => api.get('notes.php', params),
    create: (data) => api.post('notes.php', { action: 'create', ...data })
  },

  users: {
    get: (userId, email) => api.get('users.php', { user_id: userId, email }),
    register: (data) => api.post('users.php', { action: 'register', ...data })
  },

  userData: {
    get: (table, userId) => api.get('user-data.php', { table, user_id: userId }),
    addHighlight: (userId, data) => api.post('user-data.php', { action: 'add_highlight', user_id: userId, ...data }),
    addFavorite: (userId, data) => api.post('user-data.php', { action: 'add_favorite', user_id: userId, ...data }),
    addNote: (userId, data) => api.post('user-data.php', { action: 'add_note', user_id: userId, ...data }),
    addHistory: (userId, data) => api.post('user-data.php', { action: 'add_history', user_id: userId, ...data }),
    delete: (table, userId, id) => api.delete('user-data.php', { table, user_id: userId, id })
  }
};

export default api;