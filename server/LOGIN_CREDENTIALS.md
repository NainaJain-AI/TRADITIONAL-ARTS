# Login/Signup Credentials & Troubleshooting Guide

##  ISSUE RESOLVED!

The login/signup functionality is now working correctly. The main issue was that the test users were created with passwords shorter than the required 12-character minimum length enforced by the validation.

## Working Test Credentials

### Artist User  
- **Email:** `artist@test.com`
- **Password:** `artist123456789`
- **Role:** Artist
- **Login Endpoint:** `/api/auth/login`

##  What Was Fixed

1. **Password Length Issue**: Updated test user passwords from 8-9 characters to meet the 12-character minimum requirement
2. **Password Validation**: The server enforces a 12-character minimum for all passwords
3. **Authentication Flow**: All login/signup endpoints are working correctly

## API Endpoints

### Authentication Endpoints
- `POST /api/auth/register` - User registration (requires 12+ char password)
- `POST /api/auth/login` - Regular user login
- `POST /api/auth/admin-login` - Admin-specific login (checks role)
- `POST /api/auth/register-phone` - Phone number registration
- `POST /api/auth/login-phone` - Phone number login
- `POST /api/auth/forgot-password` - Password reset request
- `PUT /api/auth/reset-password/:token` - Password reset
- `GET /api/auth/me` - Get current user (requires auth)
- `POST /api/auth/logout` - Logout

### Password Requirements
- Minimum 12 characters
- Should include mix of letters, numbers, and special characters
- Examples: `admin123456789`, `MySecurePassword123!`

##  Testing

Run the comprehensive test suite:
```bash
node testAuthAPI.js
```

This will test:
-  Admin login
-  Artist login  
-  New user registration
-  Invalid login rejection
-  Admin-specific login
-  Role-based access control

## Server Status

- Server running on port: `5050`
- MongoDB: Connected
- Environment: `development`
- Base URL: `http://localhost:5174`

##  Notes

1. All test users have `isEmailVerified: true` for immediate login
2. New registrations require email verification (but can login immediately)
3. JWT tokens are valid for 1 day
4. CORS is configured to allow localhost connections
5. Rate limiting is applied to prevent abuse

##  If Issues Persist

1. Check server is running: `npm start`
2. Verify MongoDB connection in server logs
3. Ensure passwords meet 12-character minimum
4. Check network connectivity (localhost:5050)
5. Review server logs for specific error messages
