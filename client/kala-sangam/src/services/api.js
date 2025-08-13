// Smart API URL detection with fallback
const getApiUrl = () => {
  // Use environment variable first
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Fallback logic based on current hostname
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // If running on localhost, use local backend
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5050';
    }
    
    // If deployed, use production backend
    return 'https://kalasangam.onrender.com';
  }
  
  // Final fallback
  return 'http://localhost:5050';
};

const API_URL = getApiUrl();
console.log(`🔗 API URL resolved to: ${API_URL}`);

// Export the API URL for debugging
export { API_URL };

// Admin API functions
export const adminApi = {
  // Fetch all reports with optional filtering
  getReports: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.type) queryParams.append('type', filters.type);
    if (filters.page) queryParams.append('page', filters.page);
    if (filters.limit) queryParams.append('limit', filters.limit);
    
    const url = `${API_URL}/api/reports${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    console.log('Fetching reports from:', url);
    console.log('Using token:', localStorage.getItem('token') ? 'Present' : 'Missing');
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('API Error Response:', errorData);
      throw new Error(`Failed to fetch reports: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log('API Response data:', data);
    return data;
  },

  // Update report status with admin notes
  updateReportStatus: async (reportId, status, adminNotes = '') => {
    const response = await fetch(`${API_URL}/api/reports/${reportId}/status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status, adminNotes }),
    });

    if (!response.ok) {
      throw new Error('Failed to update report status');
    }

    return response.json();
  },

  // Get report statistics
  getReportStats: async () => {
    const response = await fetch(`${API_URL}/api/reports/stats`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch report statistics');
    }

    return response.json();
  },

  // Admin login
  adminLogin: async (credentials) => {
    console.log('Making admin login request to:', `${API_URL}/api/auth/admin-login`);
    console.log('Request payload:', { email: credentials.email });
    
    try {
      const response = await fetch(`${API_URL}/api/auth/admin-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorMessage = 'Admin login failed';
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          console.log('Error response data:', errorData);
        } catch (jsonError) {
          console.log('Could not parse error response as JSON:', jsonError);
          const textError = await response.text();
          console.log('Error response text:', textError);
          errorMessage = textError || errorMessage;
        }
        
        throw new Error(`${response.status}: ${errorMessage}`);
      }

      const data = await response.json();
      console.log('Admin login successful:', data);
      return data;
    } catch (fetchError) {
      console.error('Network or fetch error:', fetchError);
      
      if (fetchError.name === 'TypeError' && fetchError.message.includes('fetch')) {
        throw new Error('Network error: Could not connect to server. Please check if the server is running.');
      }
      
      throw fetchError;
    }
  },

  // User management functions
  // Get all users with pagination and filters
  getAllUsers: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    
    if (filters.page) queryParams.append('page', filters.page);
    if (filters.limit) queryParams.append('limit', filters.limit);
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.role) queryParams.append('role', filters.role);
    
    const url = `${API_URL}/api/users/admin/all${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to fetch users: ${response.status} - ${errorData}`);
    }

    return response.json();
  },

  // Get user statistics for admin dashboard
  getUserStatsAdmin: async () => {
    const response = await fetch(`${API_URL}/api/users/admin/stats`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user statistics');
    }

    return response.json();
  },

  // Create new user (admin only)
  createUser: async (userData) => {
    const response = await fetch(`${API_URL}/api/users/admin/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || 'Failed to create user');
    }

    return response.json();
  },

  // Update user role (admin only)
  updateUserRole: async (userId, role) => {
    const response = await fetch(`${API_URL}/api/users/admin/${userId}/role`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || 'Failed to update user role');
    }

    return response.json();
  },

  // Delete user (admin only)
  deleteUser: async (userId) => {
    const response = await fetch(`${API_URL}/api/users/admin/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || 'Failed to delete user');
    }

    return response.json();
  },

  // Artwork management functions
  // Get all artworks (admin only)
  getAllArtworks: async () => {
    const response = await fetch(`${API_URL}/api/artworks`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to fetch artworks: ${response.status} - ${errorData}`);
    }

    const result = await response.json();
    // Return data array if it exists, otherwise return the result directly
    return result.data || result;
  },

  // Delete artwork (admin only)
  deleteArtwork: async (artworkId) => {
    const response = await fetch(`${API_URL}/api/artworks/${artworkId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || 'Failed to delete artwork');
    }

    return response.json();
  },

  // Event management functions
  // Get all events (admin only)
  getAllEvents: async (options = {}) => {
    const queryParams = new URLSearchParams();
    
    // Add option to filter by creator role (but don't use it by default for admin)
    if (options.creatorRole) {
      queryParams.append('creatorRole', options.creatorRole);
    }
    if (options.upcoming !== undefined) {
      queryParams.append('upcoming', options.upcoming);
    }
    // Add admin flag to get all events regardless of creator
    queryParams.append('admin', 'true');

    const url = `${API_URL}/api/events${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to fetch events: ${response.status} - ${errorData}`);
    }

    const result = await response.json();
    return result.data || [];
  },

  // Delete event (admin only)
  deleteEvent: async (eventId) => {
    const response = await fetch(`${API_URL}/api/events/${eventId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || 'Failed to delete event');
    }

    return response.json();
  },

  // Email verification functions
  // Get email verification status
  getEmailVerificationStatus: async () => {
    const response = await fetch(`${API_URL}/api/email-verification/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || 'Failed to fetch email verification status');
    }

    return response.json();
  },

  // Send email verification
  sendEmailVerification: async () => {
    const response = await fetch(`${API_URL}/api/email-verification/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || 'Failed to send verification email');
    }

    return response.json();
  },

  // Admin settings functions
  // Change admin password
  changePassword: async (passwordData) => {
    const response = await fetch(`${API_URL}/api/users/change-password`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(passwordData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || 'Failed to change password');
    }

    return response.json();
  },

  // Delete admin account
  deleteAccount: async (deleteData) => {
    const response = await fetch(`${API_URL}/api/users/delete-account`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(deleteData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || 'Failed to delete account');
    }

    return response.json();
  }
};

// General API functions that might be used elsewhere
export const api = {
  // Regular user login
  login: async (credentials) => {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    return response.json();
  },

  // Register user
  register: async (userData) => {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error('Registration failed');
    }

    return response.json();
  },

  // Submit a report
  submitReport: async (reportData) => {
    const response = await fetch(`${API_URL}/api/reports`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reportData),
    });

    if (!response.ok) {
      throw new Error('Failed to submit report');
    }

    return response.json();
  },

  // Get user's own reports
  getUserReports: async () => {
    const response = await fetch(`${API_URL}/api/reports/user`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user reports');
    }

    return response.json();
  },

  // Fetch cultural events
  getEvents: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.type) queryParams.append('type', filters.type);
      if (filters.city) queryParams.append('city', filters.city);
      if (filters.state) queryParams.append('state', filters.state);
      if (filters.upcoming) queryParams.append('upcoming', filters.upcoming);
      if (filters.organizer) queryParams.append('organizer', filters.organizer);

      const url = `${API_URL}/api/events${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      console.log('Fetching events from URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Events API response status:', response.status);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.text();
          errorMessage += ` - ${errorData}`;
        } catch (e) {
          console.warn('Could not read error response body');
        }
        throw new Error(`Failed to fetch events: ${errorMessage}`);
      }

      const result = await response.json();
      console.log('Events API response data:', result);
      return result;
    } catch (error) {
      console.error('Error in getEvents API call:', error);
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error: Could not connect to server. Please check if the server is running.');
      }
      throw error;
    }
  },

  // Fetch artists
  getArtists: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    if (filters.featured) queryParams.append('featured', filters.featured);
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.limit) queryParams.append('limit', filters.limit);
    if (filters.page) queryParams.append('page', filters.page);
    if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
    if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);

    const url = `${API_URL}/api/users/artists${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to fetch artists: ${response.status} - ${errorData}`);
    }

    return response.json();
  },

  // Fetch single artist by ID
  getArtist: async (artistId) => {
    const url = `${API_URL}/api/users/artists/${artistId}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to fetch artist: ${response.status} - ${errorData}`);
    }

    return response.json();
  },

  // Fetch artworks (real user-created artworks)
  getArtworks: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    if (filters.category) queryParams.append('category', filters.category);
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.limit) queryParams.append('limit', filters.limit);
    if (filters.page) queryParams.append('page', filters.page);
    if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
    if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);
    if (filters.userId) queryParams.append('userId', filters.userId);

    const url = `${API_URL}/api/artworks${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to fetch artworks: ${response.status} - ${errorData}`);
    }

    return response.json();
  },


  // Toggle like for an artwork
  toggleLike: async (artworkId) => {
    const response = await fetch(`${API_URL}/api/artworks/${artworkId}/like`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to toggle like: ${response.status} - ${errorData}`);
    }

    return response.json();
  },

  // Toggle bookmark for an artwork
  toggleBookmark: async (artworkId) => {
    const response = await fetch(`${API_URL}/api/artworks/${artworkId}/bookmark`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to toggle bookmark: ${response.status} - ${errorData}`);
    }

    return response.json();
  },

  // Create new artwork
  createArtwork: async (artworkData) => {
    const response = await fetch(`${API_URL}/api/artworks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(artworkData),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to create artwork: ${response.status} - ${errorData}`);
    }

    return response.json();
  },

  // Update existing artwork
  updateArtwork: async (artworkId, artworkData) => {
    const response = await fetch(`${API_URL}/api/artworks/${artworkId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(artworkData),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to update artwork: ${response.status} - ${errorData}`);
    }

    return response.json();
  },

  // Delete artwork
  deleteArtwork: async (artworkId) => {
    const response = await fetch(`${API_URL}/api/artworks/${artworkId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to delete artwork: ${response.status} - ${errorData}`);
    }

    return response.json();
  },

  // Get current user profile
  getCurrentUser: async () => {
    const response = await fetch(`${API_URL}/api/users/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to fetch current user: ${response.status} - ${errorData}`);
    }

    return response.json();
  },

  // Smart Search AI Functions
  // Perform smart search with natural language processing
  smartSearch: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.query) queryParams.append('query', params.query);
    if (params.type) queryParams.append('type', params.type);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.page) queryParams.append('page', params.page);

    const url = `${API_URL}/api/smart-search/search${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Smart search failed: ${response.status} - ${errorData}`);
    }

    return response.json();
  },

  // Get search suggestions for autocomplete
  getSearchSuggestions: async (query) => {
    const queryParams = new URLSearchParams();
    if (query) queryParams.append('query', query);

    const url = `${API_URL}/api/smart-search/suggestions${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to get search suggestions: ${response.status} - ${errorData}`);
    }

    return response.json();
  },

  // Analyze search query with AI
  analyzeSearchQuery: async (query) => {
    const response = await fetch(`${API_URL}/api/smart-search/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to analyze query: ${response.status} - ${errorData}`);
    }

    return response.json();
  },

  // Get trending searches and popular content
  getTrendingSearches: async () => {
    const response = await fetch(`${API_URL}/api/smart-search/trending`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to get trending searches: ${response.status} - ${errorData}`);
    }

    return response.json();
  },

  // Advanced search with filters
  advancedSearch: async (searchParams) => {
    const response = await fetch(`${API_URL}/api/smart-search/advanced`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(searchParams),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Advanced search failed: ${response.status} - ${errorData}`);
    }

    return response.json();
  },

  // Get available search filters
  getSearchFilters: async () => {
    const response = await fetch(`${API_URL}/api/smart-search/filters`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to get search filters: ${response.status} - ${errorData}`);
    }

    return response.json();
  },

  // Increment view count for an artwork
  incrementView: async (artworkId) => {
    const response = await fetch(`${API_URL}/api/artworks/${artworkId}/view`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to increment view: ${response.status} - ${errorData}`);
    }

    return response.json();
  }
};

export default { api, adminApi };
