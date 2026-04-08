# 🔐 BusGo Authentication & Authorization System - Implementation Guide

## 📋 Overview

This guide explains the complete authentication and authorization system implemented in BusGo Frontend, including:

1. **Login Page** - Unified entry point for all users
2. **Role-Based Access Control (RBAC)** - Different menu/features based on role
3. **Admin Dashboard** - Dynamic dashboard for staff management
4. **Protected Routes** - Secure access to sensitive pages

---

## 🔑 Key Concepts

### User Roles

- **CUSTOMER** - End users booking buses
- **ADMIN** - Full system control
- **DRIVER** - Vehicle operation management
- **TICKET_STAFF** - Ticket validation & passenger management
- **SUPPORT_STAFF** - Customer support & refund handling

### Token-Based Authentication

- JWT tokens stored in `localStorage`
- Automatic token inclusion in API requests
- Token expiration handling
- Automatic logout on unauthorized access

---

## 📂 Project Structure

```
src/
├── auth/                           # Authentication & Authorization
│   ├── LoginPage.jsx              # Login form (for all users)
│   ├── LoginPage.css              # Login styling
│   ├── ProtectedRoute.jsx         # Route protection HOCs
│   ├── UnauthorizedPage.jsx       # 403 error page
│   ├── UnauthorizedPage.css       # 403 styling
│   └── index.js                   # Auth exports
│
├── admin/                          # Admin/Staff Interface
│   ├── pages/
│   │   ├── Dashboard.jsx          # Main admin dashboard
│   │   ├── AdminDashboard.css     # Dashboard styling
│   │   └── index.js               # Pages exports
│   │
│   ├── components/
│   │   ├── AdminSidebar.jsx       # Sidebar menu (dynamic)
│   │   ├── AdminSidebar.css       # Sidebar styling
│   │   ├── AdminTopbar.jsx        # Top navigation bar
│   │   ├── AdminTopbar.css        # Topbar styling
│   │   └── index.js               # Components exports
│   └── styles/
│       └── admin.css              # Shared admin styles
│
├── client/                         # Customer Interface (existing)
│   ├── components/                # Customer components
│   ├── pages/                     # Customer pages
│   └── styles/                    # Customer styles
│
├── utils/                          # Utility Functions
│   ├── constants.js               # Role definitions, test accounts
│   ├── helpers.js                 # Auth, storage, validation utils
│   └── index.js                   # Utils exports
│
├── services/                       # API Services (to be created)
│   ├── apiClient.js               # Axios instance
│   ├── authService.js             # Auth API calls
│   └── ...
│
└── App.jsx                         # Main router configuration
```

---

## 🚀 Usage Guide

### 1. **Login Page**

**URL**: `/login`

**Features:**
- Email or phone number field
- Password field with show/hide toggle
- Test account quick-login buttons (for development)
- Form validation
- Automatic role-based redirection

**Example Test Accounts:**
```javascript
// Admin
Email: admin@busgo.com
Password: admin123

// Driver
Email: driver@busgo.com
Password: staff123

// Ticket Staff
Email: ticket@busgo.com
Password: staff123

// Support Staff
Email: support@busgo.com
Password: staff123

// Customer
Email: user@gmail.com
Password: user123
```

### 2. **Protected Routes**

**ProtectedRoute** - Requires authentication
```jsx
<Route
  path="/booking/:tripId"
  element={
    <ProtectedRoute>
      <BookingPage />
    </ProtectedRoute>
  }
/>
```

**RoleProtectedRoute** - Requires specific role(s)
```jsx
<Route
  path="/admin/users"
  element={
    <RoleProtectedRoute allowedRoles={['ADMIN']}>
      <UserManagement />
    </RoleProtectedRoute>
  }
/>
```

**StaffProtectedRoute** - For any non-customer user
```jsx
<Route
  path="/admin/dashboard"
  element={
    <StaffProtectedRoute>
      <Dashboard />
    </StaffProtectedRoute>
  }
/>
```

**AdminProtectedRoute** - For admins only
```jsx
<Route
  path="/admin/system"
  element={
    <AdminProtectedRoute>
      <SystemSettings />
    </AdminProtectedRoute>
  }
/>
```

### 3. **Admin Dashboard**

**URL**: `/admin/dashboard`

