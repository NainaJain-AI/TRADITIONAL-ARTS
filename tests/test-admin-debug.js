// Admin Login Debug Test
// Run this in browser console after attempting admin login

console.log('=== ADMIN LOGIN DEBUG TEST ===');

// Check localStorage contents
console.log('1. LocalStorage Contents:');
console.log('- token:', localStorage.getItem('token') ? 'EXISTS' : 'MISSING');
console.log('- user:', localStorage.getItem('user'));
console.log('- userRole:', localStorage.getItem('userRole'));

// Try to parse user object
const userStr = localStorage.getItem('user');
if (userStr) {
  try {
    const user = JSON.parse(userStr);
    console.log('2. Parsed User Object:');
    console.log('- user.id:', user.id);
    console.log('- user.name:', user.name);
    console.log('- user.role:', user.role);
    console.log('- user.email:', user.email);
  } catch (error) {
    console.log('2. Error parsing user:', error);
  }
}

// Test ProtectedRoute logic
console.log('3. ProtectedRoute Logic Test:');
const token = localStorage.getItem('token');
let userRole = localStorage.getItem('userRole');
const userString = localStorage.getItem('user');

if (!userRole && userString) {
  try {
    const user = JSON.parse(userString);
    userRole = user.role;
    console.log('- Role extracted from user object:', userRole);
  } catch (error) {
    console.log('- Error extracting role:', error);
  }
}

const allowedRoles = ['Admin'];
console.log('- Has token:', !!token);
console.log('- User role:', userRole);
console.log('- Allowed roles:', allowedRoles);
console.log('- Role check passes:', allowedRoles.includes(userRole));

// Check current URL
console.log('4. Current Location:', window.location.pathname);

console.log('=== END DEBUG TEST ===');
