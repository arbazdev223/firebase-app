import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL - Change this for production
const BASE_URL = `https://test.ifda.in`;

// Get user ID from AsyncStorage
export const getUserId = async () => {
  try {
    const userData = await AsyncStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      return user._id;
    }
    return null;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
};

// Helper to get auth token if needed
const getAuthToken = async () => {
  try {
    return await AsyncStorage.getItem('auth_token');
  } catch {
    return null;
  }
};

// API Service Methods
export const api = {
  // Fetch enquiries with filters
  fetchEnquiries: async (params) => {
    const operatorSuffixes = ['!=', '>=', '<=', '>', '<'];

    const queryParts = [];
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined) continue;

      const operator = operatorSuffixes.find((suffix) => key.endsWith(suffix));
      if (operator) {
        const baseKey = key.slice(0, -operator.length);
        queryParts.push(`${baseKey}${operator}${value}`);
      } else {
        queryParts.push(`${key}=${value}`);
      }
    }
    const queryString = queryParts.join('&');
    
    const url = `${BASE_URL}/api/enquiries?${queryString}`;
    console.log('Fetching URL:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }
    
    const data = await response.json();
    console.log('API Response:', data.length, 'records');
    return data;
  },

  // Remaining Calls (Telecaller)
  fetchRemainingCalls: async (userId) => {
    return api.fetchEnquiries({
      caller: userId,
      assign: 'Assigned',
      callingDate: 'null',
      parentStatus: 'null'
    });
  },

  // Today's Follow-ups (Telecaller)
  fetchTodayFollowUps: async (userId) => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayDate = `${year}-${month}-${day}`;
    
    const params = {
      caller: userId,
      assign: 'Assigned',
      callingDate: 'notnull',
      visitDate: todayDate,
      parentStatus: 'null'
    };
    
    console.log('API Request - fetchTodayFollowUps:', params);
    console.log('Today\'s Date:', todayDate);
    
    return api.fetchEnquiries(params);
  },

  // Reassigned Data (Counsellor)
  fetchReassignedData: async (userId) => {
    return api.fetchEnquiries({
      caller: userId,
      assign: 'ReAssigned'
    });
  },

  // Follow-up Data (Counsellor)
  fetchFollowUpData: async (userId) => {
    console.log('API Request - fetchFollowUpData:', {
      caller: userId,
      assign: 'Assigned',
      callingDate: 'notnull',
      parentStatus: 'null',
      visitDate: 'notnull'
    });
    
    return api.fetchEnquiries({
      caller: userId,
      assign: 'Assigned',
      callingDate: 'notnull',
      parentStatus: 'null',
      visitDate: 'notnull'
    });
  },

  // Login
  login: async (credentials) => {
    const response = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    
    if (!response.ok) {
      throw new Error('Login failed');
    }
    
    return await response.json();
  },

  // Get caller counts for dashboard
  fetchCallerCounts: async (userId) => {
    const response = await fetch(`${BASE_URL}/api/enquiries/callercount/${userId}`);
    
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Failed to fetch caller counts: ${errorBody}`);
    }
    
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const raw = await response.text();
      throw new Error(`Unexpected response for caller counts: ${raw}`);
    }
    
    const data = await response.json();
    console.log('Dashboard API Response:', data);
    return data;
  },

  // Update enquiry
  updateEnquiry: async (id, payload) => {
    const response = await fetch(`${BASE_URL}/api/enquiries/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Failed to update enquiry');
    }

    return await response.json();
  },

  // Fetch recent activities
  fetchRecentActivities: async (userId, limit = 3) => {
    const response = await fetch(
      `${BASE_URL}/api/enquiries?caller=${userId}&assign=Assigned&callingDate=notnull&order=desc`
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Failed to fetch recent activities: ${errorBody}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const raw = await response.text();
      throw new Error(`Unexpected response for recent activities: ${raw}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data.slice(0, limit) : [];
  },

  // Quick Insert Feed with pagination support
  fetchQuickInsertFeed: async (params = {}) => {
    let url = `${BASE_URL}/api/quick-insert`;
    const query = [];
    if (params.before) query.push(`before=${encodeURIComponent(params.before)}`);
    if (params.limit) query.push(`limit=${params.limit}`);
    if (query.length) url += `?${query.join('&')}`;

    const response = await fetch(url);

    if (response.status === 404) {
      return [];
    }

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Failed to fetch quick insert feed: ${errorBody}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const raw = await response.text();
      throw new Error(`Unexpected response for quick insert feed: ${raw}`);
    }

    return await response.json();
  },

  createQuickInsertNote: async (payload) => {
    const response = await fetch(`${BASE_URL}/api/quick-insert/note`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Failed to save quick note: ${errorBody}`);
    }

    return await response.json();
  },

  createQuickInsertEnquiry: async (payload) => {
    console.log('API: Creating quick insert enquiry with payload:', payload);
    const response = await fetch(`${BASE_URL}/api/quick-insert/enquiry`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${await getAuthToken()}`,
      },
      body: JSON.stringify(payload),
    });

    console.log('API: Response status:', response.status);
    
    if (!response.ok) {
      const errorBody = await response.text();
      console.error('API: Error response:', errorBody);
      throw new Error(`Failed to save quick enquiry: ${errorBody}`);
    }

    const result = await response.json();
    console.log('API: Success response:', result);
    return result;
  },

  // Update a quick insert note (edit message)
  updateQuickInsertNote: async ({ id, message }) => {
    const res = await fetch(
      `${BASE_URL}/api/quick-insert/note/${id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await getAuthToken()}`,
        },
        body: JSON.stringify({ message }),
      }
    );
    if (!res.ok) throw new Error('Failed to update note');
    return await res.json();
  },

  // Delete a quick insert note (delete message)
  deleteQuickInsertNote: async ({ id }) => {
    const res = await fetch(
      `${BASE_URL}/api/quick-insert/note/${id}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${await getAuthToken()}`,
        },
      }
    );
    if (!res.ok) throw new Error('Failed to delete note');
    return await res.json();
  },
};

export default api;