**Features:**
- Dynamic sidebar menu based on user role
- User profile dropdown in topbar
- Session information display
- Role-specific statistics
- Mobile-responsive design

**Menu Structure by Role:**

| Role | Menu Items |
|------|-----------|
| **Admin** | 🚌 Quản lý đội xe<br>🛣️ Quản lý tuyến đường<br>⏰ Quản lý lịch trình<br>👥 Quản lý người dùng<br>📊 Thống kê & Báo cáo |
| **Driver** | 📅 Tiếp nhận lịch trình chạy<br>🛣️ Cập nhật trạng thái hành trình |
| **Ticket Staff** | 📱 Quét mã QR soát vé<br>👥 Danh sách hành khách |
| **Support Staff** | 🔍 Tra cứu vé<br>↩️ Xử lý yêu cầu hoàn/hủy |

### 4. **Authentication Utilities**

```javascript
import { AuthUtil, StorageUtil, ValidateUtil } from '@/utils/helpers'

// Check if user is authenticated
AuthUtil.isAuthenticated()

// Get current user
AuthUtil.getCurrentUser()

// Get current role
AuthUtil.getCurrentRole()

// Check if user has role
AuthUtil.hasRole('ADMIN')
AuthUtil.hasAnyRole(['ADMIN', 'DRIVER'])

// Check if admin
AuthUtil.isAdmin()

// Check if staff (non-customer)
AuthUtil.isStaff()

// Logout
AuthUtil.logout()

// Validate email/phone
ValidateUtil.isEmailOrPhone('admin@busgo.com')
ValidateUtil.isEmail('user@gmail.com')
ValidateUtil.isPhone('0987654321')

// Storage operations
StorageUtil.setToken(token)
StorageUtil.getToken()
StorageUtil.removeToken()
```

---

## 🔑 Constants & Configuration

**File**: `src/utils/constants.js`

```javascript
// User Roles
USER_ROLES = {
  CUSTOMER: 'CUSTOMER',
  ADMIN: 'ADMIN',
  DRIVER: 'DRIVER',
  TICKET_STAFF: 'TICKET_STAFF',
  SUPPORT_STAFF: 'SUPPORT_STAFF'
}

// Test Accounts (Development)
TEST_ACCOUNTS = {
  ADMIN: { email: 'admin@busgo.com', password: 'admin123', ... },
  DRIVER: { email: 'driver@busgo.com', password: 'staff123', ... },
  // ...
}

// Menu Items by Role
ROLE_MENU = {
  ADMIN: [
    { id: 'vehicles', label: 'Quản lý đội xe', icon: 'bus', path: '/admin/vehicles' },
    // ...
  ],
  // ...
}

// Error Messages
ERROR_MESSAGES = {
  401: 'Hết phiên làm việc...',
  403: 'Bạn không có quyền truy cập',
  // ...
}
```

---

## 🔄 Authentication Flow

```
User visits website
        ↓
    [/login page]
        ↓
   Enter credentials
        ↓
   Click "Đăng nhập"
        ↓
  Validate form
        ↓
  Find account (mock)
        ↓
  Verify password
        ↓
   [✓ Success]
        ↓
  Save token to localStorage
  Save user info to localStorage
        ↓
   Check role (RBAC)
        ↓
   [CUSTOMER] → /home
   [ADMIN/STAFF] → /admin/dashboard
```

---

## 🔐 Security Features

### 1. **Token Management**
```javascript
// Tokens stored in localStorage
// Token payload decoded to check expiration
// Invalid/expired tokens cleared, user redirected to login
```

### 2. **Protected Routes**
```javascript
// Routes check authentication status
// Missing auth → redirect to /login
// Insufficient permissions → redirect to /unauthorized
```

### 3. **Form Validation**
```javascript
// Client-side validation before submission
// Email/phone format validation
// Password length requirement (6+ chars)
```

### 4. **Error Handling**
```javascript
// Invalid credentials → error message
// Network errors → retry prompts
// Unauthorized access → 403 page
```

---

## 🎨 Responsive Design

All components are fully responsive:
- **Desktop**: Full layout with sidebar + content
- **Tablet**: Collapsible sidebar, adjusted spacing
- **Mobile**: Hamburger menu, single column

**Breakpoints:**
- `768px` - Tablet
- `480px` - Mobile

---

## 📝 Customization Guide

### Adding a New Role

