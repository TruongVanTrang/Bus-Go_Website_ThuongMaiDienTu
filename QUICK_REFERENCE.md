# 🚀 BusGo Quick Reference - Developer Guide

## 🔐 Login Credentials (Testing)

| Role | Email | Password |
|------|-------|----------|
| 👨‍💼 Admin | admin@busgo.com | admin123 |
| 🚗 Driver | driver@busgo.com | staff123 |
| 🎫 Ticket Staff | ticket@busgo.com | staff123 |
| 🤝 Support Staff | support@busgo.com | staff123 |
| 👤 Customer | user@gmail.com | user123 |

## 📍 Key Routes

| URL | Purpose | Access |
|-----|---------|--------|
| `/login` | Login page | Everyone |
| `/home` | Homepage | Authenticated customers |
| `/admin/dashboard` | Admin dashboard | Only staff |
| `/unauthorized` | 403 error | Redirected if unauthorized |

## 💻 Common Code Snippets

### Check if User is Logged In
```javascript
import { AuthUtil } from '@/utils/helpers'

if (AuthUtil.isAuthenticated()) {
  // User is logged in
}
```

### Get Current User
```javascript
const user = AuthUtil.getCurrentUser()
console.log(user.name, user.role)
```

### Check User Role
```javascript
if (AuthUtil.hasRole('ADMIN')) {
  // Admin-only code
}

if (AuthUtil.hasAnyRole(['ADMIN', 'DRIVER'])) {
  // Admin or Driver code
}
```

### Logout User
```javascript
import { AuthUtil } from '@/utils/helpers'
AuthUtil.logout()
// Redirects to /login automatically in ProtectedRoute
```

### Validate Email/Phone
```javascript
import { ValidateUtil } from '@/utils/helpers'

ValidateUtil.isEmail('user@gmail.com')     // true
ValidateUtil.isPhone('0987654321')         // true
ValidateUtil.isEmailOrPhone('anything')    // checks both
```

### Protected Routes
```javascript
import { ProtectedRoute, RoleProtectedRoute } from '@/auth'

// Requires authentication
<Route path="/booking" element={<ProtectedRoute><Booking /></ProtectedRoute>} />

// Requires specific role
<Route path="/admin/users" element={
  <RoleProtectedRoute allowedRoles={['ADMIN']}>
    <UserManagement />
  </RoleProtectedRoute>
} />
```

## 🛠️ CommonTasks

### Add New Test Account
**File**: `src/utils/constants.js`

```javascript
TEST_ACCOUNTS = {
  // ... existing
  [USER_ROLES.NEW_ROLE]: {
    email: 'newemail@busgo.com',
    phone: '0912345678',
    password: 'password123',
    name: 'User Name',
    role: USER_ROLES.NEW_ROLE
  }
}
```

### Add New Menu Item for Role
**File**: `src/utils/constants.js`

```javascript
ROLE_MENU = {
  [USER_ROLES.ADMIN]: [
    // ... existing items
    { 
      id: 'new-feature', 
      label: 'New Feature', 
      icon: 'icon-name', 
      path: '/admin/new-feature' 
    }
  ]
}
```

### Create New Protected Page
```javascript
import { ProtectedRoute } from '@/auth'
import MyComponent from '@/admin/pages/MyPage'

// In App.jsx
<Route
  path="/admin/my-page"
  element={
    <RoleProtectedRoute allowedRoles={['ADMIN']}>
      <MyComponent />
    </RoleProtectedRoute>
  }
/>
```

## 📦 Path Aliases

Use these for cleaner imports:

```javascript
import { helpers } from '@/utils'           // src/utils
import Dashboard from '@/admin'             // src/admin
import { LoginPage } from '@/auth'          // src/auth
import Button from '@/components'           // src/components
import { HomePage } from '@/pages'          // src/pages
```

## 🎨 Default Colors

```css
--primary-color: #3b82f6;      /* Blue */
--primary-dark: #1e40af;       /* Dark Blue */
--secondary-color: #10b981;    /* Green */
--danger-color: #ef4444;       /* Red */
--warning-color: #f59e0b;      /* Orange */
--light-bg: #f3f4f6;          /* Light Gray */
--border-color: #e5e7eb;      /* Border Gray */
--text-dark: #1f2937;         /* Dark Text */
--text-muted: #6b7280;        /* Muted Text */
```

## 📱 Responsive Breakpoints

```css
Mobile First:
- 480px   : Mobile adjustments
- 768px   : Tablet adjustments  
- 1200px  : Large screen adjustments
```

## ✨ Component Icons (Emoji)

```javascript
'bus' → '🚌'
'route' → '🛣️'
'clock' → '⏰'
'users' → '👥'
'chart' → '📊'
'calendar' → '📅'
'qrcode' → '📱'
'search' → '🔍'
'undo' → '↩️'
```

## 🔍 Debugging

### View localStorage
```javascript
// Browser console
localStorage.getItem('accessToken')
localStorage.getItem('user')
localStorage.getItem('userRole')
```

### Decode JWT Token
```javascript
// Browser console
import { TokenUtil } from '@/utils/helpers'
const token = localStorage.getItem('accessToken')
TokenUtil.decodeToken(token)
```

### Check Auth Status
```javascript
// Browser console
import { AuthUtil } from '@/utils/helpers'
AuthUtil.isAuthenticated()
AuthUtil.getCurrentUser()
AuthUtil.getCurrentRole()
```

## 🚨 Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| 401 - Unauthorized | Token expired/invalid | Login again |
| 403 - Forbidden | Insufficient permissions | Check user role |
| Network error | Connection issue | Check API endpoint |
| Invalid credentials | Wrong email/password | Verify test account |

## 📚 File Locations

| What | Where |
|------|-------|
| Auth components | `src/auth/` |
| Admin pages | `src/admin/pages/` |
| Admin components | `src/admin/components/` |
| Utilities | `src/utils/` |
| Constants | `src/utils/constants.js` |
| Helpers | `src/utils/helpers.js` |
| Routes | `src/App.jsx` |

## 🎯 Next Steps

1. Understand the authentication flow
2. Test with different user roles
3. Review component code comments
4. Build new admin pages as needed
5. Connect to real backend API
6. Deploy to production

## 💾 Important Files to Remember

```
src/
├── App.jsx                 ← Main routes
├── utils/
│   ├── constants.js       ← Config (roles, accounts, menus)
│   └── helpers.js         ← Auth utilities
├── auth/
│   ├── LoginPage.jsx      ← Login form
│   ├── ProtectedRoute.jsx ← Route protection
│   └── index.js           ← Export barrel
└── admin/
    ├── pages/
    │   └── Dashboard.jsx  ← Main dashboard
    └── components/
        ├── AdminSidebar.jsx
        └── AdminTopbar.jsx
```

---

**Tip**: Always check [AUTH_IMPLEMENTATION_GUIDE.md](AUTH_IMPLEMENTATION_GUIDE.md) for detailed documentation!

**Status**: ✅ Ready to code!
