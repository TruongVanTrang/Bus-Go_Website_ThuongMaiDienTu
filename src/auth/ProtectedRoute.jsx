import React from 'react'
import { Navigate } from 'react-router-dom'
import { AuthUtil } from '@/utils/helpers'

/**
 * ProtectedRoute - Bảo vệ routes theo authentication
 * 
 * Usage:
 * <ProtectedRoute>
 *   <AdminDashboard />
 * </ProtectedRoute>
 */
export function ProtectedRoute({ children }) {
  if (!AuthUtil.isAuthenticated()) {
    return <Navigate to="/login" replace />
  }

  return children
}

/**
 * RoleProtectedRoute - Bảo vệ routes theo role
 * 
 * Usage:
 * <RoleProtectedRoute allowedRoles={['ADMIN', 'DRIVER']}>
 *   <AdminDashboard />
 * </RoleProtectedRoute>
 */
export function RoleProtectedRoute({ children, allowedRoles }) {
  if (!AuthUtil.isAuthenticated()) {
    return <Navigate to="/login" replace />
  }

  const userRole = AuthUtil.getCurrentRole()
  const isAllowed = Array.isArray(allowedRoles)
    ? allowedRoles.includes(userRole)
    : allowedRoles === userRole

  if (!isAllowed) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}

/**
 * StaffProtectedRoute - Chỉ cho phép staff (non-customer)
 * 
 * Usage:
 * <StaffProtectedRoute>
 *   <AdminDashboard />
 * </StaffProtectedRoute>
 */
export function StaffProtectedRoute({ children }) {
  if (!AuthUtil.isAuthenticated()) {
    return <Navigate to="/login" replace />
  }

  if (!AuthUtil.isStaff()) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}

/**
 * AdminProtectedRoute - Chỉ cho phép admin
 * 
 * Usage:
 * <AdminProtectedRoute>
 *   <UserManagement />
 * </AdminProtectedRoute>
 */
export function AdminProtectedRoute({ children }) {
  if (!AuthUtil.isAuthenticated()) {
    return <Navigate to="/login" replace />
  }

  if (!AuthUtil.isAdmin()) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}

export default ProtectedRoute