1. **Add to constants.js**:
```javascript
export const USER_ROLES = {
  // ... existing roles
  NEW_ROLE: 'NEW_ROLE'
}
```

2. **Add test account**:
```javascript
export const TEST_ACCOUNTS = {
  // ... existing
  [USER_ROLES.NEW_ROLE]: {
    email: 'newrole@busgo.com',
    password: 'test123',
    role: USER_ROLES.NEW_ROLE,
    // ...
  }
}
```

3. **Add menu items**:
```javascript
export const ROLE_MENU = {
  // ... existing
  [USER_ROLES.NEW_ROLE]: [
    { id: 'item1', label: 'Menu Item 1', icon: 'icon', path: '/admin/page1' },
    // ...
  ]
}
```

4. **Add to Dashboard stats**:
```javascript
// In Dashboard.jsx getRoleStats()
[USER_ROLES.NEW_ROLE]: [
  { icon: '📊', label: 'Stat 1', value: '42', color: 'blue' },
  // ...
]
```

### Customizing Dashboard Stats

Edit `src/admin/pages/Dashboard.jsx` - `getRoleStats()` function:

```javascript
function getRoleStats(role) {
  const statsMap = {
    [USER_ROLES.ADMIN]: [
      { icon: '🚌', label: 'Tổng số xe', value: '42', color: 'blue' },
      // Add more stats...
    ],
    // ... other roles
  }
}
```

### Styling Customization

**CSS Variables** (in each CSS file):
```css
:root {
  --primary-color: #3b82f6;
  --primary-dark: #1e40af;
  --secondary-color: #10b981;
  --danger-color: #ef4444;
  --light-bg: #f3f4f6;
  --border-color: #e5e7eb;
}
```

---

## 🔗 API Integration (Future)

When backend is ready, update `src/services/authService.js`:

```javascript
// Replace mock login with actual API call
const login = async (emailOrPhone, password) => {
  const response = await apiClient.post('/auth/login', {
    emailOrPhone,
    password
  })
  return response.data
}
```

---

## 🐛 Troubleshooting

### User always redirected to login
- Check `localStorage` has token
- Check token is not expired (validate JWT payload)
- Verify `AuthUtil.isAuthenticated()` returns true

### Menu not showing correctly
- Verify user role matches a key in `ROLE_MENU`
- Check role is saved in `localStorage`
- Look at browser console for errors

### Styles not applying
- Check CSS files imported correctly
- Verify Bootstrap & Tailwind CSS loaded
- Check CSS class names match

---

## 📚 File Checklist

### Core Auth Files
- ✅ `src/auth/LoginPage.jsx`
- ✅ `src/auth/LoginPage.css`
- ✅ `src/auth/ProtectedRoute.jsx`
- ✅ `src/auth/UnauthorizedPage.jsx`
- ✅ `src/auth/UnauthorizedPage.css`
- ✅ `src/auth/index.js`

### Admin Files
- ✅ `src/admin/pages/Dashboard.jsx`
- ✅ `src/admin/pages/AdminDashboard.css`
- ✅ `src/admin/pages/index.js`
- ✅ `src/admin/components/AdminSidebar.jsx`
- ✅ `src/admin/components/AdminSidebar.css`
- ✅ `src/admin/components/AdminTopbar.jsx`
- ✅ `src/admin/components/AdminTopbar.css`
- ✅ `src/admin/components/index.js`

### Utils Files
- ✅ `src/utils/constants.js`
- ✅ `src/utils/helpers.js`

### Configuration Files
- ✅ `vite.config.js` - Updated with path aliases
- ✅ `src/App.jsx` - Updated with auth routes

---

## 🎯 Next Steps

1. **Create vehicle management pages** in `src/admin/pages/vehicles/`
2. **Create route management pages** in `src/admin/pages/routes/`
3. **Create user management pages** in `src/admin/pages/users/`
4. **Create API service** in `src/services/authService.js`
5. **Connect to backend** API endpoints
6. **Add role-based tests** for each feature
7. **Deploy to production**

---

## 📞 Support

For questions or issues:
1. Check the Troubleshooting section
2. Review component JSDoc comments
3. Examine test accounts for expected behavior
4. Check browser console for errors

---

**Last Updated**: April 8, 2026
**Version**: 1.0.0
**Status**: ✅ Ready for development
