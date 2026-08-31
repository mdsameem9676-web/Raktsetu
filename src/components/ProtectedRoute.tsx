import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { authService } from '../services/auth';

interface ProtectedRouteProps {
  allowedRoles?: Array<'USER' | 'HOSPITAL' | 'ADMIN'>;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const session = authService.getCurrentSession();

  // 1. Check if authenticated
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // 2. Check if role is authorized
  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Render children
  return <Outlet />;
};
