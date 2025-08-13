import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import AdminPanel from './AdminPanel';
import { adminApi } from '../services/api';
import FullBleedDivider from './FullBleedDivider';
import VerificationAdmin from './admin/VerificationAdmin';
import { useAuth } from '../context/AuthContext';
import { 
  FaHome, 
  FaUsers, 
  FaFileAlt, 
  FaCalendarAlt, 
  FaCog, 
  FaSignOutAlt, 
  FaBars,
  FaChartBar,
  FaDatabase,
  FaServer
} from 'react-icons/fa';

const AdminDashboard = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [userFilters, setUserFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
    role: 'all'
  });
  const [pagination, setPagination] = useState({});
  
  // Content management state
  const [contentView, setContentView] = useState(''); // 'artworks' or 'events'
  const [artworks, setArtworks] = useState([]);
  const [events, setEvents] = useState([]);
  const [contentLoading, setContentLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    totalArtworks: 0,
    totalEvents: 0,
    recentUsers: [],
    systemStatus: 'operational'
  });
  
  // Admin settings state
  const [adminPasswordForm, setAdminPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [adminDeleteForm, setAdminDeleteForm] = useState({
    password: '',
    confirmText: ''
  });
  const [showAdminDeleteConfirm, setShowAdminDeleteConfirm] = useState(false);
  const [adminSettingsLoading, setAdminSettingsLoading] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setCurrentUser(user);
      setLoading(false);
      // Only allow admin users to access this panel
      if (user.role !== 'Admin') {
        navigate('/');
        return;
      }
      fetchDashboardStats();
    } else {
      navigate('/');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    navigate('/');
  };

  const fetchDashboardStats = async () => {
    try {
      // Fetch multiple stats in parallel
      const [usersRes, recentUsersRes, artworksRes, eventsRes] = await Promise.all([
        adminApi.getAllUsers({ limit: 100 }), // Get more users to count properly
        adminApi.getAllUsers({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' }), // Get recent users
        adminApi.getAllArtworks(),
        adminApi.getAllEvents()
      ]);
      
      const totalUsers = usersRes.pagination?.totalCount || usersRes.users?.length || 0;
      const totalArtworks = Array.isArray(artworksRes) ? artworksRes.length : (artworksRes.data?.length || 0);
      const totalEvents = Array.isArray(eventsRes) ? eventsRes.length : (eventsRes.data?.length || 0);
      const recentUsers = recentUsersRes.users?.slice(0, 5) || [];
      
      console.log('Dashboard Stats:', {
        totalUsers,
        totalArtworks,
        totalEvents,
        recentUsersCount: recentUsers.length
      });
      
      setDashboardStats({
        totalUsers,
        totalArtworks,
        totalEvents,
        recentUsers,
        systemStatus: 'operational'
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setDashboardStats(prev => ({ ...prev, systemStatus: 'error' }));
    }
  };

  // User management functions
  const fetchUsers = async () => {
    try {
      setError('');
      const data = await adminApi.getAllUsers(userFilters);
      setUsers(data.users || []);
      setPagination(data.pagination || {});
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(`Error fetching users: ${err.message}`);
      setUsers([]);
    }
  };

  const handleCreateUser = async (userData) => {
    try {
      setError('');
      await adminApi.createUser(userData);
      setShowCreateModal(false);
      fetchUsers(); // Refresh user list
    } catch (err) {
      setError(`Error creating user: ${err.message}`);
    }
  };


  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }
    
    try {
      setError('');
      await adminApi.deleteUser(userId);
      fetchUsers(); // Refresh user list
    } catch (err) {
      setError(`Error deleting user: ${err.message}`);
    }
  };

  // Content management functions
  const fetchArtworks = async () => {
    try {
      setContentLoading(true);
      setError('');
      const data = await adminApi.getAllArtworks();
      console.log('Artworks data received:', data);
      
      // Handle different response formats
      if (Array.isArray(data)) {
        setArtworks(data);
      } else if (data && Array.isArray(data.data)) {
        setArtworks(data.data);
      } else {
        console.warn('Unexpected artworks data format:', data);
        setArtworks([]);
      }
    } catch (err) {
      console.error('Error fetching artworks:', err);
      setError(`Error fetching artworks: ${err.message}`);
      setArtworks([]);
    } finally {
      setContentLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      setContentLoading(true);
      setError('');
      console.log('Fetching all events...');
      // Fetch all events for admin management
      const data = await adminApi.getAllEvents({ 
        upcoming: 'false' // Get all events, not just upcoming
      });
      console.log('Artist events fetched:', data);
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(`Error fetching events: ${err.message}`);
      setEvents([]);
    } finally {
      setContentLoading(false);
    }
  };

  const handleDeleteArtwork = async (artworkId) => {
    if (!window.confirm('Are you sure you want to delete this artwork?')) {
      return;
    }
    
    try {
      setError('');
      await adminApi.deleteArtwork(artworkId);
      fetchArtworks(); // Refresh artwork list
    } catch (err) {
      setError(`Error deleting artwork: ${err.message}`);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }
    
    try {
      setError('');
      await adminApi.deleteEvent(eventId);
      fetchEvents(); // Refresh event list
    } catch (err) {
      setError(`Error deleting event: ${err.message}`);
    }
  };

  // Load users when the users tab is active
  useEffect(() => {
    if (activeTab === 'users' && currentUser) {
      fetchUsers();
    }
  }, [activeTab, userFilters, currentUser]);

  // Load content when content view changes
  useEffect(() => {
    if (contentView === 'artworks') {
      fetchArtworks();
    } else if (contentView === 'events') {
      fetchEvents();
    }
  }, [contentView]);

  // FloatingParticles component for background effect
  const FloatingParticles = () => {
    const particles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      size: Math.random() * 4 + 2,
      color: [
        'rgba(19, 72, 86, 0.6)',
        'rgba(224, 82, 100, 0.6)',
        'rgba(244, 140, 140, 0.6)',
        'rgba(29, 124, 111, 0.6)',
        'rgba(255, 215, 0, 0.6)'
      ][Math.floor(Math.random() * 5)],
      initialX: Math.random() * 100,
      initialY: Math.random() * 100,
      animationDelay: Math.random() * 5,
      animationDuration: 8 + Math.random() * 6
    }));

    return (
      <div className="fixed inset-0 pointer-events-none z-0">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full opacity-40"
            style={{
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              backgroundColor: particle.color,
              left: `${particle.initialX}%`,
              top: `${particle.initialY}%`,
              filter: 'blur(0.5px)',
              boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`
            }}
            animate={{
              y: [0, -80, 0],
              x: [0, 25, -25, 0],
              opacity: [0.4, 0.7, 0.4],
              scale: [1, 1.3, 1]
            }}
            transition={{
              duration: particle.animationDuration,
              repeat: Infinity,
              delay: particle.animationDelay,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
    );
  };

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F48C8C]/10 via-white to-[#134856]/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#E05264] mx-auto mb-4"></div>
          <p className="text-2xl font-dm-serif text-transparent bg-clip-text bg-gradient-to-r from-[#E05264] to-[#134856]">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  const mainMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FaHome },
    { id: 'reports', label: 'Reports', icon: FaChartBar },
    { id: 'users', label: 'User Management', icon: FaUsers },
    { id: 'content', label: 'Content Management', icon: FaFileAlt },
    { id: 'verification-admin', label: 'Verification', icon: FaFileAlt }
  ];

  const accountMenuItems = [
    { id: 'settings', label: 'Settings', icon: FaCog },
    { id: 'logout', label: 'Logout', icon: FaSignOutAlt, isAction: true }
  ];

  const handleMenuClick = (itemId) => {
    if (itemId === 'logout') {
      handleLogout();
    } else {
      setActiveTab(itemId);
      setContentView(''); // Reset content view when switching tabs
    }
    setSidebarOpen(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'reports':
        return <AdminPanel />;
      case 'users':
        return renderUserManagement();
      case 'content':
        return renderContentManagement();
case 'settings':
        return renderSettings();
      case 'verification-admin':
        return <VerificationAdmin />;
      default:
        return renderDashboard();
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-[#134856] to-[#E05264] rounded-xl p-6 text-white">
        <h2 className="text-3xl font-bold font-dm-serif mb-2">Welcome, {currentUser?.name || 'Admin'}!</h2>
        <p className="font-lora opacity-90">Role: <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">{currentUser?.role}</span></p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-3xl font-bold text-[#134856]">{dashboardStats.totalUsers}</p>
            </div>
            <div className="w-12 h-12 bg-[#134856]/10 rounded-lg flex items-center justify-center">
              <FaUsers className="w-6 h-6 text-[#134856]" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Registered platform users</p>
        </div>


        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Artworks</p>
              <p className="text-3xl font-bold text-[#F48C8C]">{dashboardStats.totalArtworks}</p>
            </div>
            <div className="w-12 h-12 bg-[#F48C8C]/10 rounded-lg flex items-center justify-center">
              <FaFileAlt className="w-6 h-6 text-[#F48C8C]" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Submitted artworks</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Events</p>
              <p className="text-3xl font-bold text-[#1D7C6F]">{dashboardStats.totalEvents}</p>
            </div>
            <div className="w-12 h-12 bg-[#1D7C6F]/10 rounded-lg flex items-center justify-center">
              <FaCalendarAlt className="w-6 h-6 text-[#1D7C6F]" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Scheduled cultural events</p>
        </div>
      </div>

      {/* System Status and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Status */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 font-dm-serif">System Status</h3>
            <div className={`w-3 h-3 rounded-full ${
              dashboardStats.systemStatus === 'operational' ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Platform Status</span>
              <span className={`text-sm font-medium ${
                dashboardStats.systemStatus === 'operational' ? 'text-green-600' : 'text-red-600'
              }`}>
                {dashboardStats.systemStatus === 'operational' ? 'Operational' : 'Issues Detected'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Database</span>
              <span className="text-sm font-medium text-green-600">Connected</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">API Services</span>
              <span className="text-sm font-medium text-green-600">Running</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 font-dm-serif mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {dashboardStats.recentUsers && dashboardStats.recentUsers.length > 0 ? (
              dashboardStats.recentUsers.map((user, index) => (
                <div key={user._id || index} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-gradient-to-r from-[#134856] to-[#E05264] rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{user.name || 'Unknown User'}</p>
                    <p className="text-xs text-gray-500 truncate">
                      New {user.role?.toLowerCase() || 'user'} • {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recently'}
                    </p>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${
                    user.role === 'Artist' ? 'bg-[#E05264]' : 'bg-[#134856]'
                  }`}></div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 font-dm-serif mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setActiveTab('users')}
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FaUsers className="w-5 h-5 text-[#134856]" />
            <span className="font-medium text-gray-700">Manage Users</span>
          </button>
          <button
            onClick={() => setActiveTab('content')}
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FaFileAlt className="w-5 h-5 text-[#E05264]" />
            <span className="font-medium text-gray-700">Manage Content</span>
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FaChartBar className="w-5 h-5 text-[#F48C8C]" />
            <span className="font-medium text-gray-700">View Reports</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderUserManagement = () => {
    if (currentUser.role !== 'Admin') {
      return (
        <div className="access-limited">
          <p>Limited access: You can only view your own profile.</p>
        </div>
      );
    }

    return (
      <div className="user-management">
        <div className="admin-header">
          <h2>User Management</h2>
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            Create New User
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Search and Filter Controls */}
        <div className="user-controls">
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={userFilters.search}
            onChange={(e) => setUserFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
            className="search-input"
          />
          
          <select
            value={userFilters.role}
            onChange={(e) => setUserFilters(prev => ({ ...prev, role: e.target.value, page: 1 }))}
            className="role-filter"
          >
            <option value="all">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="Artist">Artist</option>
            
          </select>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="loading">Loading users...</div>
        ) : (
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map(user => (
                    <tr key={user._id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`role-badge ${user.role.toLowerCase()}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${user.isEmailVerified ? 'verified' : 'unverified'}`}>
                          {user.isEmailVerified ? 'Verified' : 'Unverified'}
                        </span>
                      </td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="user-actions">
                          {user.role !== 'Admin' && (
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDeleteUser(user._id)}
                              disabled={user._id === currentUser.id}
                            >
                              Delete
                            </button>
                          )}
                          {user.role === 'Admin' && (
                            <span className="text-sm text-gray-500 italic">Protected Account</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => setUserFilters(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={userFilters.page === 1}
              className="btn btn-sm"
            >
              Previous
            </button>
            <span>
              Page {userFilters.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setUserFilters(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={userFilters.page >= pagination.totalPages}
              className="btn btn-sm"
            >
              Next
            </button>
          </div>
        )}

        {/* Create User Modal */}
        {showCreateModal && (
          <CreateUserModal
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateUser}
            error={error}
          />
        )}

      </div>
    );
  };

  const renderContentManagement = () => {
    if (currentUser.role !== 'Admin') {
      return (
        <div className="access-limited">
          <p>Only admins can manage content.</p>
        </div>
      );
    }

    if (!contentView) {
      return (
        <div className="content-management">
          <h2>Content Management</h2>
          <p>Select what you'd like to manage:</p>
          <div className="content-actions">
            <button 
              className="btn btn-secondary"
              onClick={() => setContentView('artworks')}
            >
              Manage Artworks
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => setContentView('events')}
            >
              Manage Events
            </button>
          </div>
        </div>
      );
    }

    if (contentView === 'artworks') {
      return (
        <div className="content-management">
          <div className="content-header">
            <h2>Manage Artworks</h2>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          {contentLoading ? (
            <div className="loading">Loading artworks...</div>
          ) : (
            <div className="content-list">
              <p className="content-count">
                Total Artworks: {artworks.length}
              </p>
              
              {artworks.length === 0 ? (
                <div className="no-content">
                  <p>No artworks found.</p>
                </div>
              ) : (
                <div className="artworks-grid">
                  {artworks.map(artwork => (
                    <div key={artwork._id} className="artwork-card">
                      {artwork.imageUrl && (
                        <img 
                          src={artwork.imageUrl} 
                          alt={artwork.title}
                          className="artwork-image"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      )}
                      <div className="artwork-info">
                        <h4>{artwork.title}</h4>
                        <p><strong>Artist:</strong> {artwork.artist?.name || 'Unknown'}</p>
                        <p><strong>Category:</strong> {artwork.category}</p>
                        <p><strong>Medium:</strong> {artwork.medium}</p>
                        <p><strong>Price:</strong> ${artwork.price || 'N/A'}</p>
                        <p><strong>Uploaded:</strong> {new Date(artwork.createdAt).toLocaleDateString()}</p>
                        <div className="artwork-actions">
                          <button 
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteArtwork(artwork._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          <div className="content-footer" style={{ marginTop: '20px', textAlign: 'center' }}>
            <button 
              className="btn btn-secondary"
              onClick={() => setContentView('')}
            >
              Back to Content Management
            </button>
          </div>
        </div>
      );
    }

    if (contentView === 'events') {
      return (
        <div className="content-management">
          <div className="content-header">
            <h2>Manage Events</h2>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          {contentLoading ? (
            <div className="loading">Loading events...</div>
          ) : (
            <div className="content-list">
              <p className="content-count">
                Total Events: {events.length}
              </p>
              
              {events.length === 0 ? (
                <div className="no-content">
                  <p>No events found.</p>
                  <p><small>All events in the system are shown here.</small></p>
                </div>
              ) : (
                <div className="events-list">
                  {events.map(event => (
                    <div key={event._id} className="event-card">
                      <div className="event-info">
                        <h4>{event.title}</h4>
                        <p><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
                        <p><strong>Location:</strong> {event.location.venue}, {event.location.city}, {event.location.state}</p>
                        <p><strong>Price:</strong> {event.price ? `$${event.price}` : 'Free'}</p>
                        <p><strong>Description:</strong> {event.description}</p>
                        <p><strong>Created:</strong> {new Date(event.createdAt).toLocaleDateString()}</p>
                        <div className="event-actions">
                          <button 
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteEvent(event._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          <div className="content-footer" style={{ marginTop: '20px', textAlign: 'center' }}>
            <button 
              className="btn btn-secondary"
              onClick={() => setContentView('')}
            >
              Back to Content Management
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  // Admin settings functions
  const handleAdminPasswordChange = async (e) => {
    e.preventDefault();
    
    if (adminPasswordForm.newPassword !== adminPasswordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (adminPasswordForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    setAdminSettingsLoading(true);
    try {
      await adminApi.changePassword({
        currentPassword: adminPasswordForm.currentPassword,
        newPassword: adminPasswordForm.newPassword
      });
      
      toast.success('Password changed successfully!');
      setAdminPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      toast.error(error.message || 'Failed to change password');
    } finally {
      setAdminSettingsLoading(false);
    }
  };

  const handleAdminDeleteAccount = async (e) => {
    e.preventDefault();
    
    if (adminDeleteForm.confirmText !== 'DELETE MY ACCOUNT') {
      toast.error('Please type "DELETE MY ACCOUNT" to confirm');
      return;
    }

    setAdminSettingsLoading(true);
    try {
      await adminApi.deleteAccount({
        password: adminDeleteForm.password
      });
      
      toast.success('Account deleted successfully');
      handleLogout();
    } catch (error) {
      toast.error(error.message || 'Failed to delete account');
    } finally {
      setAdminSettingsLoading(false);
    }
  };

  const renderSettings = () => (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Password Change Section */}
      <motion.div 
        className="bg-gradient-to-br from-[#1d7c6f] to-[#f58c8c] rounded-3xl shadow-2xl p-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="bg-[#F8E6DA] rounded-2xl p-8">
          <h2 className="text-3xl font-bold font-dm-serif mb-6 bg-gradient-to-r from-[#134856] to-[#e05264] bg-clip-text text-transparent">
            Change Password
          </h2>
          
          <form onSubmit={handleAdminPasswordChange} className="space-y-6">
            <div>
              <label className="block text-sm font-medium font-lora text-[#134856] mb-2">
                Current Password
              </label>
              <input
                type="password"
                required
                value={adminPasswordForm.currentPassword}
                onChange={(e) => setAdminPasswordForm({...adminPasswordForm, currentPassword: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#E05264] focus:border-transparent font-lora"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium font-lora text-[#134856] mb-2">
                New Password
              </label>
              <input
                type="password"
                required
                minLength="6"
                value={adminPasswordForm.newPassword}
                onChange={(e) => setAdminPasswordForm({...adminPasswordForm, newPassword: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#E05264] focus:border-transparent font-lora"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium font-lora text-[#134856] mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                minLength="6"
                value={adminPasswordForm.confirmPassword}
                onChange={(e) => setAdminPasswordForm({...adminPasswordForm, confirmPassword: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#E05264] focus:border-transparent font-lora"
              />
            </div>

            <motion.button
              type="submit"
              disabled={adminSettingsLoading}
              className="bg-gradient-to-r from-[#1d7c6f] to-[#f58c8c] text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 font-dm-serif disabled:opacity-50"
              whileHover={{ scale: adminSettingsLoading ? 1 : 1.05, y: adminSettingsLoading ? 0 : -2 }}
              whileTap={{ scale: adminSettingsLoading ? 1 : 0.95 }}
            >
              {adminSettingsLoading ? 'Changing Password...' : 'Change Password'}
            </motion.button>
          </form>
        </div>
      </motion.div>

      {/* Danger Zone */}
      <motion.div 
        className="bg-gradient-to-br from-red-500 to-red-600 rounded-3xl shadow-2xl p-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="bg-[#F8E6DA] rounded-2xl p-8 border-l-4 border-red-500">
          <h2 className="text-3xl font-bold font-dm-serif text-red-600 mb-2">⚠️ Danger Zone</h2>
          <p className="text-[#E05264] font-lora mb-6">
            Once you delete your admin account, there is no going back. Please be certain.
          </p>

          {!showAdminDeleteConfirm ? (
            <motion.button
              onClick={() => setShowAdminDeleteConfirm(true)}
              className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 font-dm-serif"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              Delete My Admin Account
            </motion.button>
          ) : (
            <div className="bg-red-50 rounded-2xl p-6 border border-red-200">
              <h3 className="text-xl font-bold font-dm-serif text-red-800 mb-4">
                🚨 Oh no! You're in dangerous territory!
              </h3>
              <p className="text-red-700 font-lora mb-4">
                This action cannot be undone. This will permanently delete your admin account. 
                Are you absolutely sure?
              </p>
              
              <form onSubmit={handleAdminDeleteAccount} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium font-lora text-red-700 mb-2">
                    Enter your password to confirm:
                  </label>
                  <input
                    type="password"
                    required
                    value={adminDeleteForm.password}
                    onChange={(e) => setAdminDeleteForm({...adminDeleteForm, password: e.target.value})}
                    className="w-full px-4 py-3 border border-red-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent font-lora"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium font-lora text-red-700 mb-2">
                    Type "DELETE MY ACCOUNT" to confirm:
                  </label>
                  <input
                    type="text"
                    required
                    value={adminDeleteForm.confirmText}
                    onChange={(e) => setAdminDeleteForm({...adminDeleteForm, confirmText: e.target.value})}
                    placeholder="DELETE MY ACCOUNT"
                    className="w-full px-4 py-3 border border-red-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent font-lora"
                  />
                </div>

                <div className="flex space-x-4">
                  <motion.button
                    type="submit"
                    disabled={adminSettingsLoading}
                    className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 font-dm-serif disabled:opacity-50"
                    whileHover={{ scale: adminSettingsLoading ? 1 : 1.05, y: adminSettingsLoading ? 0 : -2 }}
                    whileTap={{ scale: adminSettingsLoading ? 1 : 0.95 }}
                  >
                    {adminSettingsLoading ? 'Deleting Account...' : 'Yes, Delete My Admin Account'}
                  </motion.button>
                  
                  <motion.button
                    type="button"
                    onClick={() => {
                      setShowAdminDeleteConfirm(false);
                      setAdminDeleteForm({ password: '', confirmText: '' });
                    }}
                    className="bg-white text-[#134856] border border-gray-300 px-6 py-3 rounded-full font-semibold hover:bg-gray-50 transition-all duration-300 font-dm-serif"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Cancel
                  </motion.button>
                </div>
              </form>
            </div>
          )}
        </div>
      </motion.div>

      {/* Account Information */}
      <motion.div 
        className="bg-gradient-to-br from-[#1d7c6f] to-[#f58c8c] rounded-3xl shadow-2xl p-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <div className="bg-[#F8E6DA] rounded-2xl p-8">
          <h2 className="text-3xl font-bold font-dm-serif mb-6 bg-gradient-to-r from-[#134856] to-[#e05264] bg-clip-text text-transparent">
            Admin Account Information
          </h2>
          <div className="space-y-4 font-lora">
            <div className="text-[#134856]">
              <strong>Name:</strong> <span className="text-[#E05264]">{currentUser?.name}</span>
            </div>
            <div className="text-[#134856]">
              <strong>Email:</strong> <span className="text-[#E05264]">{currentUser?.email}</span>
            </div>
            <div className="text-[#134856]">
              <strong>Role:</strong> 
              <span className="ml-2 px-3 py-1 bg-[#134856] text-white rounded-full text-sm font-semibold">
                {currentUser?.role}
              </span>
            </div>
            <div className="text-[#134856]">
              <strong>Account Status:</strong> 
              <span className="ml-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                Active
              </span>
            </div>
            <div className="text-[#134856]">
              <strong>Admin Since:</strong> <span className="text-[#E05264]">{new Date(currentUser?.createdAt || Date.now()).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-blush-peach">
      <FloatingParticles />
      <FullBleedDivider />
      
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-3 bg-white rounded-2xl shadow-lg text-[#134856] hover:text-[#E05264] transition-all duration-200"
      >
        <FaBars className="w-5 h-5" />
      </button>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-gray-600 bg-opacity-50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Combined Container */}
      <div className="px-10 mt-10 mx-auto pb-10">
        <div className="rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="flex">
            {/* Sidebar */}
            <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-40 w-80 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:w-80 md:flex-shrink-0 bg-gradient-to-b from-[#134856] to-[#E05264]`}>
              <div className="h-full px-6 py-8 overflow-y-auto">
                {/* Navigation Header */}
                <div className="mb-8">
                  <h3 className="text-3xl font-bold font-dm-serif text-white">Admin Panel</h3>
                  <p className="text-white text-sm mt-1 font-lora">Manage platform operations</p>
                  <div className="mt-4 h-px bg-white/20"></div>
                  
                  {/* User Info */}
                  <div className="mt-4 flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                      <FaUsers className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate font-dm-serif">{currentUser?.name}</p>
                      <p className="text-xs text-white/70 truncate font-lora">{currentUser?.role} Account</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 h-px bg-white/20"></div>
                </div>
                
                {/* Navigation */}
                <nav className="space-y-2">
                  {/* Main Menu Items */}
                  {mainMenuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleMenuClick(item.id)}
                        className={`w-full flex items-center px-4 py-3 text-left rounded-2xl transition-all duration-200 font-lora ${
                          isActive
                            ? 'bg-gradient-to-r from-[#E05264] to-[#E05264]/90 text-white shadow-md transform scale-[1.02]'
                            : 'text-white hover:bg-white/10 hover:shadow-sm'
                        }`}
                      >
                        <Icon className="w-5 h-5 mr-3" />
                        <span className="font-medium">{item.label}</span>
                      </button>
                    );
                  })}
                  
                  {/* Divider */}
                  <div className="mt-6 mb-4 h-px bg-white/20"></div>
                  
                  {/* Account Menu Items */}
                  {accountMenuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    const isLogout = item.id === 'logout';
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleMenuClick(item.id)}
                        className={`w-full flex items-center px-4 py-3 text-left rounded-2xl transition-all duration-200 font-lora ${
                          isLogout
                            ? 'text-white hover:bg-red-500/20 hover:text-red-200'
                            : isActive
                              ? 'bg-gradient-to-r from-[#E05264] to-[#E05264]/90 text-white shadow-md transform scale-[1.02]'
                              : 'text-white hover:bg-white/10 hover:shadow-sm'
                        }`}
                      >
                        <Icon className="w-5 h-5 mr-3" />
                        <span className="font-medium">{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </aside>

            {/* Vertical Divider */}
            <div className="hidden md:block w-px bg-gray-200"></div>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 bg-white">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="flex-1 flex flex-col min-h-0"
                >
                  {/* Integrated Header inside container */}
                  <div className="bg-gradient-to-r from-[#134856] to-[#E05264] px-8 py-6 border-b border-gray-100">
                    <h2 className="text-4xl font-bold text-white capitalize font-dm-serif">
                      {[...mainMenuItems, ...accountMenuItems].find(item => item.id === activeTab && !item.isAction)?.label}
                    </h2>
                    <p className="text-white text-sm mt-1 font-lora">
                      {activeTab === 'dashboard' && 'Overview of your admin operations and system status'}
                      {activeTab === 'reports' && 'Review and manage user reports and platform moderation'}
                      {activeTab === 'users' && 'Manage user accounts, roles, and permissions'}
                      {activeTab === 'content' && 'Oversee artworks and events submitted by users'}
                      {activeTab === 'settings' && 'Configure your admin account preferences'}
                    </p>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-8">
                    {renderContent()}
                  </div>
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};

// Create User Modal Component
const CreateUserModal = ({ onClose, onSubmit, error }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Artist'
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    
    setSubmitting(true);
    try {
      await onSubmit(formData);
      setFormData({ name: '', email: '', password: '', role: 'Artist' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>Create New User</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-body">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label>Name:</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
              disabled={submitting}
            />
          </div>
          
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
              disabled={submitting}
            />
          </div>
          
          <div className="form-group">
            <label>Password:</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              required
              minLength="6"
              disabled={submitting}
            />
          </div>
          
          <div className="form-group">
            <label>Role:</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
              disabled={submitting}
            >
              <option value="Artist">Artist</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          
          <div className="modal-actions">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


export default AdminDashboard;
